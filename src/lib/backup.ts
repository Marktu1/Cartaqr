// Cópia de segurança da base de dados (encomendas, cartas, respostas, configurações).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { backupTo } from './db';

/** Devolve uma cópia consistente da base de dados, feita com o site a funcionar. Os ficheiros carregados ficam no disco. */
export function createDatabaseBackup(): Buffer {
  const tmp = path.join(os.tmpdir(), `cartaqr-backup-${Date.now()}.db`);
  try { backupTo(tmp); return fs.readFileSync(tmp); } finally { fs.rmSync(tmp, { force: true }); }
}
