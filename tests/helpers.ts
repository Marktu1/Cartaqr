import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** Prepara uma base de dados isolada e devolve os módulos já carregados. */
export async function freshEnv(extra: Record<string, string> = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cartaqr-'));
  process.env.DATA_DIR = dir; process.env.SESSION_SECRET = 'test-secret-test-secret-test-secret-12345'; process.env.AI_PROVIDER = 'mock';
  Object.assign(process.env, extra);
  const seed = await import('../src/lib/seed');
  await seed.seed({ adminEmail: 'admin@test.local', adminPassword: 'Password#12345' });
  return { dir, O: await import('../src/lib/orders'), S: await import('../src/lib/security'), ST: await import('../src/lib/storage'), DB: await import('../src/lib/db') };
}

// Ficheiros de teste mínimos com os "magic bytes" corretos
export const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(200, 1)]);
export const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(200, 2)]);
export const MP4 = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypmp42'), Buffer.alloc(200, 3)]);
export const MP3 = Buffer.concat([Buffer.from('ID3'), Buffer.from([3, 0, 0, 0, 0, 0, 0]), Buffer.alloc(200, 4)]);
export const EXE = Buffer.concat([Buffer.from('MZ'), Buffer.alloc(300, 5)]);
export const SCRIPT = Buffer.from('<?php system($_GET["c"]); ?>' + ' '.repeat(50));
export const SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>' + ' '.repeat(20));
export const PDF = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(200, 6)]);
export const baseOrder = (planId: number, over: Record<string, unknown> = {}) => ({
  occasion: 'amor', planId, recipientName: 'Ana Exemplo', senderName: 'Bruno Exemplo', title: 'Para a minha pessoa favorita', specialDate: '2026-03-14', contact: '923456789', language: 'pt', theme: 'romantico', ...over,
});
