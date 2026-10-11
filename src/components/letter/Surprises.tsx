'use client';
import { useEffect, useRef, useState } from 'react';
import { celebrate, type BurstKind } from './Celebration';
import { songEmbed, type Gesture } from '@/lib/experience';

const accentBtn = { background: 'var(--c-accent)', color: 'var(--c-bg)' } as const;
const fmt = (d: string) => new Intl.DateTimeFormat('pt-PT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(d + 'T12:00:00Z'));

async function post(url: string, body: unknown): Promise<{ ok: boolean; error?: string; [k: string]: unknown }> {
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return (await r.json().catch(() => null)) || { ok: false, error: 'Não foi possível enviar.' };
  } catch { return { ok: false, error: 'Sem ligação à internet. Tenta novamente.' }; }
}

/* ---------- Cartões para virar ---------- */
export function FlipCards({ title, items, burst }: { title: string; items: string[]; burst: BurstKind }) {
  const [open, setOpen] = useState<boolean[]>(() => items.map(() => false));
  const count = open.filter(Boolean).length;
  const flip = (i: number) => setOpen(o => {
    if (o[i]) return o;
    const n = o.map((v, j) => (j === i ? true : v));
    if (n.every(Boolean)) setTimeout(() => celebrate(burst), 450);
    return n;
  });
  return (
    <section aria-label={title} className="reveal mt-12">
      <h2 className="h-display text-center text-2xl text-[var(--c-accent)]">{title}</h2>
      <p className="mt-1 text-center text-sm opacity-70" aria-live="polite">{count === items.length ? 'Descobriste tudo ✨' : `Toca nos cartões para os virar · ${count} de ${items.length}`}</p>
      <ul className="mt-5 grid grid-cols-2 gap-3">
        {items.map((t, i) => (
          <li key={i} className={`flip-card ${open[i] ? 'is-flipped' : ''} ${items.length % 2 && i === items.length - 1 ? 'col-span-2' : ''}`}>
            <button type="button" onClick={() => flip(i)} className="flip-inner" aria-label={open[i] ? t : `Virar o cartão ${i + 1}`} aria-pressed={open[i]}>
              <span className="flip-face flip-front"><span className="h-display text-3xl">{i + 1}</span><span className="mt-1 text-[11px] uppercase tracking-[.2em] opacity-80">Toca para virar</span></span>
              <span className="flip-face flip-back"><span className="h-display text-[1.02rem] leading-snug">{t}</span></span>
            </button>
          </li>))}
      </ul>
    </section>
  );
}

/* ---------- Vales-presente ---------- */
export function Vouchers({ items, sender, token, demo }: { items: string[]; sender: string; token?: string; demo?: boolean }) {
  const [done, setDone] = useState<Record<number, boolean>>({}); const [busy, setBusy] = useState<number | null>(null); const [err, setErr] = useState('');
  async function redeem(i: number) {
    setErr('');
    if (demo || !token) { setDone(d => ({ ...d, [i]: true })); celebrate('gold'); return; }
    setBusy(i); const r = await post(`/api/carta/${token}/reply`, { kind: 'voucher', message: items[i] }); setBusy(null);
    if (r.ok) { setDone(d => ({ ...d, [i]: true })); celebrate('gold'); } else setErr(r.error || 'Não foi possível resgatar.');
  }
  return (
    <section aria-label="Vales-presente" className="reveal mt-12">
      <h2 className="h-display text-center text-2xl text-[var(--c-accent)]">Vales só para ti</h2>
      <p className="mt-1 text-center text-sm opacity-70">Resgata quando quiseres{sender ? `: ${sender} recebe o aviso` : ''}.</p>
      <ul className="mt-5 space-y-3">
        {items.map((v, i) => (
          <li key={i} className={`ticket ${done[i] ? 'is-used' : ''}`}>
            <div className="min-w-0 flex-1"><p className="text-[10px] font-semibold uppercase tracking-[.25em] opacity-60">Vale nº {i + 1}</p><p className="h-display mt-0.5 text-lg leading-snug">{v}</p></div>
            {done[i] ? <span className="ticket-stamp" role="status">Resgatado ✓</span>
              : <button type="button" className="btn btn-sm shrink-0" style={accentBtn} onClick={() => redeem(i)} disabled={busy !== null}>{busy === i ? '…' : 'Resgatar'}</button>}
          </li>))}
      </ul>
      {err && <p role="alert" className="mt-2 text-center text-sm font-semibold text-red-600">{err}</p>}
      {demo && Object.keys(done).length > 0 && <p className="mt-2 text-center text-xs opacity-60">(Exemplo: nada foi enviado.)</p>}
    </section>
  );
}

/* ---------- Detalhe secreto ---------- */
export function Secret({ hint, demoMessage, token, demo, burst }: { hint: string; demoMessage?: string; token?: string; demo?: boolean; burst: BurstKind }) {
  const [answer, setAnswer] = useState(''); const [msg, setMsg] = useState<string | null>(null); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const [shake, setShake] = useState(false);
  async function unlock(e: React.FormEvent) {
    e.preventDefault(); setErr(''); if (!answer.trim()) return;
    if (demo || !token) { setMsg(demoMessage || 'Aqui aparece a mensagem secreta.'); celebrate(burst); return; }
    setBusy(true); const r = await post(`/api/carta/${token}/secret`, { answer }); setBusy(false);
    if (r.ok) { setMsg(String(r.message)); celebrate(burst); }
    else { setErr(r.error || 'Ainda não é essa… tenta outra vez.'); setShake(true); setTimeout(() => setShake(false), 500); }
  }
  return (
    <section aria-label="Detalhe secreto" className="reveal mt-12">
      <div className={`secret-card ${msg ? 'is-open' : ''} ${shake ? 'shake' : ''}`}>
        <p className="text-3xl" aria-hidden>{msg ? '🔓' : '🔒'}</p>
        <h2 className="h-display mt-1 text-xl">{msg ? 'Desbloqueaste o segredo' : 'Há um segredo só para ti'}</h2>
        {msg ? <p className="h-display letter-text mt-4 whitespace-pre-line text-lg leading-8">{msg}</p> : (
          <form onSubmit={unlock} className="mt-3">
            <p className="text-sm opacity-85">{hint}</p>
            <label className="sr-only" htmlFor="secret-a">A tua resposta</label>
            <input id="secret-a" className="field mt-3 text-center" value={answer} onChange={e => setAnswer(e.target.value)} maxLength={80} autoComplete="off" placeholder="A tua resposta" />
            {err && <p role="alert" className="mt-2 text-sm font-semibold">{err}</p>}
            <button className="btn mt-3 w-full" style={accentBtn} disabled={busy}>{busy ? 'A verificar…' : 'Desbloquear'}</button>
            {demo && <p className="mt-2 text-xs opacity-60">(Exemplo: qualquer resposta desbloqueia.)</p>}
          </form>)}
      </div>
    </section>
  );
}

/* ---------- Surpresa para mais tarde ---------- */
export function Later({ date, message, open }: { date: string; message?: string; open: boolean }) {
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => { const t = new Date(date + 'T00:00:00'); const n = new Date(); n.setHours(0, 0, 0, 0); setDays(Math.round((t.getTime() - n.getTime()) / 86400000)); }, [date]);
  return (
    <section aria-label="Surpresa para mais tarde" className="reveal mt-12">
      <div className="later-card">
        {open && message ? <>
          <p className="text-xs font-semibold uppercase tracking-[.25em] opacity-70">Guardada para {fmt(date)}</p>
          <h2 className="h-display mt-1 text-xl text-[var(--c-accent)]">A surpresa que estava guardada</h2>
          <p className="h-display letter-text mt-3 whitespace-pre-line text-lg leading-8">{message}</p>
        </> : <>
          <p className="text-3xl" aria-hidden>⏳</p>
          <h2 className="h-display mt-1 text-xl text-[var(--c-accent)]">A carta ainda não acabou</h2>
          <p className="mt-2 opacity-85">Há mais uma surpresa guardada que só abre a <strong>{fmt(date)}</strong>{days !== null && days > 0 ? ` (daqui a ${days} ${days === 1 ? 'dia' : 'dias'})` : ''}.</p>
          <p className="mt-1 text-sm opacity-65">Volta a este link nesse dia.</p>
        </>}
      </div>
    </section>
  );
}

/* ---------- A nossa música ---------- */
export function Song({ url }: { url: string }) {
  const [play, setPlay] = useState(false); const e = songEmbed(url);
  if (!e) return null;
  return (
    <section aria-label="A nossa música" className="reveal mt-12 text-center">
      <h2 className="h-display text-2xl text-[var(--c-accent)]">A nossa música</h2>
      {!play ? <button type="button" className="song-btn mt-4" onClick={() => setPlay(true)}><span className="song-disc" aria-hidden>♪</span><span className="text-left"><span className="block font-semibold">Tocar a nossa música</span><span className="block text-xs opacity-70">{e.kind === 'youtube' ? 'YouTube' : 'Spotify'} · usa dados móveis</span></span></button>
        : <div className="mt-4 overflow-hidden rounded-xl2 shadow-soft"><iframe title="A nossa música" src={e.kind === 'youtube' ? `${e.src}&autoplay=1` : e.src} className={`w-full ${e.kind === 'youtube' ? 'aspect-video' : 'h-[152px]'}`} allow="autoplay; encrypted-media; picture-in-picture" loading="lazy" /></div>}
    </section>
  );
}

/* ---------- Surpresa final (um gesto físico) ---------- */
export function Finale({ text, gesture, burst }: { text: string; gesture: Gesture; burst: BurstKind }) {
  const [revealed, setRevealed] = useState(false);
  const done = () => { if (!revealed) { setRevealed(true); celebrate(burst); try { navigator.vibrate?.([20, 40, 20]); } catch { /* */ } } };
  return (
    <section aria-label="Surpresa final" className="reveal mt-14 text-center">
      <h2 className="h-display text-2xl text-[var(--c-accent)]">{revealed ? 'Para ti' : 'Uma última surpresa'}</h2>
      <p className="mt-1 text-sm opacity-70">{revealed ? '' : gesture === 'raspar' ? 'Raspa com o dedo' : gesture === 'caixa' ? 'Toca na caixa para a abrir' : 'Arrasta a fita para desatar o laço'}</p>
      <div className="mt-5">
        {gesture === 'raspar' && <Scratch text={text} onDone={done} revealed={revealed} />}
        {gesture === 'caixa' && <GiftBox text={text} onDone={done} revealed={revealed} />}
        {gesture === 'fita' && <Ribbon text={text} onDone={done} revealed={revealed} />}
      </div>
    </section>
  );
}

function Hidden({ text, show }: { text: string; show: boolean }) {
  return <p className={`h-display letter-text px-4 text-2xl leading-snug text-[var(--c-accent)] transition-all duration-700 ${show ? 'opacity-100' : 'opacity-0'}`}>{text}</p>;
}

function Scratch({ text, onDone, revealed }: { text: string; onDone: () => void; revealed: boolean }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const cb = useRef(onDone); cb.current = onDone;
  useEffect(() => {
    const c = cv.current; if (!c) return; const ctx = c.getContext('2d'); if (!ctx) return;
    const r = c.getBoundingClientRect(); const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = r.width * dpr; c.height = r.height * dpr;
    const g = ctx.createLinearGradient(0, 0, c.width, c.height); g.addColorStop(0, '#C9A45C'); g.addColorStop(0.5, '#F3D9A4'); g.addColorStop(1, '#B8862F');
    ctx.fillStyle = g; ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = 'rgba(80,50,10,.55)'; ctx.font = `${15 * dpr}px Georgia, serif`; ctx.textAlign = 'center';
    ctx.fillText('✦  Raspa aqui  ✦', c.width / 2, c.height / 2 + 5 * dpr);
    ctx.globalCompositeOperation = 'destination-out';
    let down = false; let moves = 0;
    const at = (e: PointerEvent) => { const b = c.getBoundingClientRect(); return [(e.clientX - b.left) * dpr, (e.clientY - b.top) * dpr]; };
    const scratch = (e: PointerEvent) => {
      const [x, y] = at(e); ctx.beginPath(); ctx.arc(x, y, 22 * dpr, 0, Math.PI * 2); ctx.fill();
      if (++moves % 12 === 0) {
        const d = ctx.getImageData(0, 0, c.width, c.height).data; let clear = 0;
        for (let i = 3; i < d.length; i += 64) if (d[i] === 0) clear++;
        if (clear / (d.length / 64) > 0.45) { c.style.transition = 'opacity .6s'; c.style.opacity = '0'; c.style.pointerEvents = 'none'; cb.current(); }
      }
    };
    const pd = (e: PointerEvent) => { down = true; c.setPointerCapture(e.pointerId); scratch(e); };
    const pm = (e: PointerEvent) => { if (down) scratch(e); };
    const pu = () => { down = false; };
    c.addEventListener('pointerdown', pd); c.addEventListener('pointermove', pm); c.addEventListener('pointerup', pu); c.addEventListener('pointercancel', pu);
    return () => { c.removeEventListener('pointerdown', pd); c.removeEventListener('pointermove', pm); c.removeEventListener('pointerup', pu); c.removeEventListener('pointercancel', pu); };
  }, []);
  return (
    <div className="relative mx-auto flex min-h-[150px] max-w-sm items-center justify-center overflow-hidden rounded-xl2 bg-[var(--c-card)] shadow-soft">
      <Hidden text={text} show />
      <canvas ref={cv} className="no-print absolute inset-0 h-full w-full touch-none" aria-hidden style={revealed ? { opacity: 0, pointerEvents: 'none' } : undefined} />
      {!revealed && <button type="button" className="sr-only" onClick={onDone}>Revelar a surpresa</button>}
    </div>
  );
}

function GiftBox({ text, onDone, revealed }: { text: string; onDone: () => void; revealed: boolean }) {
  const [taps, setTaps] = useState(0);
  const tap = () => { if (revealed) return; const n = taps + 1; setTaps(n); if (n >= 3) setTimeout(onDone, 350); };
  return (
    <div className="mx-auto max-w-sm">
      {!revealed ? (
        <button type="button" onClick={tap} className={`gift ${taps > 0 ? 'wiggle' : ''}`} key={taps} aria-label={`Abrir a caixa (${3 - taps} toques)`}>
          <span className="gift-lid" /><span className="gift-box" /><span className="gift-ribbon-v" /><span className="gift-bow">🎀</span>
        </button>
      ) : <div className="gift-open rounded-xl2 bg-[var(--c-card)] py-8 shadow-soft"><Hidden text={text} show /></div>}
      {!revealed && <p className="mt-3 text-xs opacity-60">{taps === 0 ? '3 toques' : taps === 1 ? 'Mais 2…' : 'Só mais 1!'}</p>}
    </div>
  );
}

function Ribbon({ text, onDone, revealed }: { text: string; onDone: () => void; revealed: boolean }) {
  const [v, setV] = useState(0);
  return (
    <div className="mx-auto max-w-sm">
      <div className="relative overflow-hidden rounded-xl2 bg-[var(--c-card)] py-10 shadow-soft">
        <Hidden text={text} show={revealed} />
        {!revealed && <div className="ribbon-band" style={{ transform: `translateX(${v}%)`, opacity: 1 - v / 140 }} aria-hidden><span className="ribbon-bow">🎀</span></div>}
      </div>
      {!revealed && <label className="mt-4 block"><span className="sr-only">Puxa a fita</span>
        <input type="range" min={0} max={100} value={v} className="ribbon-pull w-full" onChange={e => { const n = Number(e.target.value); setV(n); if (n >= 96) onDone(); }} /></label>}
    </div>
  );
}
