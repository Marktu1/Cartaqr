// Respostas à carta (mensagens, reações, vales, cápsulas, "Sim") e confirmações de presença.
import { all, get, run, Row } from './db';
import { cleanText } from './security';
import { getCategory, derive } from './categories';
import { parseExperience, REACTIONS, todayLuanda } from './experience';
import { AppError, parseExtra } from './order-core';
import { getPlan } from './plans';

export type ReplyKind = 'message' | 'answer' | 'reaction' | 'voucher' | 'capsule';
export function addReply(letter: Row, kind: ReplyKind, author: string, message: string, openAt: string | null = null) {
  run('INSERT INTO letter_replies(letter_id, kind, author, message, open_at) VALUES(?,?,?,?,?)', letter.id, kind, cleanText(author, 60), cleanText(message, 1000), openAt);
}
export function listReplies(letterId: number): Row[] { return all('SELECT * FROM letter_replies WHERE letter_id = ? ORDER BY id DESC', letterId); }

/** Regras de negócio de uma resposta à carta pública. Lança AppError se não for permitida. */
export function submitReply(letter: Row, order: Row, input: { choice?: 'yes' | 'no'; kind: Exclude<ReplyKind, 'answer'>; author: string; message: string }): { answered?: 'yes' | 'no'; openAt?: string } {
  const { kind, author, message } = input;
  const exp = parseExperience(letter.experience);
  const isCarta = getCategory(order.occasion).kind === 'carta';
  if (input.choice) {
    const proposal = derive(order.occasion, parseExtra(letter.extra), letter.special_date).proposal;
    if (!proposal) throw new AppError('not_found', 'Esta carta não tem pergunta para responder.', 404);
    addReply(letter, 'answer', author, input.choice === 'yes' ? proposal.yes : proposal.no); // o texto vem sempre da configuração da carta
    return { answered: input.choice };
  }
  if (kind === 'reaction') {
    if (!isCarta || exp.reactions === false) throw new AppError('not_found', 'Esta carta não aceita reações.', 404);
    if (!REACTIONS.includes(message)) throw new AppError('validation', 'Reação inválida.', 422);
    addReply(letter, 'reaction', author, message);
    return {};
  }
  if (kind === 'voucher') {
    if (!exp.vouchers?.includes(message)) throw new AppError('validation', 'Vale inválido.', 422);
    addReply(letter, 'voucher', author, message);
    return {};
  }
  if (kind === 'capsule') {
    if (!isCarta || exp.capsule === false) throw new AppError('not_found', 'Esta carta não tem cápsula do tempo.', 404);
    if (message.length < 3) throw new AppError('validation', 'Escreve a tua promessa ou mensagem.', 422);
    if ((get<{ n: number }>("SELECT COUNT(*) AS n FROM letter_replies WHERE letter_id = ? AND kind = 'capsule'", letter.id)?.n || 0) >= 3) throw new AppError('limit', 'Esta carta já tem cápsulas suficientes.', 422);
    const d = new Date(todayLuanda() + 'T12:00:00Z'); d.setUTCFullYear(d.getUTCFullYear() + 1);
    const openAt = d.toISOString().slice(0, 10);
    addReply(letter, 'capsule', author, message.slice(0, 600), openAt);
    // A promessa tem de poder ser aberta: se a carta expirasse antes, fica disponível até 30 dias depois da abertura.
    const keepUntil = new Date(openAt + 'T00:00:00Z'); keepUntil.setUTCDate(keepUntil.getUTCDate() + 30);
    const keep = keepUntil.toISOString().slice(0, 19).replace('T', ' ');
    run("UPDATE letters SET expires_at = ? WHERE id = ? AND expires_at IS NOT NULL AND expires_at < ?", keep, letter.id, keep);
    return { openAt };
  }
  if (!letter.allow_reply) throw new AppError('not_found', 'Esta carta não aceita respostas.', 404);
  if (!message) throw new AppError('validation', 'Escreve uma mensagem.', 422);
  addReply(letter, 'message', author, message);
  return {};
}

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
