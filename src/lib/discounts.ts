// Códigos de desconto e promoções.
import { get, run, all, Row } from './db';
import { luandaToUtc } from './format';
import { getSetting } from './settings';
import { AppError, assertCustomerEditable, touch } from './order-core';
import { getPlan } from './plans';

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
