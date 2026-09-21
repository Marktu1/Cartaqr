import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { listOrders, metrics, ORDER_STATUSES, expireDue } from '@/lib/orders';
import { formatDate, formatMoney, STATUS_LABEL } from '@/lib/format';
import { analyticsSummary } from '@/lib/orders';
import { getCategory } from '@/lib/categories';
import { getSetting } from '@/lib/settings';

export default async function AdminHome(props: { searchParams: Promise<{ status?: string; q?: string; msg?: string }> }) {
  await requireAdmin();
  const searchParams = await props.searchParams;
  expireDue();
  const orders = listOrders({ status: searchParams.status, q: searchParams.q?.slice(0, 80) });
  const m = metrics(); const an = analyticsSummary(30); const cur = getSetting('currency');
  return (
    <div className="space-y-6">
      {searchParams.msg && <p role="status" className="rounded-xl bg-green-50 p-3 text-green-900">{searchParams.msg}</p>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[['A aguardar confirmação', m.awaiting], ['Cartas ativas', m.active], ['Receita confirmada', formatMoney(m.revenue, cur)], ['Total de encomendas', Object.values(m.byStatus).reduce((a, b) => a + b, 0)]].map(([l, v]) => (
          <div key={String(l)} className="card p-4"><p className="text-sm text-muted">{l}</p><p className="mt-1 text-2xl font-bold">{v}</p></div>))}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="card p-4"><p className="text-sm text-muted">Receita por tipo (confirmada)</p><p className="mt-1">Cartas: <strong>{formatMoney(m.cartas.revenue, cur)}</strong> ({m.cartas.n})</p><p>Eventos: <strong>{formatMoney(m.eventos.revenue, cur)}</strong> ({m.eventos.n})</p></div>
        <div className="card p-4"><p className="text-sm text-muted">Funil dos últimos 30 dias (contagens anónimas)</p><p className="mt-1 text-sm">Visitas <strong>{an.landing}</strong> → Preços <strong>{an.pricing}</strong> → Categorias <strong>{an.category}</strong> → Criador <strong>{an.wizard}</strong> → Encomendas <strong>{an.orders}</strong> → Pagas <strong>{an.paid}</strong></p></div>
      </div>
      <form className="card flex flex-col gap-3 p-4 sm:flex-row" role="search">
        <label className="sr-only" htmlFor="q">Pesquisar</label><input id="q" name="q" defaultValue={searchParams.q} placeholder="Pesquisar por nome, telefone, email ou código" className="field flex-1" />
        <label className="sr-only" htmlFor="status">Estado</label>
        <select id="status" name="status" defaultValue={searchParams.status || ''} className="field sm:w-56"><option value="">Todos os estados</option>{ORDER_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]} ({m.byStatus[s] || 0})</option>)}</select>
        <button className="btn btn-primary">Filtrar</button>
      </form>
      {orders.length === 0 ? <p className="card p-8 text-center text-muted">Nenhuma encomenda encontrada.</p> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <caption className="sr-only">Encomendas</caption>
            <thead><tr className="border-b border-wine/10 text-muted"><th scope="col" className="p-3">Código</th><th scope="col" className="p-3">Cliente</th><th scope="col" className="p-3">Carta</th><th scope="col" className="p-3">Categoria</th><th scope="col" className="p-3">Plano</th><th scope="col" className="p-3">Estado</th><th scope="col" className="p-3">Atualizada</th></tr></thead>
            <tbody>{orders.map(o => (
              <tr key={o.id} className="border-b border-wine/5 last:border-0 hover:bg-rose-soft/20">
                <td className="p-3 font-semibold"><Link href={`/admin/orders/${o.id}`} className="text-wine underline">{o.public_reference}</Link></td>
                <td className="p-3">{o.customer_name || '—'}<br /><span className="text-xs text-muted">{o.customer_phone || o.customer_email}</span></td>
                <td className="p-3">{o.title}<br /><span className="text-xs text-muted">para {o.recipient_name}</span></td>
                <td className="p-3">{getCategory(o.occasion).name}</td>
                <td className="p-3">{o.plan_name}<br /><span className="text-xs text-muted">{formatMoney(o.amount, o.currency)}</span></td>
                <td className="p-3"><span className={`chip ${o.order_status === 'proof_submitted' ? '!bg-gold/25 !text-ink' : ''}`}>{STATUS_LABEL[o.order_status]}</span>{o.is_blocked ? <span className="chip ml-1 !bg-red-100 !text-red-800">Bloqueada</span> : null}</td>
                <td className="p-3 text-muted">{formatDate(o.updated_at)}</td></tr>))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
