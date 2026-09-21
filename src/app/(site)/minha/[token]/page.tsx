import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getOrderByToken, getLetterByOrder, getPlan, expireDue, rsvpSummary, listRsvps, viewStats } from '@/lib/orders';
import { all } from '@/lib/db';
import { config } from '@/lib/config';
import { formatDate, formatMoney, formatLuanda, STATUS_LABEL } from '@/lib/format';
import { getSettings, whatsappLink } from '@/lib/settings';
import { getCategory } from '@/lib/categories';
import { QrPanel } from '@/components/QrPanel';
import { ResumeButton } from '@/components/ResumeButton';

export const metadata: Metadata = { title: 'A minha encomenda', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const FLOW = ['payment_pending', 'proof_submitted', 'payment_confirmed', 'published'];

export default async function MinhaPage(props: { params: Promise<{ token: string }> }) {
  const params = await props.params;
  expireDue();
  const order = getOrderByToken(params.token); if (!order) notFound();
  const letter = getLetterByOrder(order.id)!; const plan = getPlan(order.plan_id)!; const s = getSettings();
  const replies = all('SELECT * FROM letter_replies WHERE letter_id = ? ORDER BY id DESC', letter.id);
  const cat = getCategory(order.occasion); const isEvent = cat.kind === 'evento';
  const sum = rsvpSummary(letter.id); const guestsList = isEvent ? listRsvps(letter.id) : []; const views = viewStats(letter.id);
  const status = order.order_status as string;
  const idx = status === 'in_production' ? 2 : FLOW.indexOf(status);
  const link = `${config.appUrl}/carta/${letter.secure_token}`;
  const messages: Record<string, string> = {
    draft: 'A tua carta ainda é um rascunho. Continua a editá-la e submete o pagamento.',
    payment_pending: 'À espera do pagamento. Faz o pagamento e envia o comprovativo para avançarmos.',
    proof_submitted: 'Recebemos o teu comprovativo. A nossa equipa irá confirmar o pagamento e desbloquear a tua Carta QR.',
    payment_confirmed: 'Pagamento confirmado. Estamos a preparar a tua carta para publicação.',
    in_production: 'A nossa equipa está a rever e a preparar a tua carta com todo o cuidado.',
    published: 'A tua Carta QR está publicada e pronta a ser partilhada!',
    expired: 'Esta carta expirou. Fala connosco se quiseres reativá-la.',
    cancelled: 'Esta encomenda foi cancelada.',
  };
  const wa = whatsappLink(s.whatsapp_number, `Olá! Sobre a encomenda ${order.public_reference}.`);
  return (
    <div className="section max-w-2xl space-y-6 py-10">
      <div><span className="chip">Encomenda {order.public_reference}</span><h1 className="h-display mt-3 text-3xl font-semibold text-wine">{letter.title || 'A minha Carta QR'}</h1>
        <p className="text-muted">Para {letter.recipient_name} · {cat.name} · Plano {plan.name} · {formatMoney(order.amount, order.currency)}{order.discount_code ? ` (código ${order.discount_code})` : ''}</p></div>

      <div className="card p-5">
        <p className="font-semibold text-wine">Estado: {STATUS_LABEL[status]}</p>
        {order.payment_status === 'rejected' && status === 'payment_pending' && <p className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-800">O comprovativo anterior não foi aceite. Envia um novo comprovativo ou fala connosco no WhatsApp.</p>}
        <p className="mt-1 text-muted" role="status">{messages[status]}</p>
        {idx >= 0 && <ol className="mt-4 grid grid-cols-4 gap-2 text-center text-xs" aria-label="Progresso da encomenda">
          {['Pagamento', 'Comprovativo', 'Confirmado', 'Publicada'].map((l, i) => (<li key={l}><div className={`mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full font-bold ${i <= idx ? 'bg-wine text-white' : 'bg-rose-soft text-muted'}`}>{i <= idx ? '✓' : i + 1}</div>{l}</li>))}</ol>}
        {['draft', 'payment_pending', 'proof_submitted'].includes(status) && <div className="mt-5"><ResumeButton token={params.token} label={status === 'proof_submitted' ? 'Ver o resumo do pedido' : 'Continuar a minha encomenda'} /></div>}
        <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-ghost mt-3 w-full">Falar com a equipa no WhatsApp</a>
      </div>

      {status === 'published' && letter.is_published && !letter.is_blocked && (
        <div className="card p-5">
          <h2 className="h-display mb-4 text-2xl font-semibold text-wine">O teu QR Code</h2>
          <QrPanel token={params.token} link={link} title={letter.title} date={formatDate(letter.special_date)} phrase={isEvent ? '' : letter.closing_message} instruction={cat.qrInstruction} event={isEvent} />
          <div className="no-print mt-5 flex flex-col gap-2 sm:flex-row"><Link href={`/carta/${letter.secure_token}`} className="btn btn-primary flex-1" target="_blank">{isEvent ? 'Abrir o convite' : 'Abrir a carta'}</Link></div>
          {letter.expires_at && <p className="no-print mt-3 text-center text-sm text-muted">Disponível até {formatDate(letter.expires_at)}.</p>}
        </div>
      )}
      {letter.unlock_at && new Date(letter.unlock_at.replace(' ', 'T') + 'Z') > new Date() && <p className="rounded-xl border border-gold/40 bg-gold/10 p-4" role="status">⏰ <strong>Entrega agendada:</strong> quem abrir o link antes de {formatLuanda(letter.unlock_at)} vê uma contagem decrescente e a surpresa abre sozinha à hora marcada.</p>}
      {status === 'published' && letter.is_blocked ? <p className="rounded-xl bg-red-50 p-4 text-red-800">Esta carta foi bloqueada temporariamente. Fala connosco pelo WhatsApp.</p> : null}

      {status === 'published' && <div className="card p-5"><h2 className="h-display text-xl font-semibold text-wine">Aberturas</h2><p className="mt-1 text-muted">{views.total === 0 ? 'Ainda ninguém abriu o link.' : `${views.total} abertura(s)${views.last ? ` · última em ${formatDate(views.last)}` : ''}.`}</p></div>}

      {isEvent && status === 'published' && (
        <div className="card p-5" id="rsvp"><h2 className="h-display text-xl font-semibold text-wine">Confirmações de presença</h2>
          <p className="mt-2 text-muted"><strong data-testid="rsvp-yes">{sum.yesGuests}</strong> pessoa(s) confirmada(s) ({sum.yes} resposta(s) “vou”) · {sum.maybe} talvez · {sum.no} não vão · limite do pacote: {plan.max_guests}</p>
          {guestsList.length > 0 && <ul className="mt-3 divide-y divide-wine/10 text-sm">{guestsList.map(g => <li key={g.id} className="flex flex-wrap justify-between gap-2 py-2"><span><strong>{g.guest_name}</strong>{g.message ? ` · “${g.message}”` : ''}</span><span className="text-muted">{({ yes: `Vai (${g.guests})`, no: 'Não vai', maybe: 'Talvez' } as Record<string, string>)[g.attending]}</span></li>)}</ul>}
          <a className="btn btn-secondary mt-4" href={`/api/orders/${params.token}/rsvps`}>Descarregar lista (CSV)</a></div>
      )}

      {replies.length > 0 && <div className="card p-5"><h2 className="h-display mb-3 text-xl font-semibold text-wine">{cat.proposal ? 'A resposta' : 'Respostas recebidas'}</h2><ul className="space-y-3">{replies.map(r => <li key={r.id} className={`rounded-xl p-3 ${r.kind === 'answer' ? 'border-2 border-gold bg-gold/10 font-semibold' : 'bg-rose-soft/40'}`}><p className="whitespace-pre-line">{r.message}</p><p className="mt-1 text-xs text-muted">{r.author || 'Anónimo'} · {formatDate(r.created_at)}</p></li>)}</ul></div>}
    </div>
  );
}
