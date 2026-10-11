import { z } from 'zod';
import { cookies } from 'next/headers';
import { resolvePublicLetter, pinCookieValid } from '@/lib/orders';
import { ok, fail, limit } from '@/lib/api';
import { parseExperience, answerMatches } from '@/lib/experience';

/** Verifica a resposta ao "detalhe secreto" e só então devolve a mensagem escondida. */
export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const params = await ctx.params;
  const rl = limit(req, 'secret', 20, 60 * 60_000); if (rl) return rl;
  const r = resolvePublicLetter(params.token);
  if (r.state !== 'ok') return fail('Carta indisponível.', 404, 'not_found');
  if (r.letter.pin_hash && !pinCookieValid(r.letter.id, (await cookies()).get(`pin_${r.letter.id}`)?.value)) return fail('Introduz o PIN primeiro.', 401, 'pin_required');
  const body = z.object({ answer: z.string().trim().min(1).max(80) }).safeParse(await req.json().catch(() => null));
  if (!body.success) return fail('Escreve uma resposta.', 422, 'validation');
  const secret = parseExperience(r.letter.experience).secret;
  if (!secret) return fail('Esta carta não tem segredo.', 404, 'not_found');
  if (!answerMatches(body.data.answer, secret.answer)) return fail('Ainda não é essa… tenta outra vez.', 422, 'wrong');
  return ok({ message: secret.message });
}
