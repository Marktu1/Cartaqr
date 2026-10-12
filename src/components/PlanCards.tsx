import Link from 'next/link';
import { Price } from './Price';
import type { Row } from '@/lib/db';

export function PlanCards({ plans, cta = true }: { plans: Row[]; cta?: boolean }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {plans.map(p => {
        const featured = p.slug === 'romantico' || p.slug === 'evento-premium';
        return (
          <div key={p.id} data-rv className={`relative flex flex-col rounded-[22px] p-7 ${featured ? 'bg-white ring-2 ring-wine' : 'bg-mist'}`}>
            {featured ? <p className="text-[12px] font-semibold uppercase tracking-[.08em] text-gold-deep">Mais escolhido</p> : <p className="text-[12px] font-semibold uppercase tracking-[.08em] text-transparent" aria-hidden>·</p>}
            <h3 className="mt-1 text-[28px] font-semibold leading-tight tracking-[-.01em] text-ink">{p.name}</h3>
            <p className="mt-1 text-[15px] leading-snug text-muted">{p.description}</p>
            <div className="mt-6"><Price plan={p as any} className="text-[32px] font-semibold tracking-[-.01em] text-ink" /></div>
            <p className="mt-1 text-[13px] text-muted">Disponível durante {p.duration_days} dias</p>
            {p.kind === 'evento' && <p className="mt-1 text-[13px] font-semibold text-wine">Até {p.max_guests} convidados com confirmação de presença</p>}
            <ul className="mt-6 flex-1 space-y-2.5 border-t border-black/[.08] pt-6 text-[15px]">
              {p.features.map((f: string) => <li key={f} className="flex gap-2.5"><span className="text-wine" aria-hidden>✓</span><span>{f}</span></li>)}
            </ul>
            {cta && <Link href={`/criar?plano=${p.slug}`} className={`btn mt-8 w-full ${featured ? 'btn-primary' : 'btn-secondary'}`}>Escolher {p.name}</Link>}
          </div>
        );
      })}
    </div>
  );
}
