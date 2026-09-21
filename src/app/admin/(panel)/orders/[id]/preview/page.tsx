import { notFound } from 'next/navigation';
import * as O from '@/lib/orders';
import { requireAdmin } from '@/lib/auth';
import { buildLetterView } from '@/lib/view';
import { LetterView } from '@/components/LetterView';

export const metadata = { robots: { index: false, follow: false } };

/** Pré-visualização para o administrador (mesmo que a carta ainda não esteja publicada). Não conta como abertura. */
export default async function AdminPreview(props: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const params = await props.params;
  const order = O.getOrderById(Number(params.id)); if (!order) notFound();
  const letter = O.getLetterByOrder(order.id)!;
  const data = { ...buildLetterView(order, letter, { ttl: 3600 }), demo: true };
  return (<><div className="bg-gold/20 px-4 py-2 text-center text-sm font-semibold">Pré-visualização do administrador · estado: {order.order_status} · as respostas não são enviadas</div><LetterView data={data} /></>);
}
