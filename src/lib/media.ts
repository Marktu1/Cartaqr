// Fotografias, vídeos e áudios das cartas.
import { all, get, run, Row } from './db';
import { cleanText } from './security';
import { stripImageMetadata } from './metadata';
import { getSettings } from './settings';
import { removeFile, saveBuffer, validateUpload, MediaKind } from './storage';
import { AppError, assertCustomerEditable, getLetterByOrder, touch } from './order-core';
import { getPlan } from './plans';

export function getMedia(letterId: number): Row[] { return all('SELECT * FROM media_assets WHERE letter_id = ? ORDER BY sort_order, id', letterId); }
/** Ficheiro pedido por URL assinado: caminho, tipo e se a carta está bloqueada. */
export function mediaForServing(id: number): { storage_path: string; mime_type: string; is_blocked: number } | undefined {
  return get('SELECT m.storage_path, m.mime_type, l.is_blocked FROM media_assets m JOIN letters l ON l.id = m.letter_id WHERE m.id = ?', id) as any;
}

export function uploadLimits() {
  const s = getSettings();
  return { image: Number(s.max_image_mb) || 8, video: Number(s.max_video_mb) || 50, audio: Number(s.max_audio_mb) || 15, proof: Number(s.max_proof_mb) || 8 };
}

export function addMedia(order: Row, kind: Exclude<MediaKind, 'proof'>, buf: Buffer, originalName: string): Row {
  assertCustomerEditable(order);
  const plan = getPlan(order.plan_id)!;
  const letter = getLetterByOrder(order.id)!;
  const check = validateUpload(kind, buf, uploadLimits());
  if (!check.ok) throw new AppError('upload_invalid', check.error, 415);
  const count = (types: string[]) => (get<{ n: number }>(`SELECT COUNT(*) n FROM media_assets WHERE letter_id = ? AND type IN (${types.map(() => '?').join(',')})`, letter.id, ...types)?.n) || 0;
  if (kind === 'photo' && count(['photo']) >= plan.max_photos) throw new AppError('limit', `O plano ${plan.name} permite até ${plan.max_photos} fotografias.`, 409);
  if (kind === 'video' && count(['video']) >= plan.max_videos) throw new AppError('limit', plan.max_videos === 0 ? `O plano ${plan.name} não inclui vídeo.` : `O plano ${plan.name} permite até ${plan.max_videos} vídeo(s).`, 409);
  if ((kind === 'audio' || kind === 'music') && count(['audio', 'music']) >= plan.max_audio_files) throw new AppError('limit', plan.max_audio_files === 0 ? `O plano ${plan.name} não inclui áudio.` : `O plano ${plan.name} permite até ${plan.max_audio_files} ficheiro(s) de áudio.`, 409);
  if (kind === 'cover') { // só uma capa
    for (const old of all('SELECT id, storage_path FROM media_assets WHERE letter_id = ? AND type = ?', letter.id, 'cover')) { removeFile(old.storage_path); run('DELETE FROM media_assets WHERE id = ?', old.id); }
  }
  if (check.mime.startsWith('image/')) buf = stripImageMetadata(buf, check.mime); // sem localização GPS
  const rel = saveBuffer(order.id, buf, check.ext);
  const next = (get<{ m: number }>('SELECT COALESCE(MAX(sort_order), -1) + 1 m FROM media_assets WHERE letter_id = ?', letter.id)?.m) || 0;
  const r = run(`INSERT INTO media_assets(letter_id, type, storage_path, file_size, mime_type, original_name, sort_order) VALUES(?,?,?,?,?,?,?)`,
    letter.id, kind, rel, buf.length, check.mime, cleanText(originalName, 120), next);
  const id = Number(r.lastInsertRowid);
  if (kind === 'cover') run('UPDATE letters SET cover_media_id = ? WHERE id = ?', id, letter.id);
  touch(order.id);
  return get('SELECT * FROM media_assets WHERE id = ?', id)!;
}

export function removeMedia(order: Row, mediaId: number) {
  assertCustomerEditable(order);
  const letter = getLetterByOrder(order.id)!;
  const m = get('SELECT * FROM media_assets WHERE id = ? AND letter_id = ?', mediaId, letter.id);
  if (!m) throw new AppError('not_found', 'Ficheiro não encontrado.', 404);
  removeFile(m.storage_path);
  run('DELETE FROM media_assets WHERE id = ?', mediaId);
  if (letter.cover_media_id === mediaId) run('UPDATE letters SET cover_media_id = NULL WHERE id = ?', letter.id);
  touch(order.id);
}

export function updateMediaMeta(order: Row, mediaId: number, meta: { caption?: string; altText?: string; setCover?: boolean; sortOrder?: number }) {
  assertCustomerEditable(order);
  const letter = getLetterByOrder(order.id)!;
  const m = get('SELECT * FROM media_assets WHERE id = ? AND letter_id = ?', mediaId, letter.id);
  if (!m) throw new AppError('not_found', 'Ficheiro não encontrado.', 404);
  if (meta.caption !== undefined) run('UPDATE media_assets SET caption = ? WHERE id = ?', cleanText(meta.caption, 200), mediaId);
  if (meta.altText !== undefined) run('UPDATE media_assets SET alt_text = ? WHERE id = ?', cleanText(meta.altText, 200), mediaId);
  if (meta.setCover && ['photo', 'cover'].includes(m.type)) run('UPDATE letters SET cover_media_id = ? WHERE id = ?', mediaId, letter.id);
  if (meta.sortOrder !== undefined) run('UPDATE media_assets SET sort_order = ? WHERE id = ?', meta.sortOrder, mediaId);
}

export function reorderPhotos(order: Row, ids: number[]) {
  assertCustomerEditable(order);
  const letter = getLetterByOrder(order.id)!;
  ids.forEach((id, i) => run('UPDATE media_assets SET sort_order = ? WHERE id = ? AND letter_id = ?', i, id, letter.id));
}
