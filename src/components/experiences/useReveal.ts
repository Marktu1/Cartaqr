'use client';
import { useEffect, useRef, useState } from 'react';

/** Faz entrar os elementos `.rv` quando aparecem no ecrã (só opacidade e transformação). `active=false` adia a observação. */
export function useReveal(active = true) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!active) return;
    const els = ref.current?.querySelectorAll('.rv'); if (!els) return;
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.15 });
    els.forEach(e => io.observe(e));
    const onPrint = () => els.forEach(e => e.classList.add('in')); window.addEventListener('beforeprint', onPrint);
    return () => { io.disconnect(); window.removeEventListener('beforeprint', onPrint); };
  }, [active]);
  return ref;
}

export function useCountdown(target: string | undefined) {
  const [t, setT] = useState<{ d: number; h: number; m: number; s: number; over: boolean } | null>(null);
  useEffect(() => {
    if (!target) return;
    const tick = () => {
      const ms = new Date(target).getTime() - Date.now(); const s = Math.max(0, Math.floor(ms / 1000));
      setT({ d: Math.floor(s / 86400), h: Math.floor(s / 3600) % 24, m: Math.floor(s / 60) % 60, s: s % 60, over: ms <= 0 });
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, [target]);
  return t;
}
