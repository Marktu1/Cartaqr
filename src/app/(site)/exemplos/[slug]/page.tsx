import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { DEMOS, placeholderSvg } from '@/lib/demo';
import { getCategory } from '@/lib/categories';
import { LetterView, type LetterViewData } from '@/components/LetterView';

export function generateStaticParams() { return DEMOS.map(d => ({ slug: d.slug })); }
export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const d = DEMOS.find(x => x.slug === params.slug);
  return { title: d ? `Exemplo: ${d.title}` : 'Exemplo', robots: { index: false } };
}

export default async function DemoPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const d = DEMOS.find(x => x.slug === params.slug); if (!d) notFound();
  const data: LetterViewData = {
    title: d.title, recipientName: d.recipient, senderName: d.sender, intro: d.intro, mainMessage: d.message, closingMessage: d.closing, specialDate: d.date, theme: d.theme,
    memories: d.memories, cover: { url: placeholderSvg(d.photos[0].hue, '', 900, 1200), alt: 'Imagem de demonstração' },
    photos: d.photos.map(p => ({ url: placeholderSvg(p.hue, p.caption), caption: p.caption, alt: `Imagem de demonstração: ${p.caption}` })),
    video: null, audios: [], ambient: 'piano-suave', allowReply: false,
    category: d.category, extra: d.extra || {}, demo: true, rsvp: getCategory(d.category).rsvp ? { open: true } : undefined,
  };
  return (
    <>
      <div className="sticky top-16 z-30 border-b border-gold/30 bg-gold/15 px-4 py-2 text-center text-sm">
        <strong>Exemplo fictício</strong> · nomes e imagens de demonstração. <Link href="/criar" className="font-semibold text-wine underline">Criar a minha</Link>
      </div>
      <LetterView data={data} />
    </>
  );
}
