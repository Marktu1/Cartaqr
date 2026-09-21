import { all, get, run } from './db';

export const SETTING_DEFAULTS: Record<string, string> = {
  site_name: 'Carta QR',
  currency: 'Kz',
  whatsapp_number: '244900000000',
  payment_instructions: 'Faz a transferência ou o pagamento Multicaixa Express para os dados abaixo e envia o comprovativo. Indica o código da tua encomenda na referência.',
  payment_account: 'IBAN: AO06 0000 0000 0000 0000 0000 0 (exemplo, altera no painel)\nMulticaixa Express: 900 000 000 (exemplo)',
  max_image_mb: '8',
  max_video_mb: '50',
  max_audio_mb: '15',
  max_proof_mb: '8',
  default_expiry_days: '180',
  address_form: 'tu',
  newsletter_popup: '1',
  discount_stack_with_promo: '0',
  newsletter_code: '',
};

export function getSetting(key: string): string {
  const r = get<{ value: string }>('SELECT value FROM settings WHERE key = ?', key);
  return r ? r.value : SETTING_DEFAULTS[key] ?? '';
}
export function getSettings(): Record<string, string> {
  const out = { ...SETTING_DEFAULTS };
  for (const r of all<{ key: string; value: string }>('SELECT key, value FROM settings')) out[r.key] = r.value;
  return out;
}
export function setSetting(key: string, value: string) {
  run(`INSERT INTO settings(key, value, updated_at) VALUES(?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`, key, value);
}
/** Apenas o que é seguro expor ao público. */
export function getPublicSettings() {
  const s = getSettings();
  return { siteName: s.site_name, currency: s.currency, whatsapp: s.whatsapp_number, newsletterPopup: s.newsletter_popup !== '0' };
}
export function whatsappLink(number: string, text: string): string {
  const n = number.replace(/\D/g, '');
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}
