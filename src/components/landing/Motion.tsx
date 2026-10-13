'use client';
import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

const reduced = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Página inicial: scroll suave (Lenis), secções que se revelam ao rolar ([data-reveal], com atraso em cascata
 * pelos filhos [data-stagger]) e leve parallax do telemóvel do topo ([data-parallax]).
 * Sem JavaScript ou com "reduzir movimento", tudo aparece normalmente.
 */
export function LandingMotion() {
  useEffect(() => {
    document.documentElement.classList.add('motion-ready');
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    els.forEach(el => el.querySelectorAll<HTMLElement>('[data-stagger] > *').forEach((c, i) => c.style.setProperty('--d', `${Math.min(i, 8) * 90}ms`)));
    if (reduced() || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('is-in')); return () => document.documentElement.classList.remove('motion-ready'); }

    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    els.forEach(e => io.observe(e));

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true, anchors: { offset: -72 } });
    const par = document.querySelectorAll<HTMLElement>('[data-parallax]');
    lenis.on('scroll', ({ scroll }: { scroll: number }) => {
      par.forEach(p => { const k = Number(p.dataset.parallax || 0.15); p.style.transform = `translate3d(0, ${scroll * k}px, 0) rotate(${Math.min(scroll / 120, 4)}deg)`; });
    });
    let raf = 0; const loop = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(loop); }; raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); lenis.destroy(); io.disconnect(); document.documentElement.classList.remove('motion-ready'); };
  }, []);
  return null;
}

/**
 * Vídeo do topo sem pesar no carregamento: a página carrega só o primeiro frame (poster, ~3 KB);
 * o vídeo (~33 KB) só é pedido depois de a página terminar de carregar, e começa no mesmo frame.
 */
export function HeroVideo({ src, webm, poster, className }: { src: string; webm?: string; poster: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current; if (!v) return;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (reduced() || conn?.saveData) return;
    const start = () => { v.src = webm && !v.canPlayType('video/mp4; codecs="avc1.42E01E"') ? webm : src; v.play().catch(() => { /* sem autoplay: fica o poster */ }); };
    if (document.readyState === 'complete') { const id = setTimeout(start, 300); return () => clearTimeout(id); }
    addEventListener('load', start, { once: true }); return () => removeEventListener('load', start);
  }, [src, webm]);
  return <video ref={ref} className={className} poster={poster} muted playsInline loop preload="none" aria-hidden />;
}
