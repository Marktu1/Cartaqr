import crypto from 'node:crypto';
import { config } from './config';
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
export function clientIp(req: Request): string {
  const xf = req.headers.get('x-forwarded-for');
  return (xf ? xf.split(',')[0].trim() : req.headers.get('x-real-ip')) || 'unknown';
}
export function resetRateLimits() { run('DELETE FROM rate_limits'); }
