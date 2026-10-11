'use client';
import { useEffect, useRef, useState } from 'react';

/** Escreve a mensagem letra a letra quando aparece no ecrã (no máximo ~14 s). Toque para mostrar tudo. */
export function Typewriter({ paragraphs, className, onDone }: { paragraphs: string[]; className?: string; onDone?: () => void }) {
  const full = paragraphs.join('\n\n');
  const [n, setN] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setN(full.length); return; }
    const el = ref.current; if (!el) return;
    if (!('IntersectionObserver' in window)) { setStarted(true); return; }
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { setStarted(true); io.disconnect(); } }, { threshold: 0.25 });
    io.observe(el);
    const onPrint = () => setN(full.length); addEventListener('beforeprint', onPrint);
    return () => { io.disconnect(); removeEventListener('beforeprint', onPrint); };
  }, [full.length]);

  useEffect(() => {
    if (!started || n >= full.length) return;
    const step = Math.max(1, Math.ceil(full.length / 420)); // ~14 s no total a 30 fps
    const id = setTimeout(() => {
      let next = n + step;
      const ch = full[n];
      if (ch === '.' || ch === '!' || ch === '?') next = n + 1; // pausa curta no fim de cada frase
      setN(Math.min(full.length, next));
    }, full[n] === '.' || full[n] === '\n' ? 180 : 33);
    return () => clearTimeout(id);
  }, [started, n, full]);

  useEffect(() => { if (n >= full.length && full.length && !doneRef.current) { doneRef.current = true; onDone?.(); } }, [n, full.length, onDone]);

  const shown = full.slice(0, n).split(/\n{2,}/);
  const typing = n < full.length;
  return (
    <div ref={ref} className={className} onClick={() => typing && setN(full.length)}>
      {/* Texto completo para leitores de ecrã e impressão; a animação é só visual */}
      <div className="sr-only">{paragraphs.map((p, i) => <p key={i}>{p}</p>)}</div>
      <div className="print-only" aria-hidden>{paragraphs.map((p, i) => <p key={i} className="h-display letter-text mb-5 whitespace-pre-line text-[1.15rem] leading-8">{p}</p>)}</div>
      <div aria-hidden className="no-print">
        {shown.map((p, i) => <p key={i} className="h-display letter-text mb-5 whitespace-pre-line text-[1.15rem] leading-8 last:mb-0">{p}{typing && i === shown.length - 1 && <span className="tw-caret" />}</p>)}
        {!started && <p className="h-display letter-text text-[1.15rem] leading-8 opacity-0">{paragraphs[0]}</p>}
      </div>
      {typing && started && <button type="button" className="no-print mt-4 text-xs font-semibold uppercase tracking-wider opacity-60 underline" onClick={e => { e.stopPropagation(); setN(full.length); }}>Mostrar tudo</button>}
    </div>
  );
}
