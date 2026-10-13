import type { Metadata } from 'next';
import { RefinedInvitation, type RefinedData } from '@/components/letter/RefinedInvitation';

export const metadata: Metadata = { title: 'Exemplo: convite refinado', robots: { index: false } };

const data: RefinedData = {
  names: 'Inês & Tomás', dateISO: '2027-05-22T17:00:00', dateLabel: '22 de maio de 2027 · Sintra', kicker: 'Convidam-vos para o seu casamento',
  welcome: 'Juntos, com as nossas famílias',
  story: 'A Inês e o Tomás pedem o prazer da vossa companhia para celebrarem o seu casamento e começarem este novo capítulo rodeados de quem mais amam. (Exemplo fictício.)',
  place: 'Quinta das Rosas', placeSub: 'Sintra · Portugal',
  placeText: 'Uma quinta do século XIX, com jardins e vista para a serra. Sugerimos que cheguem um pouco antes para se instalarem e aproveitarem o cenário antes da cerimónia.',
  mapUrl: 'https://maps.google.com/',
  program: [
    { time: '16:30', title: 'Receção', text: 'Chegada dos convidados aos jardins, com bebidas e abraços de boas-vindas.' },
    { time: '17:00', title: 'Cerimónia', text: 'Dizemos “sim” nos jardins, com vista para a serra ao pôr do sol.' },
    { time: '18:00', title: 'Aperitivo', text: 'Petiscos no terraço enquanto os fotógrafos captam o momento.' },
    { time: '20:00', title: 'Jantar', text: 'Um jantar à luz das velas, com brindes e boa conversa.' },
    { time: '22:30', title: 'Festa', text: 'Música e dança até tarde.' },
  ],
  dressCode: { title: 'Dress code', text: 'Pedimos traje formal de noite. Vistam-se com elegância, escolham o que for confortável e venham prontos para celebrar.' },
  transport: { text: 'Um autocarro privado parte às 15:45 da Praça da República, em Lisboa, e leva os convidados diretamente à quinta. No fim da noite, haverá regresso a Lisboa.', pickup: 'https://maps.google.com/' },
  stay: { name: 'Hotel Palácio da Serra', dates: '21 – 23 mai 2027', code: '“INES & TOMAS”', parking: 'Disponível no local', text: 'Para quem vem de fora, escolhemos um alojamento perto da quinta.', url: 'https://example.com/' },
  gift: { text: 'Se quiserem presentear-nos, podem fazê-lo por transferência bancária.', iban: 'PT50 0000 0000 0000 0000 0000 0' },
};

export default function Page() {
  return <RefinedInvitation data={data} />;
}
