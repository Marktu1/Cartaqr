import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { DEMOS, demoImage } from '@/lib/demo';
import { publicExperience } from '@/lib/experience';
import { getCategory } from '@/lib/categories';
import { LetterView, type LetterViewData } from '@/components/LetterView';

export function generateStaticParams() { return DEMOS.map(d => ({ slug: d.slug })); }
export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const d = DEMOS.find(x => x.slug === params.slug);
  return { title: d ? `Exemplo: ${d.title}` : 'Exemplo', robots: { index: false } };
}

/** Nos exemplos o segredo abre com qualquer resposta, mas a "surpresa para mais tarde" fica fechada, como na vida real. */
function demoExperience(e: Parameters<typeof publicExperience>[0] | undefined) {
  const p = publicExperience(e || {}, { reveal: true });
  if (e?.later) p.later = { date: e.later.date, open: false };
  return p;
}

export default async function DemoPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const d = DEMOS.find(x => x.slug === params.slug); if (!d) notFound();
  const data: LetterViewData = {
    title: d.title, recipientName: d.recipient, senderName: d.sender, intro: d.intro, mainMessage: d.message, closingMessage: d.closing, specialDate: d.date, theme: d.theme,
    memories: d.memories, cover: { url: demoImage(d.photos[0], '', 900, 1200), alt: 'Imagem de demonstração' },
    photos: d.photos.slice(1).map(p => ({ url: demoImage(p, p.caption), caption: p.caption, alt: `Imagem de demonstração: ${p.caption}` })), // a 1.ª é a capa
    video: null, audios: [], ambient: 'piano-suave', allowReply: false,
    category: d.category, extra: d.extra || {}, demo: true, rsvp: getCategory(d.category).rsvp ? { open: true } : undefined,
    experience: demoExperience(d.experience), capsules: [],
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
