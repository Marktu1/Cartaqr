import { NextResponse } from 'next/server';
import { AppError, getOrderByToken, getLetterByOrder, getMemories, getMedia, getPlan, uploadLimits, parseExtra } from './orders';
import { rateLimit, clientIp, signedMediaUrl } from './security';
import { getPublicSettings } from './settings';
import { Row } from './db';
import { utcToLuanda } from './format';

export function ok(data: unknown = {}, status = 200) { return NextResponse.json({ ok: true, ...(data as object) }, { status }); }
export function fail(error: string, status = 400, code = 'error') { return NextResponse.json({ ok: false, error, code }, { status }); }

/** Converte qualquer erro numa resposta segura (nunca expõe stack traces nem detalhes internos). */
export function handle(e: unknown) {
  if (e instanceof AppError) return fail(e.message, e.status, e.code);
  console.error('[api]', e instanceof Error ? e.message : e);
  return fail('Ocorreu um erro inesperado. Tenta novamente daqui a pouco.', 500, 'internal');
}

export function limit(req: Request, bucket: string, max: number, windowMs: number): NextResponse | null {
  const r = rateLimit(`${bucket}:${clientIp(req)}`, max, windowMs);
  return r.ok ? null : fail(`Muitos pedidos. Tenta novamente em ${r.retryAfter} segundos.`, 429, 'rate_limited');
}

export function orderFromToken(token: string): Row {
  const o = getOrderByToken(token);
  if (!o) throw new AppError('not_found', 'Encomenda não encontrada. Verifica o link.', 404);
  return o;
}

/** Estado completo da encomenda para o próprio cliente (com URLs assinados dos ficheiros). */
export function serializeOrder(order: Row) {
  const letter = getLetterByOrder(order.id)!;
  const plan = getPlan(order.plan_id)!;
  const media = getMedia(letter.id).map(m => ({
    id: m.id, type: m.type, caption: m.caption, altText: m.alt_text, sortOrder: m.sort_order, size: m.file_size, mime: m.mime_type, name: m.original_name,
    url: signedMediaUrl(m.id, 3600),
  }));
  const s = getPublicSettings();
  return {
    order: {
      reference: order.public_reference, status: order.order_status, paymentStatus: order.payment_status, amount: order.amount, discountCode: order.discount_code || null, discountAmount: order.discount_amount || 0, currency: order.currency,
      hasProof: !!order.payment_proof_path, paymentNote: order.payment_note, occasion: order.occasion, planId: order.plan_id, kind: plan.kind || 'carta',
    },
    plan: { id: plan.id, name: plan.name, maxPhotos: plan.max_photos, maxVideos: plan.max_videos, maxAudio: plan.max_audio_files, maxGuests: plan.max_guests || 0, durationDays: plan.duration_days },
    letter: {
      recipientName: letter.recipient_name, senderName: letter.sender_name, title: letter.title, intro: letter.intro, mainMessage: letter.main_message,
      closingMessage: letter.closing_message, specialDate: letter.special_date, unlockAt: utcToLuanda(letter.unlock_at), theme: letter.theme, tone: letter.tone, howMet: letter.how_met, admire: letter.admire,
      musicMode: letter.music_mode, ambient: letter.ambient, musicRightsAck: !!letter.music_rights_ack, allowReply: !!letter.allow_reply,
      coverMediaId: letter.cover_media_id, hasPin: !!letter.pin_hash, isPublished: !!letter.is_published, expiresAt: letter.expires_at,
      publicPath: letter.is_published ? `/carta/${letter.secure_token}` : null, extra: parseExtra(letter.extra),
    },
    memories: getMemories(letter.id).map(m => ({ title: m.title, description: m.description, date: m.date || '' })),
    media,
    limits: uploadLimits(),
    whatsapp: s.whatsapp,
  };
}
