import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { CATEGORIES, CATEGORY_MAP } from '@/lib/categories';
import { listPlans } from '@/lib/orders';
import { formatMoney } from '@/lib/format';
import { DEMOS } from '@/lib/demo';
import { Track } from '@/components/Track';

export const dynamic = 'force-dynamic';
export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = CATEGORY_MAP[(await props.params).slug];
  return c ? { title: c.page.title, description: c.page.seo } : { title: 'Ocasião' };
}

export default async function OcasiaoPage(props: { params: Promise<{ slug: string }> }) {
  const c = CATEGORY_MAP[(await props.params).slug]; if (!c) notFound();
  const plans = listPlans(true, c.kind);
  const min = plans.length ? Math.min(...plans.map(p => p.effective_price)) : 0;
  const demo = DEMOS.find(d => d.category === c.slug) || (c.kind === 'evento' ? DEMOS.find(d => d.category === 'convite-casamento') : undefined);
  const others = CATEGORIES.filter(x => x.kind === c.kind && x.slug !== c.slug && x.slug !== 'outra').slice(0, 6);
  return (
    <div className="section py-12">
      <Track name="category_view" />
      <div className="mx-auto max-w-2xl text-center">
        <span className="flex mx-auto h-14 w-14 items-center justify-center rounded-full bg-rose-soft text-2xl text-wine" aria-hidden>{c.glyph}</span>
        <p className="chip mt-4">{c.kind === 'evento' ? 'Convite de evento' : 'Carta QR'}</p>
        <h1 className="h-display mt-3 text-4xl font-semibold text-wine">{c.page.title}</h1>
        <p className="mt-4 text-lg text-muted">{c.page.text}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={`/criar?ocasiao=${c.slug}`} className="btn btn-primary">Criar {c.kind === 'evento' ? 'o meu convite' : 'a minha carta'}</Link>
          {demo && <Link href={`/exemplos/${demo.slug}`} className="btn btn-secondary">Ver exemplo</Link>}
        </div>
        {min > 0 && <p className="mt-4 text-sm text-muted">A partir de {formatMoney(min, 'Kz')} · {c.kind === 'evento' ? 'com confirmação de presença dos convidados' : 'link privado e QR Code incluídos'}</p>}
      </div>
      <div className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-2">
        <div className="card p-5"><p className="h-display text-lg font-semibold text-wine">O que vais preencher</p><ul className="mt-2 space-y-1 text-sm text-muted">
          {c.extra.map(f => <li key={f.key}>• {f.label}</li>)}<li>• {c.memories.heading}</li><li>• {c.message.label}</li></ul></div>
        <div className="card p-5"><p className="h-display text-lg font-semibold text-wine">Planos disponíveis</p><ul className="mt-2 space-y-1 text-sm">
          {plans.map(p => <li key={p.id} className="flex justify-between"><span>{p.name}</span><span className="font-semibold">{formatMoney(p.effective_price, p.currency)}</span></li>)}</ul>
          <Link href={c.kind === 'evento' ? '/precos#eventos' : '/precos'} className="mt-3 inline-block text-sm font-semibold text-wine underline">Comparar planos</Link></div>
      </div>
      <div className="mx-auto mt-10 max-w-3xl"><p className="text-sm font-semibold text-muted">Outras categorias</p><div className="mt-2 flex flex-wrap gap-2">{others.map(o => <Link key={o.slug} href={`/ocasioes/${o.slug}`} className="chip">{o.name}</Link>)}</div></div>
    </div>
  );
}
