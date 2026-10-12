import { addMedia, reorderPhotos, uploadLimits } from '@/lib/orders';
import { ok, fail, handle, limit, orderFromToken, serializeOrder } from '@/lib/api';
import { z } from 'zod';
import { readForm, readJson, BodyTooLarge } from '@/lib/security';

const KINDS = ['photo', 'cover', 'video', 'audio', 'music'] as const;

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const params = await ctx.params;
  try {
    const rl = limit(req, 'upload', 60, 60 * 60_000); if (rl) return rl;
    const order = orderFromToken(params.token);
    const maxMb = Math.max(...Object.values(uploadLimits()));
    const form = await readForm(req, (maxMb + 1) * 1024 * 1024).catch(e => { if (e instanceof BodyTooLarge) return 'too_large' as const; throw e; });
    if (form === 'too_large') return fail(`Ficheiro demasiado grande. O máximo é ${maxMb} MB.`, 413, 'too_large');
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
    const rl = limit(req, 'media-edit', 120, 60_000); if (rl) return rl;
    const order = orderFromToken(params.token);
    const body = z.object({ order: z.array(z.number().int().positive()).max(100) }).safeParse(await readJson(req, 4096));
    if (!body.success) return fail('Pedido inválido.', 422, 'validation');
    reorderPhotos(order, body.data.order);
    return ok(serializeOrder(orderFromToken(params.token)));
  } catch (e) { return handle(e); }
}
