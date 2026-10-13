'use client';
import { useMemo, useState } from 'react';
import './pedido.css';
import { derive, getCategory, kickerFor } from '@/lib/categories';
import type { LetterViewData } from '../LetterView';
import { AmbientPlayer } from '../AmbientPlayer';
import { ReplyForm } from '../ReplyForm';
import { useFormGuard } from '../useFormGuard';
import { useReveal } from './useReveal';

const Heart = () => <svg className="heart-pulse" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 5 6.3 5c2 0 3.6 1.1 4.4 2.6h2.6C14.1 6.1 15.7 5 17.7 5 21 5 23.1 8.4 21.6 11.8 19.5 16.4 12 21 12 21z" /></svg>;
const AMBIENT_LABEL: Record<string, string> = { 'piano-suave': 'Piano suave', 'chuva-leve': 'Chuva leve', ondas: 'Ondas do mar' };

/** "A pergunta": uma noite, uma história em capítulos e a pergunta no fim. */
export function Pedido({ data, startOpen = false, embedded = false }: { data: LetterViewData; startOpen?: boolean; embedded?: boolean }) {
  const cat = getCategory(data.category);
  const d = useMemo(() => derive(cat.slug, data.extra || {}, data.specialDate), [cat.slug, data.extra, data.specialDate]);
  const [started, setStarted] = useState(startOpen || embedded);
  const ref = useReveal(started);
  const { guard } = useFormGuard();
  const [answered, setAnswered] = useState<'yes' | 'no' | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const paragraphs = data.mainMessage.split(/\n{2,}/).filter(Boolean);
  const p = d.proposal;

  async function answer(choice: 'yes' | 'no') {
    setError('');
    if (data.demo || !data.replyToken) { setAnswered(choice); return; }
    setBusy(true);
    try {
      const r = await fetch(`/api/carta/${data.replyToken}/reply`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ choice, ...(await guard()) }) });
      const j = await r.json().catch(() => null);
      if (j?.ok) setAnswered(choice); else setError(j?.error || 'Não foi possível enviar a resposta. Tenta novamente.');
    } catch { setError('Sem ligação à internet. Tenta novamente.'); }
    setBusy(false);
  }
  const hearts = useMemo(() => Array.from({ length: 22 }, (_, i) => ({ left: (i * 37) % 100, delay: (i % 8) * 0.18, dx: ((i * 53) % 90) - 45, size: 14 + ((i * 7) % 22) })), []);

  return (
    <div ref={ref} className={`pd${embedded ? ' emb' : ''}`}>
      <div className="stars" aria-hidden />
      {!started ? (
        <section className="ch" style={{ minHeight: '100vh' }}>
          <p className="eyebrow intro-in">{kickerFor(cat, data.recipientName)}</p>
          <h1 className="big intro-in" style={{ marginTop: 26, animationDelay: '.5s' }}>{data.title}</h1>
          {data.intro && <p className="small intro-in" style={{ animationDelay: '1s' }}>{data.intro}</p>}
          <button className="btn-g intro-in" style={{ animationDelay: '1.5s' }} onClick={() => { setStarted(true); window.scrollTo(0, 0); }}>{cat.open}</button>
        </section>
      ) : (
        <>
          <section className="ch" style={{ minHeight: '100vh' }}>
            <Heart />
            <p className="eyebrow rv in" style={{ marginTop: 28 }}>{kickerFor(cat, data.recipientName)}</p>
            <h1 className="big rv in" style={{ marginTop: 22 }}>{data.title}</h1>
            {data.intro && <p className="small rv in d1">{data.intro}</p>}
            {(data.ambient || data.audios.length > 0) && (
              <div className="rv in d2" style={{ marginTop: 28 }}>
                {data.ambient && <AmbientPlayer kind={data.ambient} label={`Ouvir: ${AMBIENT_LABEL[data.ambient] || 'ambiente'}`} />}
                {data.audios.map((a, i) => <div key={i} style={{ marginTop: 10 }}><p className="eyebrow">{a.label}</p><audio controls preload="none" src={a.url} style={{ width: 'min(280px,80vw)', marginTop: 6 }} /></div>)}
              </div>)}
            <span className="small" style={{ marginTop: 44, opacity: .6 }}>Desliza para baixo ↓</span>
          </section>

          {paragraphs.map((t, i) => (
            <section className="ch" key={i}>
              {i === 0 && <p className="eyebrow rv" style={{ marginBottom: 24 }}>Primeiro capítulo</p>}
              <p className="line rv">{t}</p>
            </section>))}

          {data.photos.map((ph, i) => (
            <figure className="ph rv" key={i} style={{ margin: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ph.url} alt={ph.alt || ph.caption || `Fotografia ${i + 1}`} loading="lazy" />
              {ph.caption && <figcaption>{ph.caption}</figcaption>}
            </figure>))}

          {data.memories.map((m, i) => (
            <section className="ch" key={i} style={{ minHeight: '70vh' }}>
              <p className="eyebrow rv">{String(i + 1).padStart(2, '0')}</p>
              <h2 className="big rv d1" style={{ marginTop: 20, fontSize: 'clamp(34px,9vw,46px)' }}>{m.title}</h2>
              {m.description && <p className="small rv d2">{m.description}</p>}
            </section>))}

          {data.video && <section className="ch" style={{ minHeight: '60vh' }}><video controls playsInline preload="metadata" src={data.video.url} className="rv" style={{ width: '100%', maxWidth: 420, borderRadius: 18, background: '#000' }} /></section>}

          {data.closingMessage && <section className="ch" style={{ minHeight: '60vh' }}><p className="line rv" style={{ fontStyle: 'italic', color: 'var(--glow)' }}>{data.closingMessage}</p></section>}

          {p ? (
            <section className="ch ask" aria-live="polite" style={{ position: 'relative' }}>
              {answered ? (
                <>
                  {answered === 'yes' && <div className="burst" aria-hidden>{hearts.map((h, i) => <i key={i} style={{ left: `${h.left}%`, animationDelay: `${h.delay}s`, fontSize: h.size, ['--dx' as string]: `${h.dx}px` }}>♥</i>)}</div>}
                  <Heart />
                  <p className="answer intro-in" style={{ marginTop: 28 }}>{answered === 'yes' ? p.thanksYes : p.thanksNo}</p>
                  {data.demo && <p className="small">(Exemplo: nada foi enviado.)</p>}
                </>
              ) : (
                <>
                  <p className="eyebrow rv">A pergunta</p>
                  <h2 className="rv d1" style={{ marginTop: 26 }}>{p.question}</h2>
                  <button className="yes rv d2" onClick={() => answer('yes')} disabled={busy}>{p.yes}</button>
                  <button className="maybe rv d2" onClick={() => answer('no')} disabled={busy}>{p.no}</button>
                  {error && <p role="alert" className="small" style={{ color: '#ff9aa8' }}>{error}</p>}
                </>)}
            </section>
          ) : (data.allowReply && data.replyToken && <section className="ch" style={{ minHeight: '60vh', textAlign: 'left' }}><ReplyForm token={data.replyToken} /></section>)}

          <p className="foot">Criado com Carta QR</p>
        </>
      )}
    </div>
  );
}
