export function formatMoney(amount: number, currency: string): string {
  const n = String(Math.round(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  return currency === 'Kz' ? `${n} Kz` : `${n} ${currency}`;
}
export function formatDate(d: string | null | undefined): string {
  if (!d) return '';
  const dt = new Date(d.includes('T') || d.includes(' ') ? d.replace(' ', 'T') + (d.endsWith('Z') ? '' : 'Z') : d + 'T12:00:00');
  if (isNaN(dt.getTime())) return '';
  return new Intl.DateTimeFormat('pt-PT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(dt);
}
/** Normaliza telefone angolano: aceita 9XXXXXXXX, +2449XXXXXXXX, 002449... */
export function normalizePhone(input: string): string | null {
  const d = input.replace(/[^\d+]/g, '').replace(/^00/, '+');
  const digits = d.replace(/\D/g, '');
  if (/^9\d{8}$/.test(digits)) return `+244${digits}`;
  if (/^2449\d{8}$/.test(digits)) return `+${digits}`;
  if (d.startsWith('+') && digits.length >= 8 && digits.length <= 15) return `+${digits}`;
  return null;
}
export const STATUS_LABEL: Record<string, string> = {
  draft: 'Rascunho', payment_pending: 'Pagamento pendente', proof_submitted: 'Comprovativo enviado',
  payment_confirmed: 'Pagamento confirmado', in_production: 'Em produção', published: 'Publicada', expired: 'Expirada', cancelled: 'Cancelada',
};

// Fuso de Angola (Africa/Luanda) = UTC+1 o ano todo, sem horário de verão.
/** 'YYYY-MM-DDTHH:mm' (hora de Luanda) → 'YYYY-MM-DD HH:mm:ss' em UTC. */
export function luandaToUtc(local: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local || ''); if (!m) return null;
  const t = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4] - 1, +m[5]); if (Number.isNaN(t)) return null;
  return new Date(t).toISOString().replace('T', ' ').slice(0, 19);
}
/** UTC ('YYYY-MM-DD HH:mm:ss') → 'YYYY-MM-DDTHH:mm' em hora de Luanda. */
export function utcToLuanda(utc: string | null | undefined): string {
  if (!utc) return ''; const d = new Date(utc.replace(' ', 'T') + 'Z'); if (Number.isNaN(d.getTime())) return '';
  return new Date(d.getTime() + 3600_000).toISOString().slice(0, 16);
}
export function formatLuanda(utc: string | null | undefined): string {
  const l = utcToLuanda(utc); if (!l) return '';
  return new Intl.DateTimeFormat('pt-PT', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(new Date(l + ':00Z')) + ' (hora de Luanda)';
}
