import { NextResponse } from 'next/server';
import { getLetterByOrder, rsvpCsv } from '@/lib/orders';
import { handle, limit, orderFromToken } from '@/lib/api';

export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const params = await ctx.params;
  try {
    const rl = limit(req, 'csv', 30, 60_000); if (rl) return rl;
    const order = orderFromToken(params.token); const letter = getLetterByOrder(order.id)!;
    return new NextResponse(rsvpCsv(letter.id), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="confirmacoes-${order.public_reference}.csv"`, 'Cache-Control': 'private, no-store' } });
  } catch (e) { return handle(e); }
}
