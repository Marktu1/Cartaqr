import type { Metadata } from 'next';
import Link from 'next/link';
import { listPlans } from '@/lib/orders';
import { PlanCards } from '@/components/PlanCards';
import { Faq } from '@/components/Faq';
import { Track } from '@/components/Track';
import { formatMoney } from '@/lib/format';

export const metadata: Metadata = { title: 'Preços', description: 'Escolhe o plano da tua Carta QR: cartas a partir de 4 500 Kz e pacotes de Eventos.' };

function Compare({ plans, event }: { plans: any[]; event?: boolean }) {
  const rows: [string, (p: any) => string][] = [
    ['Preço', p => formatMoney(p.effective_price ?? p.price, p.currency) + (p.promo_active ? ' (promoção)' : '')], ...(event ? [['Convidados com confirmação (RSVP)', (p: any) => `Até ${p.max_guests}`] as [string, (p: any) => string]] : []),
    ['Fotografias', p => `Até ${p.max_photos}`], ['Vídeo', p => (p.max_videos ? `Até ${p.max_videos}` : '—')],
    ['Áudio / música', p => (p.max_audio_files ? `Até ${p.max_audio_files}` : '—')], ['Disponibilidade', p => `${p.duration_days} dias`],
    ['Revisão da equipa', p => (p.slug === 'premium' || p.slug === 'evento-exclusivo' ? 'Sim' : '—')], ['Link privado e QR Code', () => 'Sim'],
  ];
  return (
    <div className="mt-3 overflow-x-auto rounded-[22px] bg-mist" data-rv>
      <table className="w-full min-w-[560px] text-left text-[15px]">
        <caption className="sr-only">Comparação dos planos</caption>
        <thead><tr className="border-b border-black/10"><th scope="col" className="p-5 text-[13px] font-semibold uppercase tracking-[.06em] text-muted">Inclui</th>{plans.map(p => <th scope="col" key={p.id} className="p-5 text-[17px] font-semibold text-ink">{p.name}</th>)}</tr></thead>
        <tbody>{rows.map(([label, fn]) => (<tr key={label} className="border-b border-black/[.06] last:border-0"><th scope="row" className="p-5 font-medium text-ink">{label}</th>{plans.map(p => <td key={p.id} className="p-5 text-muted">{fn(p)}</td>)}</tr>))}</tbody>
      </table>
    </div>
  );
}

export default function Precos() {
  const plans = listPlans(true, 'carta'); const eventPlans = listPlans(true, 'evento');
  return (
    <div className="pb-24">
      <Track name="pricing_view" />
      <header className="wrap pb-16 pt-16 text-center sm:pt-24">
        <p className="t-eyebrow text-gold-deep fade-up">Preços</p>
        <h1 className="t-hero mx-auto mt-2 max-w-[14ch] text-ink fade-up">Simples e claros.</h1>
        <p className="t-sub mx-auto mt-4 max-w-[32ch] text-muted fade-up">Pagas uma vez, por transferência. A nossa equipa confirma e publica a tua carta.</p>
        <nav aria-label="Secções" className="mt-8 flex justify-center gap-3 fade-up">
          <a href="#cartas" className="btn btn-primary">Cartas</a>
          <a href="#eventos" className="btn btn-secondary">Eventos</a>
        </nav>
      </header>
      <section id="cartas" className="scroll-mt-16 bg-white" aria-labelledby="cartas-t">
        <div className="wrap">
          <h2 id="cartas-t" className="t-section text-center text-ink" data-rv>Cartas.</h2>
          <p className="t-lead mx-auto mt-3 max-w-[40ch] text-center text-muted" data-rv>Para dizer o que sentes, com fotos, vídeo e música.</p>
          <div className="mt-12"><PlanCards plans={plans} /></div>
          <Compare plans={plans} />
        </div>
      </section>
      <section id="eventos" className="mt-24 scroll-mt-16 bg-night py-24 text-white" aria-labelledby="eventos-t">
        <div className="wrap">
          <p className="t-eyebrow text-center text-gold" data-rv>Novo</p>
          <h2 id="eventos-t" className="t-section mt-1 text-center" data-rv>Eventos.</h2>
          <p className="t-lead mx-auto mt-3 max-w-[44ch] text-center text-white/70" data-rv>Convites digitais com programa, local, mapa e confirmação de presença dos convidados.</p>
          <div className="mt-12 text-ink"><PlanCards plans={eventPlans} /></div>
          <div className="text-ink"><Compare plans={eventPlans} event /></div>
        </div>
      </section>
      <section className="bg-white pt-24" aria-labelledby="faq-t">
        <div className="wrap">
          <h2 id="faq-t" className="t-section mb-12 text-center text-ink" data-rv>Perguntas frequentes.</h2>
          <Faq />
          <div className="mt-12 text-center"><Link href="/criar" className="btn btn-primary">Fazer a minha encomenda</Link></div>
        </div>
      </section>
    </div>
  );
}
