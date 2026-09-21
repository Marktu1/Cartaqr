import Link from 'next/link';
import { getPublicSettings, whatsappLink } from '@/lib/settings';
import { NewsletterPopup } from '@/components/NewsletterPopup';
import { NewsletterForm } from '@/components/NewsletterForm';

export const dynamic = 'force-dynamic';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const s = getPublicSettings();
  return (
    <>
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-full focus:bg-wine focus:px-4 focus:py-2 focus:text-white">Saltar para o conteúdo</a>
      <header className="sticky top-0 z-40 border-b border-wine/10 bg-cream/90 backdrop-blur">
        <div className="section flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Carta QR, página inicial">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="" width={40} height={42} className="h-11 w-auto" />
            <span className="leading-none"><span className="h-display block text-[1.65rem] font-semibold text-wine">Carta QR</span><span className="mt-1 hidden text-[9px] uppercase tracking-[.22em] text-wine/70 sm:block">Conectando mensagens digitalmente</span></span>
          </Link>
          <nav aria-label="Principal" className="flex items-center gap-1 sm:gap-3">
            <Link href="/precos" className="btn btn-ghost btn-sm">Preços</Link>
            <Link href="/contacto" className="btn btn-ghost btn-sm hidden sm:inline-flex">Contacto</Link>
            <Link href="/criar" className="btn btn-primary btn-sm">Criar carta</Link>
          </nav>
        </div>
      </header>
      <div id="conteudo">{children}</div>
      <NewsletterPopup enabled={s.newsletterPopup} />
      <footer className="mt-24 border-t border-wine/10 bg-paper py-10 text-sm text-muted">
        <div className="section flex flex-col gap-6 sm:flex-row sm:justify-between">
          <div>{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/logo-full.png" alt="Carta QR — Conectando mensagens digitalmente" width={511} height={422} className="h-32 w-auto" /><p className="mt-3 max-w-xs">Transforma uma mensagem num presente digital inesquecível.</p></div>
          <div className="max-w-sm sm:order-last"><p className="h-display text-lg font-semibold text-wine">Newsletter</p><p className="mb-3 mt-1">Ideias de mensagens e novidades no teu email.</p><NewsletterForm source="footer" compact /></div>
          <nav aria-label="Rodapé" className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/precos" className="hover:text-wine">Preços</Link><Link href="/contacto" className="hover:text-wine">Contacto</Link>
            <Link href="/privacidade" className="hover:text-wine">Privacidade</Link><Link href="/termos" className="hover:text-wine">Termos de uso</Link>
          </nav>
        </div>
      </footer>
      <a href={whatsappLink(s.whatsapp, 'Olá! Tenho uma dúvida sobre a Carta QR.')} target="_blank" rel="noopener noreferrer"
        className="fixed bottom-4 right-4 z-40 inline-flex min-h-[52px] items-center gap-2 rounded-full bg-[#1F8A4C] px-5 py-3 font-semibold text-white shadow-lg hover:bg-[#186f3d]" aria-label="Falar connosco no WhatsApp">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.8 14.1c-.2.7-1.4 1.3-1.9 1.3-.5.1-1.1.1-1.8-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5-4.5-.2-.2-1.2-1.6-1.2-3s.8-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6c-.2.2-.3.4-.1.7.2.3.8 1.3 1.8 2.1 1.2 1.1 2.3 1.4 2.6 1.6.3.1.5.1.7-.1.2-.3.8-.9 1-1.2.2-.3.4-.2.7-.1l2 1c.3.1.5.2.6.3.1.2.1.8-.1 1.5Z"/></svg>
        <span className="hidden sm:inline">WhatsApp</span>
      </a>
    </>
  );
}
