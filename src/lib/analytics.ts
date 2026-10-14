// Aberturas e analytics (sem dados pessoais).
import { all, get, run } from './db';

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
