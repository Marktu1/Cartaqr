'use client';
import { useState } from 'react';

type Memory = { title: string; description: string; date?: string; place?: string };
type Photo = { url: string; caption: string; alt: string };
const monthYear = (d: string) => new Intl.DateTimeFormat('pt-PT', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(d + 'T12:00:00Z'));

/** "A nossa história": cada ponto da linha do tempo revela a memória e a fotografia com o mesmo número. */
export function Timeline({ title, memories, photos, onPhoto }: { title: string; memories: Memory[]; photos: Photo[]; onPhoto: (i: number) => void }) {
  const [open, setOpen] = useState<Record<number, boolean>>({ 0: true });
  return (
    <section aria-label={title} className="mt-12">
      <h2 className="h-display reveal mb-2 text-center text-2xl text-[var(--c-accent)]">{title}</h2>
      <p className="reveal mb-7 text-center text-sm opacity-65">Toca em cada momento para recordar</p>
      <ol className="timeline">
        {memories.map((m, i) => {
          const p = photos[i]; const isOpen = !!open[i];
          return (
            <li key={i} className={`reveal tl-item ${isOpen ? 'is-open' : ''}`}>
              <span className="tl-dot" aria-hidden>{i + 1}</span>
              <button type="button" className="tl-head" onClick={() => setOpen(o => ({ ...o, [i]: !o[i] }))} aria-expanded={isOpen}>
                <span className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--c-accent)]">
                  {m.date && <span>{monthYear(m.date)}</span>}{m.place && <span className="tl-place">📍 {m.place}</span>}
                </span>
                <span className="h-display mt-0.5 block text-lg font-semibold leading-snug">{m.title}</span>
                {!isOpen && <span className="text-xs opacity-60">Toca para recordar</span>}
              </button>
              <div className="tl-body">
                {m.description && <p className="opacity-90">{m.description}</p>}
                {p && <button type="button" onClick={() => onPhoto(i)} className="polaroid mt-4" aria-label={`Ampliar fotografia: ${p.caption || m.title}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={p.alt || p.caption || m.title} loading="lazy" />
                  {p.caption && <span className="polaroid-cap">{p.caption}</span>}
                </button>}
              </div>
            </li>);
        })}
      </ol>
    </section>
  );
}

/** Galeria em estilo polaroide (as fotografias que não ficaram na linha do tempo). */
export function Gallery({ title, photos, offset, onPhoto }: { title?: string; photos: Photo[]; offset: number; onPhoto: (i: number) => void }) {
  if (!photos.length) return null;
  return (
    <section aria-label={title || 'Fotografias'} className="reveal mt-12">
      {title && <h2 className="h-display mb-5 text-center text-2xl text-[var(--c-accent)]">{title}</h2>}
      <div className="snap-x-row -mx-5 px-5 pb-3">
        {photos.map((p, i) => (
          <button key={i} type="button" onClick={() => onPhoto(offset + i)} className="polaroid w-[72%] max-w-[290px]" style={{ ['--tilt' as string]: `${i % 2 ? 2 : -2}deg` }} aria-label={`Ampliar fotografia ${offset + i + 1}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={p.alt || p.caption || `Fotografia ${offset + i + 1}`} loading="lazy" />
            {p.caption && <span className="polaroid-cap">{p.caption}</span>}
          </button>))}
      </div>
    </section>
  );
}
