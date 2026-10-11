import { z } from 'zod';
import { cookies } from 'next/headers';
import { resolvePublicLetter, pinCookieValid, addReply, parseExtra } from '@/lib/orders';
import { ok, fail, limit } from '@/lib/api';
import { derive, getCategory } from '@/lib/categories';
import { parseExperience, REACTIONS, todayLuanda } from '@/lib/experience';
import { run, get } from '@/lib/db';

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const params = await ctx.params;
  const rl = limit(req, 'reply', 12, 60 * 60_000); if (rl) return rl;
  const r = resolvePublicLetter(params.token);
  if (r.state !== 'ok') return fail('Não foi possível enviar a mensagem.', 404, 'not_found');
  if (r.letter.pin_hash && !pinCookieValid(r.letter.id, (await cookies()).get(`pin_${r.letter.id}`)?.value)) return fail('Introduz o PIN primeiro.', 401, 'pin_required');
  const body = z.object({
    choice: z.enum(['yes', 'no']).optional(),
    kind: z.enum(['message', 'reaction', 'voucher', 'capsule']).default('message'),
    author: z.string().max(60).default(''),
    message: z.string().trim().max(1000).default(''),
  }).safeParse(await req.json().catch(() => null));
  if (!body.success) return fail('Mensagem inválida.', 422, 'validation');
  const { kind, author, message } = body.data;
  const exp = parseExperience(r.letter.experience);
  const isCarta = getCategory(r.order.occasion).kind === 'carta';

  if (body.data.choice) {
    const proposal = derive(r.order.occasion, parseExtra(r.letter.extra), r.letter.special_date).proposal;
    if (!proposal) return fail('Esta carta não tem pergunta para responder.', 404, 'not_found');
    addReply(r.letter, 'answer', author, body.data.choice === 'yes' ? proposal.yes : proposal.no); // o texto vem sempre da configuração da carta
    return ok({ answered: body.data.choice });
  }
  if (kind === 'reaction') {
    if (!isCarta || exp.reactions === false) return fail('Esta carta não aceita reações.', 404, 'not_found');
    if (!REACTIONS.includes(message)) return fail('Reação inválida.', 422, 'validation');
    addReply(r.letter, 'reaction', author, message);
    return ok();
  }
  if (kind === 'voucher') {
    if (!exp.vouchers?.includes(message)) return fail('Vale inválido.', 422, 'validation');
    addReply(r.letter, 'voucher', author, message);
    return ok();
  }
  if (kind === 'capsule') {
    if (!isCarta || exp.capsule === false) return fail('Esta carta não tem cápsula do tempo.', 404, 'not_found');
    if (message.length < 3) return fail('Escreve a tua promessa ou mensagem.', 422, 'validation');
    if ((get<{ n: number }>("SELECT COUNT(*) AS n FROM letter_replies WHERE letter_id = ? AND kind = 'capsule'", r.letter.id)?.n || 0) >= 3) return fail('Esta carta já tem cápsulas suficientes.', 422, 'limit');
    const d = new Date(todayLuanda() + 'T12:00:00Z'); d.setUTCFullYear(d.getUTCFullYear() + 1);
    const openAt = d.toISOString().slice(0, 10);
    addReply(r.letter, 'capsule', author, message.slice(0, 600), openAt);
    // A promessa tem de poder ser aberta: se a carta expirasse antes, fica disponível até 30 dias depois da abertura.
    const keepUntil = new Date(openAt + 'T00:00:00Z'); keepUntil.setUTCDate(keepUntil.getUTCDate() + 30);
    const keep = keepUntil.toISOString().slice(0, 19).replace('T', ' ');
    run("UPDATE letters SET expires_at = ? WHERE id = ? AND expires_at IS NOT NULL AND expires_at < ?", keep, r.letter.id, keep);
    return ok({ openAt });
  }
  if (!r.letter.allow_reply) return fail('Esta carta não aceita respostas.', 404, 'not_found');
  if (!message) return fail('Escreve uma mensagem.', 422, 'validation');
  addReply(r.letter, 'message', author, message);
  return ok();
}
