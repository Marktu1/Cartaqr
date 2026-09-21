import Link from 'next/link';
import { Price } from './Price';
import type { Row } from '@/lib/db';

export function PlanCards({ plans, cta = true }: { plans: Row[]; cta?: boolean }) {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {plans.map(p => {
        const featured = p.slug === 'romantico' || p.slug === 'evento-premium';
        return (
          <div key={p.id} className={`card relative flex flex-col p-6 ${featured ? 'border-2 border-gold' : ''}`}>
            {featured && <span className="chip absolute -top-3 left-6 bg-gold-deep text-white">Mais escolhido</span>}
            <h3 className="h-display text-2xl font-semibold text-wine">{p.name}</h3>
            <p className="mt-1 text-sm text-muted">{p.description}</p>
            <div className="mt-4"><Price plan={p as any} /></div>
            <p className="text-xs text-muted">Disponível durante {p.duration_days} dias</p>
            {p.kind === 'evento' && <p className="text-xs font-semibold text-wine">Até {p.max_guests} convidados com confirmação de presença</p>}
            <ul className="mt-5 flex-1 space-y-2 text-sm">
              {p.features.map((f: string) => <li key={f} className="flex gap-2"><span className="text-gold-deep" aria-hidden>✓</span><span>{f}</span></li>)}
            </ul>
            {cta && <Link href={`/criar?plano=${p.slug}`} className={`btn mt-6 ${featured ? 'btn-primary' : 'btn-secondary'}`}>Escolher {p.name}</Link>}
          </div>
        );
      })}
    </div>
  );
}
