import { z } from 'zod';
import { all, get, run } from './db';
import { newToken } from './security';

const emailSchema = z.string().trim().toLowerCase().max(254).email();
export const NEWSLETTER_SOURCES = ['popup', 'footer', 'home', 'precos', 'site'] as const;

/** Inscreve (ou reativa) um email. Nunca revela se o email já existia. */
export function subscribe(rawEmail: string, source: string): { ok: true } | { ok: false; error: string } {
  const p = emailSchema.safeParse(rawEmail); if (!p.success) return { ok: false, error: 'Indica um email válido.' };
  const src = (NEWSLETTER_SOURCES as readonly string[]).includes(source) ? source : 'site';
  const existing = get<{ id: number; unsubscribed_at: string | null }>('SELECT id, unsubscribed_at FROM newsletter_subscribers WHERE email = ?', p.data);
  if (!existing) run('INSERT INTO newsletter_subscribers(email, source, unsub_token) VALUES(?,?,?)', p.data, src, newToken(24));
  else if (existing.unsubscribed_at) run(`UPDATE newsletter_subscribers SET unsubscribed_at = NULL, consent_at = datetime('now'), source = ? WHERE id = ?`, src, existing.id);
  return { ok: true };
}
export function unsubscribe(token: string): boolean {
  if (!token || token.length < 20 || token.length > 60) return false;
  return run(`UPDATE newsletter_subscribers SET unsubscribed_at = COALESCE(unsubscribed_at, datetime('now')) WHERE unsub_token = ?`, token).changes > 0;
}
export function listSubscribers(): Record<string, any>[] { return all('SELECT * FROM newsletter_subscribers ORDER BY id DESC LIMIT 5000'); }
export function subscriberStats() {
  const r = get<{ total: number; active: number }>(`SELECT COUNT(*) total, COALESCE(SUM(CASE WHEN unsubscribed_at IS NULL THEN 1 ELSE 0 END),0) active FROM newsletter_subscribers`);
  const bySource = all<{ source: string; n: number }>(`SELECT source, COUNT(*) n FROM newsletter_subscribers WHERE unsubscribed_at IS NULL GROUP BY source`);
  return { total: r?.total || 0, active: r?.active || 0, bySource };
}
export function deleteSubscriber(id: number) { run('DELETE FROM newsletter_subscribers WHERE id = ?', id); }
/** CSV só com inscritos ativos; neutraliza fórmulas. */
export function subscribersCsv(): string {
  const esc = (v: unknown) => { let t = String(v ?? ''); if (/^[=+\-@]/.test(t)) t = "'" + t; return `"${t.replace(/"/g, '""')}"`; };
  return '﻿' + ['Email,Origem,Consentimento em', ...listSubscribers().filter(s => !s.unsubscribed_at).reverse().map(s => [s.email, s.source, s.consent_at].map(esc).join(','))].join('\n');
}
