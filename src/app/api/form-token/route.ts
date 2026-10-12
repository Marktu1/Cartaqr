import { NextResponse } from 'next/server';
import { limit } from '@/lib/api';
import { newFormToken } from '@/lib/security';

/** Token para formulários públicos (proteção contra robôs). */
export async function GET(req: Request) {
  const rl = limit(req, 'form-token', 60, 10 * 60_000); if (rl) return rl;
  return NextResponse.json({ t: newFormToken() }, { headers: { 'Cache-Control': 'no-store' } });
}
