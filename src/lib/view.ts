import * as O from './orders';
import { signedMediaUrl } from './security';
import { getCategory } from './categories';
import type { Row } from './db';
import type { LetterViewData } from '@/components/LetterView';

/** Monta os dados da carta (para a página pública e para a pré-visualização do admin). */
export function buildLetterView(order: Row, letter: Row, opts: { token?: string; ttl?: number } = {}): LetterViewData {
  const media = O.getMedia(letter.id); const ttl = opts.ttl ?? 3 * 3600;
  const u = (m: Row) => signedMediaUrl(m.id, ttl);
  const cover = media.find(m => m.id === letter.cover_media_id) || media.find(m => m.type === 'cover') || media.find(m => m.type === 'photo');
  const video = media.find(m => m.type === 'video'); const cat = getCategory(order.occasion);
  return {
    title: letter.title, recipientName: letter.recipient_name, senderName: letter.sender_name, intro: letter.intro, mainMessage: letter.main_message, closingMessage: letter.closing_message,
    specialDate: letter.special_date || '', theme: letter.theme, memories: O.getMemories(letter.id).map(m => ({ title: m.title, description: m.description, date: m.date || undefined })),
    cover: cover ? { url: u(cover), alt: cover.alt_text || `Foto de capa: ${letter.title}` } : null,
    photos: media.filter(m => m.type === 'photo').map(m => ({ url: u(m), caption: m.caption, alt: m.alt_text || m.caption || 'Fotografia' })),
    video: video ? { url: u(video) } : null,
    audios: media.filter(m => m.type === 'audio' || (m.type === 'music' && letter.music_mode === 'own')).map(m => ({ url: u(m), label: m.type === 'music' ? 'Música' : 'Mensagem de áudio' })),
    ambient: letter.music_mode === 'ambient' ? letter.ambient : null, allowReply: !!letter.allow_reply, replyToken: opts.token,
    category: order.occasion, extra: O.parseExtra(letter.extra), rsvp: cat.rsvp ? O.rsvpStatus(letter, order) : undefined,
  };
}
