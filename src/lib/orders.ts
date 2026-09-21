// Lógica de negócio das encomendas e cartas (independente de UI e de HTTP).
import bcrypt from 'bcryptjs';
import { all, get, run, getDb, Row } from './db';
import { newToken, newReference, cleanText, sign, verifySigned } from './security';
import { normalizePhone, luandaToUtc } from './format';
import { getSettings, getSetting } from './settings';
import { removeFile, removeOrderDir, saveBuffer, validateUpload, MediaKind } from './storage';
import { LetterPatch } from './validation';
import { getCategory, sanitizeExtra, missingRequired } from './categories';
import { notifyWhatsApp } from './notifications';
import { config } from './config';

export type OrderStatus = 'draft' | 'payment_pending' | 'proof_submitted' | 'payment_confirmed' | 'in_production' | 'published' | 'expired' | 'cancelled';
export const ORDER_STATUSES: OrderStatus[] = ['draft', 'payment_pending', 'proof_submitted', 'payment_confirmed', 'in_production', 'published', 'expired', 'cancelled'];
/** Estados em que o cliente ainda pode editar o conteúdo. */
const CUSTOMER_EDITABLE: OrderStatus[] = ['draft', 'payment_pending', 'proof_submitted'];

export class AppError extends Error {
  constructor(public code: string, message: string, public status = 400) { super(message); }
}

export function parseExtra(raw: string | null | undefined): Record<string, string> {
  try { const v = JSON.parse(raw || '{}'); return v && typeof v === 'object' ? v : {}; } catch { return {}; }
}

// ---------------- Planos e ocasiões ----------------
export function listPlans(activeOnly = true, kind?: 'carta' | 'evento'): Row[] {
  const where = [activeOnly ? 'is_active = 1' : '', kind ? `kind = '${kind === 'evento' ? 'evento' : 'carta'}'` : ''].filter(Boolean).join(' AND ');
  const rows = all(`SELECT * FROM plans ${where ? 'WHERE ' + where : ''} ORDER BY sort_order, id`);
  return rows.map(decoratePlan);
}
export function getPlan(id: number): Row | undefined {
  const p = get('SELECT * FROM plans WHERE id = ?', id);
  return p ? decoratePlan(p) : undefined;
}
/** Promoção com data de fim: `price` é sempre o preço normal (o que se cobra depois); `effective_price` é o que se cobra agora. */
export function promoActive(p: Row): boolean {
  return p.promo_price != null && p.promo_price >= 0 && p.promo_price < p.price && !!p.promo_ends_at && new Date(String(p.promo_ends_at).replace(' ', 'T') + 'Z') > new Date();
}
function decoratePlan(p: Row): Row {
  const active = promoActive(p);
  return { ...p, features: JSON.parse(p.features || '[]'), promo_active: active, promo_ends_at: active ? p.promo_ends_at : null, promo_price: active ? p.promo_price : null, effective_price: active ? p.promo_price : p.price };
}
export function listOccasions(): Row[] { return all('SELECT * FROM occasions WHERE is_active = 1 ORDER BY sort_order, id'); }

// ---------------- Encomendas ----------------
export function getOrderByToken(manageToken: string): Row | undefined {
  if (!manageToken || manageToken.length < 20) return undefined;
  return get('SELECT * FROM orders WHERE manage_token = ?', manageToken);
}
export function getOrderById(id: number): Row | undefined { return get('SELECT * FROM orders WHERE id = ?', id); }
export function getLetterByOrder(orderId: number): Row | undefined { return get('SELECT * FROM letters WHERE order_id = ?', orderId); }
export function getMemories(letterId: number): Row[] { return all('SELECT * FROM memories WHERE letter_id = ? ORDER BY sort_order, id', letterId); }
export function getMedia(letterId: number): Row[] { return all('SELECT * FROM media_assets WHERE letter_id = ? ORDER BY sort_order, id', letterId); }

function logEvent(orderId: number, from: string | null, to: string, actor: string, note?: string) {
  run('INSERT INTO order_events(order_id, from_status, to_status, actor, note) VALUES(?,?,?,?,?)', orderId, from, to, actor, note ?? null);
}
function touch(orderId: number) { run(`UPDATE orders SET updated_at = datetime('now') WHERE id = ?`, orderId); }

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
    const o = run(`INSERT INTO orders(public_reference, manage_token, customer_name, customer_email, customer_phone, occasion, plan_id, amount, currency)
                   VALUES(?,?,?,?,?,?,?,?,?)`, ref, newToken(), cleanText(input.customerName || input.senderName, 80), email, phone, input.occasion, plan.id, plan.effective_price, plan.currency || currency);
    const orderId = Number(o.lastInsertRowid);
    run(`INSERT INTO letters(order_id, secure_token, recipient_name, sender_name, title, special_date, theme, language, extra, allow_reply)
         VALUES(?,?,?,?,?,?,?,?,?,?)`, orderId, newToken(32), cleanText(input.recipientName, 80), cleanText(input.senderName, 80),
      cleanText(input.title, 120), input.specialDate || null, input.theme, input.language, JSON.stringify(extra), cat.proposal ? 1 : 0);
    logEvent(orderId, null, 'draft', 'customer');
    db.exec('COMMIT');
    return { order: getOrderById(orderId)!, letter: getLetterByOrder(orderId)! };
  } catch (e) { db.exec('ROLLBACK'); throw e; }
}

function assertCustomerEditable(order: Row) {
  if (!CUSTOMER_EDITABLE.includes(order.order_status)) {
    throw new AppError('locked', 'Esta Carta QR já foi confirmada e não pode ser editada aqui. Contacta-nos pelo WhatsApp para pedir alterações.', 403);
  }
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
  if (cols.length) run(`UPDATE letters SET ${cols.map(([c]) => `${c} = ?`).join(', ')}, updated_at = datetime('now') WHERE id = ?`, ...cols.map(([, v]) => v), letter.id);
  if (patch.memories) {
    run('DELETE FROM memories WHERE letter_id = ?', letter.id);
    patch.memories.filter(m => m.title || m.description).forEach((m, i) =>
      run('INSERT INTO memories(letter_id, title, description, date, sort_order) VALUES(?,?,?,?,?)', letter.id, cleanText(m.title, 100), cleanText(m.description, 600), m.date || null, i));
  }
  touch(order.id);
}

// ---------------- Media ----------------
export function uploadLimits() {
  const s = getSettings();
  return { image: Number(s.max_image_mb) || 8, video: Number(s.max_video_mb) || 50, audio: Number(s.max_audio_mb) || 15, proof: Number(s.max_proof_mb) || 8 };
}

export function addMedia(order: Row, kind: Exclude<MediaKind, 'proof'>, buf: Buffer, originalName: string): Row {
  assertCustomerEditable(order);
  const plan = getPlan(order.plan_id)!;
  const letter = getLetterByOrder(order.id)!;
  const check = validateUpload(kind, buf, uploadLimits());
  if (!check.ok) throw new AppError('upload_invalid', check.error, 415);
  const count = (types: string[]) => (get<{ n: number }>(`SELECT COUNT(*) n FROM media_assets WHERE letter_id = ? AND type IN (${types.map(() => '?').join(',')})`, letter.id, ...types)?.n) || 0;
  if (kind === 'photo' && count(['photo']) >= plan.max_photos) throw new AppError('limit', `O plano ${plan.name} permite até ${plan.max_photos} fotografias.`, 409);
  if (kind === 'video' && count(['video']) >= plan.max_videos) throw new AppError('limit', plan.max_videos === 0 ? `O plano ${plan.name} não inclui vídeo.` : `O plano ${plan.name} permite até ${plan.max_videos} vídeo(s).`, 409);
  if ((kind === 'audio' || kind === 'music') && count(['audio', 'music']) >= plan.max_audio_files) throw new AppError('limit', plan.max_audio_files === 0 ? `O plano ${plan.name} não inclui áudio.` : `O plano ${plan.name} permite até ${plan.max_audio_files} ficheiro(s) de áudio.`, 409);
  if (kind === 'cover') { // só uma capa
    for (const old of all('SELECT id, storage_path FROM media_assets WHERE letter_id = ? AND type = ?', letter.id, 'cover')) { removeFile(old.storage_path); run('DELETE FROM media_assets WHERE id = ?', old.id); }
  }
  const rel = saveBuffer(order.id, buf, check.ext);
  const next = (get<{ m: number }>('SELECT COALESCE(MAX(sort_order), -1) + 1 m FROM media_assets WHERE letter_id = ?', letter.id)?.m) || 0;
  const r = run(`INSERT INTO media_assets(letter_id, type, storage_path, file_size, mime_type, original_name, sort_order) VALUES(?,?,?,?,?,?,?)`,
    letter.id, kind, rel, buf.length, check.mime, cleanText(originalName, 120), next);
  const id = Number(r.lastInsertRowid);
  if (kind === 'cover') run('UPDATE letters SET cover_media_id = ? WHERE id = ?', id, letter.id);
  touch(order.id);
  return get('SELECT * FROM media_assets WHERE id = ?', id)!;
}

export function removeMedia(order: Row, mediaId: number) {
  assertCustomerEditable(order);
  const letter = getLetterByOrder(order.id)!;
  const m = get('SELECT * FROM media_assets WHERE id = ? AND letter_id = ?', mediaId, letter.id);
  if (!m) throw new AppError('not_found', 'Ficheiro não encontrado.', 404);
  removeFile(m.storage_path);
  run('DELETE FROM media_assets WHERE id = ?', mediaId);
  if (letter.cover_media_id === mediaId) run('UPDATE letters SET cover_media_id = NULL WHERE id = ?', letter.id);
  touch(order.id);
}

export function updateMediaMeta(order: Row, mediaId: number, meta: { caption?: string; altText?: string; setCover?: boolean; sortOrder?: number }) {
  assertCustomerEditable(order);
  const letter = getLetterByOrder(order.id)!;
  const m = get('SELECT * FROM media_assets WHERE id = ? AND letter_id = ?', mediaId, letter.id);
  if (!m) throw new AppError('not_found', 'Ficheiro não encontrado.', 404);
  if (meta.caption !== undefined) run('UPDATE media_assets SET caption = ? WHERE id = ?', cleanText(meta.caption, 200), mediaId);
  if (meta.altText !== undefined) run('UPDATE media_assets SET alt_text = ? WHERE id = ?', cleanText(meta.altText, 200), mediaId);
  if (meta.setCover && ['photo', 'cover'].includes(m.type)) run('UPDATE letters SET cover_media_id = ? WHERE id = ?', mediaId, letter.id);
  if (meta.sortOrder !== undefined) run('UPDATE media_assets SET sort_order = ? WHERE id = ?', meta.sortOrder, mediaId);
}

export function reorderPhotos(order: Row, ids: number[]) {
  assertCustomerEditable(order);
  const letter = getLetterByOrder(order.id)!;
  ids.forEach((id, i) => run('UPDATE media_assets SET sort_order = ? WHERE id = ? AND letter_id = ?', i, id, letter.id));
}

// ---------------- Fluxo de estados ----------------
function setStatus(order: Row, to: OrderStatus, actor: string, note?: string, extra: Record<string, unknown> = {}) {
  const cols = Object.keys(extra);
  run(`UPDATE orders SET order_status = ?, ${cols.map(c => `${c} = ?`).join(', ')}${cols.length ? ',' : ''} updated_at = datetime('now') WHERE id = ?`, to, ...cols.map(c => extra[c]), order.id);
  logEvent(order.id, order.order_status, to, actor, note);
}

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

// ---------------- Carta pública ----------------
export type PublicLetterState =
  | { state: 'notfound' } | { state: 'unpublished' } | { state: 'blocked' } | { state: 'expired' } | { state: 'locked'; unlockAt: string; letter: Row; order: Row }
  | { state: 'ok'; letter: Row; order: Row };

export function resolvePublicLetter(token: string): PublicLetterState {
  if (!token || token.length < 20 || token.length > 100) return { state: 'notfound' };
  const letter = get('SELECT * FROM letters WHERE secure_token = ?', token);
  if (!letter) return { state: 'notfound' };
  const order = getOrderById(letter.order_id)!;
  if (letter.is_blocked || order.order_status === 'cancelled') return { state: 'blocked' };
  if (order.order_status === 'expired' || (letter.expires_at && new Date(letter.expires_at.replace(' ', 'T') + 'Z') <= new Date())) {
    if (order.order_status === 'published') setStatus(order, 'expired', 'system', 'Expirada automaticamente');
    return { state: 'expired' };
  }
  if (!letter.is_published || order.order_status !== 'published') return { state: 'unpublished' };
  if (letter.unlock_at && new Date(letter.unlock_at.replace(' ', 'T') + 'Z') > new Date()) return { state: 'locked', unlockAt: new Date(letter.unlock_at.replace(' ', 'T') + 'Z').toISOString(), letter, order };
  return { state: 'ok', letter, order };
}

export function verifyPin(letter: Row, pin: string): boolean { return !!letter.pin_hash && bcrypt.compareSync(pin, letter.pin_hash); }
export function pinCookieValue(letterId: number): string { return sign(`pin:${letterId}:${Math.floor(Date.now() / 1000) + 6 * 3600}`); }
export function pinCookieValid(letterId: number, cookie: string | undefined): boolean {
  const p = verifySigned(cookie);
  if (!p) return false;
  const [tag, id, exp] = p.split(':');
  return tag === 'pin' && Number(id) === letterId && Number(exp) > Date.now() / 1000;
}

// ---------------- Admin: listagem e métricas ----------------
export function listOrders(opts: { status?: string; q?: string }): Row[] {
  const where: string[] = []; const params: any[] = [];
  if (opts.status && ORDER_STATUSES.includes(opts.status as OrderStatus)) { where.push('o.order_status = ?'); params.push(opts.status); }
  if (opts.q) {
    const like = `%${opts.q.replace(/[%_]/g, '')}%`;
    where.push('(o.customer_name LIKE ? OR o.customer_email LIKE ? OR o.customer_phone LIKE ? OR o.public_reference LIKE ? OR l.recipient_name LIKE ?)');
    params.push(like, like, like, like, like);
  }
  return all(`SELECT o.*, l.title, l.recipient_name, l.secure_token, l.is_published, l.is_blocked, l.expires_at, p.name AS plan_name
              FROM orders o JOIN letters l ON l.order_id = o.id JOIN plans p ON p.id = o.plan_id
              ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY o.updated_at DESC, o.id DESC LIMIT 200`, ...params);
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

// ---------------- Respostas (pedidos) e confirmações de presença (eventos) ----------------
export function addReply(letter: Row, kind: 'message' | 'answer', author: string, message: string) {
  run('INSERT INTO letter_replies(letter_id, kind, author, message) VALUES(?,?,?,?)', letter.id, kind, cleanText(author, 60), cleanText(message, 1000));
}
export function listReplies(letterId: number): Row[] { return all('SELECT * FROM letter_replies WHERE letter_id = ? ORDER BY id DESC', letterId); }

export type RsvpInput = { name: string; attending: 'yes' | 'no' | 'maybe'; guests: number; message?: string };
export function rsvpSummary(letterId: number) {
  const rows = all<{ attending: string; n: number; g: number }>('SELECT attending, COUNT(*) n, COALESCE(SUM(guests),0) g FROM rsvps WHERE letter_id = ? GROUP BY attending', letterId);
  const pick = (a: string) => rows.find(r => r.attending === a);
  return { yes: pick('yes')?.n || 0, yesGuests: pick('yes')?.g || 0, no: pick('no')?.n || 0, maybe: pick('maybe')?.n || 0 };
}
export function listRsvps(letterId: number): Row[] { return all('SELECT * FROM rsvps WHERE letter_id = ? ORDER BY id DESC', letterId); }

export function rsvpStatus(letter: Row, order: Row): { open: boolean; reason?: string } {
  const cat = getCategory(order.occasion); const plan = getPlan(order.plan_id)!;
  if (!cat.rsvp) return { open: false, reason: 'Este convite não tem confirmação de presença.' };
  const extra = parseExtra(letter.extra);
  const today = new Date().toISOString().slice(0, 10);
  if (extra.rsvpDeadline && today > extra.rsvpDeadline) return { open: false, reason: 'O prazo para confirmar presença já terminou.' };
  if (letter.special_date && today > letter.special_date) return { open: false, reason: 'Este evento já decorreu.' };
  if (plan.max_guests > 0 && rsvpSummary(letter.id).yesGuests >= plan.max_guests) return { open: false, reason: 'A lista de confirmações está completa. Fala com os anfitriões.' };
  return { open: true };
}

export function addRsvp(letter: Row, order: Row, input: RsvpInput) {
  const st = rsvpStatus(letter, order);
  if (!st.open) throw new AppError('rsvp_closed', st.reason || 'As confirmações estão encerradas.', 409);
  const plan = getPlan(order.plan_id)!;
  const name = cleanText(input.name, 80); if (!name) throw new AppError('validation', 'Indica o teu nome.', 422);
  const guests = input.attending === 'yes' ? Math.min(Math.max(1, Math.round(input.guests) || 1), 10) : 1;
  const existing = get('SELECT id, guests, attending FROM rsvps WHERE letter_id = ? AND lower(guest_name) = lower(?)', letter.id, name);
  if (input.attending === 'yes' && plan.max_guests > 0) {
    const already = rsvpSummary(letter.id).yesGuests - (existing && existing.attending === 'yes' ? existing.guests : 0);
    if (already + guests > plan.max_guests) throw new AppError('rsvp_full', 'Já não há lugares suficientes para este número de pessoas. Fala com os anfitriões.', 409);
  }
  if (existing) run('UPDATE rsvps SET attending = ?, guests = ?, message = ?, created_at = datetime(\'now\') WHERE id = ?', input.attending, guests, cleanText(input.message || '', 300), existing.id);
  else run('INSERT INTO rsvps(letter_id, guest_name, attending, guests, message) VALUES(?,?,?,?,?)', letter.id, name, input.attending, guests, cleanText(input.message || '', 300));
  return { updated: !!existing };
}

export function rsvpCsv(letterId: number): string {
  const esc = (v: unknown) => { let t = String(v ?? ''); if (/^[=+\-@]/.test(t)) t = "'" + t; return `"${t.replace(/"/g, '""')}"`; };
  const rows = listRsvps(letterId).reverse();
  return '\uFEFF' + ['Nome,Resposta,Pessoas,Mensagem,Data', ...rows.map(r => [r.guest_name, ({ yes: 'Vai', no: 'Não vai', maybe: 'Talvez' } as Record<string, string>)[r.attending], r.attending === 'yes' ? r.guests : 0, r.message, r.created_at].map(esc).join(','))].join('\n');
}

// ---------------- Aberturas e analytics (sem dados pessoais) ----------------
const today = () => new Date().toISOString().slice(0, 10);
export function trackLetterView(letterId: number) {
  run(`INSERT INTO letter_views(letter_id, day, count) VALUES(?,?,1) ON CONFLICT(letter_id, day) DO UPDATE SET count = count + 1`, letterId, today());
}
export function viewStats(letterId: number) {
  const r = get<{ total: number; last: string | null }>('SELECT COALESCE(SUM(count),0) total, MAX(day) last FROM letter_views WHERE letter_id = ?', letterId);
  return { total: r?.total || 0, last: r?.last || null };
}
export const TRACK_EVENTS = ['landing_view', 'wizard_start', 'category_view', 'pricing_view'] as const;
export function trackEvent(name: string) {
  if (!(TRACK_EVENTS as readonly string[]).includes(name)) return false;
  run(`INSERT INTO analytics_events(day, name, count) VALUES(?,?,1) ON CONFLICT(day, name) DO UPDATE SET count = count + 1`, today(), name);
  return true;
}
export function analyticsSummary(days = 30) {
  const rows = all<{ name: string; n: number }>(`SELECT name, SUM(count) n FROM analytics_events WHERE day >= date('now', ?) GROUP BY name`, `-${days} days`);
  const g = (n: string) => rows.find(r => r.name === n)?.n || 0;
  const orders = get<{ n: number }>(`SELECT COUNT(*) n FROM orders WHERE created_at >= datetime('now', ?)`, `-${days} days`)?.n || 0;
  const paid = get<{ n: number }>(`SELECT COUNT(*) n FROM orders WHERE payment_status = 'confirmed' AND created_at >= datetime('now', ?)`, `-${days} days`)?.n || 0;
  return { landing: g('landing_view'), wizard: g('wizard_start'), category: g('category_view'), pricing: g('pricing_view'), orders, paid };
}


// ---------------- Códigos de desconto ----------------
export type DiscountRow = { id: number; code: string; kind: 'percent' | 'fixed'; value: number; applies_to: 'all' | 'carta' | 'evento'; valid_until: string | null; max_uses: number; used_count: number; is_active: number };
export const normalizeCode = (c: string) => String(c || '').toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 24);
export const MIN_FINAL_PRICE = 500;
export function listDiscountCodes(): DiscountRow[] { return all<DiscountRow>('SELECT * FROM discount_codes ORDER BY id DESC'); }
export function hasActiveDiscountCodes(): boolean { return !!get('SELECT 1 FROM discount_codes WHERE is_active = 1 AND (valid_until IS NULL OR valid_until > datetime(\'now\')) AND (max_uses = 0 OR used_count < max_uses)'); }
export function createDiscountCode(input: { code: string; kind: string; value: number; appliesTo: string; validUntil?: string | null; maxUses?: number }) {
  const code = normalizeCode(input.code); if (code.length < 3) throw new AppError('discount', 'O código deve ter 3 a 24 letras ou números.', 422);
  const kind = input.kind === 'fixed' ? 'fixed' : 'percent'; const value = Math.round(Number(input.value));
  if (!Number.isFinite(value) || value <= 0) throw new AppError('discount', 'Indica o valor do desconto.', 422);
  if (kind === 'percent' && value > 90) throw new AppError('discount', 'O desconto máximo é 90 %.', 422);
  const applies = ['carta', 'evento'].includes(input.appliesTo) ? input.appliesTo : 'all';
  const until = input.validUntil ? luandaToUtc(input.validUntil) : null; if (input.validUntil && !until) throw new AppError('discount', 'Data de validade inválida.', 422);
  if (get('SELECT 1 FROM discount_codes WHERE code = ?', code)) throw new AppError('discount', 'Já existe um código com esse nome.', 409);
  run('INSERT INTO discount_codes(code, kind, value, applies_to, valid_until, max_uses) VALUES(?,?,?,?,?,?)', code, kind, value, applies, until, Math.max(0, Math.round(input.maxUses || 0)));
}
export function toggleDiscountCode(id: number) { run('UPDATE discount_codes SET is_active = 1 - is_active WHERE id = ?', id); }
export function deleteDiscountCode(id: number) { run('DELETE FROM discount_codes WHERE id = ?', id); }

/** Valida o código para um plano e devolve o valor a descontar (nunca deixa o preço final abaixo de MIN_FINAL_PRICE). */
export function computeDiscount(codeRaw: string, plan: Row): { code: string; amount: number } {
  const code = normalizeCode(codeRaw);
  const d = get<DiscountRow>('SELECT * FROM discount_codes WHERE code = ?', code);
  if (!d || !d.is_active) throw new AppError('discount', 'Código inválido.', 422);
  if (d.valid_until && new Date(d.valid_until.replace(' ', 'T') + 'Z') <= new Date()) throw new AppError('discount', 'Este código já expirou.', 422);
  if (d.max_uses > 0 && d.used_count >= d.max_uses) throw new AppError('discount', 'Este código já atingiu o limite de utilizações.', 422);
  if (d.applies_to !== 'all' && d.applies_to !== (plan.kind || 'carta')) throw new AppError('discount', d.applies_to === 'evento' ? 'Este código só vale para pacotes de Eventos.' : 'Este código só vale para planos de cartas.', 422);
  if (plan.promo_active && getSetting('discount_stack_with_promo') !== '1') throw new AppError('discount', 'Este plano já está com preço promocional; o código não é acumulável.', 422);
  const raw = d.kind === 'percent' ? Math.floor(plan.effective_price * d.value / 100) : d.value;
  const amount = Math.max(0, Math.min(raw, plan.effective_price - MIN_FINAL_PRICE));
  if (amount <= 0) throw new AppError('discount', 'Este código não se aplica a este plano.', 422);
  return { code: d.code, amount };
}
export function applyDiscount(order: Row, codeRaw: string) {
  assertCustomerEditable(order);
  const plan = getPlan(order.plan_id)!; const r = computeDiscount(codeRaw, plan);
  run('UPDATE orders SET discount_code = ?, discount_amount = ?, amount = ? WHERE id = ?', r.code, r.amount, plan.effective_price - r.amount, order.id);
  touch(order.id);
}
export function removeDiscount(order: Row) {
  assertCustomerEditable(order); const plan = getPlan(order.plan_id)!;
  run('UPDATE orders SET discount_code = NULL, discount_amount = 0, amount = ? WHERE id = ?', plan.effective_price, order.id); touch(order.id);
}

/** Código oferecido a quem se inscreve na newsletter (definido nas configurações), se ainda estiver válido. */
export function newsletterOffer(): { code: string; label: string } | null {
  const code = normalizeCode(getSetting('newsletter_code')); if (!code) return null;
  const d = get<DiscountRow>('SELECT * FROM discount_codes WHERE code = ?', code);
  if (!d || !d.is_active || (d.valid_until && new Date(d.valid_until.replace(' ', 'T') + 'Z') <= new Date()) || (d.max_uses > 0 && d.used_count >= d.max_uses)) return null;
  return { code: d.code, label: d.kind === 'percent' ? `${d.value} % de desconto` : `${d.value} Kz de desconto` };
}
