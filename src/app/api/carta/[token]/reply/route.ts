import { z } from 'zod';
import { cookies } from 'next/headers';
import { resolvePublicLetter, pinCookieValid, addReply, parseExtra } from '@/lib/orders';
import { ok, fail, limit } from '@/lib/api';
import { derive } from '@/lib/categories';

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const params = await ctx.params;
  const rl = limit(req, 'reply', 8, 60 * 60_000); if (rl) return rl;
  const r = resolvePublicLetter(params.token);
  if (r.state !== 'ok') return fail('Não foi possível enviar a mensagem.', 404, 'not_found');
  if (r.letter.pin_hash && !pinCookieValid(r.letter.id, (await cookies()).get(`pin_${r.letter.id}`)?.value)) return fail('Introduz o PIN primeiro.', 401, 'pin_required');
  const body = z.object({ choice: z.enum(['yes', 'no']).optional(), author: z.string().max(60).default(''), message: z.string().trim().max(1000).default('') }).safeParse(await req.json().catch(() => null));
  if (!body.success) return fail('Mensagem inválida.', 422, 'validation');
  const proposal = derive(r.order.occasion, parseExtra(r.letter.extra), r.letter.special_date).proposal;
  if (body.data.choice) {
    if (!proposal) return fail('Esta carta não tem pergunta para responder.', 404, 'not_found');
    addReply(r.letter, 'answer', body.data.author, body.data.choice === 'yes' ? proposal.yes : proposal.no); // o texto vem sempre da configuração da carta
    return ok({ answered: body.data.choice });
  }
  if (!r.letter.allow_reply) return fail('Esta carta não aceita respostas.', 404, 'not_found');
  if (!body.data.message) return fail('Escreve uma mensagem.', 422, 'validation');
  addReply(r.letter, 'message', body.data.author, body.data.message);
  return ok();
}
