'use client';
import { useEffect, useId, useRef, useState } from 'react';
import './refined.css';

export type RefinedData = {
  names: string; dateISO: string; dateLabel: string; kicker: string; welcome: string; story: string;
  place: string; placeSub: string; placeText: string; mapUrl?: string;
  program: { time: string; title: string; text: string }[];
  dressCode: { title: string; text: string };
  transport: { text: string; pickup?: string };
  stay: { name: string; dates: string; code: string; parking: string; text: string; url?: string };
  gift: { text: string; iban: string };
};

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

/* ---------- Comportamento ---------- */

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const els = ref.current?.querySelectorAll('.rv'); if (!els) return;
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.15 });
    els.forEach(e => io.observe(e));
    return () => io.disconnect();
  }, []);
  return ref;
}

function useCountdown(iso: string) {
  const [t, setT] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  useEffect(() => {
    const tick = () => {
      const ms = Math.max(0, new Date(iso).getTime() - Date.now()); const s = Math.floor(ms / 1000);
      setT({ d: Math.floor(s / 86400), h: Math.floor(s / 3600) % 24, m: Math.floor(s / 60) % 60, s: s % 60 });
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, [iso]);
  return t;
}

export function RefinedInvitation({ data }: { data: RefinedData }) {
  const ref = useReveal(); const cd = useCountdown(data.dateISO); const [copied, setCopied] = useState(false);
  async function copy() { try { await navigator.clipboard.writeText(data.gift.iban); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* o IBAN continua visível */ } }
  const two = (n: number) => String(n).padStart(2, '0');
  return (
    <div ref={ref} className="rf">
      <section className="sec cover">
        <p className="eyebrow rv">{data.kicker}</p>
        <div className="rule rv d1"><Sprig /></div>
        <h1 className="script rv d1" style={{ fontSize: 76 }}>{data.names}</h1>
        <p className="lede rv d2" style={{ marginTop: 18 }}>{data.dateLabel}</p>
        <span className="scroll" aria-hidden />
      </section>

      <section className="sec" style={{ paddingTop: 24 }}>
        <div className="rv"><Swans /></div>
        <h2 className="t-lg rv d1" style={{ marginTop: 18 }}>{data.welcome}</h2>
        <p className="body rv d2" style={{ marginTop: 22 }}>{data.story}</p>
      </section>

      <section className="sec dark" style={{ paddingTop: 110 }}>
        <Lace position="top" />
        <div className="rv"><Bow /></div>
        <h2 className="t-lg rv d1" style={{ marginTop: 6 }}>Contagem decrescente</h2>
        <div className="cd rv d2" role="timer" aria-label="Tempo até ao casamento">
          {([['d', 'Dias'], ['h', 'Horas'], ['m', 'Min'], ['s', 'Seg']] as const).map(([k, l]) => (
            <div key={k}><div className="n">{cd ? two(cd[k]) : '--'}</div><div className="l">{l}</div></div>))}
        </div>
      </section>

      <section className="sec" style={{ paddingTop: 100 }}>
        <Lace position="top" />
        <h2 className="t-lg rv" style={{ marginTop: 14 }}>Local</h2>
        <p className="script rv d1" style={{ fontSize: 54, marginTop: 10 }}>{data.place}</p>
        <p className="eyebrow rv d1" style={{ marginTop: 6 }}>{data.placeSub}</p>
        <p className="body rv d2" style={{ marginTop: 26 }}>{data.placeText}</p>
        {data.mapUrl && <a className="btn-o rv d3" style={{ marginTop: 30 }} href={data.mapUrl} target="_blank" rel="noopener noreferrer">Ver mapa</a>}
      </section>

      <section className="sec" style={{ paddingTop: 20 }}>
        <h2 className="t-lg rv">O dia</h2>
        <p className="body rv d1" style={{ marginTop: 14 }}>Um dia para celebrar, do primeiro olá à última dança.</p>
        <ol className="tl" style={{ padding: 0 }}>
          {data.program.map(p => (
            <li key={p.time} className="rv"><span className="time">{p.time}</span><div><h3>{p.title}</h3><p className="body">{p.text}</p></div></li>))}
        </ol>
      </section>

      <section className="sec" style={{ paddingTop: 20 }}>
        <ArchFrame>
          <h2 className="t-lg">{data.dressCode.title}</h2>
          <p className="eyebrow" style={{ marginTop: 14 }}>Traje formal</p>
          <p className="body" style={{ marginTop: 18, fontSize: 12.5 }}>{data.dressCode.text}</p>
        </ArchFrame>
      </section>

      <section className="sec dark" style={{ paddingTop: 110 }}>
        <Lace position="top" />
        <div className="rv"><Bus /></div>
        <h2 className="t-lg rv d1" style={{ marginTop: 10 }}>Transporte</h2>
        <p className="body rv d2" style={{ marginTop: 22 }}>{data.transport.text}</p>
        {data.transport.pickup && <a className="btn-o rv d3" style={{ marginTop: 30 }} href={data.transport.pickup} target="_blank" rel="noopener noreferrer">Ponto de recolha</a>}
      </section>

      <section className="sec" style={{ paddingTop: 100 }}>
        <Lace position="top" />
        <h2 className="t-lg rv" style={{ marginTop: 14 }}>Onde ficar</h2>
        <p className="body rv d1" style={{ marginTop: 16 }}>{data.stay.text}</p>
        <div className="card rv d2">
          <h3 style={{ fontSize: 30 }}>{data.stay.name}</h3>
          <p className="kv" style={{ marginTop: 18 }}>Estadia recomendada<b>{data.stay.dates}</b><br />Tarifa convidados<b>{data.stay.code}</b><br />Estacionamento<b>{data.stay.parking}</b></p>
          {data.stay.url && <a className="btn-o" style={{ marginTop: 24 }} href={data.stay.url} target="_blank" rel="noopener noreferrer">Reservar</a>}
        </div>
      </section>

      <section className="sec" style={{ paddingTop: 20, paddingBottom: 110 }}>
        <h2 className="t-lg rv">Presente</h2>
        <p className="script rv d1" style={{ fontSize: 46, marginTop: 14 }}>A vossa presença é o presente</p>
        <p className="body rv d2" style={{ marginTop: 20 }}>{data.gift.text}</p>
        <p className="eyebrow rv d2" style={{ marginTop: 22, letterSpacing: '.12em' }}>{data.gift.iban}</p>
        <button type="button" className="btn-o rv d3" style={{ marginTop: 26 }} onClick={copy}>{copied ? 'Copiado ✓' : 'Copiar IBAN'}</button>
        <p className="sr-only" aria-live="polite">{copied ? 'IBAN copiado.' : ''}</p>
      </section>
    </div>
  );
}
