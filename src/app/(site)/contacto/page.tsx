import type { Metadata } from 'next';
import { ContactForm } from '@/components/ContactForm';
import { getPublicSettings, whatsappLink } from '@/lib/settings';

export const metadata: Metadata = { title: 'Contacto' };

export default function Contacto() {
  const s = getPublicSettings();
  return (
    <div className="section max-w-2xl py-12">
      <h1 className="h-display text-4xl font-semibold text-wine">Fala connosco</h1>
      <p className="mt-3 text-muted">Dúvidas, pedidos de alteração ou ajuda com a tua encomenda? A forma mais rápida é o WhatsApp.</p>
      <a href={whatsappLink(s.whatsapp, 'Olá! Preciso de ajuda com a Carta QR.')} target="_blank" rel="noopener noreferrer" className="btn mt-6 w-full bg-[#1F8A4C] text-white hover:bg-[#186f3d] sm:w-auto">Abrir conversa no WhatsApp</a>
      <h2 className="h-display mb-4 mt-12 text-2xl font-semibold text-wine">Ou envia-nos uma mensagem</h2>
      <ContactForm />
    </div>
  );
}
