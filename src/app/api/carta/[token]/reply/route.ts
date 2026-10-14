import { z } from 'zod';
import { cookies } from 'next/headers';
import { resolvePublicLetter, pinCookieValid, submitReply } from '@/lib/orders';
import { ok, fail, limit, handle, botBlock } from '@/lib/api';
import { readJson } from '@/lib/security';
import { pinCookieName } from '@/lib/cookies';

const Body = z.object({
  choice: z.enum(['yes', 'no']).optional(),
  kind: z.enum(['message', 'reaction', 'voucher', 'capsule']).default('message'),
  author: z.string().max(60).default(''),
  message: z.string().trim().max(1000).default(''),
});

/** Rota fina: limita, verifica acesso e valida o formato. As regras ficam em submitReply (src/lib/replies.ts). */
export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    const params = await ctx.params;
    const rl = limit(req, 'reply', 12, 60 * 60_000); if (rl) return rl;
    const r = resolvePublicLetter(params.token);
    if (r.state !== 'ok') return fail('Não foi possível enviar a mensagem.', 404, 'not_found');
    if (r.letter.pin_hash && !pinCookieValid(r.letter, (await cookies()).get(pinCookieName(r.letter.id))?.value)) return fail('Introduz o PIN primeiro.', 401, 'pin_required');
    const raw = await readJson(req, 8 * 1024);
    const bot = botBlock(raw); if (bot) return bot;
    const body = Body.safeParse(raw);
    if (!body.success) return fail('Mensagem inválida.', 422, 'validation');
    return ok(submitReply(r.letter, r.order, body.data));
  } catch (e) { return handle(e); }
}
