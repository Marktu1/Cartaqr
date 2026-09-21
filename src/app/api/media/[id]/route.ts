import { NextResponse } from 'next/server';
import { get } from '@/lib/db';
import { readFile } from '@/lib/storage';
import { verifyMediaSig } from '@/lib/security';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  const id = Number(params.id); const u = new URL(req.url);
  if (!Number.isInteger(id) || !verifyMediaSig(id, u.searchParams.get('exp'), u.searchParams.get('sig'))) return new NextResponse('Link inválido ou expirado.', { status: 403 });
  const m = get('SELECT storage_path, mime_type FROM media_assets WHERE id = ?', id);
  const buf = m && readFile(m.storage_path);
  if (!m || !buf) return new NextResponse('Ficheiro não encontrado.', { status: 404 });
  // suporte a Range (necessário para vídeo/áudio em telemóveis)
  const range = req.headers.get('range');
  const base = { 'Content-Type': m.mime_type, 'Accept-Ranges': 'bytes', 'Cache-Control': 'private, max-age=600', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex' };
  if (range) {
    const mm = /bytes=(\d*)-(\d*)/.exec(range);
    if (mm) {
      const start = mm[1] ? parseInt(mm[1], 10) : 0; const end = mm[2] ? Math.min(parseInt(mm[2], 10), buf.length - 1) : buf.length - 1;
      if (start <= end && start < buf.length) {
        return new NextResponse(new Uint8Array(buf.subarray(start, end + 1)), { status: 206, headers: { ...base, 'Content-Range': `bytes ${start}-${end}/${buf.length}`, 'Content-Length': String(end - start + 1) } });
      }
    }
  }
  return new NextResponse(new Uint8Array(buf), { headers: { ...base, 'Content-Length': String(buf.length) } });
}
