'use client';
import { useEffect, useState } from 'react';

/** Introdução cinematográfica + envelope com selo de cera. Chama onOpen quando a carta sai do envelope. */
export function Intro({ teaser, recipientName, glyph, label, isEvent, onOpen }: {
  teaser?: string; recipientName: string; glyph: string; label: string; isEvent: boolean; onOpen: () => void;
}) {
  const [phase, setPhase] = useState<'dark' | 'envelope' | 'opening'>('dark');
  useEffect(() => { const t = setTimeout(() => setPhase(p => (p === 'dark' ? 'envelope' : p)), 3200); return () => clearTimeout(t); }, []);
  const line = teaser?.trim() || (isEvent ? 'Tens um convite especial à tua espera…' : 'Alguém preparou algo especial para ti…');

  function open() {
    if (phase === 'opening') return;
    setPhase('opening');
    try { navigator.vibrate?.(30); } catch { /* sem vibração */ }
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    setTimeout(onOpen, reduce ? 50 : 1900);
  }

  return (
    <div className={`intro-stage fixed inset-0 z-[65] flex flex-col items-center justify-center overflow-hidden px-6 text-center ${phase === 'opening' ? 'intro-leaving' : ''}`}
      onClick={() => phase === 'dark' && setPhase('envelope')} role="dialog" aria-label="Abertura da carta">
      <div className="intro-dust" aria-hidden>{Array.from({ length: 22 }, (_, i) => <span key={i} style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, animationDelay: `${(i % 7) * 0.7}s`, width: 2 + (i % 4), height: 2 + (i % 4) }} />)}</div>

      <div className={`relative z-10 transition-all duration-1000 ${phase === 'dark' ? 'translate-y-0' : '-translate-y-2'}`}>
        {recipientName && <p className="intro-line mb-3 text-xs uppercase tracking-[.35em] text-[#E9D3A1]/80" style={{ animationDelay: '.2s' }}>{label}</p>}
        <p className="intro-line h-display max-w-xs text-2xl leading-snug text-[#FFF5E6] sm:text-3xl" style={{ animationDelay: '.6s' }}>{line}</p>
      </div>

      <div className={`envelope-wrap relative z-10 mt-10 ${phase === 'dark' ? 'envelope-hidden' : 'envelope-shown'} ${phase === 'opening' ? 'is-open' : ''}`}>
        <div className="envelope" aria-hidden>
          <div className="env-back" />
          <div className="env-letter"><span className="h-display">{glyph}</span><span className="text-[10px] uppercase tracking-[.25em]">{recipientName ? `Para ${recipientName}` : 'Para ti'}</span></div>
          <div className="env-front" />
          <div className="env-flap" />
        </div>
        <button type="button" onClick={e => { e.stopPropagation(); open(); }} className="wax-seal" aria-label={isEvent ? 'Abrir o convite' : 'Abrir a carta'} disabled={phase === 'dark'}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="" width={34} height={36} />
        </button>
      </div>
      <p className={`relative z-10 mt-8 text-sm text-[#F3E6CF]/80 transition-opacity duration-700 ${phase === 'envelope' ? 'opacity-100 seal-hint' : 'opacity-0'}`} aria-live="polite">
        Toca no selo para abrir
      </p>
      {phase === 'dark' && <p className="absolute bottom-8 z-10 text-xs text-white/40">Toca no ecrã para continuar</p>}
    </div>
  );
}
