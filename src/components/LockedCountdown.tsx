'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

/** Ecrã de espera de uma carta com entrega agendada: contagem decrescente e abre sozinha à hora marcada. */
export function LockedCountdown({ unlockAt, label, opensAt }: { unlockAt: string; label: string; opensAt: string }) {
  const target = new Date(unlockAt).getTime();
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => { const l = target - Date.now(); setLeft(l); if (l <= 0) window.location.reload(); };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, [target]);
  const s = Math.max(0, Math.floor((left ?? 0) / 1000));
  const parts: [number, string][] = [[Math.floor(s / 86400), 'dias'], [Math.floor((s % 86400) / 3600), 'horas'], [Math.floor((s % 3600) / 60), 'min'], [s % 60, 'seg']];
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-5 py-10">
      <div className="card w-full max-w-md p-8 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark.png" alt="" width={56} height={66} className="mx-auto mb-3 h-16 w-auto" />
        <p className="text-[11px] uppercase tracking-[.3em] text-gold-deep">{label}</p>
        <h1 className="h-display mt-2 text-3xl font-semibold text-wine">Uma surpresa está a caminho</h1>
        <p className="mt-2 text-muted">Ainda não é a hora. Volta em:</p>
        <div className="mt-5 grid grid-cols-4 gap-2" role="timer" aria-live="off" aria-label="Tempo até a surpresa abrir">
          {parts.map(([n, l]) => (<div key={l} className="rounded-xl bg-rose-soft/60 py-3"><div className="h-display text-3xl font-semibold text-wine tabular-nums">{left === null ? '–' : String(n).padStart(2, '0')}</div><div className="text-xs text-muted">{l}</div></div>))}
        </div>
        <p className="mt-5 text-sm text-muted">Abre a {opensAt}.</p>
        <p className="mt-1 text-xs text-muted">Esta página abre sozinha à hora marcada.</p>
        <Link href="/" className="btn btn-ghost btn-sm mt-5">Conhecer a Carta QR</Link>
      </div>
    </main>
  );
}
