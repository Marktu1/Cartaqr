import { letterPatchSchema, firstError } from '@/lib/validation';
import { updateLetter, changePlanOrOccasion } from '@/lib/orders';
import { z } from 'zod';
import { OCCASIONS } from '@/lib/validation';
import { ok, fail, handle, limit, orderFromToken, serializeOrder } from '@/lib/api';

export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const params = await ctx.params;
  try {
    const rl = limit(req, 'order-get', 120, 60_000); if (rl) return rl;
    return ok(serializeOrder(orderFromToken(params.token)));
  } catch (e) { return handle(e); }
}
export async function PATCH(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const params = await ctx.params;
  try {
    const rl = limit(req, 'order-patch', 200, 60_000); if (rl) return rl;
    const order = orderFromToken(params.token);
    const parsed = letterPatchSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail(firstError(parsed.error), 422, 'validation');
    updateLetter(order, parsed.data);
    return ok(serializeOrder(orderFromToken(params.token)));
  } catch (e) { return handle(e); }
}

export async function PUT(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const params = await ctx.params;
  try {
    const rl = limit(req, 'order-put', 60, 60_000); if (rl) return rl;
    const order = orderFromToken(params.token);
    const b = z.object({ planId: z.number().int().positive().optional(), occasion: z.enum(OCCASIONS).optional() }).safeParse(await req.json().catch(() => null));
    if (!b.success) return fail('Pedido inválido.', 422, 'validation');
    changePlanOrOccasion(order, b.data);
    return ok(serializeOrder(orderFromToken(params.token)));
  } catch (e) { return handle(e); }
}
