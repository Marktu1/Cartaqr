import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || 'http://localhost:3000'),
  title: { default: 'Carta QR — Transforma uma mensagem num presente digital inesquecível', template: '%s · Carta QR' },
  description: 'Cria uma carta digital personalizada com fotografias, vídeo e áudio, e recebe um link privado e um QR Code para oferecer a alguém especial.',
  openGraph: {
    title: 'Carta QR — Um presente digital inesquecível', description: 'Transforma as tuas fotografias, palavras e memórias numa carta digital com link privado e QR Code.',
    type: 'website', locale: 'pt_AO', siteName: 'Carta QR', images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Carta QR' }],
  },
  twitter: { card: 'summary_large_image' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#FAF8F3' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="pt-AO"><body className="min-h-screen antialiased">{children}</body></html>);
}
