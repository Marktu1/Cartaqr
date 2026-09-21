import { all } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { formatDate } from '@/lib/format';

export default async function Mensagens() {
  await requireAdmin();
  const msgs = all('SELECT * FROM contact_messages ORDER BY id DESC LIMIT 100');
  return (<div><h1 className="h-display mb-4 text-3xl font-semibold text-wine">Mensagens de contacto</h1>
    {msgs.length === 0 ? <p className="card p-8 text-center text-muted">Ainda não há mensagens.</p> : <ul className="space-y-3">{msgs.map(m => <li key={m.id} className="card p-4"><p className="font-semibold">{m.name} · <span className="font-normal text-muted">{m.contact}</span></p><p className="mt-1 whitespace-pre-line">{m.message}</p><p className="mt-1 text-xs text-muted">{formatDate(m.created_at)}</p></li>)}</ul>}</div>);
}
