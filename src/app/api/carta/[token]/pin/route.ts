import { NextResponse } from 'next/server';
import { z } from 'zod';
import { get } from '@/lib/db';
import { verifyPin, pinCookieValue } from '@/lib/orders';
import { fail, limit } from '@/lib/api';
import { rateLimit } from '@/lib/security';

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const params = await ctx.params;
  const rl = limit(req, 'pin-ip', 30, 10 * 60_000); if (rl) return rl;
  const letter = get('SELECT * FROM letters WHERE secure_token = ?', params.token);
  if (!letter || !letter.pin_hash) return fail('Esta carta não existe ou não precisa de PIN.', 404, 'not_found');
  const per = rateLimit(`pin-letter:${letter.id}`, 10, 10 * 60_000);
  if (!per.ok) return fail(`Demasiadas tentativas. Tenta novamente em ${Math.ceil(per.retryAfter / 60)} min.`, 429, 'rate_limited');
  const body = z.object({ pin: z.string().max(10) }).safeParse(await req.json().catch(() => null));
  if (!body.success || !verifyPin(letter, body.data.pin)) return fail('PIN incorreto. Tenta novamente.', 401, 'bad_pin');
  const res = NextResponse.json({ ok: true });
  res.cookies.set(`pin_${letter.id}`, pinCookieValue(letter.id), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 6 * 3600 });
  return res;
}
