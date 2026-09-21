import { NextResponse } from 'next/server';
import { currentAdminId } from '@/lib/auth';
import { getOrderById } from '@/lib/orders';
import { readFile } from '@/lib/storage';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  if (!(await currentAdminId())) return new NextResponse('Não autorizado.', { status: 401 });
  const o = getOrderById(Number(params.id));
  const buf = o?.payment_proof_path ? readFile(o.payment_proof_path) : null;
  if (!o || !buf) return new NextResponse('Sem comprovativo.', { status: 404 });
  const dl = new URL(req.url).searchParams.get('download') === '1';
  return new NextResponse(new Uint8Array(buf), { headers: {
    'Content-Type': o.payment_proof_mime, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff',
    'Content-Disposition': `${dl ? 'attachment' : 'inline'}; filename="comprovativo-${o.public_reference}"`,
  } });
}
