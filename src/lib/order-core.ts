// Núcleo das encomendas: tipos, erros e ajudantes partilhados pelos módulos de negócio.
import { all, get, run, Row } from './db';
import { encryptText, decryptText, blindIndex, assertIdentifiers } from './security';

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

export function getOrderByToken(manageToken: string): Row | undefined {
  if (!manageToken || manageToken.length < 20) return undefined;
  return decodeOrder(get('SELECT * FROM orders WHERE manage_token = ?', manageToken));
}
export function getOrderById(id: number): Row | undefined { return decodeOrder(get('SELECT * FROM orders WHERE id = ?', id)); }

/** Email e telefone do cliente ficam cifrados na base de dados; aqui são decifrados para uso no servidor. */
export function decodeOrder<T extends Row | undefined>(o: T): T {
  if (!o) return o;
  return { ...o, customer_email: decryptText(o.customer_email), customer_phone: decryptText(o.customer_phone) } as T;
}
/** Cifra contactos guardados em claro por versões anteriores (corre no arranque). */
export function migrateEncryptedFields() {
  for (const o of all<{ id: number; customer_email: string | null; customer_phone: string | null }>(
    "SELECT id, customer_email, customer_phone FROM orders WHERE (customer_email IS NOT NULL AND customer_email NOT LIKE 'enc:%') OR (customer_phone IS NOT NULL AND customer_phone NOT LIKE 'enc:%')")) {
    run('UPDATE orders SET customer_email = ?, customer_phone = ?, customer_email_idx = ?, customer_phone_idx = ? WHERE id = ?',
      encryptText(decryptText(o.customer_email)), encryptText(decryptText(o.customer_phone)), blindIndex(decryptText(o.customer_email)), blindIndex(decryptText(o.customer_phone)), o.id);
  }
  for (const m of all<{ id: number; contact: string }>("SELECT id, contact FROM contact_messages WHERE contact NOT LIKE 'enc:%'")) run('UPDATE contact_messages SET contact = ? WHERE id = ?', encryptText(m.contact), m.id);
}
export function getLetterByOrder(orderId: number): Row | undefined { return get('SELECT * FROM letters WHERE order_id = ?', orderId); }
export function getMemories(letterId: number): Row[] { return all('SELECT * FROM memories WHERE letter_id = ? ORDER BY sort_order, id', letterId); }

export function logEvent(orderId: number, from: string | null, to: string, actor: string, note?: string) {
  run('INSERT INTO order_events(order_id, from_status, to_status, actor, note) VALUES(?,?,?,?,?)', orderId, from, to, actor, note ?? null);
}
export function touch(orderId: number) { run(`UPDATE orders SET updated_at = datetime('now') WHERE id = ?`, orderId); }

export function assertCustomerEditable(order: Row) {
  if (!CUSTOMER_EDITABLE.includes(order.order_status)) {
    throw new AppError('locked', 'Esta Carta QR já foi confirmada e não pode ser editada aqui. Contacta-nos pelo WhatsApp para pedir alterações.', 403);
  }
}

const ORDER_STATUS_COLUMNS = ['payment_status', 'payment_proof_path', 'payment_proof_mime', 'payment_note', 'completed_at', 'discount_code', 'discount_amount', 'amount'] as const;
export function setStatus(order: Row, to: OrderStatus, actor: string, note?: string, extra: Record<string, unknown> = {}) {
  const cols = Object.keys(extra);
  assertIdentifiers(cols, ORDER_STATUS_COLUMNS);
  run(`UPDATE orders SET order_status = ?, ${cols.map(c => `${c} = ?`).join(', ')}${cols.length ? ',' : ''} updated_at = datetime('now') WHERE id = ?`, to, ...cols.map(c => extra[c]), order.id);
  logEvent(order.id, order.order_status, to, actor, note);
}
