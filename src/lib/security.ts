import crypto from 'node:crypto';
import { config } from './config';
import { dataKey } from './secrets';
import { run, get } from './db';

/** Token URL-safe com 192 bits de entropia. */
export function newToken(bytes = 24): string { return crypto.randomBytes(bytes).toString('base64url'); }

/** Código curto legível para encomendas (sem 0/O/1/I). */
export function newReference(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  const b = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) s += alphabet[b[i] % alphabet.length];
  return `CQ-${s}`;
}

export function hmac(data: string): string {
  return crypto.createHmac('sha256', config.sessionSecret).update(data).digest('base64url');
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a); const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export function sign(payload: string): string { return `${payload}.${hmac(payload)}`; }
export function verifySigned(value: string | undefined): string | null {
  if (!value) return null;
  const i = value.lastIndexOf('.');
  if (i < 0) return null;
  const payload = value.slice(0, i);
  return safeEqual(value.slice(i + 1), hmac(payload)) ? payload : null;
}

/** URL assinado e temporário para ficheiros privados. */
export function signedMediaUrl(mediaId: number, ttlSeconds = 3600): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  return `/api/media/${mediaId}?exp=${exp}&sig=${hmac(`media:${mediaId}:${exp}`)}`;
}
export function verifyMediaSig(mediaId: number, exp: string | null, sig: string | null): boolean {
  if (!exp || !sig) return false;
  const e = Number(exp);
  if (!Number.isFinite(e) || e < Date.now() / 1000) return false;
  return safeEqual(sig, hmac(`media:${mediaId}:${e}`));
}

/** Texto simples: remove caracteres de controlo e limita o tamanho. O React escapa ao renderizar (anti-XSS). */
export function cleanText(input: unknown, max = 5000): string {
  if (typeof input !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/<\/?[a-z][^>]*>/gi, '').trim().slice(0, max);
}

// ---------- Rate limiting (persistente em SQLite: sobrevive a reinícios; para várias instâncias usa Redis/Upstash) ----------
export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  if (Math.random() < 0.02) run('DELETE FROM rate_limits WHERE reset_at < ?', now);
  const b = get<{ count: number; reset_at: number }>('SELECT count, reset_at FROM rate_limits WHERE key = ?', key);
  if (!b || b.reset_at < now) { run('INSERT INTO rate_limits(key, count, reset_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET count = 1, reset_at = excluded.reset_at', key, 1, now + windowMs); return { ok: true, retryAfter: 0 }; }
  run('UPDATE rate_limits SET count = count + 1 WHERE key = ?', key);
  if (b.count + 1 > limit) return { ok: false, retryAfter: Math.ceil((b.reset_at - now) / 1000) };
  return { ok: true, retryAfter: 0 };
}
/**
 * IP do cliente para limites de taxa. O X-Forwarded-For pode ser falsificado pelo cliente
 * (as entradas à esquerda são dele); só a entrada acrescentada pelo nosso proxy é fiável.
 * TRUST_PROXY_HOPS = número de proxies confiáveis à frente da app (Render: 1).
 */
export function ipFromHeaders(h: Headers): string {
  const hops = Math.max(0, Number(process.env.TRUST_PROXY_HOPS ?? 1) || 0);
  const xf = (h.get('x-forwarded-for') || '').split(',').map(s => s.trim()).filter(Boolean);
  if (hops > 0 && xf.length) return xf[Math.max(0, xf.length - hops)] || 'unknown';
  return h.get('x-real-ip') || 'unknown';
}
export function clientIp(req: Request): string { return ipFromHeaders(req.headers); }
export function resetRateLimits() { run('DELETE FROM rate_limits'); }

// ---------- Cifra de dados em repouso (AES-256-GCM) ----------
const ENC_PREFIX = 'enc:v1:';
const FILE_MAGIC = Buffer.from('CQE1');

/** Cifra texto (ex.: email/telefone do cliente). Vazio/nulo fica igual. */
export function encryptText(v: string | null | undefined): string | null {
  if (v == null || v === '') return v ?? null;
  const iv = crypto.randomBytes(12); const c = crypto.createCipheriv('aes-256-gcm', dataKey(), iv);
  const ct = Buffer.concat([c.update(v, 'utf8'), c.final()]);
  return ENC_PREFIX + Buffer.concat([iv, c.getAuthTag(), ct]).toString('base64url');
}
/** Decifra; valores antigos ainda não cifrados são devolvidos tal como estão. */
export function decryptText(v: string | null | undefined): string | null {
  if (v == null || !v.startsWith(ENC_PREFIX)) return v ?? null;
  try {
    const b = Buffer.from(v.slice(ENC_PREFIX.length), 'base64url');
    const d = crypto.createDecipheriv('aes-256-gcm', dataKey(), b.subarray(0, 12)); d.setAuthTag(b.subarray(12, 28));
    return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8');
  } catch { return null; }
}
/** Índice cego (HMAC) para procurar por um valor cifrado sem o guardar em claro. */
export function blindIndex(v: string | null | undefined): string | null {
  if (!v) return null;
  return crypto.createHmac('sha256', dataKey()).update('idx:' + v.trim().toLowerCase()).digest('base64url').slice(0, 32);
}
export function encryptFile(buf: Buffer): Buffer {
  const iv = crypto.randomBytes(12); const c = crypto.createCipheriv('aes-256-gcm', dataKey(), iv);
  const ct = Buffer.concat([c.update(buf), c.final()]);
  return Buffer.concat([FILE_MAGIC, iv, c.getAuthTag(), ct]);
}
export function decryptFile(buf: Buffer): Buffer {
  if (buf.length < 32 || !buf.subarray(0, 4).equals(FILE_MAGIC)) return buf; // ficheiro antigo, em claro
  const d = crypto.createDecipheriv('aes-256-gcm', dataKey(), buf.subarray(4, 16)); d.setAuthTag(buf.subarray(16, 32));
  return Buffer.concat([d.update(buf.subarray(32)), d.final()]);
}

// ---------- Proteção contra robôs ----------
// Formulários públicos pedem um "form token" assinado (GET /api/form-token) e devolvem-no com
// o envio, junto de um campo-armadilha escondido ("website"). Um robô que não executa JavaScript,
// que envia em menos de 2 s, que reutiliza um token antigo ou que preenche o campo escondido é travado.
const FORM_MIN_MS = 2000; const FORM_MAX_MS = 12 * 3600_000;
export function newFormToken(): string { return sign(`form:${Date.now()}:${crypto.randomBytes(6).toString('base64url')}`); }
/** Cada token só pode ser usado uma vez (impede que um robô reutilize o mesmo token). */
export function consumeFormToken(t: unknown): boolean {
  if (typeof t !== 'string') return false;
  return rateLimit(`ft:${crypto.createHash('sha256').update(t).digest('base64url').slice(0, 24)}`, 1, FORM_MAX_MS).ok;
}
export function checkBot(fields: { _t?: unknown; website?: unknown }, now = Date.now()): { ok: true } | { ok: false; reason: string } {
  if (typeof fields.website === 'string' && fields.website.trim() !== '') return { ok: false, reason: 'honeypot' };
  const payload = typeof fields._t === 'string' ? verifySigned(fields._t) : null;
  if (!payload || !payload.startsWith('form:')) return { ok: false, reason: 'token' };
  const t = Number(payload.split(':')[1]);
  if (!Number.isFinite(t) || now - t < FORM_MIN_MS) return { ok: false, reason: 'too_fast' };
  if (now - t > FORM_MAX_MS) return { ok: false, reason: 'expired' };
  return { ok: true };
}

// ---------- Leitura de pedidos com limite de tamanho ----------
export class BodyTooLarge extends Error {}
/** Lê o corpo do pedido sem nunca guardar mais de maxBytes em memória (mesmo sem Content-Length). */
export async function readBodyLimited(req: Request, maxBytes: number): Promise<Buffer> {
  const declared = Number(req.headers.get('content-length') || 0);
  if (declared > maxBytes) throw new BodyTooLarge();
  if (!req.body) return Buffer.alloc(0);
  const reader = req.body.getReader(); const chunks: Uint8Array[] = []; let total = 0;
  for (;;) {
    const { done, value } = await reader.read(); if (done) break;
    total += value.byteLength;
    if (total > maxBytes) { await reader.cancel().catch(() => {}); throw new BodyTooLarge(); }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}
/** JSON com limite de tamanho (por defeito 64 KB). Devolve null se não for JSON válido. */
export async function readJson(req: Request, maxBytes = 64 * 1024): Promise<unknown> {
  const ct = req.headers.get('content-type') || '';
  if (!ct.toLowerCase().includes('application/json')) return null; // bloqueia envios de formulários de outros sites (text/plain)
  const buf = await readBodyLimited(req, maxBytes);
  try { return JSON.parse(buf.toString('utf8')); } catch { return null; }
}
/** multipart/form-data com limite de tamanho. */
export async function readForm(req: Request, maxBytes: number): Promise<FormData | null> {
  const buf = await readBodyLimited(req, maxBytes);
  try { return await new Request('http://local/', { method: 'POST', headers: { 'content-type': req.headers.get('content-type') || '' }, body: new Uint8Array(buf) }).formData(); } catch { return null; }
}

/** Nomes de colunas em SQL dinâmico só podem vir de listas fixas do código. */
export function assertIdentifiers(names: string[], allowed: readonly string[]) {
  for (const n of names) if (!allowed.includes(n) || !/^[a-z_]+$/.test(n)) throw new Error(`Coluna não permitida: ${n}`);
}
