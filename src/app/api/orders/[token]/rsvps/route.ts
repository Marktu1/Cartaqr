import { NextResponse } from 'next/server';
import { getLetterByOrder, rsvpCsv, eventDashboard } from '@/lib/orders';
import { ok, handle, limit, orderFromToken } from '@/lib/api';

/** Lista de convidados: CSV para descarregar, ou JSON (?format=json) para o painel do evento. */
export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const params = await ctx.params;
  try {
    const rl = limit(req, 'csv', 120, 60_000); if (rl) return rl;
    const order = orderFromToken(params.token);
    if (new URL(req.url).searchParams.get('format') === 'json') return ok({ dashboard: eventDashboard(order) });
    const letter = getLetterByOrder(order.id)!;
    return new NextResponse(rsvpCsv(letter.id), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="confirmacoes-${order.public_reference}.csv"`, 'Cache-Control': 'private, no-store' } });
  } catch (e) { return handle(e); }
}
