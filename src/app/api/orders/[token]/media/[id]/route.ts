import { removeMedia, updateMediaMeta } from '@/lib/orders';
import { ok, fail, handle, limit, intParam, orderFromToken, serializeOrder } from '@/lib/api';
import { readJson } from '@/lib/security';
import { z } from 'zod';

export async function DELETE(req: Request, ctx: { params: Promise<{ token: string; id: string }> }) {
  const params = await ctx.params;
  try {
    const rl = limit(req, 'media-edit', 120, 60_000); if (rl) return rl;
    removeMedia(orderFromToken(params.token), intParam(params.id));
    return ok(serializeOrder(orderFromToken(params.token)));
  } catch (e) { return handle(e); }
}
export async function PATCH(req: Request, ctx: { params: Promise<{ token: string; id: string }> }) {
  const params = await ctx.params;
  try {
    const rl = limit(req, 'media-edit', 120, 60_000); if (rl) return rl;
    const body = z.object({ caption: z.string().max(200).optional(), altText: z.string().max(200).optional(), setCover: z.boolean().optional() }).safeParse(await readJson(req, 4096));
    if (!body.success) return fail('Pedido inválido.', 422, 'validation');
    updateMediaMeta(orderFromToken(params.token), intParam(params.id), body.data);
    return ok(serializeOrder(orderFromToken(params.token)));
  } catch (e) { return handle(e); }
}
