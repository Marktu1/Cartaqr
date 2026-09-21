import { addMedia, reorderPhotos, uploadLimits } from '@/lib/orders';
import { ok, fail, handle, limit, orderFromToken, serializeOrder } from '@/lib/api';
import { z } from 'zod';

const KINDS = ['photo', 'cover', 'video', 'audio', 'music'] as const;

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const params = await ctx.params;
  try {
    const rl = limit(req, 'upload', 60, 60 * 60_000); if (rl) return rl;
    const order = orderFromToken(params.token);
    const maxMb = Math.max(...Object.values(uploadLimits()));
    const len = Number(req.headers.get('content-length') || 0);
    if (len > (maxMb + 2) * 1024 * 1024) return fail(`Ficheiro demasiado grande. O máximo é ${maxMb} MB.`, 413, 'too_large');
    const form = await req.formData().catch(() => null);
    const file = form?.get('file'); const kind = String(form?.get('kind') || '');
    if (!(file instanceof File) || !(KINDS as readonly string[]).includes(kind)) return fail('Ficheiro inválido.', 422, 'validation');
    const buf = Buffer.from(await file.arrayBuffer());
    const media = addMedia(order, kind as (typeof KINDS)[number], buf, file.name);
    return ok({ mediaId: media.id, ...serializeOrder(orderFromToken(params.token)) }, 201);
  } catch (e) { return handle(e); }
}

/** Reordenar fotografias: { order: [id, id, ...] } */
export async function PUT(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const params = await ctx.params;
  try {
    const order = orderFromToken(params.token);
    const body = z.object({ order: z.array(z.number().int()).max(100) }).safeParse(await req.json().catch(() => null));
    if (!body.success) return fail('Pedido inválido.', 422, 'validation');
    reorderPhotos(order, body.data.order);
    return ok(serializeOrder(orderFromToken(params.token)));
  } catch (e) { return handle(e); }
}
