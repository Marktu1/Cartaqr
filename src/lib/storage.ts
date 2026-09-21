// Storage de ficheiros privado (disco local). Para produção troca por Supabase Storage / S3
// mantendo estas funções (saveBuffer, readFile, removeFile, removeOrderDir).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { config } from './config';

export type MediaKind = 'photo' | 'cover' | 'video' | 'audio' | 'music' | 'proof';

export const ALLOWED: Record<string, { ext: string; group: 'image' | 'video' | 'audio' | 'doc' }> = {
  'image/jpeg': { ext: 'jpg', group: 'image' },
  'image/png': { ext: 'png', group: 'image' },
  'image/webp': { ext: 'webp', group: 'image' },
  'video/mp4': { ext: 'mp4', group: 'video' },
  'video/quicktime': { ext: 'mov', group: 'video' },
  'video/webm': { ext: 'webm', group: 'video' },
  'audio/mpeg': { ext: 'mp3', group: 'audio' },
  'audio/mp4': { ext: 'm4a', group: 'audio' },
  'audio/ogg': { ext: 'ogg', group: 'audio' },
  'audio/wav': { ext: 'wav', group: 'audio' },
  'application/pdf': { ext: 'pdf', group: 'doc' },
};

/** Deteta o tipo real pelos primeiros bytes (não confia no nome nem no Content-Type enviados). */
export function detectMime(b: Buffer): string | null {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  const s4 = b.toString('latin1', 0, 4);
  if (s4 === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') return 'image/webp';
  if (s4 === 'RIFF' && b.toString('latin1', 8, 12) === 'WAVE') return 'audio/wav';
  if (s4 === '%PDF') return 'application/pdf';
  if (s4 === 'OggS') return 'audio/ogg';
  if (s4 === 'ID3\u0003' || s4.startsWith('ID3') || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0)) return 'audio/mpeg';
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return 'video/webm';
  if (b.toString('latin1', 4, 8) === 'ftyp') {
    const brand = b.toString('latin1', 8, 12);
    if (brand === 'qt  ') return 'video/quicktime';
    if (brand === 'M4A ' || brand === 'M4B ') return 'audio/mp4';
    return 'video/mp4';
  }
  return null;
}

export type UploadCheck =
  | { ok: true; mime: string; ext: string }
  | { ok: false; error: string };

const KIND_GROUPS: Record<MediaKind, Array<'image' | 'video' | 'audio' | 'doc'>> = {
  photo: ['image'], cover: ['image'], video: ['video'], audio: ['audio'], music: ['audio'], proof: ['image', 'doc'],
};
const KIND_LABEL: Record<MediaKind, string> = {
  photo: 'uma imagem JPG, PNG ou WebP', cover: 'uma imagem JPG, PNG ou WebP', video: 'um vídeo MP4, MOV ou WebM',
  audio: 'um áudio MP3, M4A, OGG ou WAV', music: 'um áudio MP3, M4A, OGG ou WAV', proof: 'uma imagem ou um PDF',
};

export function validateUpload(kind: MediaKind, buf: Buffer, limitsMb: { image: number; video: number; audio: number; proof: number }): UploadCheck {
  const mime = detectMime(buf);
  if (!mime || !ALLOWED[mime]) return { ok: false, error: `Tipo de ficheiro não permitido. Envia ${KIND_LABEL[kind]}.` };
  const { group, ext } = ALLOWED[mime];
  if (!KIND_GROUPS[kind].includes(group)) return { ok: false, error: `Este campo aceita apenas ${KIND_LABEL[kind]}.` };
  const limit = kind === 'proof' ? limitsMb.proof : group === 'image' ? limitsMb.image : group === 'video' ? limitsMb.video : limitsMb.audio;
  if (buf.length > limit * 1024 * 1024) return { ok: false, error: `Ficheiro demasiado grande. O máximo é ${limit} MB.` };
  return { ok: true, mime, ext };
}

function root() { return path.join(config.dataDir, 'uploads'); }
function abs(rel: string) {
  const p = path.resolve(root(), rel);
  if (!p.startsWith(root() + path.sep)) throw new Error('Caminho inválido'); // evita path traversal
  return p;
}

export function saveBuffer(orderId: number, buf: Buffer, ext: string): string {
  const rel = `${orderId}/${crypto.randomUUID()}.${ext}`;
  const p = abs(rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, buf, { mode: 0o600 });
  return rel;
}
export function readFile(rel: string): Buffer | null { try { return fs.readFileSync(abs(rel)); } catch { return null; } }
export function fileSize(rel: string): number | null { try { return fs.statSync(abs(rel)).size; } catch { return null; } }
export function removeFile(rel: string | null | undefined) { if (!rel) return; try { fs.rmSync(abs(rel), { force: true }); } catch { /* ignore */ } }
export function removeOrderDir(orderId: number) { try { fs.rmSync(abs(String(orderId)), { recursive: true, force: true }); } catch { /* ignore */ } }
