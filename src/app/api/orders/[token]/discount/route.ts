import { z } from 'zod';
import { fail, ok, handle, limit, orderFromToken, serializeOrder } from '@/lib/api';
import { applyDiscount, removeDiscount, getOrderById } from '@/lib/orders';

const schema = z.object({ code: z.string().trim().min(1).max(40) });

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    const rl = limit(req, 'discount', 15, 600_000); if (rl) return rl;
    const order = orderFromToken((await ctx.params).token);
    const b = schema.safeParse(await req.json().catch(() => null)); if (!b.success) return fail('Escreve o código de desconto.', 422, 'validation');
    applyDiscount(order, b.data.code);
    return ok(serializeOrder(getOrderById(order.id)!));
  } catch (e) { return handle(e); }
}
export async function DELETE(req: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    const rl = limit(req, 'discount', 15, 600_000); if (rl) return rl;
    const order = orderFromToken((await ctx.params).token); removeDiscount(order);
    return ok(serializeOrder(getOrderById(order.id)!));
  } catch (e) { return handle(e); }
}
