'use client';
import { useEffect, useRef, useState } from 'react';

/** Iniciais para o selo: "Marta & Rui" → "M&R"; "Bruno Silva" → "B". */
export function sealInitials(name: string): string {
  const parts = name.split(/\s*(?:&|\+|\be\b)\s*/i).map(p => p.trim()).filter(Boolean).slice(0, 2);
  const letters = parts.map(p => p[0]?.toUpperCase() || '').filter(Boolean);
  if (!letters.length) return '♡';
  return letters.join(letters.length > 1 ? '&' : '');
}

/**
 * Ecrã de abertura: um envelope fechado com selo de cera dourado.
 * Ao tocar, a aba abre, a carta sobe e o ecrã desvanece para a carta.
 */
export function Envelope({ kicker, initials, hint, onOpened }: { kicker: string; initials: string; hint: string; onOpened: () => void }) {
  const [state, setState] = useState<'closed' | 'opening' | 'leaving'>('closed');

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  function open() {
    if (state !== 'closed') return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    setState('opening');
    timers.current.push(setTimeout(() => setState('leaving'), reduce ? 0 : 50));
    timers.current.push(setTimeout(onOpened, reduce ? 0 : 1900));
  }

  useEffect(() => {
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const isOpen = state !== 'closed';
  return (
    <div className={`env-overlay fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--c-bg)] px-6 text-center ${state === 'leaving' ? 'leaving' : ''}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_45%,var(--c-soft),transparent)] opacity-80" aria-hidden />
      <p className="relative mb-10 text-sm uppercase tracking-[.28em] opacity-70">{kicker}</p>

      <button type="button" onClick={open} disabled={isOpen} aria-label={hint}
        className={`env relative w-[min(84vw,360px)] cursor-pointer select-none focus-visible:outline-offset-8 ${isOpen ? 'open' : ''}`} style={{ aspectRatio: '3 / 2' }}>
        {/* Corpo do envelope (parte de trás) */}
        <span className="absolute inset-0 z-0 rounded-[10px] bg-[var(--c-soft)] shadow-[0_30px_60px_-25px_rgba(0,0,0,.45)]" aria-hidden />
        {/* Carta dentro do envelope */}
        <span className="env-letter absolute inset-x-[7%] bottom-[6%] top-[10%] z-[2] rounded-md bg-[var(--c-card)] shadow-md" aria-hidden>
          <span className="mx-auto mt-[14%] block h-1 w-1/2 rounded-full bg-[var(--c-accent)] opacity-25" />
          <span className="mx-auto mt-2 block h-1 w-2/5 rounded-full bg-[var(--c-accent)] opacity-20" />
        </span>
        {/* Bolso da frente */}
        <span className="absolute inset-0 z-[3] rounded-[10px] bg-[var(--c-soft)] brightness-[.97]" style={{ clipPath: 'polygon(0 0, 50% 56%, 100% 0, 100% 100%, 0 100%)', backgroundImage: 'linear-gradient(to top, rgba(0,0,0,.05), rgba(255,255,255,.06))' }} aria-hidden />
        <span className="absolute inset-0 z-[3] rounded-[10px]" style={{ clipPath: 'polygon(0 100%, 50% 50%, 100% 100%)', background: 'linear-gradient(to top, rgba(0,0,0,.06), transparent)' }} aria-hidden />
        {/* Aba */}
        <span className="env-flap absolute inset-x-0 top-0 h-[58%]" style={{ zIndex: isOpen ? 1 : 5 }} aria-hidden>
          <span className="absolute inset-0 bg-[var(--c-soft)] brightness-[.93]" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)', borderRadius: '10px 10px 0 0', backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,.10), rgba(0,0,0,.06))' }} />
        </span>
        {/* Selo de cera */}
        <span className={`env-seal absolute left-1/2 top-[56%] z-[6] flex h-[86px] w-[86px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full ${isOpen ? '' : 'env-seal-pulse'}`}
          style={{ background: 'radial-gradient(circle at 35% 30%, #F1DCA5 0%, #D4AF62 38%, #A57E33 72%, #7E5D21 100%)' }} aria-hidden>
          <span className="absolute inset-[7px] rounded-full border border-[#7E5D21]/40" />
          <span className="font-script text-[34px] leading-none text-[#5E4416] [text-shadow:0_1px_0_rgba(255,240,200,.6)]">{initials}</span>
        </span>
      </button>

      <p className={`relative mt-12 text-[15px] transition-opacity duration-300 ${isOpen ? 'opacity-0' : 'opacity-80'}`}>{hint}</p>
    </div>
  );
}
