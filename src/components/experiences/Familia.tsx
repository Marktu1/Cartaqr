'use client';
import { useCallback, useMemo, useState } from 'react';
import './familia.css';
import { derive, getCategory, kickerFor } from '@/lib/categories';
import type { LetterViewData } from '../LetterView';
import { AmbientPlayer } from '../AmbientPlayer';
import { ReplyForm } from '../ReplyForm';
import { Envelope, sealInitials } from '../letter/Envelope';
import { useReveal } from './useReveal';

const AMBIENT_LABEL: Record<string, string> = { 'piano-suave': 'Piano suave', 'chuva-leve': 'Chuva leve', ondas: 'Ondas do mar' };
const rot = (i: number, k = 3) => `${(((i * 37) % 7) - 3) * (k / 3)}deg`;

/** "Álbum de família": polaroids, uma carta em papel pautado e notas das recordações. */
export function Familia({ data, startOpen = false, embedded = false }: { data: LetterViewData; startOpen?: boolean; embedded?: boolean }) {
  const cat = getCategory(data.category);
  const d = useMemo(() => derive(cat.slug, data.extra || {}, data.specialDate), [cat.slug, data.extra, data.specialDate]);
  const [envelope, setEnvelope] = useState(!startOpen && !embedded);
  const open = useCallback(() => { setEnvelope(false); window.scrollTo(0, 0); }, []);
  const ref = useReveal(!envelope);
  const paragraphs = data.mainMessage.split(/\n{2,}/).filter(Boolean);

  return (
    <div ref={ref} className={`fm${embedded ? ' emb' : ''}`}>
      <section className="sec head">
        <p className="eyebrow rv">{kickerFor(cat, data.recipientName)}</p>
        <h1 className="rv">{data.title}</h1>
        {data.recipientName && <p className="hand rv">{data.recipientName}</p>}
        {data.intro && <p className="lede rv">{data.intro}</p>}
        {d.subtitle && <p className="eyebrow rv" style={{ marginTop: 14 }}>{d.subtitle}</p>}
        {(data.ambient || data.audios.length > 0) && (
          <div className="rv" style={{ marginTop: 22 }}>
            {data.ambient && <AmbientPlayer kind={data.ambient} label={`Ouvir: ${AMBIENT_LABEL[data.ambient] || 'ambiente'}`} />}
            {data.audios.map((a, i) => <div key={i} style={{ marginTop: 10 }}><p className="eyebrow">{a.label}</p><audio controls preload="none" src={a.url} style={{ width: '100%', marginTop: 6 }} /></div>)}
          </div>)}
      </section>

      {data.photos.length > 0 && (
        <div className="wall" aria-label="Fotografias">
          {data.photos.map((p, i) => (
            <figure key={i} className={`pol rv${data.photos.length % 2 && i === data.photos.length - 1 ? ' solo' : ''}`} style={{ ['--r' as string]: rot(i + 1, 4) }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.alt || p.caption || `Fotografia ${i + 1}`} loading="lazy" />
              {p.caption && <figcaption>{p.caption}</figcaption>}
            </figure>))}
        </div>)}

      {paragraphs.length > 0 && (
        <section className="rv" aria-label="Carta">
          <div className="letter">
            {paragraphs.map((t, i) => <p key={i}>{t}</p>)}
            {data.senderName && <p className="sign">{data.senderName}</p>}
          </div>
        </section>)}

      {d.quote && <blockquote className="quote rv"><p className="eyebrow">{d.quote.label}</p><p>“{d.quote.text}”</p></blockquote>}

      {data.memories.length > 0 && (
        <section className="sec" aria-label={cat.memories.publicTitle}>
          <h2 className="hand rv" style={{ fontSize: 46 }}>{cat.memories.publicTitle}</h2>
          <div className="notes" style={{ marginTop: 18 }}>
            {data.memories.map((m, i) => (
              <article key={i} className="note rv" style={{ ['--r' as string]: rot(i + 3, 3) }}>
                {m.date && <p className="d">{new Intl.DateTimeFormat('pt-PT', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(m.date + 'T12:00:00Z'))}</p>}
                <h3>{m.title}</h3>{m.description && <p>{m.description}</p>}
              </article>))}
          </div>
        </section>)}

      {data.video && <section className="sec" aria-label="Vídeo"><video controls playsInline preload="metadata" src={data.video.url} style={{ width: '100%', borderRadius: 6, background: '#000' }} /></section>}

      {data.closingMessage && <p className="hand closing rv" style={{ textAlign: 'center', padding: '0 24px' }}>{data.closingMessage}</p>}

      {data.allowReply && data.replyToken && <section className="sec" style={{ textAlign: 'left' }}><ReplyForm token={data.replyToken} /></section>}

      <p className="foot">Criado com Carta QR</p>
      {envelope && <Envelope kicker={kickerFor(cat, data.recipientName)} initials={sealInitials(data.senderName || data.recipientName)} hint="Toca no selo para abrir a tua carta" onOpened={open} />}
    </div>
  );
}
