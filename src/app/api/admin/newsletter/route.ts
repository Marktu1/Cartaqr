import { NextResponse } from 'next/server';
import { currentAdminId } from '@/lib/auth';
import { subscribersCsv } from '@/lib/newsletter';

export async function GET() {
  if (!(await currentAdminId())) return new NextResponse('Não autorizado.', { status: 401 });
  return new NextResponse(subscribersCsv(), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="newsletter-inscritos.csv"', 'Cache-Control': 'private, no-store' } });
}
