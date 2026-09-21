import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { resolvePublicLetter, pinCookieValid, trackLetterView } from '@/lib/orders';
import { buildLetterView } from '@/lib/view';
import { LetterView } from '@/components/LetterView';
import { LockedCountdown } from '@/components/LockedCountdown';
import { getCategory } from '@/lib/categories';
import { formatLuanda } from '@/lib/format';
import { PinGate } from '@/components/PinGate';

export const dynamic = 'force-dynamic';
// Páginas privadas: sem título/descrição com dados pessoais e fora dos motores de pesquisa.
export const metadata: Metadata = {
  title: 'Uma surpresa para ti', description: 'Alguém preparou uma Carta QR para ti.',
  robots: { index: false, follow: false, nocache: true, noarchive: true, nosnippet: true }, openGraph: { title: 'Uma surpresa para ti', description: 'Toca para abrir.' },
};

function Notice({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-5"><div className="card max-w-sm p-8 text-center">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-rose-soft text-2xl" aria-hidden>{icon}</div>
      <h1 className="h-display text-2xl font-semibold text-wine">{title}</h1><p className="mt-2 text-muted">{text}</p>
      <Link href="/" className="btn btn-secondary mt-6">Conhecer a Carta QR</Link></div></main>
  );
}

export default async function CartaPage(props: { params: Promise<{ token: string }> }) {
  const params = await props.params;
  const r = resolvePublicLetter(params.token);
  if (r.state === 'notfound') return <Notice icon="?" title="Link inexistente" text="Não encontrámos esta carta. Confirma se o link está completo ou pede-o novamente a quem o enviou." />;
  if (r.state === 'expired') return <Notice icon="⏳" title="Esta carta expirou" text="O período de disponibilidade terminou. Fala com quem a ofereceu para a reativar." />;
  if (r.state === 'blocked') return <Notice icon="⛔" title="Carta indisponível" text="Esta carta não está disponível neste momento." />;
  if (r.state === 'unpublished') return <Notice icon="✉" title="Ainda não está pronta" text="Esta surpresa ainda está a ser preparada. Volta a tentar mais tarde." />;

  if (r.state === 'locked') return <LockedCountdown unlockAt={r.unlockAt} label={getCategory(r.order.occasion).kind === 'evento' ? 'Convite' : 'Carta QR'} opensAt={formatLuanda(r.letter.unlock_at)} />;
  const { letter, order } = r;
  if (letter.pin_hash && !pinCookieValid(letter.id, (await cookies()).get(`pin_${letter.id}`)?.value)) return <PinGate token={params.token} />;
  trackLetterView(letter.id);
  return <LetterView data={buildLetterView(order, letter, { token: params.token })} />;
}
