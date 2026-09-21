import { NextResponse } from 'next/server';
import { getLetterByOrder } from '@/lib/orders';
import { fail, handle, limit, orderFromToken } from '@/lib/api';
import { qrPng, qrSvg } from '@/lib/qr';
import { config } from '@/lib/config';

export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const params = await ctx.params;
  try {
    const rl = limit(req, 'qr', 60, 60_000); if (rl) return rl;
    const order = orderFromToken(params.token);
    const letter = getLetterByOrder(order.id)!;
    if (order.order_status !== 'published' || !letter.is_published) return fail('O QR Code fica disponível depois de a tua Carta QR ser publicada.', 409, 'not_published');
    const url = `${config.appUrl}/carta/${letter.secure_token}`;
    const u = new URL(req.url);
    const format = u.searchParams.get('format') === 'svg' ? 'svg' : 'png';
    const download = u.searchParams.get('download') === '1';
    const headers: Record<string, string> = { 'Cache-Control': 'private, no-store' };
    if (download) headers['Content-Disposition'] = `attachment; filename="carta-qr-${order.public_reference}.${format}"`;
    try {
      if (format === 'svg') return new NextResponse(await qrSvg(url), { headers: { ...headers, 'Content-Type': 'image/svg+xml' } });
      return new NextResponse(new Uint8Array(await qrPng(url)), { headers: { ...headers, 'Content-Type': 'image/png' } });
    } catch { return fail('Não foi possível criar o QR Code agora. Podes copiar o link e tentar de novo mais tarde.', 500, 'qr_failed'); }
  } catch (e) { return handle(e); }
}
