import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { NextResponse } from 'next/server';
import { currentAdminId, logAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';

/** Cópia de segurança da base de dados (encomendas, cartas, respostas, configurações). Os ficheiros carregados ficam no disco. */
export async function GET() {
  const admin = await currentAdminId();
  if (!admin) return new NextResponse('Não autorizado.', { status: 401 });
  const tmp = path.join(os.tmpdir(), `cartaqr-backup-${Date.now()}.db`);
  try {
    getDb().exec(`VACUUM INTO '${tmp.replace(/'/g, "''")}'`); // cópia consistente, mesmo com o site a funcionar
    const buf = fs.readFileSync(tmp);
    logAdmin(admin, 'backup_download');
    const day = new Date().toISOString().slice(0, 10);
    return new NextResponse(buf, { headers: { 'Content-Type': 'application/vnd.sqlite3', 'Content-Disposition': `attachment; filename="cartaqr-backup-${day}.db"`, 'Cache-Control': 'private, no-store' } });
  } finally { fs.rmSync(tmp, { force: true }); }
}
