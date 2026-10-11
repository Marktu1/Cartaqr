'use client';
import { useEffect, useRef } from 'react';

export type BurstKind = 'hearts' | 'confetti' | 'petals' | 'panos' | 'gold';

/** Dispara uma celebração em qualquer ponto da carta. */
export function celebrate(kind: BurstKind = 'confetti') {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('cq-celebrate', { detail: kind }));
}

/** Escolhe a celebração mais adequada ao tema/ambiente da carta. */
export function burstFor(theme: string, mood?: string, category?: string): BurstKind {
  if (mood === 'panos' || theme === 'samakaka') return 'panos';
  if (mood === 'por-do-sol' || theme === 'mussulo' || theme === 'gala' || theme === 'elegante') return 'gold';
  if (['amor', 'pedido-namoro', 'pedido-casamento', 'dia-namorados', 'distancia'].includes(category || '') || theme === 'romantico') return 'hearts';
  if (theme === 'natureza' || theme === 'familiar') return 'petals';
  return 'confetti';
}

const PALETTES: Record<BurstKind, string[]> = {
  hearts: ['#E0475B', '#F28AA0', '#B3213B', '#FFC2CF', '#D9B76E'],
  confetti: ['#A3283F', '#D9B76E', '#F5D9C9', '#5B8DEF', '#3BB27C', '#F2A541'],
  petals: ['#F6C1C9', '#F9DCE0', '#E89AA8', '#FFF3F5'],
  // Cores de festa e de panos angolanos (vermelho, preto, amarelo, laranja, verde, azul)
  panos: ['#C8102E', '#1A1A1A', '#F6B40E', '#E4572E', '#2E8B57', '#1F5AA6', '#F3D9A4'],
  gold: ['#D9B76E', '#F3D9A4', '#B8862F', '#FFF1C9', '#C9A45C'],
};

type P = { x: number; y: number; vx: number; vy: number; r: number; rot: number; vr: number; c: string; life: number; shape: number };

export function CelebrationLayer() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let parts: P[] = []; let raf = 0; let kind: BurstKind = 'confetti';
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const size = () => { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; };
    size(); addEventListener('resize', size);

    const heart = (s: number) => {
      ctx.beginPath(); ctx.moveTo(0, s * 0.3);
      ctx.bezierCurveTo(0, 0, -s * 0.5, 0, -s * 0.5, s * 0.3);
      ctx.bezierCurveTo(-s * 0.5, s * 0.6, 0, s * 0.8, 0, s);
      ctx.bezierCurveTo(0, s * 0.8, s * 0.5, s * 0.6, s * 0.5, s * 0.3);
      ctx.bezierCurveTo(s * 0.5, 0, 0, 0, 0, s * 0.3); ctx.fill();
    };
    const draw = (p: P) => {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 40)); ctx.fillStyle = p.c;
      const s = p.r * dpr;
      if (kind === 'hearts') { ctx.translate(0, -s / 2); heart(s); }
      else if (kind === 'petals') { ctx.beginPath(); ctx.ellipse(0, 0, s * 0.35, s * 0.7, 0, 0, Math.PI * 2); ctx.fill(); }
      else if (kind === 'gold') { ctx.beginPath(); ctx.arc(0, 0, s * 0.22, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha *= 0.35; ctx.beginPath(); ctx.arc(0, 0, s * 0.6, 0, Math.PI * 2); ctx.fill(); }
      else if (kind === 'panos') {
        // pedaços de "pano": losangos, triângulos e faixas, como nos padrões de samakaka
        if (p.shape === 0) { ctx.beginPath(); ctx.moveTo(0, -s / 2); ctx.lineTo(s / 2, 0); ctx.lineTo(0, s / 2); ctx.lineTo(-s / 2, 0); ctx.fill(); }
        else if (p.shape === 1) { ctx.beginPath(); ctx.moveTo(-s / 2, s / 2); ctx.lineTo(0, -s / 2); ctx.lineTo(s / 2, s / 2); ctx.fill(); }
        else { ctx.fillRect(-s / 2, -s / 6, s, s / 3); ctx.fillStyle = '#1A1A1A'; ctx.fillRect(-s / 2, -s / 18, s, s / 9); }
      } else ctx.fillRect(-s / 2, -s / 4, s, s / 2);
      ctx.restore();
    };
    const tick = () => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      parts = parts.filter(p => p.life > 0 && p.y < cv.height + 40);
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= 1;
        p.vy += kind === 'gold' ? 0.005 : kind === 'petals' || kind === 'hearts' ? 0.03 : 0.09;
        p.vx *= 0.99; if (kind === 'petals') p.x += Math.sin(p.y / 40) * 0.6;
        draw(p);
      }
      raf = parts.length ? requestAnimationFrame(tick) : 0;
    };
    const onBurst = (e: Event) => {
      kind = ((e as CustomEvent).detail as BurstKind) || 'confetti';
      const n = reduce ? 18 : kind === 'gold' ? 90 : 130; const pal = PALETTES[kind];
      for (let i = 0; i < n; i++) {
        const fromTop = kind === 'petals' || kind === 'gold';
        parts.push({
          x: fromTop ? Math.random() * cv.width : cv.width / 2 + (Math.random() - 0.5) * cv.width * 0.3,
          y: fromTop ? -20 - Math.random() * cv.height * 0.4 : cv.height * 0.6,
          vx: fromTop ? (Math.random() - 0.5) * 1.5 * dpr : (Math.random() - 0.5) * 12 * dpr,
          vy: fromTop ? (0.6 + Math.random() * 1.6) * dpr : -(6 + Math.random() * 9) * dpr,
          r: kind === 'hearts' ? 14 + Math.random() * 14 : kind === 'gold' ? 8 + Math.random() * 10 : 9 + Math.random() * 9,
          rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.2, c: pal[i % pal.length], life: 200 + Math.random() * 120, shape: i % 3,
        });
      }
      if (!raf) raf = requestAnimationFrame(tick);
    };
    addEventListener('cq-celebrate', onBurst);
    return () => { removeEventListener('cq-celebrate', onBurst); removeEventListener('resize', size); cancelAnimationFrame(raf); };
  }, []);
  return <canvas ref={ref} aria-hidden className="no-print pointer-events-none fixed inset-0 z-[60] h-full w-full" />;
}
