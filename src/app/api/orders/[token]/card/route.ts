import { NextResponse } from 'next/server';
import { getLetterByOrder } from '@/lib/orders';
import { getCategory } from '@/lib/categories';
import { fail, handle, limit, orderFromToken } from '@/lib/api';
import { buildCardPdf, type CardSize } from '@/lib/card';
import { config } from '@/lib/config';
import { formatDate } from '@/lib/format';

/** Cartão imprimível em PDF (A6, cartão pequeno ou folha A4 com 4 cartões). Só depois de a carta estar publicada. */
export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const params = await ctx.params;
  try {
    const rl = limit(req, 'card', 30, 60_000); if (rl) return rl;
    const order = orderFromToken(params.token); const letter = getLetterByOrder(order.id)!;
    if (order.order_status !== 'published' || !letter.is_published) return fail('O cartão fica disponível depois de a tua Carta QR ser publicada.', 409, 'not_published');
    const u = new URL(req.url); const s = u.searchParams.get('size');
    const size: CardSize = s === 'mini' || s === 'a4' ? s : 'a6';
    const cat = getCategory(order.occasion);
    const pdf = await buildCardPdf(size, { url: `${config.appUrl}/carta/${letter.secure_token}`, title: letter.title, date: letter.special_date ? formatDate(letter.special_date) : '', instruction: cat.qrInstruction, kind: cat.kind, reference: order.public_reference });
    return new NextResponse(new Uint8Array(pdf), { headers: { 'Content-Type': 'application/pdf', 'Cache-Control': 'private, no-store', 'Content-Disposition': `${u.searchParams.get('download') === '0' ? 'inline' : 'attachment'}; filename="cartao-qr-${order.public_reference}-${size}.pdf"` } });
  } catch (e) { return handle(e); }
}
