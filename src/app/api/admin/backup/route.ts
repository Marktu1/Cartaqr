import { NextResponse } from 'next/server';
import { currentAdminId, logAdmin } from '@/lib/auth';
import { createDatabaseBackup } from '@/lib/backup';

/** Descarregar a cópia de segurança da base de dados (só administradores). */
export async function GET() {
  const admin = await currentAdminId();
  if (!admin) return new NextResponse('Não autorizado.', { status: 401 });
  const buf = createDatabaseBackup();
  logAdmin(admin, 'backup_download');
  const day = new Date().toISOString().slice(0, 10);
  return new NextResponse(new Uint8Array(buf), { headers: { 'Content-Type': 'application/vnd.sqlite3', 'Content-Disposition': `attachment; filename="cartaqr-backup-${day}.db"`, 'Cache-Control': 'private, no-store' } });
}
