'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/** Faz aparecer suavemente os elementos com o atributo data-rv quando entram no ecrã. */
export function ScrollReveal() {
  const pathname = usePathname();
  useEffect(() => {
    const root = document.documentElement;
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    root.classList.add('rv-on');
    const io = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    document.querySelectorAll('[data-rv]:not(.in)').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);
  return null;
}
