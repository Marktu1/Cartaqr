'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { NewsletterForm } from './NewsletterForm';

const SHOW_ON = [/^\/$/, /^\/precos$/, /^\/ocasioes\//];
const COOLDOWN_DAYS = 14;

/** Pop-up de newsletter para visitantes novos: aparece uma vez (depois de ~12 s, 45 % de scroll ou intenção de sair) e respeita "fechar" durante 14 dias. */
export function NewsletterPopup({ enabled }: { enabled: boolean }) {
  const path = usePathname(); const [open, setOpen] = useState(false); const shown = useRef(false); const opener = useRef<HTMLElement | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const eligible = enabled && SHOW_ON.some(r => r.test(path || ''));

  const remember = useCallback((subscribed = false) => { try { localStorage.setItem('cq_nl', JSON.stringify({ t: Date.now(), s: subscribed ? 1 : 0 })); } catch { /* */ } }, []);
  const close = useCallback(() => { setOpen(false); remember(false); opener.current?.focus?.(); }, [remember]);

  useEffect(() => {
    if (!eligible) return;
    try { const v = JSON.parse(localStorage.getItem('cq_nl') || 'null'); if (v && (v.s || Date.now() - v.t < COOLDOWN_DAYS * 86400_000)) return; if (sessionStorage.getItem('cq_nl_seen')) return; } catch { /* sem storage: continua */ }
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; void reduceMotion;
    const show = () => { if (shown.current) return; shown.current = true; opener.current = document.activeElement as HTMLElement; try { sessionStorage.setItem('cq_nl_seen', '1'); } catch { /* */ } setOpen(true); };
    const timer = setTimeout(show, 12_000);
    const onScroll = () => { const h = document.documentElement; if ((h.scrollTop + window.innerHeight) / h.scrollHeight > 0.45) show(); };
    const onLeave = (e: MouseEvent) => { if (e.clientY <= 0) show(); };
    window.addEventListener('scroll', onScroll, { passive: true }); document.addEventListener('mouseleave', onLeave);
    return () => { clearTimeout(timer); window.removeEventListener('scroll', onScroll); document.removeEventListener('mouseleave', onLeave); };
  }, [eligible]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'Tab' && boxRef.current) { // prende o foco dentro do diálogo
        const f = Array.from(boxRef.current.querySelectorAll<HTMLElement>('button, input:not([tabindex="-1"]), a[href]')); if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey); return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/60 p-3 sm:items-center" onMouseDown={e => { if (e.target === e.currentTarget) close(); }}>
      <div ref={boxRef} role="dialog" aria-modal="true" aria-labelledby="nl-title" className="fade-up relative w-full max-w-md rounded-xl2 border-2 border-gold/50 bg-paper p-6 pt-8 text-center shadow-2xl">
        <button type="button" onClick={close} aria-label="Fechar" className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-2xl leading-none text-wine hover:bg-rose-soft">×</button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark.png" alt="" width={48} height={56} className="mx-auto mb-2 h-14 w-auto" />
        <p className="text-[11px] uppercase tracking-[.3em] text-gold-deep">Newsletter Carta QR</p>
        <h2 id="nl-title" className="h-display mt-1 text-2xl font-semibold text-wine">Ideias para surpreender quem amas</h2>
        <p className="mt-2 text-sm text-muted">Mensagens prontas para cada ocasião, dicas de presentes e novidades da Carta QR, direto no teu email.</p>
        <div className="mt-4 text-left"><NewsletterForm source="popup" compact autoFocus onDone={() => { remember(true); }} /></div>
        <button type="button" onClick={close} className="mt-3 text-sm text-muted underline">Agora não</button>
      </div>
    </div>
  );
}
