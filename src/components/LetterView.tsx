'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { themeStyle } from '@/lib/themes';
import { getCategory, kickerFor, derive } from '@/lib/categories';
import { defaultCardsTitle, type PublicExperience } from '@/lib/experience';
import { AmbientPlayer } from './AmbientPlayer';
import { ReplyForm } from './ReplyForm';
import { RsvpForm } from './RsvpForm';
import { ScratchDate } from './letter/ScratchDate';
import { useFormGuard } from './useFormGuard';
import { Intro } from './letter/Intro';
import { Typewriter } from './letter/Typewriter';
import { Timeline, Gallery } from './letter/Story';
import { FlipCards, Vouchers, Secret, Later, Song, Finale } from './letter/Surprises';
import { Reactions, Capsule } from './letter/Responses';
import { CelebrationLayer, celebrate, burstFor, type BurstKind } from './letter/Celebration';
import { MoodLayer, CandleToggle, CandleLayer } from './letter/Atmosphere';

export type LetterViewData = {
  title: string; recipientName: string; senderName: string; intro: string; mainMessage: string; closingMessage: string; specialDate: string;
  theme: string; memories: { title: string; description: string; date?: string; place?: string }[];
  photos: { url: string; caption: string; alt: string }[]; cover: { url: string; alt: string } | null; video: { url: string } | null;
  audios: { url: string; label: string }[]; ambient: string | null; allowReply: boolean; replyToken?: string;
  category?: string; extra?: Record<string, string>; rsvp?: { open: boolean; reason?: string }; demo?: boolean;
  experience?: PublicExperience; expiresAt?: string; pinProtected?: boolean;
  capsules?: { author: string; message?: string; openAt: string; open: boolean }[];
};

const AMBIENT_LABEL: Record<string, string> = { 'piano-suave': 'Piano suave', 'chuva-leve': 'Chuva leve', ondas: 'Ondas do mar' };
const accentBtn = { background: 'var(--c-accent)', color: 'var(--c-bg)' } as const;
const CANDLE_VARS = { '--c-bg': '#24160f', '--c-ink': '#F6E7D2', '--c-card': '#35231a', '--c-soft': '#4a3020', '--c-accent': '#E7B46A' };
const RAIN_VARS = { '--c-bg': '#EDEFF3' };
const fmtDate = (d: string, withYear = true) => new Intl.DateTimeFormat('pt-PT', { weekday: withYear ? 'long' : undefined, day: 'numeric', month: 'long', year: withYear ? 'numeric' : undefined, timeZone: 'UTC' }).format(new Date(d + 'T12:00:00Z'));
const fmtShort = (d: string) => new Intl.DateTimeFormat('pt-PT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(d + 'T12:00:00Z'));

function useReveal(dep: unknown) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const els = el.querySelectorAll('.reveal:not(.in)');
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 });
    els.forEach(e => io.observe(e));
    const onPrint = () => el.querySelectorAll('.reveal').forEach(e => e.classList.add('in')); window.addEventListener('beforeprint', onPrint);
    return () => { io.disconnect(); window.removeEventListener('beforeprint', onPrint); };
  }, [dep]);
  return ref;
}

/** Corre `fn` uma vez quando o elemento aparece no ecrã. */
function useOnceVisible<T extends HTMLElement>(fn: () => void) {
  const ref = useRef<T>(null); const done = useRef(false);
  useEffect(() => {
    const el = ref.current; if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(es => { if (!done.current && es.some(e => e.isIntersecting)) { done.current = true; fn(); io.disconnect(); } }, { threshold: 0.6 });
    io.observe(el); return () => io.disconnect();
  }, [fn]);
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

function Proposal({ p, token, demo, burst }: { p: NonNullable<ReturnType<typeof derive>['proposal']>; token?: string; demo?: boolean; burst: BurstKind }) {
  const { guard } = useFormGuard();
  const [answered, setAnswered] = useState<'yes' | 'no' | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [dodge, setDodge] = useState(0);
  async function answer(choice: 'yes' | 'no') {
    setError('');
    const done = () => { setAnswered(choice); if (choice === 'yes') { celebrate(burst); setTimeout(() => celebrate('confetti'), 700); } };
    if (demo || !token) { done(); return; }
    setBusy(true);
    try {
      const r = await fetch(`/api/carta/${token}/reply`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ choice, ...(await guard()) }) });
      const j = await r.json().catch(() => null);
      if (j?.ok) done(); else setError(j?.error || 'Não foi possível enviar a resposta. Tenta novamente.');
    } catch { setError('Sem ligação à internet. Tenta novamente.'); }
    setBusy(false);
  }
  return (
    <section className="reveal mt-14 rounded-xl2 bg-[var(--c-card)] p-6 text-center shadow-soft" aria-labelledby="pq">
      <p className="text-3xl" aria-hidden>💍</p>
      <h2 id="pq" className="h-display mt-1 text-3xl font-semibold leading-snug text-[var(--c-accent)]">{p.question}</h2>
      {answered ? <p role="status" className="h-display mt-5 text-xl">{answered === 'yes' ? p.thanksYes : p.thanksNo}{demo && <span className="mt-2 block text-sm opacity-70">(Exemplo: nada foi enviado.)</span>}</p> : (
        <div className="mt-6 flex flex-col gap-3">
          <button className="btn w-full text-lg" style={{ ...accentBtn, transform: `scale(${1 + Math.min(dodge, 3) * 0.06})` }} onClick={() => answer('yes')} disabled={busy}>{p.yes}</button>
          <button className="btn w-full border-2 border-[var(--c-accent)]/40 bg-transparent text-[var(--c-ink)]" onClick={() => answer('no')} onPointerEnter={() => setDodge(d => d + 1)} disabled={busy}>{p.no}</button>
          {error && <p role="alert" className="text-sm font-semibold text-red-600">{error}</p>}
        </div>)}
    </section>
  );
}

const PROGRAM_ICON: [RegExp, string][] = [[/cerim|igreja|missa|b[eê]n[cç]/i, '♡'], [/drink|cocktail|copo|brinde|recep/i, '✧'], [/jantar|almo[cç]o|refei/i, '✦'], [/festa|dan[cç]a|m[uú]sica|dj/i, '♪'], [/bolo|corte/i, '❋']];
function splitTime(title: string) { const m = title.match(/^\s*(\d{1,2}[:h]\d{2})\s*[-–·]?\s*(.*)$/); return m ? { time: m[1].replace('h', ':'), rest: m[2] || title } : { time: '', rest: title }; }

/** Programa do evento numa linha do tempo com medalhões dourados. */
function ProgramTimeline({ title, items }: { title: string; items: { title: string; description: string }[] }) {
  return (
    <section aria-label={title} className="mt-14">
      <h2 className="font-script reveal mb-8 text-center text-[44px] leading-tight text-[var(--c-accent)]">{title}</h2>
      <ol className="relative mx-auto max-w-md">
        <span className="absolute bottom-6 left-1/2 top-6 w-px -translate-x-1/2 bg-[var(--c-accent)] opacity-30" aria-hidden />
        {items.map((m, i) => {
          const { time, rest } = splitTime(m.title); const icon = PROGRAM_ICON.find(([re]) => re.test(rest))?.[1] || '◆';
          return (
            <li key={i} className="reveal relative mb-8 grid grid-cols-[1fr_56px_1fr] items-center gap-3 last:mb-0">
              <p className="h-display text-right text-xl font-semibold">{time}</p>
              <span className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-full text-xl text-[#5E4416] shadow-[0_6px_14px_-6px_rgba(0,0,0,.45)]" style={{ background: 'radial-gradient(circle at 35% 30%, #F1DCA5, #D4AF62 45%, #A57E33)' }} aria-hidden>{icon}</span>
              <div><p className="h-display text-lg font-semibold leading-tight">{rest}</p>{m.description && <p className="mt-0.5 text-sm opacity-75">{m.description}</p>}</div>
            </li>);
        })}
      </ol>
    </section>
  );
}

function GiftSection({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* sem permissão: o texto continua visível para copiar à mão */ }
  }
  return (
    <section aria-labelledby="gift-t" className="reveal mt-14 overflow-hidden rounded-xl2 p-7 text-center shadow-soft" style={{ background: 'var(--c-accent)', color: 'var(--c-bg)' }}>
      <span className="text-2xl" aria-hidden>🎁</span>
      <h2 id="gift-t" className="font-script mt-1 text-[44px] leading-tight">Presente</h2>
      <p className="mx-auto mt-3 max-w-sm whitespace-pre-line leading-relaxed opacity-90">{text}</p>
      <button type="button" onClick={copy} className="btn mt-6 border border-current bg-transparent">{copied ? 'Copiado ✓' : 'Copiar dados'}</button>
      <p className="sr-only" aria-live="polite">{copied ? 'Dados copiados.' : ''}</p>
    </section>
  );
}

function NextButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="no-print mt-14 flex flex-col items-center gap-2 text-center">
      <span className="next-line" aria-hidden />
      <button type="button" onClick={onClick} className="next-btn h-display">{label}<span aria-hidden className="ml-2">→</span></button>
    </div>
  );
}

function Closing({ text, date, burst }: { text: string; date: string; burst: BurstKind }) {
  const fire = useCallback(() => celebrate(burst), [burst]);
  const ref = useOnceVisible<HTMLElement>(fire);
  return (
    <section ref={ref} className="reveal mt-14 text-center">
      {text && <p className="h-display letter-text text-2xl leading-snug text-[var(--c-accent)]">{text}</p>}
      {date && <p className="mt-4 text-sm uppercase tracking-[0.2em] opacity-70">{date}</p>}
    </section>
  );
}

export function LetterView({ data, startOpen = false, embedded = false }: { data: LetterViewData; startOpen?: boolean; embedded?: boolean }) {
  const exp = data.experience || {};
  const cat = getCategory(data.category);
  const isEvent = cat.kind === 'evento';
  const [opened, setOpened] = useState(startOpen);
  const [showIntro, setShowIntro] = useState(!startOpen && !embedded);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [candle, setCandle] = useState(false);
  const d = useMemo(() => derive(cat.slug, data.extra || {}, data.specialDate), [cat.slug, data.extra, data.specialDate]);
  const paragraphs = data.mainMessage.split(/\n{2,}/).filter(Boolean);
  const date = data.specialDate ? fmtDate(data.specialDate, isEvent) : '';
  const mapsOk = d.event?.mapUrl && /^https?:\/\//i.test(d.event.mapUrl);
  const scratch = isEvent && !!data.specialDate;
  const [dateRevealed, setDateRevealed] = useState(!scratch);
  const revealDate = useCallback(() => setDateRevealed(true), []);
  const burst = burstFor(data.theme, exp.mood, cat.slug);

  // --- capítulos (a carta revela-se aos poucos; convites mostram tudo de uma vez) ---
  const storyPhotos = isEvent ? 0 : Math.min(data.memories.length, data.photos.length);
  const hasStory = data.memories.length > 0 || data.photos.length > 0 || !!data.video || (isEvent && !!d.event?.dressCode);
  const hasSurprises = !!(exp.song || exp.cards?.length || (d.list && d.list.items.length) || exp.secret || exp.vouchers?.length || exp.later);
  const chapters = ['message', ...(hasStory ? ['story'] : []), ...(hasSurprises ? ['surprises'] : []), 'final'];
  const [shown, setShown] = useState(startOpen || isEvent ? chapters.length : 1);
  const ref = useReveal(`${opened}-${shown}`);
  const goNext = () => {
    const target = shown; setShown(s => s + 1);
    setTimeout(() => document.getElementById(`ch-${target}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };
  const nextLabel: Record<string, string> = { story: 'Agora lembra-te disto…', surprises: 'Tenho mais uma coisa para te mostrar…', final: 'Uma última coisa…' };
  const visible = (key: string) => chapters.indexOf(key) > -1 && chapters.indexOf(key) < shown;
  const nextFor = (key: string) => { const i = chapters.indexOf(key); const n = chapters[i + 1]; return n && i === shown - 1 ? <NextButton label={nextLabel[n]} onClick={goNext} /> : null; };

  function keepsake() {
    setShown(chapters.length);
    setTimeout(() => { document.querySelectorAll('.reveal').forEach(e => e.classList.add('in')); window.print(); }, 400);
  }

  const moodClass = exp.mood && exp.mood !== 'classico' ? `mood-${exp.mood}` : '';
  return (
    <div ref={ref} style={{ ...themeStyle(data.theme), ...(exp.mood === 'chuva' ? RAIN_VARS : {}), ...(candle ? CANDLE_VARS : {}) } as React.CSSProperties} className={`letter-root letter-scope relative w-full overflow-hidden bg-[var(--c-bg)] text-[var(--c-ink)] ${moodClass} ${candle ? 'candle-on' : ''} ${embedded ? '' : 'min-h-screen'}`}>
      {!embedded && <CelebrationLayer />}
      {!embedded && <MoodLayer mood={exp.mood} />}
      {!embedded && <CandleLayer on={candle} />}
      {showIntro && <Intro teaser={exp.teaser} recipientName={data.recipientName} glyph={cat.glyph} label={kickerFor(cat, data.recipientName)} isEvent={isEvent}
        onOpen={() => { setShowIntro(false); setOpened(true); window.scrollTo({ top: 0 }); }} />}
      {!embedded && opened && !isEvent && <CandleToggle on={candle} onToggle={() => setCandle(c => !c)} />}

      <header className="letter-cover relative flex min-h-[70vh] flex-col items-center justify-end overflow-hidden px-6 pb-12 pt-24 text-center" style={embedded ? { minHeight: 420 } : undefined}>
        {data.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.cover.url} alt={data.cover.alt || `Foto de capa: ${data.title}`} className="cover-kenburns absolute inset-0 h-full w-full object-cover" />
        ) : <div className="absolute inset-0 bg-[var(--c-soft)]" aria-hidden />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" aria-hidden />
        <div className="relative z-10 max-w-md text-white fade-up">
          <p className="mb-2 text-2xl opacity-90" aria-hidden>{cat.glyph}</p>
          <p className="mb-3 text-sm uppercase tracking-[0.25em] opacity-90">{kickerFor(cat, data.recipientName)}</p>
          {isEvent && data.senderName && <p className="font-script mb-2 text-[52px] leading-[1.05] sm:text-[64px]">{data.senderName}</p>}
          <h1 className={`h-display font-semibold leading-tight ${isEvent && data.senderName ? 'text-2xl sm:text-3xl' : 'text-4xl sm:text-5xl'}`}>{data.title || 'A tua surpresa'}</h1>
          {d.subtitle && <p className="mt-3 text-sm uppercase tracking-[.18em] opacity-90">{d.subtitle}</p>}
          {isEvent && date && dateRevealed && <p className="mt-3 text-lg opacity-95">{date}{d.event?.time ? ` · ${d.event.time}` : ''}</p>}
          {data.intro && <p className="mx-auto mt-4 max-w-sm text-lg opacity-95">{data.intro}</p>}
          {!opened && !showIntro && <button onClick={() => setOpened(true)} className="btn mt-8 bg-white text-[#4E1421] shadow-soft hover:bg-white/90">{cat.open}</button>}
          {opened && !isEvent && !embedded && <p className="no-print mt-8 animate-bounce text-sm opacity-80" aria-hidden>Lê quando estiveres confortável ↓</p>}
        </div>
      </header>
      {exp.mood === 'panos' && <div className="pano-band" aria-hidden />}

      {opened && (
        <main className="mx-auto max-w-xl px-5 pb-16">
          {/* ---------- 1. A mensagem ---------- */}
          <div id="ch-0" className="scroll-mt-4">
            {(data.ambient || data.audios.length > 0) && (
              <section aria-label="Som" className="reveal -mt-6 mb-8 flex flex-col items-center gap-3 rounded-xl2 bg-[var(--c-card)] p-4 shadow-soft">
                {data.ambient && <AmbientPlayer kind={data.ambient} label={`Ouvir: ${AMBIENT_LABEL[data.ambient] || 'ambiente'}`} />}
                {data.audios.map((a, i) => (<div key={i} className="w-full"><p className="mb-1 text-sm font-semibold">{a.label}</p><audio controls preload="none" src={a.url} className="w-full">O teu navegador não suporta áudio.</audio></div>))}
              </section>
            )}

            {scratch && <ScratchDate date={data.specialDate} onReveal={revealDate} />}

            {d.countdown && dateRevealed && <Countdown {...d.countdown} />}

            {isEvent && d.event && (
              <section aria-label="Detalhes do evento" className="reveal mb-8 rounded-xl2 bg-[var(--c-card)] p-5 shadow-soft">
                <dl className="grid gap-4 text-center sm:grid-cols-2 sm:text-left">
                  {date && dateRevealed && <div><dt className="text-xs uppercase tracking-[.2em] opacity-60">Data</dt><dd className="h-display text-lg">{date}</dd></div>}
                  {d.event.time && <div><dt className="text-xs uppercase tracking-[.2em] opacity-60">Hora</dt><dd className="h-display text-lg">{d.event.time}</dd></div>}
                  {d.event.venue && <div><dt className="text-xs uppercase tracking-[.2em] opacity-60">Local</dt><dd className="h-display text-lg">{d.event.venue}</dd>{d.event.address && <dd className="text-sm opacity-80">{d.event.address}</dd>}</div>}
                </dl>
                {mapsOk && <a href={d.event.mapUrl} target="_blank" rel="noopener noreferrer nofollow" className="btn mt-5 w-full" style={accentBtn}>Ver no mapa</a>}
              </section>
            )}

            <article className="reveal letter-paper rounded-xl2 p-6 shadow-soft sm:p-8">
              {isEvent || embedded
                ? paragraphs.map((p, i) => <p key={i} className="h-display letter-text mb-5 whitespace-pre-line text-[1.15rem] leading-8 last:mb-0">{p}</p>)
                : <Typewriter paragraphs={paragraphs} />}
              {data.senderName && <p className="letter-sign mt-6 text-right">{isEvent ? 'Com carinho,' : 'Com todo o carinho,'}<br /><span className="h-display letter-text text-xl">{data.senderName}</span></p>}
            </article>

            {d.quote && <blockquote className="reveal mt-8 border-l-4 border-[var(--c-accent)] pl-4"><p className="text-xs uppercase tracking-[.2em] opacity-60">{d.quote.label}</p><p className="h-display letter-text mt-1 text-xl italic">“{d.quote.text}”</p></blockquote>}
            {nextFor('message')}
          </div>

          {/* ---------- 2. A nossa história ---------- */}
          {visible('story') && (
            <div id={`ch-${chapters.indexOf('story')}`} className="chapter-in scroll-mt-4">
              {isEvent ? (<>
                {data.memories.length > 0 && <ProgramTimeline title={cat.memories.publicTitle} items={data.memories} />}
                {d.event?.dressCode && (
                  <section aria-labelledby="dress-t" className="reveal mt-14 rounded-xl2 bg-[var(--c-card)] p-7 text-center shadow-soft">
                    <h2 id="dress-t" className="font-script text-[44px] leading-tight text-[var(--c-accent)]">Dress code</h2>
                    <p className="h-display mt-2 text-xl">{d.event.dressCode}</p>
                    <p className="mt-1 text-sm opacity-70">Vem a rigor, vai ficar nas fotografias.</p>
                  </section>
                )}
              </>)
                : data.memories.length > 0 && <Timeline title={cat.memories.publicTitle} memories={data.memories} photos={data.photos.slice(0, storyPhotos)} onPhoto={setLightbox} />}
              <Gallery title={storyPhotos > 0 ? 'Mais momentos' : undefined} photos={data.photos.slice(storyPhotos)} offset={storyPhotos} onPhoto={setLightbox} />
              {data.video && <section aria-label="Vídeo" className="reveal mt-12"><video controls playsInline preload="metadata" src={data.video.url} className="w-full rounded-xl2 bg-black shadow-soft">O teu navegador não suporta vídeo.</video></section>}
              {nextFor('story')}
            </div>
          )}

          {/* ---------- 3. Surpresas ---------- */}
          {visible('surprises') && (
            <div id={`ch-${chapters.indexOf('surprises')}`} className="chapter-in scroll-mt-4">
              {exp.song && <Song url={exp.song} />}
              {exp.cards && exp.cards.length > 0 && <FlipCards title={exp.cardsTitle || defaultCardsTitle(cat.slug)} items={exp.cards} burst={burst} />}
              {d.list && d.list.items.length > 0 && <FlipCards title={d.list.title} items={d.list.items.slice(0, 12)} burst={burst} />}
              {exp.secret && <Secret hint={exp.secret.hint} demoMessage={exp.secret.message} token={data.replyToken} demo={data.demo} burst={burst} />}
              {exp.vouchers && exp.vouchers.length > 0 && <Vouchers items={exp.vouchers} sender={data.senderName} token={data.replyToken} demo={data.demo} />}
              {exp.later && <Later {...exp.later} />}
              {nextFor('surprises')}
            </div>
          )}

          {/* ---------- 4. O final ---------- */}
          {visible('final') && (
            <div id={`ch-${chapters.indexOf('final')}`} className="chapter-in scroll-mt-4">
              {exp.finale && <Finale text={exp.finale.text} gesture={exp.finale.gesture} burst={burst} />}
              {(data.closingMessage || (date && !isEvent)) && <Closing text={data.closingMessage} date={date && !isEvent ? date : ''} burst={burst} />}

              {d.proposal && <Proposal p={d.proposal} token={data.replyToken} demo={data.demo} burst={burst} />}
              {isEvent && d.event?.gift && <GiftSection text={d.event.gift} />}
              {isEvent && data.rsvp && data.rsvp.open && (
                <p className="mt-14 flex items-center justify-center gap-2 text-center text-sm opacity-75">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                  Este convite é pessoal e intransmissível. Confirma só a tua presença e a de quem vem contigo.
                </p>
              )}
              {isEvent && data.rsvp && <RsvpForm token={data.replyToken || ''} open={data.rsvp.open} reason={data.rsvp.reason} deadline={d.event?.rsvpDeadline} demo={data.demo} />}
              {!isEvent && exp.reactions !== false && !embedded && <Reactions token={data.replyToken} demo={data.demo} sender={data.senderName} burst={burst} />}
              {!d.proposal && !isEvent && data.allowReply && data.replyToken && <ReplyForm token={data.replyToken} />}
              {!isEvent && exp.capsule !== false && !embedded && <Capsule token={data.replyToken} demo={data.demo} capsules={data.capsules || []} />}

              {!embedded && (
                <section className="no-print reveal mt-14 space-y-3 text-center">
                  <button type="button" className="btn btn-sm w-full border-2 border-[var(--c-accent)]/30 bg-[var(--c-card)]" onClick={keepsake}>🖨 Guardar como recordação (PDF)</button>
                  <p className="privacy-note">🔒 Esta {isEvent ? 'página' : 'carta'} é privada: só abre quem tem este link{data.pinProtected ? ' e o PIN' : ''}. Não aparece em pesquisas nem é partilhada por nós.{data.expiresAt ? ` Fica disponível até ${fmtShort(data.expiresAt)}.` : ''}</p>
                </section>
              )}

              {!embedded && (
                <section className="no-print reveal mt-12 rounded-xl2 bg-[var(--c-soft)] p-6 text-center">
                  <p className="h-display text-xl text-[var(--c-accent)]">Queres criar uma surpresa assim para alguém especial?</p>
                  <Link href={`/criar?ocasiao=${encodeURIComponent(cat.slug)}`} className="btn mt-4" style={accentBtn}>Criar a minha Carta QR</Link>
                </section>
              )}

              <footer className="mt-16 flex flex-col items-center gap-1 text-center text-xs opacity-70">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/logo-mark.png" alt="" width={28} height={30} className="h-7 w-auto" />Criado com Carta QR</footer>
            </div>
          )}
        </main>
      )}

      {lightbox !== null && data.photos[lightbox] && (
        <div role="dialog" aria-modal="true" aria-label="Fotografia ampliada" className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.photos[lightbox].url} alt={data.photos[lightbox].alt || data.photos[lightbox].caption || 'Fotografia'} className="max-h-[78vh] max-w-full rounded-lg object-contain" />
          {data.photos[lightbox].caption && <p className="h-display letter-text mt-3 text-center text-lg text-white/90">{data.photos[lightbox].caption}</p>}
          <button className="btn btn-secondary mt-4" onClick={() => setLightbox(null)}>Fechar</button>
        </div>
      )}
    </div>
  );
}
