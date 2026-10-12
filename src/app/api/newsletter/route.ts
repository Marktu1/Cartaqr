import { z } from 'zod';
import { fail, ok, handle, limit } from '@/lib/api';
import { subscribe } from '@/lib/newsletter';
import { newsletterOffer } from '@/lib/orders';
import { rateLimit, clientIp, readJson, checkBot, consumeFormToken } from '@/lib/security';

const schema = z.object({ email: z.string().max(254), consent: z.literal(true, { message: 'Aceita receber emails para te inscreveres.' }), source: z.string().regex(/^[a-z-]{1,20}$/).default('site'), website: z.string().max(200).optional(), _t: z.string().max(200).optional() });

export async function POST(req: Request) {
  try {
    const rl = limit(req, 'nl', 10, 3600_000); if (rl) return rl;
    if (!rateLimit(`nl-day:${clientIp(req)}`, 30, 86_400_000).ok) return fail('Muitos pedidos. Tenta amanhã.', 429, 'rate_limited');
    const body = schema.safeParse(await readJson(req, 4096));
    if (!body.success) return fail(body.error.issues[0]?.message || 'Dados inválidos.', 422, 'validation');
    if (!checkBot(body.data).ok || !consumeFormToken(body.data._t)) return ok(); // robô (campo-armadilha ou sem token válido): finge sucesso
    const r = subscribe(body.data.email, body.data.source);
    return r.ok ? ok({ offer: newsletterOffer() }) : fail(r.error, 422, 'validation');
  } catch (e) { return handle(e); }
}
