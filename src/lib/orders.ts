// Lógica de negócio das encomendas (independente de UI e de HTTP).
// Este ficheiro é também a porta de entrada: re-exporta os módulos de domínio, por isso
// `import { … } from '@/lib/orders'` continua a funcionar em todo o código.
import bcrypt from 'bcryptjs';
import { all, get, run, getDb, Row } from './db';
import { newToken, newReference, cleanText, encryptText, blindIndex, assertIdentifiers } from './security';
import { normalizePhone, luandaToUtc } from './format';
import { stripImageMetadata } from './metadata';
import { getSetting } from './settings';
import { removeFile, removeOrderDir, saveBuffer, validateUpload } from './storage';
import { LetterPatch } from './validation';
import { getCategory, sanitizeExtra, missingRequired } from './categories';
import { sanitizeExperience } from './experience';
import { notifyWhatsApp } from './notifications';
import { config } from './config';
import { AppError, ORDER_STATUSES, OrderStatus, parseExtra, getOrderById, getLetterByOrder, decodeOrder, logEvent, touch, assertCustomerEditable, setStatus } from './order-core';
import { getPlan } from './plans';
import { uploadLimits } from './media';
import { applyDiscount } from './discounts';

export { AppError, ORDER_STATUSES, parseExtra, getOrderByToken, getOrderById, migrateEncryptedFields, getLetterByOrder, getMemories } from './order-core';
export type { OrderStatus } from './order-core';
export * from './plans';
export * from './media';
export * from './public-letter';
export * from './replies';
export * from './analytics';
export * from './discounts';

export function createOrder(input: {
  occasion: string; planId: number; recipientName: string; senderName: string; customerName?: string; title: string;
  specialDate?: string; contact: string; language: string; theme: string; extra?: Record<string, string>;
}): { order: Row; letter: Row } {
  const plan = getPlan(input.planId);
  if (!plan || !plan.is_active) throw new AppError('plan_invalid', 'Este plano já não está disponível. Escolhe outro.');
  const cat = getCategory(input.occasion);
  if ((plan.kind || 'carta') !== cat.kind) throw new AppError('plan_kind', cat.kind === 'evento' ? 'Para convites de evento escolhe um dos pacotes de Eventos.' : 'Este pacote é para eventos. Escolhe um plano de cartas.');
  const extra = sanitizeExtra(input.occasion, input.extra);
  const miss = missingRequired(input.occasion, extra, input.specialDate);
  if (miss.length) throw new AppError('incomplete', `Falta preencher: ${miss.join(', ')}.`, 422);
  const email = input.contact.includes('@') ? input.contact.trim().toLowerCase() : null;
  const phone = email ? null : normalizePhone(input.contact);
  const currency = getSetting('currency') || plan.currency;
  const db = getDb();
  db.exec('BEGIN');
  try {
    let ref = newReference();
    while (get('SELECT 1 FROM orders WHERE public_reference = ?', ref)) ref = newReference();
    const o = run(`INSERT INTO orders(public_reference, manage_token, customer_name, customer_email, customer_phone, customer_email_idx, customer_phone_idx, occasion, plan_id, amount, currency)
                   VALUES(?,?,?,?,?,?,?,?,?,?,?)`, ref, newToken(), cleanText(input.customerName || input.senderName, 80), encryptText(email), encryptText(phone), blindIndex(email), blindIndex(phone), input.occasion, plan.id, plan.effective_price, plan.currency || currency);
    const orderId = Number(o.lastInsertRowid);
    run(`INSERT INTO letters(order_id, secure_token, recipient_name, sender_name, title, special_date, theme, language, extra, allow_reply)
         VALUES(?,?,?,?,?,?,?,?,?,?)`, orderId, newToken(32), cleanText(input.recipientName, 80), cleanText(input.senderName, 80),
      cleanText(input.title, 120), input.specialDate || null, input.theme, input.language, JSON.stringify(extra), cat.proposal ? 1 : 0);
    logEvent(orderId, null, 'draft', 'customer');
    db.exec('COMMIT');
    return { order: getOrderById(orderId)!, letter: getLetterByOrder(orderId)! };
  } catch (e) { db.exec('ROLLBACK'); throw e; }
}

export function updateLetter(order: Row, patch: LetterPatch, actor: 'customer' | 'admin' = 'customer') {
  if (actor === 'customer') assertCustomerEditable(order);
  const letter = getLetterByOrder(order.id)!;
  const map: Record<string, [string, unknown]> = {};
  const set = (col: string, v: unknown) => { map[col] = [col, v]; };
  if (patch.title !== undefined) set('title', cleanText(patch.title, 120));
  if (patch.intro !== undefined) set('intro', cleanText(patch.intro, 400));
  if (patch.mainMessage !== undefined) set('main_message', cleanText(patch.mainMessage, 6000));
  if (patch.closingMessage !== undefined) set('closing_message', cleanText(patch.closingMessage, 300));
  if (patch.howMet !== undefined) set('how_met', cleanText(patch.howMet, 1000));
  if (patch.admire !== undefined) set('admire', cleanText(patch.admire, 1000));
  if (patch.tone !== undefined) set('tone', patch.tone);
  if (patch.theme !== undefined) set('theme', patch.theme);
  if (patch.specialDate !== undefined) set('special_date', patch.specialDate || null);
  if (patch.musicMode !== undefined) set('music_mode', patch.musicMode);
  if (patch.ambient !== undefined) set('ambient', patch.ambient === 'none' ? null : patch.ambient);
  if (patch.musicRightsAck !== undefined) set('music_rights_ack', patch.musicRightsAck ? 1 : 0);
  if (patch.allowReply !== undefined) set('allow_reply', (patch.allowReply || getCategory(order.occasion).proposal) ? 1 : 0);
  if (patch.extra !== undefined) set('extra', JSON.stringify(sanitizeExtra(order.occasion, { ...parseExtra(letter.extra), ...patch.extra })));
  if (patch.experience !== undefined) set('experience', JSON.stringify(sanitizeExperience(patch.experience)));
  if (patch.recipientName !== undefined) set('recipient_name', cleanText(patch.recipientName, 80));
  if (patch.senderName !== undefined) set('sender_name', cleanText(patch.senderName, 80));
  if (patch.unlockAt !== undefined) {
    const utc = patch.unlockAt ? luandaToUtc(patch.unlockAt) : null;
    if (patch.unlockAt && !utc) throw new AppError('unlock', 'Data e hora de entrega inválidas.', 422);
    if (utc && utc !== letter.unlock_at) {
      const t = new Date(utc.replace(' ', 'T') + 'Z').getTime();
      if (t < Date.now() + 60_000) throw new AppError('unlock', 'Escolhe uma data e hora de entrega no futuro.', 422);
      if (t > Date.now() + 2 * 365 * 86400_000) throw new AppError('unlock', 'A entrega agendada não pode ser daqui a mais de 2 anos.', 422);
    }
    set('unlock_at', utc);
  }
  if (patch.aiUsed) set('ai_used', 1);
  if (patch.pin !== undefined) set('pin_hash', patch.pin ? bcrypt.hashSync(patch.pin, 10) : null);
  const cols = Object.values(map);
  assertIdentifiers(cols.map(([c]) => c), LETTER_COLUMNS);
  if (cols.length) run(`UPDATE letters SET ${cols.map(([c]) => `${c} = ?`).join(', ')}, updated_at = datetime('now') WHERE id = ?`, ...cols.map(([, v]) => v), letter.id);
  if (patch.memories) {
    run('DELETE FROM memories WHERE letter_id = ?', letter.id);
    patch.memories.filter(m => m.title || m.description).forEach((m, i) =>
      run('INSERT INTO memories(letter_id, title, description, date, place, sort_order) VALUES(?,?,?,?,?,?)', letter.id, cleanText(m.title, 100), cleanText(m.description, 600), m.date || null, cleanText(m.place || '', 80), i));
  }
  touch(order.id);
}

const LETTER_COLUMNS = ['title', 'intro', 'main_message', 'closing_message', 'how_met', 'admire', 'tone', 'theme', 'special_date', 'music_mode', 'ambient', 'music_rights_ack', 'allow_reply', 'extra', 'recipient_name', 'sender_name', 'unlock_at', 'ai_used', 'pin_hash', 'experience'] as const;

/** Cliente conclui o wizard → aguarda pagamento. */
export function submitOrder(order: Row) {
  if (order.order_status !== 'draft' && order.order_status !== 'payment_pending') return;
  const letter = getLetterByOrder(order.id)!;
  if (!letter.title || !letter.main_message || letter.main_message.length < 10) throw new AppError('incomplete', 'Escreve a mensagem principal antes de continuar.');
  if (letter.music_mode === 'own' && !letter.music_rights_ack) throw new AppError('rights', 'Confirma que tens direitos para usar a música que carregaste.');
  if (order.order_status === 'draft') setStatus(order, 'payment_pending', 'customer');
  const fresh = getOrderById(order.id)!;
  if (!fresh.customer_email && !fresh.customer_phone) throw new AppError('contact', 'Falta um contacto (email ou WhatsApp).');
}

export function submitProof(order: Row, buf: Buffer, note: string) {
  if (!['payment_pending', 'proof_submitted'].includes(order.order_status)) {
    throw new AppError('bad_state', 'Esta encomenda não está a aguardar pagamento.', 409);
  }
  const check = validateUpload('proof', buf, uploadLimits());
  if (!check.ok) throw new AppError('upload_invalid', check.error, 415);
  removeFile(order.payment_proof_path);
  if (check.mime.startsWith('image/')) buf = stripImageMetadata(buf, check.mime);
  const rel = saveBuffer(order.id, buf, check.ext);
  run(`UPDATE orders SET payment_proof_path = ?, payment_proof_mime = ?, payment_note = ?, payment_status = 'proof_submitted' WHERE id = ?`, rel, check.mime, cleanText(note, 300), order.id);
  if (order.order_status !== 'proof_submitted') setStatus(order, 'proof_submitted', 'customer', 'Comprovativo enviado');
  else touch(order.id);
  void notifyWhatsApp(getSetting('whatsapp_number'), 'proof_submitted', `Novo comprovativo da encomenda ${order.public_reference}. Abre o painel para confirmar.`);
}

// ---------------- Ações do administrador ----------------
function addDays(days: number): string { return new Date(Date.now() + days * 86400_000).toISOString().replace('T', ' ').slice(0, 19); }

export function adminConfirmPayment(order: Row) {
  if (!['payment_pending', 'proof_submitted'].includes(order.order_status)) throw new AppError('bad_state', 'Só é possível confirmar pagamentos pendentes.', 409);
  run(`UPDATE orders SET payment_status = 'confirmed' WHERE id = ?`, order.id);
  if (order.discount_code) run('UPDATE discount_codes SET used_count = used_count + 1 WHERE code = ?', order.discount_code);
  setStatus(order, 'payment_confirmed', 'admin', 'Pagamento confirmado');
  void notifyWhatsApp(order.customer_phone, 'payment_confirmed', `Pagamento da encomenda ${order.public_reference} confirmado. Estamos a preparar a tua Carta QR.`);
}
export function adminRejectPayment(order: Row, reason: string) {
  if (!['payment_pending', 'proof_submitted'].includes(order.order_status)) throw new AppError('bad_state', 'Só é possível rejeitar pagamentos pendentes.', 409);
  run(`UPDATE orders SET payment_status = 'rejected' WHERE id = ?`, order.id);
  setStatus(order, 'payment_pending', 'admin', `Pagamento rejeitado: ${cleanText(reason, 200)}`);
}
export function adminMarkInProduction(order: Row) {
  if (order.order_status !== 'payment_confirmed') throw new AppError('bad_state', 'Confirma o pagamento primeiro.', 409);
  setStatus(order, 'in_production', 'admin');
}
/** Só publica depois de o pagamento estar confirmado. */
export function adminPublish(order: Row) {
  if (order.payment_status !== 'confirmed' || !['payment_confirmed', 'in_production', 'published', 'expired'].includes(order.order_status)) {
    throw new AppError('not_paid', 'Não é possível publicar antes de confirmar o pagamento.', 409);
  }
  const plan = getPlan(order.plan_id)!;
  const letter = getLetterByOrder(order.id)!;
  const days = plan.duration_days || Number(getSetting('default_expiry_days')) || 180;
  const expires = letter.expires_at && order.order_status === 'published' ? letter.expires_at : addDays(days);
  run(`UPDATE letters SET is_published = 1, is_blocked = 0, published_at = COALESCE(published_at, datetime('now')), expires_at = ?, updated_at = datetime('now') WHERE id = ?`, expires, letter.id);
  setStatus(order, 'published', 'admin');
  void notifyWhatsApp(order.customer_phone, 'published', `A tua Carta QR está publicada! Descarrega o QR Code aqui: ${config.appUrl}/minha/${order.manage_token}`);
}
export function adminBlock(order: Row, blocked: boolean) {
  const letter = getLetterByOrder(order.id)!;
  run('UPDATE letters SET is_blocked = ? WHERE id = ?', blocked ? 1 : 0, letter.id);
  logEvent(order.id, order.order_status, order.order_status, 'admin', blocked ? 'Carta bloqueada' : 'Carta desbloqueada');
}
export function adminSetExpiry(order: Row, iso: string | null) {
  const letter = getLetterByOrder(order.id)!;
  const val = iso ? iso.replace('T', ' ').slice(0, 19) : null;
  run('UPDATE letters SET expires_at = ? WHERE id = ?', val, letter.id);
  // reativar se a nova data estiver no futuro
  if (order.order_status === 'expired' && val && new Date(val.replace(' ', 'T') + 'Z') > new Date()) setStatus(order, 'published', 'admin', 'Expiração alterada');
}
export function adminSetPin(order: Row, pin: string | null) {
  const letter = getLetterByOrder(order.id)!;
  if (pin && !/^\d{4,6}$/.test(pin)) throw new AppError('pin', 'O PIN deve ter 4 a 6 números.');
  run('UPDATE letters SET pin_hash = ? WHERE id = ?', pin ? bcrypt.hashSync(pin, 10) : null, letter.id);
}
export function adminCancel(order: Row) { setStatus(order, 'cancelled', 'admin'); run('UPDATE letters SET is_published = 0 WHERE order_id = ?', order.id); }
export function adminComplete(order: Row) { run(`UPDATE orders SET completed_at = datetime('now') WHERE id = ?`, order.id); logEvent(order.id, order.order_status, order.order_status, 'admin', 'Marcada como concluída'); }
export function adminSetNotes(order: Row, notes: string) { run('UPDATE orders SET admin_notes = ? WHERE id = ?', cleanText(notes, 2000), order.id); }

/** Elimina a encomenda, a carta e todos os ficheiros. */
export function deleteOrderCompletely(orderId: number) {
  removeOrderDir(orderId);
  run('DELETE FROM orders WHERE id = ?', orderId); // ON DELETE CASCADE apaga carta, memórias, media e eventos
}
/** Apaga só os conteúdos (media e texto) mantendo a encomenda para registo. */
export function deleteLetterContents(orderId: number) {
  const letter = getLetterByOrder(orderId);
  if (!letter) return;
  removeOrderDir(orderId);
  run('DELETE FROM media_assets WHERE letter_id = ?', letter.id);
  run('DELETE FROM memories WHERE letter_id = ?', letter.id);
  run(`UPDATE letters SET main_message = '', intro = '', closing_message = '', how_met = NULL, admire = NULL, cover_media_id = NULL, is_published = 0 WHERE id = ?`, letter.id);
  run(`UPDATE orders SET payment_proof_path = NULL WHERE id = ?`, orderId);
}

// ---------------- Expiração ----------------
/** Marca como expiradas as cartas vencidas. Chamado por /api/cron/expire e em cada acesso público. */
export function expireDue(): number {
  const due = all(`SELECT o.* FROM orders o JOIN letters l ON l.order_id = o.id
                   WHERE o.order_status = 'published' AND l.expires_at IS NOT NULL AND l.expires_at <= datetime('now')`);
  for (const o of due) setStatus(o, 'expired', 'system', 'Expirada automaticamente');
  return due.length;
}

// ---------------- Admin: listagem e métricas ----------------
export function listOrders(opts: { status?: string; q?: string }): Row[] {
  const where: string[] = []; const params: any[] = [];
  if (opts.status && ORDER_STATUSES.includes(opts.status as OrderStatus)) { where.push('o.order_status = ?'); params.push(opts.status); }
  if (opts.q) {
    const q = opts.q.slice(0, 100); const like = `%${q.replace(/[%_\\]/g, '')}%`;
    // email e telefone estão cifrados: procura-se pelo valor exato através do índice cego
    where.push('(o.customer_name LIKE ? OR o.public_reference LIKE ? OR l.recipient_name LIKE ? OR o.customer_email_idx = ? OR o.customer_phone_idx = ?)');
    params.push(like, like, like, blindIndex(q.trim().toLowerCase()), blindIndex(normalizePhone(q) || q));
  }
  return all(`SELECT o.*, l.title, l.recipient_name, l.secure_token, l.is_published, l.is_blocked, l.expires_at, p.name AS plan_name
              FROM orders o JOIN letters l ON l.order_id = o.id JOIN plans p ON p.id = o.plan_id
              ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY o.updated_at DESC, o.id DESC LIMIT 200`, ...params).map(decodeOrder);
}
export function metrics() {
  const byStatus = all<{ order_status: string; n: number }>('SELECT order_status, COUNT(*) n FROM orders GROUP BY order_status');
  const revenue = get<{ s: number }>(`SELECT COALESCE(SUM(amount),0) s FROM orders WHERE payment_status = 'confirmed'`)?.s || 0;
  const awaiting = get<{ n: number }>(`SELECT COUNT(*) n FROM orders WHERE order_status = 'proof_submitted'`)?.n || 0;
  const active = get<{ n: number }>(`SELECT COUNT(*) n FROM orders WHERE order_status = 'published'`)?.n || 0;
  const byKind = all<{ kind: string; n: number; s: number }>(`SELECT p.kind kind, COUNT(*) n, COALESCE(SUM(o.amount),0) s FROM orders o JOIN plans p ON p.id = o.plan_id WHERE o.payment_status = 'confirmed' GROUP BY p.kind`);
  const kindRev = (k: string) => ({ n: byKind.find(r => r.kind === k)?.n || 0, revenue: byKind.find(r => r.kind === k)?.s || 0 });
  return { byStatus: Object.fromEntries(byStatus.map(r => [r.order_status, r.n])), revenue, awaiting, active, cartas: kindRev('carta'), eventos: kindRev('evento') };
}
export function getEvents(orderId: number): Row[] { return all('SELECT * FROM order_events WHERE order_id = ? ORDER BY id DESC', orderId); }

/** O cliente pode trocar de ocasião/plano enquanto edita, desde que os ficheiros já enviados caibam nos limites do novo plano
 *  e o tipo do plano (carta/evento) corresponda ao da ocasião. */
export function changePlanOrOccasion(order: Row, input: { planId?: number; occasion?: string }) {
  assertCustomerEditable(order);
  const newOccasion = input.occasion || order.occasion;
  const plan = getPlan(input.planId || order.plan_id);
  if (!plan || !plan.is_active) throw new AppError('plan_invalid', 'Este plano já não está disponível.');
  const cat = getCategory(newOccasion);
  if ((plan.kind || 'carta') !== cat.kind) throw new AppError('plan_kind', cat.kind === 'evento' ? 'Para convites de evento escolhe um dos pacotes de Eventos.' : 'Este pacote é para eventos. Escolhe um plano de cartas.');
  const letter = getLetterByOrder(order.id)!;
  if (plan.id !== order.plan_id) {
    const n = (types: string[]) => (get<{ n: number }>(`SELECT COUNT(*) n FROM media_assets WHERE letter_id = ? AND type IN (${types.map(() => '?').join(',')})`, letter.id, ...types)?.n) || 0;
    if (n(['photo']) > plan.max_photos || n(['video']) > plan.max_videos || n(['audio', 'music']) > plan.max_audio_files) {
      throw new AppError('limit', `Já tens mais ficheiros do que o plano ${plan.name} permite. Remove alguns na etapa de conteúdos antes de mudar.`, 409);
    }
    run('UPDATE orders SET plan_id = ?, amount = ?, currency = ?, discount_code = NULL, discount_amount = 0 WHERE id = ?', plan.id, plan.effective_price, plan.currency, order.id);
    if (order.discount_code) { try { applyDiscount(getOrderById(order.id)!, order.discount_code); } catch { /* o código deixa de se aplicar ao novo plano */ } }
  }
  if (newOccasion !== order.occasion) {
    run('UPDATE orders SET occasion = ? WHERE id = ?', newOccasion, order.id);
    run('UPDATE letters SET extra = ?, allow_reply = ? WHERE id = ?', JSON.stringify(sanitizeExtra(newOccasion, parseExtra(letter.extra))), cat.proposal ? 1 : 0, letter.id);
  }
  touch(order.id);
}
