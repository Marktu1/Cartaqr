// Notificações: links wa.me (abertos pelo utilizador) + envio automático opcional pela WhatsApp Cloud API (Meta).
// Ativa definindo WHATSAPP_TOKEN e WHATSAPP_PHONE_ID. Sem estas variáveis, nada é enviado (só os links wa.me).
// Nota: a Meta só permite texto livre dentro de 24h após o cliente escrever; fora disso é preciso um template aprovado.
import crypto from 'node:crypto';
import { config } from './config';
import { run } from './db';
import { getSetting, whatsappLink } from './settings';

export function customerToAdminWhatsApp(reference: string, planName: string, amountLabel: string): string {
  return whatsappLink(getSetting('whatsapp_number'), `Olá! Fiz a encomenda ${reference} (plano ${planName}, ${amountLabel}). Segue o comprovativo de pagamento.`);
}
export function adminToCustomerWhatsApp(phone: string | null, text: string): string | null {
  return phone ? whatsappLink(phone, text) : null;
}

export const autoWhatsappEnabled = () => !!(config.waToken && config.waPhoneId);

/** Envia texto por WhatsApp Cloud API. Nunca lança erro nem bloqueia o fluxo; regista só um hash do número. */
export async function notifyWhatsApp(phone: string | null | undefined, kind: string, text: string): Promise<boolean> {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!autoWhatsappEnabled() || digits.length < 8) return false;
  const toHash = crypto.createHash('sha256').update(digits).digest('hex').slice(0, 16);
  try {
    const r = await fetch(`https://graph.facebook.com/v20.0/${encodeURIComponent(config.waPhoneId)}/messages`, {
      method: 'POST', headers: { Authorization: `Bearer ${config.waToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: digits, type: 'text', text: { body: text.slice(0, 1000), preview_url: true } }), signal: AbortSignal.timeout(8000),
    });
    run('INSERT INTO notification_log(channel, to_hash, kind, status, detail) VALUES(?,?,?,?,?)', 'whatsapp', toHash, kind, r.ok ? 'sent' : 'failed', r.ok ? null : `HTTP ${r.status}`);
    return r.ok;
  } catch (e) {
    try { run('INSERT INTO notification_log(channel, to_hash, kind, status, detail) VALUES(?,?,?,?,?)', 'whatsapp', toHash, kind, 'failed', String((e as Error).message).slice(0, 120)); } catch { /* */ }
    return false;
  }
}
