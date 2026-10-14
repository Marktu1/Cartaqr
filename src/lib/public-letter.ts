// Carta pública: estado de acesso, PIN e cookie de PIN.
import bcrypt from 'bcryptjs';
import { get, Row } from './db';
import { sign, verifySigned, hmac, safeEqual } from './security';
import { getOrderById, setStatus } from './order-core';

export type PublicLetterState =
  | { state: 'notfound' } | { state: 'unpublished' } | { state: 'blocked' } | { state: 'expired' } | { state: 'locked'; unlockAt: string; letter: Row; order: Row }
  | { state: 'ok'; letter: Row; order: Row };

export function resolvePublicLetter(token: string): PublicLetterState {
  if (!token || token.length < 20 || token.length > 100) return { state: 'notfound' };
  const letter = get('SELECT * FROM letters WHERE secure_token = ?', token);
  if (!letter) return { state: 'notfound' };
  const order = getOrderById(letter.order_id)!;
  if (letter.is_blocked || order.order_status === 'cancelled') return { state: 'blocked' };
  if (order.order_status === 'expired' || (letter.expires_at && new Date(letter.expires_at.replace(' ', 'T') + 'Z') <= new Date())) {
    if (order.order_status === 'published') setStatus(order, 'expired', 'system', 'Expirada automaticamente');
    return { state: 'expired' };
  }
  if (!letter.is_published || order.order_status !== 'published') return { state: 'unpublished' };
  if (letter.unlock_at && new Date(letter.unlock_at.replace(' ', 'T') + 'Z') > new Date()) return { state: 'locked', unlockAt: new Date(letter.unlock_at.replace(' ', 'T') + 'Z').toISOString(), letter, order };
  return { state: 'ok', letter, order };
}

/** Carta pelo token público (para o PIN). */
export function getLetterBySecureToken(token: string): Row | undefined {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return undefined;
  return get('SELECT * FROM letters WHERE secure_token = ?', token);
}

export function verifyPin(letter: Row, pin: string): boolean { return !!letter.pin_hash && bcrypt.compareSync(pin, letter.pin_hash); }
// O cookie fica ligado ao PIN atual: se o PIN mudar, os acessos antigos deixam de valer.
const pinStamp = (letter: Row) => hmac(`pinstamp:${letter.id}:${letter.pin_hash || ''}`).slice(0, 16);
export function pinCookieValue(letter: Row): string { return sign(`pin:${letter.id}:${Math.floor(Date.now() / 1000) + 6 * 3600}:${pinStamp(letter)}`); }
export function pinCookieValid(letter: Row, cookie: string | undefined): boolean {
  const p = verifySigned(cookie);
  if (!p) return false;
  const [tag, id, exp, stamp] = p.split(':');
  return tag === 'pin' && Number(id) === letter.id && Number(exp) > Date.now() / 1000 && !!stamp && safeEqual(stamp, pinStamp(letter));
}
