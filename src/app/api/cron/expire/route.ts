import { NextResponse } from 'next/server';
import { expireDue } from '@/lib/orders';
import { safeEqual } from '@/lib/security';

/** Chama isto de hora a hora (Vercel Cron, cron-job.org, etc.) com Authorization: Bearer $CRON_SECRET */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET || '';
  const auth = req.headers.get('authorization') || '';
  if (!secret || !safeEqual(auth, `Bearer ${secret}`)) return new NextResponse('Não autorizado.', { status: 401 });
  return NextResponse.json({ ok: true, expired: expireDue() });
}
