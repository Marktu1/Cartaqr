import Link from 'next/link';
import { notFound } from 'next/navigation';
import * as O from '@/lib/orders';
import { formatDate, formatMoney, formatLuanda as O_fmt, STATUS_LABEL } from '@/lib/format';
import { config } from '@/lib/config';
import { getCategory } from '@/lib/categories';
import { ConfirmButton } from '@/components/ConfirmButton';
import { adminToCustomerWhatsApp } from '@/lib/notifications';
import * as A from '../../../actions';
import { requireAdmin } from '@/lib/auth';

export default async function OrderDetail(props: { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string }> }) {
  await requireAdmin();
  const params = await props.params; const searchParams = await props.searchParams;
  const order = O.getOrderById(Number(params.id)); if (!order) notFound();
  const letter = O.getLetterByOrder(order.id)!; const plan = O.getPlan(order.plan_id)!;
  const media = O.getMedia(letter.id); const memories = O.getMemories(letter.id); const events = O.getEvents(order.id);
  const cat = getCategory(order.occasion); const rsvps = cat.rsvp ? O.listRsvps(letter.id) : []; const rsum = O.rsvpSummary(letter.id); const views = O.viewStats(letter.id); const replies = O.listReplies(letter.id);
  const st = order.order_status as O.OrderStatus;
  const pending = ['payment_pending', 'proof_submitted'].includes(st);
  const canPublish = order.payment_status === 'confirmed' && ['payment_confirmed', 'in_production', 'expired', 'published'].includes(st);
  const publicUrl = `${config.appUrl}/carta/${letter.secure_token}`;
  const wa = adminToCustomerWhatsApp(order.customer_phone, `Olá ${order.customer_name}! Sobre a tua encomenda ${order.public_reference} na Carta QR.`);
  const Hidden = () => <input type="hidden" name="id" value={order.id} />;
  return (
    <div className="space-y-6">
      <Link href="/admin" className="text-sm text-wine underline">← Voltar às encomendas</Link>
      {searchParams.msg && <p role="status" className={`rounded-xl p-3 ${searchParams.msg.startsWith('Erro') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-900'}`}>{searchParams.msg}</p>}
      <div><h1 className="h-display text-3xl font-semibold text-wine">{order.public_reference} · {letter.title}</h1>
        <p className="mt-1"><span className="chip">{STATUS_LABEL[st]}</span> <span className="chip ml-1">Pagamento: {order.payment_status}</span>{letter.is_blocked ? <span className="chip ml-1 !bg-red-100 !text-red-800">Bloqueada</span> : null}{order.completed_at ? <span className="chip ml-1">Concluída</span> : null}</p></div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card p-5" aria-labelledby="dados"><h2 id="dados" className="h-display mb-3 text-xl font-semibold text-wine">Dados da encomenda</h2>
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              {[['Cliente', order.customer_name], ['Email', order.customer_email || '—'], ['Telefone', order.customer_phone || '—'], ['Categoria', `${cat.name} (${cat.kind})`], ['Plano', `${plan.name} · ${plan.duration_days} dias`], ['Valor', formatMoney(order.amount, order.currency) + (order.discount_code ? ` (código ${order.discount_code}, −${formatMoney(order.discount_amount, order.currency)})` : '')],
                ['Para', letter.recipient_name], ['De', letter.sender_name], ['Data especial', formatDate(letter.special_date) || '—'], ['Estilo', letter.theme], ['Criada', formatDate(order.created_at)], ['Expira', formatDate(letter.expires_at) || '—'], ['PIN', letter.pin_hash ? 'Ativo' : 'Não'], ['IA usada', letter.ai_used ? 'Sim' : 'Não'], ['Aberturas', `${views.total}`], ['Entrega agendada', letter.unlock_at ? O_fmt(letter.unlock_at) : 'Não']].map(([k, v]) => <div key={k}><dt className="text-muted">{k}</dt><dd className="font-semibold">{v}</dd></div>)}
            </dl>
            {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm mt-4">Contactar cliente no WhatsApp</a>}
          </section>

          <section className="card p-5" aria-labelledby="comp"><h2 id="comp" className="h-display mb-3 text-xl font-semibold text-wine">Comprovativo de pagamento</h2>
            {order.payment_proof_path ? (<div>
              {order.payment_proof_mime?.startsWith('image/') ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={`/api/admin/proof/${order.id}`} alt="Comprovativo enviado pelo cliente" className="max-h-96 rounded-xl border border-wine/10" /> : <p>Ficheiro PDF.</p>}
              <div className="mt-3 flex gap-2"><a className="btn btn-secondary btn-sm" href={`/api/admin/proof/${order.id}`} target="_blank">Abrir</a><a className="btn btn-secondary btn-sm" href={`/api/admin/proof/${order.id}?download=1`}>Descarregar</a></div>
              {order.payment_note && <p className="mt-3 text-sm"><strong>Referência do cliente:</strong> {order.payment_note}</p>}</div>) : <p className="text-muted">Ainda sem comprovativo.</p>}
          </section>

          <section className="card p-5" aria-labelledby="conteudo"><h2 id="conteudo" className="h-display mb-3 text-xl font-semibold text-wine">Conteúdo da carta</h2>
            <div className="mb-3 flex flex-wrap gap-2"><Link href={`/admin/orders/${order.id}/preview`} className="btn btn-primary btn-sm" target="_blank">Pré-visualizar como o destinatário</Link>{letter.is_published ? <a href={publicUrl} className="btn btn-secondary btn-sm" target="_blank" rel="noopener noreferrer">Abrir link público</a> : null}</div>
            <p className="text-sm text-muted">{media.filter(m => m.type === 'photo').length} fotos · {media.filter(m => m.type === 'video').length} vídeo · {media.filter(m => m.type === 'audio' || m.type === 'music').length} áudio · {memories.length} memórias</p>
            <form action={A.editLetterAction} className="mt-4 space-y-3"><Hidden />
              <div><label className="label" htmlFor="e-title">Título</label><input id="e-title" name="title" className="field" defaultValue={letter.title} maxLength={120} /></div>
              <div><label className="label" htmlFor="e-intro">Introdução</label><input id="e-intro" name="intro" className="field" defaultValue={letter.intro} maxLength={400} /></div>
              <div><label className="label" htmlFor="e-main">Mensagem principal</label><textarea id="e-main" name="mainMessage" className="field min-h-[180px]" defaultValue={letter.main_message} /></div>
              <div><label className="label" htmlFor="e-close">Frase final</label><input id="e-close" name="closingMessage" className="field" defaultValue={letter.closing_message} maxLength={300} /></div>
              <button className="btn btn-secondary btn-sm">Guardar alterações da carta</button></form>
          </section>

          {cat.rsvp && <section className="card p-5" aria-labelledby="rsvp"><h2 id="rsvp" className="h-display mb-3 text-xl font-semibold text-wine">Confirmações de presença</h2>
            <p className="text-sm">{rsum.yesGuests} pessoa(s) vão ({rsum.yes} respostas) · {rsum.maybe} talvez · {rsum.no} não · limite {plan.max_guests}</p>
            {rsvps.length > 0 && <ul className="mt-2 space-y-1 text-sm">{rsvps.map(r => <li key={r.id}><strong>{r.guest_name}</strong> · {r.attending === 'yes' ? `Vai (${r.guests})` : r.attending === 'no' ? 'Não vai' : 'Talvez'}{r.message ? ` · “${r.message}”` : ''}</li>)}</ul>}</section>}
          {replies.length > 0 && <section className="card p-5" aria-labelledby="resp"><h2 id="resp" className="h-display mb-3 text-xl font-semibold text-wine">Respostas do destinatário</h2>
            <ul className="space-y-2 text-sm">{replies.map(r => <li key={r.id} className={r.kind === 'answer' ? 'font-semibold' : ''}>{r.kind === 'answer' ? '★ ' : ''}{r.message} <span className="text-muted">({r.author || 'Anónimo'})</span></li>)}</ul></section>}

          <section className="card p-5" aria-labelledby="hist"><h2 id="hist" className="h-display mb-3 text-xl font-semibold text-wine">Histórico</h2>
            <ul className="space-y-1 text-sm">{events.map(e => <li key={e.id}><span className="text-muted">{e.created_at}</span> · {e.actor} · {e.from_status ? `${STATUS_LABEL[e.from_status] || e.from_status} → ` : ''}<strong>{STATUS_LABEL[e.to_status] || e.to_status}</strong>{e.note ? ` (${e.note})` : ''}</li>)}</ul></section>
        </div>

        <aside className="space-y-4">
          <section className="card space-y-3 p-5" aria-labelledby="acoes"><h2 id="acoes" className="h-display text-xl font-semibold text-wine">Ações</h2>
            {pending && (<>
              <form action={A.confirmPaymentAction}><Hidden /><ConfirmButton message="Confirmar que o pagamento foi recebido?" className="btn btn-primary w-full">Confirmar pagamento</ConfirmButton></form>
              <form action={A.rejectPaymentAction} className="space-y-2"><Hidden /><label className="sr-only" htmlFor="reason">Motivo da rejeição</label><input id="reason" name="reason" className="field" placeholder="Motivo (ex.: valor incorreto)" /><ConfirmButton message="Rejeitar este pagamento?" className="btn btn-secondary w-full">Rejeitar pagamento</ConfirmButton></form></>)}
            {st === 'payment_confirmed' && <form action={A.productionAction}><Hidden /><button className="btn btn-secondary w-full">Marcar em produção</button></form>}
            {canPublish && st !== 'published' && <form action={A.publishAction}><Hidden /><ConfirmButton message="Publicar esta carta? Ficará acessível pelo link privado." className="btn btn-primary w-full">{st === 'expired' ? 'Republicar' : 'Publicar carta'}</ConfirmButton></form>}
            {!canPublish && !pending && st !== 'published' && <p className="text-sm text-muted">A carta só pode ser publicada depois de o pagamento estar confirmado.</p>}
            {letter.is_published || st === 'published' ? <form action={A.blockAction}><Hidden /><input type="hidden" name="block" value={letter.is_blocked ? '0' : '1'} /><ConfirmButton message={letter.is_blocked ? 'Desbloquear a carta?' : 'Bloquear a carta? Ninguém a poderá abrir.'} className="btn btn-secondary w-full">{letter.is_blocked ? 'Desbloquear carta' : 'Bloquear carta'}</ConfirmButton></form> : null}
            {!order.completed_at && <form action={A.completeAction}><Hidden /><button className="btn btn-secondary w-full">Marcar como concluída</button></form>}
            {!['cancelled', 'expired'].includes(st) && <form action={A.cancelAction}><Hidden /><ConfirmButton message="Cancelar esta encomenda? A carta deixa de estar publicada." className="btn btn-ghost w-full">Cancelar encomenda</ConfirmButton></form>}
          </section>

          <section className="card p-5" aria-labelledby="exp"><h2 id="exp" className="h-display mb-2 text-lg font-semibold text-wine">Expiração</h2>
            <form action={A.expiryAction} className="space-y-2"><Hidden /><label className="sr-only" htmlFor="expires">Data de expiração</label><input id="expires" name="expires" type="date" className="field" defaultValue={letter.expires_at?.slice(0, 10)} /><button className="btn btn-secondary btn-sm w-full">Alterar data</button></form></section>

          <section className="card p-5" aria-labelledby="pin"><h2 id="pin" className="h-display mb-2 text-lg font-semibold text-wine">PIN {letter.pin_hash ? '(ativo)' : '(desativado)'}</h2>
            <form action={A.pinAction} className="space-y-2"><Hidden /><label className="sr-only" htmlFor="pin-in">Novo PIN</label><input id="pin-in" name="pin" inputMode="numeric" maxLength={6} className="field" placeholder="4 a 6 números (vazio = desativar)" /><button className="btn btn-secondary btn-sm w-full">{letter.pin_hash ? 'Alterar / desativar PIN' : 'Ativar PIN'}</button></form></section>

          <section className="card p-5" aria-labelledby="notas"><h2 id="notas" className="h-display mb-2 text-lg font-semibold text-wine">Notas internas</h2>
            <form action={A.notesAction} className="space-y-2"><Hidden /><label className="sr-only" htmlFor="notes">Notas</label><textarea id="notes" name="notes" className="field min-h-[90px]" defaultValue={order.admin_notes || ''} /><button className="btn btn-secondary btn-sm w-full">Guardar notas</button></form></section>

          <section className="card border-red-200 p-5" aria-labelledby="perigo"><h2 id="perigo" className="h-display mb-2 text-lg font-semibold text-red-800">Zona de perigo</h2>
            <form action={A.deleteContentsAction} className="mb-2"><Hidden /><ConfirmButton message="Eliminar o texto e todos os ficheiros desta carta? Não é possível desfazer." className="btn btn-secondary btn-sm w-full">Eliminar conteúdos</ConfirmButton></form>
            <form action={A.deleteOrderAction}><Hidden /><ConfirmButton message="Eliminar a encomenda, a carta e todos os ficheiros? Não é possível desfazer." className="btn btn-danger btn-sm w-full">Eliminar encomenda</ConfirmButton></form></section>
        </aside>
      </div>
    </div>
  );
}
