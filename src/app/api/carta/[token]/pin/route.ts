import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyPin, pinCookieValue, getLetterBySecureToken } from '@/lib/public-letter';
import { fail, limit, handle } from '@/lib/api';
import { rateLimit, readJson } from '@/lib/security';
import { pinCookieName, pinCookieOptions } from '@/lib/cookies';

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
  const params = await ctx.params;
  const rl = limit(req, 'pin-ip', 30, 10 * 60_000); if (rl) return rl;
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(params.token)) return fail('Esta carta não existe ou não precisa de PIN.', 404, 'not_found');
  const letter = getLetterBySecureToken(params.token);
  if (!letter || !letter.pin_hash) return fail('Esta carta não existe ou não precisa de PIN.', 404, 'not_found');
  const per = rateLimit(`pin-letter:${letter.id}`, 10, 10 * 60_000);
  if (!per.ok) return fail(`Demasiadas tentativas. Tenta novamente em ${Math.ceil(per.retryAfter / 60)} min.`, 429, 'rate_limited');
  const body = z.object({ pin: z.string().regex(/^\d{4,6}$/) }).safeParse(await readJson(req, 1024));
  if (!body.success || !verifyPin(letter, body.data.pin)) return fail('PIN incorreto. Tenta novamente.', 401, 'bad_pin');
  const res = NextResponse.json({ ok: true });
  res.cookies.set(pinCookieName(letter.id), pinCookieValue(letter), pinCookieOptions());
  return res;
  } catch (e) { return handle(e); }
}
