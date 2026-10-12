'use client';
import { useEffect, useRef, useState } from 'react';

/** Um círculo dourado que se raspa com o dedo (ou o rato) para revelar o que está por baixo. */
function ScratchDisc({ value, label, revealed, onDone }: { value: string; label: string; revealed: boolean; onDone: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false); const last = useRef<{ x: number; y: number } | null>(null); const moves = useRef(0);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    const c = canvas.current; if (!c) return;
    const size = c.clientWidth; const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = size * dpr; c.height = size * dpr;
    const ctx = c.getContext('2d'); if (!ctx) return;
    ctx.scale(dpr, dpr);
    const g = ctx.createRadialGradient(size * .35, size * .3, size * .05, size * .5, size * .5, size * .6);
    g.addColorStop(0, '#F3E1AE'); g.addColorStop(.45, '#D2AE5F'); g.addColorStop(1, '#8F6B27');
    ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
    // Brilho granulado, como uma raspadinha
    for (let i = 0; i < size * 6; i++) {
      ctx.fillStyle = Math.random() > .5 ? 'rgba(255,248,220,.55)' : 'rgba(110,80,25,.35)';
      ctx.fillRect(Math.random() * size, Math.random() * size, 1.2, 1.2);
    }
  }, []);

  useEffect(() => { if (revealed) setCleared(true); }, [revealed]);

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function scratch(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || cleared) return;
    const ctx = canvas.current?.getContext('2d'); if (!ctx) return;
    const p = point(e); const from = last.current || p;
    ctx.globalCompositeOperation = 'destination-out'; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 26;
    ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    last.current = p;
    if (++moves.current % 8 === 0) check();
  }
  function check() {
    const c = canvas.current; const ctx = c?.getContext('2d'); if (!c || !ctx) return;
    const data = ctx.getImageData(0, 0, c.width, c.height).data; let clear = 0; let total = 0;
    for (let i = 3; i < data.length; i += 64) { total++; if (data[i] === 0) clear++; }
    if (clear / total > 0.42) { setCleared(true); onDone(); }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[92px] w-[92px] sm:h-[104px] sm:w-[104px]">
        <div className="absolute inset-0 flex items-center justify-center rounded-full border border-[var(--c-accent)]/30 bg-[var(--c-card)]">
          <span className="h-display text-[26px] font-semibold text-[var(--c-accent)] sm:text-[30px]">{value}</span>
        </div>
        <canvas ref={canvas} aria-hidden
          className={`absolute inset-0 h-full w-full touch-none rounded-full shadow-[0_8px_18px_-8px_rgba(0,0,0,.45)] transition-opacity duration-700 ${cleared ? 'pointer-events-none opacity-0' : 'cursor-grab'}`}
          onPointerDown={e => { drawing.current = true; last.current = point(e); e.currentTarget.setPointerCapture(e.pointerId); scratch(e); }}
          onPointerMove={scratch}
          onPointerUp={() => { drawing.current = false; last.current = null; check(); }}
          onPointerCancel={() => { drawing.current = false; last.current = null; }} />
      </div>
      <span className="mt-2 text-[11px] uppercase tracking-[.22em] opacity-60">{label}</span>
    </div>
  );
}

/** "Raspa para descobrir a data": dia, mês e ano escondidos em três círculos dourados. */
export function ScratchDate({ date, onReveal }: { date: string; onReveal: () => void }) {
  const [done, setDone] = useState<boolean[]>([false, false, false]);
  const [all, setAll] = useState(false);
  const d = new Date(date + 'T12:00:00Z');
  const parts = [
    { value: String(d.getUTCDate()), label: 'Dia' },
    { value: new Intl.DateTimeFormat('pt-PT', { month: 'short', timeZone: 'UTC' }).format(d).replace('.', ''), label: 'Mês' },
    { value: String(d.getUTCFullYear()), label: 'Ano' },
  ];
  const full = new Intl.DateTimeFormat('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);
  const revealed = all || done.every(Boolean);

  useEffect(() => { if (revealed) onReveal(); }, [revealed, onReveal]);

  return (
    <section aria-labelledby="scratch-t" className="reveal mb-10 text-center">
      <h2 id="scratch-t" className="font-script text-[40px] leading-tight text-[var(--c-accent)]">Guarda a data</h2>
      <p className="mt-1 text-[11px] uppercase tracking-[.25em] opacity-70">{revealed ? full : 'Raspa os círculos para descobrir'}</p>
      <div className="mt-6 flex justify-center gap-3 sm:gap-5">
        {parts.map((p, i) => (
          <ScratchDisc key={p.label} value={p.value} label={p.label} revealed={all}
            onDone={() => setDone(prev => prev.map((v, j) => (j === i ? true : v)))} />
        ))}
      </div>
      {!revealed && <button type="button" onClick={() => setAll(true)} className="mt-5 text-sm underline underline-offset-4 opacity-70 hover:opacity-100">Revelar a data sem raspar</button>}
      <p className="sr-only" aria-live="polite">{revealed ? `A data é ${full}.` : ''}</p>
    </section>
  );
}
