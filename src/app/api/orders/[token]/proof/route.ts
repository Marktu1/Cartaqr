import { submitProof, uploadLimits } from '@/lib/orders';
import { ok, fail, handle, limit, orderFromToken, serializeOrder } from '@/lib/api';
import { readForm, BodyTooLarge } from '@/lib/security';

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const params = await ctx.params;
  try {
    const rl = limit(req, 'proof', 20, 60 * 60_000); if (rl) return rl;
    const order = orderFromToken(params.token);
    const form = await readForm(req, (uploadLimits().proof + 1) * 1024 * 1024).catch(e => { if (e instanceof BodyTooLarge) return 'too_large' as const; throw e; });
    if (form === 'too_large') return fail(`Ficheiro demasiado grande. O máximo é ${uploadLimits().proof} MB.`, 413, 'too_large');
    const file = form?.get('file');
    if (!(file instanceof File) || file.size === 0) return fail('Anexa o comprovativo de pagamento (imagem ou PDF) para continuar.', 422, 'no_proof');
    submitProof(order, Buffer.from(await file.arrayBuffer()), String(form?.get('note') || '').slice(0, 500));
    return ok(serializeOrder(orderFromToken(params.token)));
  } catch (e) { return handle(e); }
}
