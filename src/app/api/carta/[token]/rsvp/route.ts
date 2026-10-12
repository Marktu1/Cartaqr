import { z } from 'zod';
import { cookies } from 'next/headers';
import { resolvePublicLetter, pinCookieValid, addRsvp, AppError } from '@/lib/orders';
import { ok, fail, handle, limit, botBlock } from '@/lib/api';
import { readJson } from '@/lib/security';
import { pinCookieName } from '@/lib/cookies';

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const params = await ctx.params;
  try {
    const rl = limit(req, 'rsvp', 20, 60 * 60_000); if (rl) return rl;
    const r = resolvePublicLetter(params.token);
    if (r.state !== 'ok') return fail('Este convite não está disponível.', 404, 'not_found');
    if (r.letter.pin_hash && !pinCookieValid(r.letter, (await cookies()).get(pinCookieName(r.letter.id))?.value)) return fail('Introduz o PIN primeiro.', 401, 'pin_required');
    const raw = await readJson(req, 8 * 1024);
    const bot = botBlock(raw); if (bot) return bot;
    const b = z.object({ name: z.string().trim().min(1, 'Indica o teu nome.').max(80), attending: z.enum(['yes', 'no', 'maybe']), guests: z.number().int().min(1).max(10).default(1), message: z.string().max(300).default('') }).safeParse(raw);
    if (!b.success) return fail(b.error.issues[0]?.message || 'Dados inválidos.', 422, 'validation');
    const res = addRsvp(r.letter, r.order, b.data);
    return ok({ updated: res.updated });
  } catch (e) { if (e instanceof AppError) return fail(e.message, e.status, e.code); return handle(e); }
}
