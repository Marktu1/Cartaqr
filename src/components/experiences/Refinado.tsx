'use client';
import { useCallback, useId, useMemo, useState } from 'react';
import './refinado.css';
import { derive, getCategory, kickerFor } from '@/lib/categories';
import { longDate, splitTime } from '@/lib/experiences';
import type { LetterViewData } from '../LetterView';
import { AmbientPlayer } from '../AmbientPlayer';
import { RsvpForm } from '../RsvpForm';
import { ReplyForm } from '../ReplyForm';
import { Envelope, sealInitials } from '../letter/Envelope';
import { useCountdown, useReveal } from './useReveal';

/* ---------- Ornamentos originais (SVG) ---------- */

/** Bainha de renda recortada: tiles com arcos, pérolas e pétalas num traço fino. */
function Lace({ position }: { position: 'top' | 'bot' }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={`lace lace-${position}`} viewBox="0 0 460 64" preserveAspectRatio="none" aria-hidden>
      <defs>
        <filter id={`s${id}`} x="-5%" y="-5%" width="110%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="2.2" floodColor="#2a0a12" floodOpacity=".28" /></filter>
        <pattern id={`p${id}`} width="46" height="64" patternUnits="userSpaceOnUse">
          <path d="M0 0H46V30Q46 58 23 58Q0 58 0 30Z" fill="#FBF7F5" />
          <path d="M6 26Q23 52 40 26" fill="none" stroke="#DCC9CB" strokeWidth=".8" />
          <path d="M12 24Q23 42 34 24" fill="none" stroke="#DCC9CB" strokeWidth=".8" />
          <circle cx="23" cy="42" r="2.6" fill="#EFE2E0" stroke="#D6BFC2" strokeWidth=".7" />
          <circle cx="23" cy="18" r="1.4" fill="#D6BFC2" />
          <circle cx="0" cy="30" r="1.6" fill="#D6BFC2" /><circle cx="46" cy="30" r="1.6" fill="#D6BFC2" />
        </pattern>
      </defs>
      <rect width="460" height="64" fill={`url(#p${id})`} filter={`url(#s${id})`} />
    </svg>
  );
}

/** Moldura em arco: filete, fio de pérolas e folhas nos montantes. */
function ArchFrame({ children }: { children: React.ReactNode }) {
  const leaves = Array.from({ length: 9 }, (_, i) => 175 + i * 28);
  return (
    <div className="arch">
      <svg viewBox="0 0 300 420" aria-hidden>
        <path d="M18 412V150A132 132 0 0 1 282 150V412Z" fill="rgba(255,255,255,.4)" stroke="#CDB4BC" strokeWidth="1" />
        <path d="M30 412V150A120 120 0 0 1 270 150V412" fill="none" stroke="#E4D3D6" strokeWidth="3.4" strokeDasharray="0 8.2" strokeLinecap="round" />
        <path d="M40 412V150A110 110 0 0 1 260 150V412" fill="none" stroke="#DCC7CB" strokeWidth=".8" />
        {leaves.map((y, i) => (
          <g key={y} stroke="#BFA3AB" strokeWidth=".8" fill="rgba(255,255,255,.55)">
            <ellipse cx="46" cy={y} rx="3.4" ry="8" transform={`rotate(${i % 2 ? 38 : -38} 46 ${y})`} />
            <ellipse cx="254" cy={y} rx="3.4" ry="8" transform={`rotate(${i % 2 ? -38 : 38} 254 ${y})`} />
          </g>
        ))}
      </svg>
      <div className="in">{children}</div>
    </div>
  );
}

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/** Dois cisnes cujos pescoços formam um coração. */
function Swans() {
  return (
    <svg width="130" height="86" viewBox="0 0 130 86" style={{ color: '#5A1E2C' }} aria-hidden>
      <g {...stroke}>
        <path d="M63 50C46 44 30 30 36 17c4-9 17-8 21 1 3 7-2 13-8 15" />
        <path d="M67 50C84 44 100 30 94 17c-4-9-17-8-21 1-3 7 2 13 8 15" />
        <path d="M63 50C54 56 40 60 28 58c-10-2-16-8-18-14 7 6 17 8 24 6" />
        <path d="M67 50C76 56 90 60 102 58c10-2 16-8 18-14-7 6-17 8-24 6" />
        <path d="M63 50C58 60 66 64 67 50" />
        <path d="M18 70c14 6 30 5 47 0 17 5 33 6 47 0" />
        <path d="M34 77c10 3 20 3 31 0 11 3 21 3 31 0" opacity=".6" />
      </g>
      <circle cx="40" cy="16" r="1" fill="currentColor" /><circle cx="90" cy="16" r="1" fill="currentColor" />
    </svg>
  );
}

/** Autocarro, estrada sinuosa e ciprestes. */
function Bus() {
  return (
    <svg width="190" height="130" viewBox="0 0 190 130" style={{ color: '#F1DDE1' }} aria-hidden>
      <g {...stroke}>
        <path d="M14 112C46 118 70 96 104 100c34 4 52-8 72-26" />
        <path d="M30 120c34 4 60-12 90-8s44-4 62-18" opacity=".5" />
        <path d="M28 84c0-26 6-50 12-70 6 20 12 44 12 70" /><path d="M40 14v70" opacity=".5" />
        <path d="M156 70c0-20 5-38 10-54 5 16 10 34 10 54" /><path d="M166 16v54" opacity=".5" />
        <rect x="62" y="48" width="78" height="38" rx="8" />
        <path d="M62 66h78" /><path d="M96 48v18M118 48v18" />
        <rect x="68" y="53" width="22" height="10" rx="2" /><rect x="102" y="53" width="12" height="10" rx="2" /><rect x="123" y="53" width="12" height="10" rx="2" />
        <circle cx="80" cy="90" r="7" /><circle cx="124" cy="90" r="7" /><circle cx="80" cy="90" r="2" /><circle cx="124" cy="90" r="2" />
        <path d="M140 76h6" />
      </g>
    </svg>
  );
}

/** Laço de fita para a contagem decrescente. */
function Bow() {
  return (
    <svg width="150" height="44" viewBox="0 0 150 44" style={{ color: '#EBCFD6' }} aria-hidden>
      <g {...stroke}>
        <path d="M75 22C60 6 34 2 22 12c-8 8 4 24 22 22 14-2 24-8 31-12" />
        <path d="M75 22C90 6 116 2 128 12c8 8-4 24-22 22-14-2-24-8-31-12" />
        <path d="M75 22c-6 8-12 14-24 20M75 22c6 8 12 14 24 20" />
        <circle cx="75" cy="22" r="4" fill="currentColor" />
        <path d="M30 14c10-2 22 2 32 8M120 14c-10-2-22 2-32 8" opacity=".5" />
      </g>
    </svg>
  );
}

function Sprig() {
  return (
    <svg width="120" height="22" viewBox="0 0 120 22" style={{ color: '#BFA3AB' }} aria-hidden>
      <g {...stroke} strokeWidth="1">
        <path d="M8 11h104" />
        {[26, 40, 54, 66, 80, 94].map((x, i) => <path key={x} d={`M${x} 11c${i % 2 ? '-2 -9 4 -10 6 -10' : '-2 9 4 10 6 10'}`} />)}
        <circle cx="60" cy="11" r="2.4" fill="#F8F0F3" />
      </g>
    </svg>
  );
}

/* ---------- Experiência ---------- */

const AMBIENT_LABEL: Record<string, string> = { 'piano-suave': 'Piano suave', 'chuva-leve': 'Chuva leve', ondas: 'Ondas do mar' };

/** Convite de casamento refinado, montado só com o que o casal preencheu. */
export function Refinado({ data, startOpen = false, embedded = false }: { data: LetterViewData; startOpen?: boolean; embedded?: boolean }) {
  const cat = getCategory(data.category); const x = data.extra || {};
  const d = useMemo(() => derive(cat.slug, x, data.specialDate), [cat.slug, x, data.specialDate]);
  const [envelope, setEnvelope] = useState(!startOpen && !embedded);
  const open = useCallback(() => { setEnvelope(false); window.scrollTo(0, 0); }, []);
  const ref = useReveal(!envelope);
  const [copied, setCopied] = useState(false);
  const target = d.countdown ? `${d.countdown.target}T${d.event?.time || '00:00'}:00` : undefined;
  const cd = useCountdown(target);
  const two = (n: number) => String(n).padStart(2, '0');
  const paragraphs = data.mainMessage.split(/\n{2,}/).filter(Boolean);
  const when = [data.specialDate && longDate(data.specialDate), d.event?.time].filter(Boolean).join(' · ');
  const e = d.event; const mapsOk = !!e?.mapUrl && /^https?:\/\//i.test(e.mapUrl);
  const program = data.memories.map(m => { const { time, rest } = splitTime(m.title); return { time, title: rest, text: m.description }; });
  async function copy() { try { await navigator.clipboard.writeText(e?.gift || ''); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* o texto continua visível */ } }

  return (
    <div ref={ref} className={`rf${embedded ? ' emb' : ''}`} style={{ ['--c-bg' as string]: '#F8F0F3', ['--c-card' as string]: '#FBF7F5', ['--c-accent' as string]: '#5A1E2C', ['--c-soft' as string]: '#F0E3E8', ['--c-ink' as string]: '#3A262D' }}>
      <section className="sec cover">
        <p className="eyebrow rv">{kickerFor(cat, data.recipientName)}</p>
        <div className="rule rv d1"><Sprig /></div>
        {data.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.cover.url} alt={data.cover.alt} className="rv d1 cover-arch" />
        )}
        <h1 className="script rv d1" style={{ fontSize: data.senderName.length > 16 ? 60 : 76 }}>{data.senderName || data.title}</h1>
        {data.senderName && <p className="lede rv d2" style={{ marginTop: 14 }}>{data.title}</p>}
        {when && <p className="eyebrow rv d2" style={{ marginTop: 18 }}>{when}</p>}
        <span className="scroll" aria-hidden />
      </section>

      {(data.ambient || data.audios.length > 0) && (
        <section aria-label="Som" className="sec" style={{ paddingTop: 0, paddingBottom: 24 }}>
          {data.ambient && <AmbientPlayer kind={data.ambient} label={`Ouvir: ${AMBIENT_LABEL[data.ambient] || 'ambiente'}`} />}
          {data.audios.map((a, i) => <div key={i} style={{ marginTop: 12 }}><p className="eyebrow">{a.label}</p><audio controls preload="none" src={a.url} style={{ width: '100%', marginTop: 8 }} /></div>)}
        </section>
      )}

      {(data.intro || paragraphs.length > 0) && (
        <section className="sec" style={{ paddingTop: 24 }}>
          <div className="rv"><Swans /></div>
          {data.intro && <h2 className="t-lg rv d1" style={{ marginTop: 18 }}>{data.intro}</h2>}
          {paragraphs.map((p, i) => <p key={i} className="body rv d2" style={{ marginTop: 22, whiteSpace: 'pre-line' }}>{p}</p>)}
        </section>
      )}

      {d.countdown && (
        <section className="sec dark" style={{ paddingTop: 110 }}>
          <Lace position="top" />
          <div className="rv"><Bow /></div>
          <h2 className="t-lg rv d1" style={{ marginTop: 6 }}>{cd?.over ? 'Obrigado' : 'Contagem decrescente'}</h2>
          {cd?.over ? <p className="body rv d2" style={{ marginTop: 20 }}>{d.countdown.past}</p> : (
            <div className="cd rv d2" role="timer" aria-label="Tempo até ao casamento">
              {([['d', 'Dias'], ['h', 'Horas'], ['m', 'Min'], ['s', 'Seg']] as const).map(([k, l]) => (
                <div key={k}><div className="n">{cd ? two(cd[k]) : '--'}</div><div className="l">{l}</div></div>))}
            </div>)}
        </section>
      )}

      {(e?.venue || e?.address) && (
        <section className="sec" style={{ paddingTop: d.countdown ? 100 : 40 }}>
          {d.countdown && <Lace position="top" />}
          <h2 className="t-lg rv" style={{ marginTop: 14 }}>Local</h2>
          {e?.venue && <p className="script rv d1" style={{ fontSize: e.venue.length > 22 ? 40 : 54, marginTop: 10 }}>{e.venue}</p>}
          {e?.address && <p className="eyebrow rv d1" style={{ marginTop: 8 }}>{e.address}</p>}
          {mapsOk && <a className="btn-o rv d3" style={{ marginTop: 30 }} href={e!.mapUrl} target="_blank" rel="noopener noreferrer nofollow">Ver no mapa</a>}
        </section>
      )}

      {data.photos.length > 0 && (
        <section aria-label="Fotografias" className="sec" style={{ paddingTop: 20, paddingInline: 0 }}>
          <div className="gal">
            {data.photos.map((p, i) => (
              <figure key={i} className="rv">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.alt || p.caption || `Fotografia ${i + 1}`} loading="lazy" />
                {p.caption && <figcaption>{p.caption}</figcaption>}
              </figure>))}
          </div>
        </section>
      )}

      {program.length > 0 && (
        <section className="sec" style={{ paddingTop: 20 }}>
          <h2 className="t-lg rv">{cat.memories.publicTitle === 'Programa' ? 'O dia' : cat.memories.publicTitle}</h2>
          <p className="body rv d1" style={{ marginTop: 14 }}>Um dia para celebrar, do primeiro olá à última dança.</p>
          <ol className="tl" style={{ padding: 0 }}>
            {program.map((p, i) => (
              <li key={i} className="rv"><span className="time">{p.time || '·'}</span><div><h3>{p.title}</h3>{p.text && <p className="body">{p.text}</p>}</div></li>))}
          </ol>
        </section>
      )}

      {e?.dressCode && (
        <section className="sec" style={{ paddingTop: 20 }}>
          <ArchFrame>
            <h2 className="t-lg">Dress code</h2>
            <p className="eyebrow" style={{ marginTop: 14 }}>{e.dressCode}</p>
            <p className="body" style={{ marginTop: 18 }}>Vem a rigor: vai ficar nas fotografias.</p>
          </ArchFrame>
        </section>
      )}

      {x.transport && (
        <section className="sec dark" style={{ paddingTop: 110 }}>
          <Lace position="top" />
          <div className="rv"><Bus /></div>
          <h2 className="t-lg rv d1" style={{ marginTop: 10 }}>Transporte</h2>
          <p className="body rv d2" style={{ marginTop: 22, whiteSpace: 'pre-line' }}>{x.transport}</p>
        </section>
      )}

      {x.stay && (
        <section className="sec" style={{ paddingTop: x.transport ? 100 : 40 }}>
          {x.transport && <Lace position="top" />}
          <h2 className="t-lg rv" style={{ marginTop: 14 }}>Onde ficar</h2>
          <div className="card rv d1"><p className="body" style={{ whiteSpace: 'pre-line', margin: 0 }}>{x.stay}</p></div>
        </section>
      )}

      {data.video && <section aria-label="Vídeo" className="sec" style={{ paddingTop: 20 }}><video controls playsInline preload="metadata" src={data.video.url} style={{ width: '100%', borderRadius: 18, background: '#000' }}>O teu navegador não suporta vídeo.</video></section>}

      {data.closingMessage && (
        <section className="sec" style={{ paddingTop: 20, paddingBottom: 30 }}>
          <p className="script rv" style={{ fontSize: 46 }}>{data.closingMessage}</p>
        </section>
      )}

      {e?.gift && (
        <section className="sec" style={{ paddingTop: 20 }}>
          <h2 className="t-lg rv">Presente</h2>
          <p className="body rv d1" style={{ marginTop: 18, whiteSpace: 'pre-line' }}>{e.gift}</p>
          <button type="button" className="btn-o rv d2" style={{ marginTop: 26 }} onClick={copy}>{copied ? 'Copiado ✓' : 'Copiar dados'}</button>
          <p className="sr-only" aria-live="polite">{copied ? 'Dados copiados.' : ''}</p>
        </section>
      )}

      {data.rsvp && (
        <section className="sec" style={{ paddingTop: 20, paddingBottom: 40, textAlign: 'left' }}>
          {data.rsvp.open && <p className="body" style={{ textAlign: 'center', marginBottom: 16 }}>Este convite é pessoal e intransmissível. Confirma só a tua presença e a de quem vem contigo.</p>}
          <RsvpForm token={data.replyToken || ''} open={data.rsvp.open} reason={data.rsvp.reason} deadline={e?.rsvpDeadline} demo={data.demo} />
        </section>
      )}
      {!data.rsvp && data.allowReply && data.replyToken && <section className="sec" style={{ paddingTop: 0, textAlign: 'left' }}><ReplyForm token={data.replyToken} /></section>}

      <footer className="sec" style={{ paddingTop: 10, paddingBottom: 48 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark.png" alt="" width={28} height={30} style={{ height: 28, width: 'auto', margin: '0 auto 6px', opacity: .8 }} />
        <p className="eyebrow" style={{ letterSpacing: '.2em' }}>Criado com Carta QR</p>
      </footer>

      {envelope && <Envelope kicker={kickerFor(cat, data.recipientName)} initials={sealInitials(data.senderName || data.recipientName)} hint="Toca no selo para abrir o convite" onOpened={open} />}
    </div>
  );
}
