import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getOrderByToken, eventDashboard, eventPanelAvailable, expireDue } from '@/lib/orders';
import { getCategory } from '@/lib/categories';
import { STATUS_LABEL } from '@/lib/format';
import { EventDashboard } from '@/components/EventDashboard';

export const metadata: Metadata = { title: 'Painel do evento', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function ConvidadosPage(props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) notFound();
  expireDue();
  const order = getOrderByToken(token); if (!order) notFound();
  if (getCategory(order.occasion).kind !== 'evento') notFound();
  if (!eventPanelAvailable(order)) {
    return (
      <div className="wrap max-w-[560px] py-24 text-center">
        <p className="t-eyebrow text-gold-deep">Painel do evento</p>
        <h1 className="t-tile mt-1 text-ink">Ainda não está ativo</h1>
        <p className="t-lead mt-3 text-muted">O painel de convidados abre assim que confirmarmos o pagamento do teu convite. Estado atual: {STATUS_LABEL[order.order_status] || order.order_status}.</p>
        <Link href={`/minha/${token}`} className="btn btn-primary mt-8">Ver a minha encomenda</Link>
      </div>
    );
  }
  return (
    <>
      <div className="wrap pt-6"><Link href={`/minha/${token}`} className="link-more text-[15px] [&::after]:hidden">‹ A minha encomenda</Link></div>
      <EventDashboard token={token} initial={eventDashboard(order)} />
    </>
  );
}
