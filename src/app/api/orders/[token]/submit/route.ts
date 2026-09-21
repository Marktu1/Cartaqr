import { submitOrder } from '@/lib/orders';
import { ok, handle, limit, orderFromToken, serializeOrder } from '@/lib/api';

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const params = await ctx.params;
  try {
    const rl = limit(req, 'submit', 30, 60 * 60_000); if (rl) return rl;
    submitOrder(orderFromToken(params.token));
    return ok(serializeOrder(orderFromToken(params.token)));
  } catch (e) { return handle(e); }
}
