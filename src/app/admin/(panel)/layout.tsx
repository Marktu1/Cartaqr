import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { logoutAction } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin', robots: { index: false, follow: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-screen bg-[#F6F2EC]">
      <header className="border-b border-wine/10 bg-paper">
        <div className="section flex flex-wrap items-center justify-between gap-2 py-3">
          <Link href="/admin" className="flex items-center gap-2">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/logo-mark.png" alt="" width={30} height={32} className="h-8 w-auto" /><span className="h-display text-lg font-semibold text-wine">Carta QR · Admin</span></Link>
          <nav className="flex flex-wrap items-center gap-1" aria-label="Admin">
            <Link href="/admin" className="btn btn-ghost btn-sm">Encomendas</Link><Link href="/admin/mensagens" className="btn btn-ghost btn-sm">Mensagens</Link><Link href="/admin/newsletter" className="btn btn-ghost btn-sm">Newsletter</Link><Link href="/admin/settings" className="btn btn-ghost btn-sm">Configurações</Link>
            <form action={logoutAction}><button className="btn btn-secondary btn-sm">Sair</button></form>
          </nav>
        </div>
      </header>
      <div className="section py-6">{children}</div>
    </div>
  );
}
