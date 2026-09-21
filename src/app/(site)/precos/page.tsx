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
    <div className="mt-6 overflow-x-auto rounded-xl2 border border-wine/10 bg-paper">
      <table className="w-full min-w-[520px] text-left text-sm">
        <caption className="sr-only">Comparação dos planos</caption>
        <thead><tr className="border-b border-wine/10"><th scope="col" className="p-4">Inclui</th>{plans.map(p => <th scope="col" key={p.id} className="p-4 text-wine">{p.name}</th>)}</tr></thead>
        <tbody>{rows.map(([label, fn]) => (<tr key={label} className="border-b border-wine/5 last:border-0"><th scope="row" className="p-4 font-semibold">{label}</th>{plans.map(p => <td key={p.id} className="p-4">{fn(p)}</td>)}</tr>))}</tbody>
      </table>
    </div>
  );
}

export default function Precos() {
  const plans = listPlans(true, 'carta'); const eventPlans = listPlans(true, 'evento');
  return (
    <div className="section py-12">
      <Track name="pricing_view" />
      <h1 className="h-display text-center text-4xl font-semibold text-wine">Preços simples e claros</h1>
      <p className="mx-auto mt-3 max-w-lg text-center text-muted">Pagas uma vez, por transferência, e a nossa equipa confirma e publica a tua carta.</p>
      <h2 className="h-display mt-10 text-center text-2xl font-semibold text-wine">Cartas</h2>
      <div className="mt-6"><PlanCards plans={plans} /></div>
      <Compare plans={plans} />
      <section id="eventos" className="scroll-mt-24">
        <h2 className="h-display mt-16 text-center text-2xl font-semibold text-wine">Eventos</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-muted">Convites digitais com programa, local, mapa e confirmação de presença dos convidados. Pacotes mais completos, pensados para celebrações e eventos.</p>
        <div className="mt-6"><PlanCards plans={eventPlans} /></div>
        <Compare plans={eventPlans} event />
      </section>
      <div className="mt-14"><h2 className="h-display mb-6 text-center text-2xl font-semibold text-wine">Perguntas frequentes</h2><Faq /></div>
      <div className="mt-12 text-center"><Link href="/criar" className="btn btn-primary">Fazer a minha encomenda</Link></div>
    </div>
  );
}
