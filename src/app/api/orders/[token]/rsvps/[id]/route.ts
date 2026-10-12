import { z } from 'zod';
import { setRsvpCheckIn, deleteRsvp, eventDashboard } from '@/lib/orders';
import { ok, fail, handle, limit, intParam, orderFromToken } from '@/lib/api';
import { readJson } from '@/lib/security';

/** Marcar/desmarcar a chegada de um convidado (controlo à porta). */
export async function PATCH(req: Request, ctx: { params: Promise<{ token: string; id: string }> }) {
  const params = await ctx.params;
  try {
    const rl = limit(req, 'rsvp-edit', 300, 60_000); if (rl) return rl;
    const order = orderFromToken(params.token);
    const b = z.object({ checkedIn: z.boolean() }).safeParse(await readJson(req, 1024));
    if (!b.success) return fail('Pedido inválido.', 422, 'validation');
    setRsvpCheckIn(order, intParam(params.id), b.data.checkedIn);
    return ok({ dashboard: eventDashboard(order) });
  } catch (e) { return handle(e); }
}

/** Remover uma resposta (ex.: duplicada ou de alguém que não foi convidado). */
export async function DELETE(req: Request, ctx: { params: Promise<{ token: string; id: string }> }) {
  const params = await ctx.params;
  try {
    const rl = limit(req, 'rsvp-edit', 300, 60_000); if (rl) return rl;
    const order = orderFromToken(params.token);
    deleteRsvp(order, intParam(params.id));
    return ok({ dashboard: eventDashboard(order) });
  } catch (e) { return handle(e); }
}
