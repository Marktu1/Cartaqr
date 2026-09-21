import { createOrderSchema, firstError } from '@/lib/validation';
import { createOrder } from '@/lib/orders';
import { ok, fail, handle, limit } from '@/lib/api';

export async function POST(req: Request) {
  try {
    const rl = limit(req, 'order-create', 15, 60 * 60_000); if (rl) return rl;
    const parsed = createOrderSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail(firstError(parsed.error), 422, 'validation');
    const { order } = createOrder(parsed.data as any);
    return ok({ token: order.manage_token, reference: order.public_reference }, 201);
  } catch (e) { return handle(e); }
}
