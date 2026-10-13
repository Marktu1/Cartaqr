'use client';
import { experienceIdOf } from '@/lib/experiences';
import { LetterView, type LetterViewData } from './LetterView';
import { Refinado } from './experiences/Refinado';
import { Pedido } from './experiences/Pedido';
import { Familia } from './experiences/Familia';

/** Escolhe a experiência de cada ocasião. Todas recebem os mesmos dados, só muda a apresentação. */
export function ExperienceView({ data, startOpen = false, embedded = false }: { data: LetterViewData; startOpen?: boolean; embedded?: boolean }) {
  switch (experienceIdOf(data.category)) {
    case 'refinado': return <Refinado data={data} startOpen={startOpen} embedded={embedded} />;
    case 'pedido': return <Pedido data={data} startOpen={startOpen} embedded={embedded} />;
    case 'familia': return <Familia data={data} startOpen={startOpen} embedded={embedded} />;
    default: return <LetterView data={data} startOpen={startOpen} embedded={embedded} />;
  }
}
