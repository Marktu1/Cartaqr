import { removeMedia, updateMediaMeta } from '@/lib/orders';
import { ok, fail, handle, orderFromToken, serializeOrder } from '@/lib/api';
import { z } from 'zod';

export async function DELETE(_req: Request, ctx: { params: Promise<{ token: string; id: string }> }) {
  const params = await ctx.params;
  try {
    removeMedia(orderFromToken(params.token), Number(params.id));
    return ok(serializeOrder(orderFromToken(params.token)));
  } catch (e) { return handle(e); }
}
export async function PATCH(req: Request, ctx: { params: Promise<{ token: string; id: string }> }) {
  const params = await ctx.params;
  try {
    const body = z.object({ caption: z.string().max(200).optional(), altText: z.string().max(200).optional(), setCover: z.boolean().optional() }).safeParse(await req.json().catch(() => null));
    if (!body.success) return fail('Pedido inválido.', 422, 'validation');
    updateMediaMeta(orderFromToken(params.token), Number(params.id), body.data);
    return ok(serializeOrder(orderFromToken(params.token)));
  } catch (e) { return handle(e); }
}
