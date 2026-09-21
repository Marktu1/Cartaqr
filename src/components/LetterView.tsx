'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { themeStyle } from '@/lib/themes';
import { getCategory, kickerFor, derive } from '@/lib/categories';
import { AmbientPlayer } from './AmbientPlayer';
import { ReplyForm } from './ReplyForm';
import { RsvpForm } from './RsvpForm';

export type LetterViewData = {
  title: string; recipientName: string; senderName: string; intro: string; mainMessage: string; closingMessage: string; specialDate: string;
  theme: string; memories: { title: string; description: string; date?: string }[];
  photos: { url: string; caption: string; alt: string }[]; cover: { url: string; alt: string } | null; video: { url: string } | null;
  audios: { url: string; label: string }[]; ambient: string | null; allowReply: boolean; replyToken?: string;
  category?: string; extra?: Record<string, string>; rsvp?: { open: boolean; reason?: string }; demo?: boolean;
};

const AMBIENT_LABEL: Record<string, string> = { 'piano-suave': 'Piano suave', 'chuva-leve': 'Chuva leve', ondas: 'Ondas do mar' };
const accentBtn = { background: 'var(--c-accent)', color: 'var(--c-bg)' } as const;
const fmtDate = (d: string, withYear = true) => new Intl.DateTimeFormat('pt-PT', { weekday: withYear ? 'long' : undefined, day: 'numeric', month: 'long', year: withYear ? 'numeric' : undefined, timeZone: 'UTC' }).format(new Date(d + 'T12:00:00Z'));

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const els = el.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 });
    els.forEach(e => io.observe(e));
    const onPrint = () => els.forEach(e => e.classList.add('in')); window.addEventListener('beforeprint', onPrint);
    return () => { io.disconnect(); window.removeEventListener('beforeprint', onPrint); };
  });
  return ref;
}

function Countdown({ target, label, past }: { target: string; label: string; past: string }) {
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => { const t = new Date(target + 'T00:00:00'); const n = new Date(); n.setHours(0, 0, 0, 0); setDays(Math.round((t.getTime() - n.getTime()) / 86400000)); }, [target]);
  if (days === null) return null;
  if (days < 0 && !past) return null;
  return (
    <div className="reveal mb-8 rounded-xl2 bg-[var(--c-card)] p-5 text-center shadow-soft" role="status">
      {days > 0 && <><p className="h-display text-5xl font-semibold text-[var(--c-accent)]">{days}</p><p className="mt-1 text-sm uppercase tracking-[.2em] opacity-75">{days === 1 ? 'dia' : 'dias'} {label}</p></>}
      {days === 0 && <p className="h-display text-2xl text-[var(--c-accent)]">É hoje!</p>}
      {days < 0 && <p className="h-display text-xl text-[var(--c-accent)]">{past}</p>}
    </div>
  );
}

function Proposal({ p, token, demo }: { p: NonNullable<ReturnType<typeof derive>['proposal']>; token?: string; demo?: boolean }) {
  const [answered, setAnswered] = useState<'yes' | 'no' | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function answer(choice: 'yes' | 'no') {
    setError('');
    if (demo || !token) { setAnswered(choice); return; }
    setBusy(true);
    try {
      const r = await fetch(`/api/carta/${token}/reply`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ choice }) });
      const j = await r.json().catch(() => null);
      if (j?.ok) setAnswered(choice); else setError(j?.error || 'Não foi possível enviar a resposta. Tenta novamente.');
    } catch { setError('Sem ligação à internet. Tenta novamente.'); }
    setBusy(false);
  }
  return (
    <section className="reveal mt-14 rounded-xl2 bg-[var(--c-card)] p-6 text-center shadow-soft" aria-labelledby="pq">
      <h2 id="pq" className="h-display text-3xl font-semibold leading-snug text-[var(--c-accent)]">{p.question}</h2>
      {answered ? <p role="status" className="mt-5 text-lg">{answered === 'yes' ? p.thanksYes : p.thanksNo}{demo && <span className="mt-2 block text-sm opacity-70">(Exemplo: nada foi enviado.)</span>}</p> : (
        <div className="mt-6 flex flex-col gap-3">
          <button className="btn w-full" style={accentBtn} onClick={() => answer('yes')} disabled={busy}>{p.yes}</button>
          <button className="btn w-full border-2 border-[var(--c-accent)]/40 bg-transparent text-[var(--c-ink)]" onClick={() => answer('no')} disabled={busy}>{p.no}</button>
          {error && <p role="alert" className="text-sm font-semibold text-red-600">{error}</p>}
        </div>)}
    </section>
  );
}

export function LetterView({ data, startOpen = false, embedded = false }: { data: LetterViewData; startOpen?: boolean; embedded?: boolean }) {
  const [opened, setOpened] = useState(startOpen);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const ref = useReveal();
  const cat = getCategory(data.category);
  const d = useMemo(() => derive(cat.slug, data.extra || {}, data.specialDate), [cat.slug, data.extra, data.specialDate]);
  const paragraphs = data.mainMessage.split(/\n{2,}/).filter(Boolean);
  const isEvent = cat.kind === 'evento';
  const date = data.specialDate ? fmtDate(data.specialDate, isEvent) : '';
  const mapsOk = d.event?.mapUrl && /^https?:\/\//i.test(d.event.mapUrl);

  return (
    <div ref={ref} style={themeStyle(data.theme)} className={`relative w-full overflow-hidden bg-[var(--c-bg)] text-[var(--c-ink)] ${embedded ? '' : 'min-h-screen'}`}>
      <header className="relative flex min-h-[70vh] flex-col items-center justify-end overflow-hidden px-6 pb-12 pt-24 text-center" style={embedded ? { minHeight: 420 } : undefined}>
        {data.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.cover.url} alt={data.cover.alt || `Foto de capa: ${data.title}`} className="absolute inset-0 h-full w-full object-cover" />
        ) : <div className="absolute inset-0 bg-[var(--c-soft)]" aria-hidden />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" aria-hidden />
        <div className="relative z-10 max-w-md text-white fade-up">
          <p className="mb-2 text-2xl opacity-90" aria-hidden>{cat.glyph}</p>
          <p className="mb-3 text-sm uppercase tracking-[0.25em] opacity-90">{kickerFor(cat, data.recipientName)}</p>
          <h1 className="h-display text-4xl font-semibold leading-tight sm:text-5xl">{data.title || 'A tua surpresa'}</h1>
          {d.subtitle && <p className="mt-3 text-sm uppercase tracking-[.18em] opacity-90">{d.subtitle}</p>}
          {isEvent && date && <p className="mt-3 text-lg opacity-95">{date}{d.event?.time ? ` · ${d.event.time}` : ''}</p>}
          {data.intro && <p className="mx-auto mt-4 max-w-sm text-lg opacity-95">{data.intro}</p>}
          {!opened && <button onClick={() => setOpened(true)} className="btn mt-8 bg-white text-[#4E1421] shadow-soft hover:bg-white/90">{cat.open}</button>}
        </div>
      </header>

      {opened && (
        <main className="mx-auto max-w-xl px-5 pb-16">
          {(data.ambient || data.audios.length > 0) && (
            <section aria-label="Som" className="reveal -mt-6 mb-8 flex flex-col items-center gap-3 rounded-xl2 bg-[var(--c-card)] p-4 shadow-soft">
              {data.ambient && <AmbientPlayer kind={data.ambient} label={`Ouvir: ${AMBIENT_LABEL[data.ambient] || 'ambiente'}`} />}
              {data.audios.map((a, i) => (<div key={i} className="w-full"><p className="mb-1 text-sm font-semibold">{a.label}</p><audio controls preload="none" src={a.url} className="w-full">O teu navegador não suporta áudio.</audio></div>))}
            </section>
          )}

          {d.countdown && <Countdown {...d.countdown} />}

          {isEvent && d.event && (
            <section aria-label="Detalhes do evento" className="reveal mb-8 rounded-xl2 bg-[var(--c-card)] p-5 shadow-soft">
              <dl className="grid gap-4 text-center sm:grid-cols-2 sm:text-left">
                {date && <div><dt className="text-xs uppercase tracking-[.2em] opacity-60">Data</dt><dd className="h-display text-lg">{date}</dd></div>}
                {d.event.time && <div><dt className="text-xs uppercase tracking-[.2em] opacity-60">Hora</dt><dd className="h-display text-lg">{d.event.time}</dd></div>}
                {d.event.venue && <div><dt className="text-xs uppercase tracking-[.2em] opacity-60">Local</dt><dd className="h-display text-lg">{d.event.venue}</dd>{d.event.address && <dd className="text-sm opacity-80">{d.event.address}</dd>}</div>}
                {d.event.dressCode && <div><dt className="text-xs uppercase tracking-[.2em] opacity-60">Vestuário</dt><dd className="h-display text-lg">{d.event.dressCode}</dd></div>}
              </dl>
              {mapsOk && <a href={d.event.mapUrl} target="_blank" rel="noopener noreferrer nofollow" className="btn mt-5 w-full" style={accentBtn}>Ver no mapa</a>}
            </section>
          )}

          {data.photos.length > 0 && (
            <section aria-label="Fotografias" className="reveal mt-2 mb-10">
              <div className="snap-x-row -mx-5 px-5">
                {data.photos.map((p, i) => (
                  <figure key={i} className="w-[78%] max-w-[320px]">
                    <button type="button" onClick={() => setLightbox(i)} className="block w-full overflow-hidden rounded-xl2 shadow-soft" aria-label={`Ampliar fotografia ${i + 1}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt={p.alt || p.caption || `Fotografia ${i + 1}`} loading="lazy" className="aspect-[4/5] w-full object-cover" />
                    </button>
                    {p.caption && <figcaption className="mt-2 text-center text-sm italic opacity-80">{p.caption}</figcaption>}
                  </figure>))}
              </div>
            </section>
          )}

          <article className="reveal letter-paper rounded-xl2 p-6 shadow-soft sm:p-8">
            {paragraphs.map((p, i) => <p key={i} className="h-display mb-5 whitespace-pre-line text-[1.15rem] leading-8 last:mb-0">{p}</p>)}
            {data.senderName && <p className="mt-6 text-right text-sm opacity-70">{isEvent ? 'Com carinho,' : '—'} {data.senderName}</p>}
          </article>

          {d.quote && <blockquote className="reveal mt-8 border-l-4 border-[var(--c-accent)] pl-4"><p className="text-xs uppercase tracking-[.2em] opacity-60">{d.quote.label}</p><p className="h-display mt-1 text-xl italic">“{d.quote.text}”</p></blockquote>}

          {d.list && d.list.items.length > 0 && (
            <section aria-label={d.list.title} className="reveal mt-10"><h2 className="h-display mb-4 text-center text-2xl text-[var(--c-accent)]">{d.list.title}</h2>
              <ol className="space-y-2">{d.list.items.map((it, i) => <li key={i} className="flex gap-3 rounded-xl bg-[var(--c-card)] p-3 shadow-soft"><span className="h-display font-semibold text-[var(--c-accent)]">{i + 1}</span><span>{it}</span></li>)}</ol></section>
          )}

          {data.memories.length > 0 && (
            <section aria-label={cat.memories.publicTitle} className="mt-12">
              <h2 className="h-display reveal mb-6 text-center text-2xl text-[var(--c-accent)]">{cat.memories.publicTitle}</h2>
              <ol className="relative ml-3 border-l-2 border-[var(--c-accent)]/30 pl-6">
                {data.memories.map((m, i) => (
                  <li key={i} className="reveal relative mb-8 last:mb-0">
                    <span className="absolute -left-[33px] top-1.5 h-4 w-4 rounded-full border-2 border-[var(--c-accent)] bg-[var(--c-bg)]" aria-hidden />
                    {m.date && <p className="text-xs font-semibold uppercase tracking-wider text-[var(--c-accent)]">{new Intl.DateTimeFormat('pt-PT', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(m.date + 'T12:00:00Z'))}</p>}
                    <h3 className="h-display text-lg font-semibold">{m.title}</h3>
                    {m.description && <p className="mt-1 opacity-85">{m.description}</p>}
                  </li>))}
              </ol>
            </section>
          )}

          {data.video && <section aria-label="Vídeo" className="reveal mt-12"><video controls playsInline preload="metadata" src={data.video.url} className="w-full rounded-xl2 bg-black shadow-soft">O teu navegador não suporta vídeo.</video></section>}

          {(data.closingMessage || (date && !isEvent)) && (
            <section className="reveal mt-14 text-center">
              {data.closingMessage && <p className="h-display text-2xl leading-snug text-[var(--c-accent)]">{data.closingMessage}</p>}
              {date && !isEvent && <p className="mt-4 text-sm uppercase tracking-[0.2em] opacity-70">{date}</p>}
            </section>
          )}

          {d.proposal && <Proposal p={d.proposal} token={data.replyToken} demo={data.demo} />}
          {isEvent && data.rsvp && <RsvpForm token={data.replyToken || ''} open={data.rsvp.open} reason={data.rsvp.reason} deadline={d.event?.rsvpDeadline} demo={data.demo} />}
          {!d.proposal && !isEvent && data.allowReply && data.replyToken && <ReplyForm token={data.replyToken} />}

          <footer className="mt-16 flex flex-col items-center gap-1 text-center text-xs opacity-70">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/logo-mark.png" alt="" width={28} height={30} className="h-7 w-auto" />Criado com Carta QR</footer>
        </main>
      )}

      {lightbox !== null && (
        <div role="dialog" aria-modal="true" aria-label="Fotografia ampliada" className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.photos[lightbox].url} alt={data.photos[lightbox].alt || data.photos[lightbox].caption || 'Fotografia'} className="max-h-[80vh] max-w-full rounded-lg object-contain" />
          {data.photos[lightbox].caption && <p className="mt-3 text-center text-white/90">{data.photos[lightbox].caption}</p>}
          <button className="btn btn-secondary mt-4" onClick={() => setLightbox(null)}>Fechar</button>
        </div>
      )}
    </div>
  );
}
