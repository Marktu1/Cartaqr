import { NextResponse } from 'next/server';
import { trackEvent } from '@/lib/orders';
import { limit } from '@/lib/api';

/** Analytics mínimos: só contagens diárias por nome de evento. Sem IP, sem cookies, sem identificadores. */
export async function POST(req: Request) {
  const rl = limit(req, 'track', 120, 60_000); if (rl) return new NextResponse(null, { status: 204 });
  const b = await req.json().catch(() => null) as { name?: string } | null;
  if (b?.name) trackEvent(String(b.name));
  return new NextResponse(null, { status: 204 });
}
