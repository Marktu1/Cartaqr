// Planos e ocasiões (catálogo).
import { all, get, run, Row } from './db';
import { AppError } from './order-core';

export function listPlans(activeOnly = true, kind?: 'carta' | 'evento'): Row[] {
  const where: string[] = []; const params: unknown[] = [];
  if (activeOnly) where.push('is_active = 1');
  if (kind) { where.push('kind = ?'); params.push(kind === 'evento' ? 'evento' : 'carta'); }
  const rows = all(`SELECT * FROM plans ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY sort_order, id`, ...params);
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
/** Todas as ocasiões, incluindo as inativas (painel). */
export function listAllOccasions(): Row[] { return all('SELECT * FROM occasions ORDER BY sort_order, id'); }
/** Preços promocionais em bruto (o painel mostra-os mesmo depois de expirarem). */
export function listPlanPromos(): Row[] { return all('SELECT id, promo_price, promo_ends_at FROM plans'); }

export type PlanUpdate = { name: string; description: string; price: number; currency: string; maxPhotos: number; maxVideos: number; maxAudio: number; maxGuests: number; durationDays: number; features: string[]; isActive: boolean; promoPrice: number | null; promoEndsAt: string | null };
export function updatePlan(id: number, p: PlanUpdate) {
  if (!get('SELECT 1 FROM plans WHERE id = ?', id)) throw new AppError('not_found', 'Plano não encontrado.', 404);
  run(`UPDATE plans SET name = ?, description = ?, price = ?, currency = ?, max_photos = ?, max_videos = ?, max_audio_files = ?, max_guests = ?, duration_days = ?, features = ?, is_active = ?, promo_price = ?, promo_ends_at = ? WHERE id = ?`,
    p.name, p.description, p.price, p.currency, p.maxPhotos, p.maxVideos, p.maxAudio, p.maxGuests, p.durationDays, JSON.stringify(p.features), p.isActive ? 1 : 0, p.promoPrice, p.promoEndsAt, id);
}
export function updateOccasion(id: number, o: { name: string; description: string; defaultTheme: string; isActive: boolean }) {
  run('UPDATE occasions SET name = ?, description = ?, default_theme = ?, is_active = ? WHERE id = ?', o.name, o.description, o.defaultTheme, o.isActive ? 1 : 0, id);
}
