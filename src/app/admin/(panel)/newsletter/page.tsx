import { requireAdmin } from '@/lib/auth';
import { listSubscribers, subscriberStats } from '@/lib/newsletter';
import { formatDate } from '@/lib/format';
import { deleteSubscriberAction } from '../../actions';

export default async function NewsletterAdmin() {
  await requireAdmin();
  const st = subscriberStats(); const subs = listSubscribers();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="h-display text-3xl font-semibold text-wine">Newsletter</h1>
        <a className="btn btn-primary btn-sm" href="/api/admin/newsletter">Exportar inscritos ativos (CSV)</a></div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="card p-4"><p className="text-sm text-muted">Inscritos ativos</p><p className="mt-1 text-2xl font-bold" data-testid="nl-active">{st.active}</p></div>
        <div className="card p-4"><p className="text-sm text-muted">Total (com saídas)</p><p className="mt-1 text-2xl font-bold">{st.total}</p></div>
        <div className="card col-span-2 p-4"><p className="text-sm text-muted">Origem dos ativos</p><p className="mt-1 text-sm">{st.bySource.length ? st.bySource.map(s => `${s.source}: ${s.n}`).join(' · ') : '—'}</p></div>
      </div>
      <p className="rounded-xl bg-gold/10 p-3 text-sm">Usa o CSV no teu serviço de email marketing (Mailchimp, Brevo, MailerLite…). Só exportamos quem deu consentimento e não saiu. Lembra-te de incluir sempre o link para sair em cada email.</p>
      {subs.length === 0 ? <p className="card p-8 text-center text-muted">Ainda sem inscritos.</p> : (
        <div className="card overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><caption className="sr-only">Inscritos</caption>
          <thead><tr className="border-b border-wine/10 text-muted"><th scope="col" className="p-3">Email</th><th scope="col" className="p-3">Origem</th><th scope="col" className="p-3">Data</th><th scope="col" className="p-3">Estado</th><th scope="col" className="p-3"><span className="sr-only">Ações</span></th></tr></thead>
          <tbody>{subs.map(s => (<tr key={s.id} className="border-b border-wine/5 last:border-0"><td className="p-3 font-semibold">{s.email}</td><td className="p-3">{s.source}</td><td className="p-3 text-muted">{formatDate(s.consent_at)}</td>
            <td className="p-3">{s.unsubscribed_at ? <span className="chip !bg-red-100 !text-red-800">Saiu</span> : <span className="chip">Ativo</span>}</td>
            <td className="p-3"><form action={deleteSubscriberAction}><input type="hidden" name="id" value={s.id} /><button className="btn btn-ghost btn-sm">Eliminar</button></form></td></tr>))}</tbody></table></div>)}
    </div>
  );
}
