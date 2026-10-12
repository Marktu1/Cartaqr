import Link from 'next/link';
import { getPublicSettings, whatsappLink } from '@/lib/settings';
import { NewsletterPopup } from '@/components/NewsletterPopup';
import { NewsletterForm } from '@/components/NewsletterForm';
import { ScrollReveal } from '@/components/ScrollReveal';

export const dynamic = 'force-dynamic';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const s = getPublicSettings();
  return (
    <>
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-full focus:bg-wine focus:px-4 focus:py-2 focus:text-white">Saltar para o conteúdo</a>
      <header className="glass sticky top-0 z-40 border-b border-black/[.06]">
        <div className="mx-auto flex h-12 w-full max-w-[1024px] items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2" aria-label="Carta QR, página inicial">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="" width={40} height={42} className="h-7 w-auto" />
            <span className="h-display text-[19px] font-semibold leading-none text-wine">Carta QR</span>
          </Link>
          <nav aria-label="Principal" className="flex items-center gap-1 text-[13px] sm:gap-2">
            <Link href="/#ocasioes" className="hidden rounded-full px-3 py-2 text-ink/80 transition-colors hover:text-ink md:inline-flex">Ocasiões</Link>
            <Link href="/#eventos" className="hidden rounded-full px-3 py-2 text-ink/80 transition-colors hover:text-ink md:inline-flex">Eventos</Link>
            <Link href="/#exemplos" className="hidden rounded-full px-3 py-2 text-ink/80 transition-colors hover:text-ink md:inline-flex">Exemplos</Link>
            <Link href="/precos" className="rounded-full px-3 py-2 text-ink/80 transition-colors hover:text-ink">Preços</Link>
            <Link href="/contacto" className="hidden rounded-full px-3 py-2 text-ink/80 transition-colors hover:text-ink sm:inline-flex">Contacto</Link>
            <Link href="/criar" className="btn btn-primary btn-sm ml-1">Criar carta</Link>
          </nav>
        </div>
      </header>
      <ScrollReveal />
      <div id="conteudo">{children}</div>
      <NewsletterPopup enabled={s.newsletterPopup} />
      <footer className="bg-mist pb-8 pt-12 text-xs leading-relaxed text-muted">
        <div className="mx-auto w-full max-w-[1024px] px-5 sm:px-6">
          <div className="grid gap-10 border-b border-black/10 pb-10 sm:grid-cols-[1.3fr_1fr_1fr]">
            <div>
              <Link href="/" className="inline-flex items-center gap-2" aria-label="Carta QR, página inicial">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-mark.png" alt="" width={40} height={42} className="h-9 w-auto" />
                <span className="leading-none"><span className="h-display block text-xl font-semibold text-wine">Carta QR</span><span className="mt-1 block text-[9px] uppercase tracking-[.22em] text-wine/70">Conectando mensagens digitalmente</span></span>
              </Link>
              <p className="mt-4 max-w-xs text-[13px]">Transforma uma mensagem num presente digital inesquecível.</p>
            </div>
            <nav aria-label="Rodapé">
              <p className="mb-2 text-[13px] font-semibold text-ink">Carta QR</p>
              <ul className="space-y-2 text-[13px]">
                <li><Link href="/criar" className="hover:text-ink hover:underline">Criar carta</Link></li>
                <li><Link href="/precos" className="hover:text-ink hover:underline">Preços</Link></li>
                <li><Link href="/precos#eventos" className="hover:text-ink hover:underline">Eventos</Link></li>
                <li><Link href="/contacto" className="hover:text-ink hover:underline">Contacto</Link></li>
              </ul>
            </nav>
            <div>
              <p className="mb-2 text-[13px] font-semibold text-ink">Newsletter</p>
              <p className="mb-3 text-[13px]">Ideias de mensagens e novidades no teu email.</p>
              <NewsletterForm source="footer" compact />
            </div>
          </div>
          <div className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p>Copyright © {new Date().getFullYear()} Carta QR. Todos os direitos reservados.</p>
            <nav aria-label="Legal" className="flex gap-4">
              <Link href="/privacidade" className="hover:text-ink hover:underline">Privacidade</Link>
              <span aria-hidden className="text-black/20">|</span>
              <Link href="/termos" className="hover:text-ink hover:underline">Termos de uso</Link>
            </nav>
          </div>
        </div>
      </footer>
      <a href={whatsappLink(s.whatsapp, 'Olá! Tenho uma dúvida sobre a Carta QR.')} target="_blank" rel="noopener noreferrer"
        className="fixed bottom-4 right-4 z-40 inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[#1F8A4C] px-4 py-2.5 text-[15px] font-medium text-white shadow-[0_8px_24px_-8px_rgba(0,0,0,.35)] transition-colors hover:bg-[#186f3d]" aria-label="Falar connosco no WhatsApp">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.8 14.1c-.2.7-1.4 1.3-1.9 1.3-.5.1-1.1.1-1.8-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5-4.5-.2-.2-1.2-1.6-1.2-3s.8-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6c-.2.2-.3.4-.1.7.2.3.8 1.3 1.8 2.1 1.2 1.1 2.3 1.4 2.6 1.6.3.1.5.1.7-.1.2-.3.8-.9 1-1.2.2-.3.4-.2.7-.1l2 1c.3.1.5.2.6.3.1.2.1.8-.1 1.5Z"/></svg>
        <span className="hidden sm:inline">WhatsApp</span>
      </a>
    </>
  );
}
