import type { Experience } from './experience';

// Experiências de demonstração: textos fictícios. Fotos do Unsplash (licença gratuita) quando `img` está definido; senão, imagem gerada (SVG).
export type DemoLetter = {
  slug: string; category: string; extra?: Record<string, string>; occasion: string; theme: string; title: string; recipient: string; sender: string; intro: string; message: string;
  closing: string; date: string; memories: { title: string; description: string; date?: string; place?: string }[]; experience?: Experience; photos: { caption: string; hue: number; img?: string; credit?: string }[]; blurb: string;
};

export const DEMOS: DemoLetter[] = [
  {
    slug: 'pessoa-favorita', category: 'aniversario', extra: { age: '30' }, occasion: 'Aniversário romântico', theme: 'romantico', title: 'Para a minha pessoa favorita', recipient: 'Ana Exemplo', sender: 'Bruno Exemplo',
    blurb: 'Um aniversário com memórias a dois.', date: '2026-03-14',
    intro: 'Hoje o dia é teu, mas o presente também é meu: poder escrever isto.',
    message: 'Ana,\n\nHá pessoas que chegam devagar e ficam para sempre. Tu chegaste a rir, com aquele jeito de quem já conhece o mundo todo, e de repente o meu mundo ficou mais pequeno e mais bonito.\n\nObrigado pelas conversas sem hora, pelos domingos sem pressa e por acreditares em mim quando eu ainda estava a aprender a acreditar.\n\nQue este novo ano te devolva tudo o que dás aos outros.',
    closing: 'Parabéns, meu amor. Vamos continuar?', memories: [
      { title: 'A primeira conversa', description: 'Começou com uma pergunta simples e acabou às duas da manhã. Ainda hoje não sei quem desligou primeiro.', date: '2022-05-08', place: 'Talatona' },
      { title: 'O passeio na Marginal', description: 'O dia em que o carro avariou junto à baía e nós rimos o caminho todo até casa.', date: '2023-08-19', place: 'Marginal de Luanda' },
      { title: 'O nosso café de domingo', description: 'O ritual que já ninguém nos tira: café, pão com chouriço e conversa sem pressa.', date: '2024-11-03', place: 'Ilha de Luanda' }],
    experience: {
      teaser: 'Ana, hoje o mundo celebra-te… mas eu tenho uma coisa só minha para te dizer.', mood: 'por-do-sol',
      cardsTitle: 'Razões porque te amo', cards: ['O teu sorriso logo de manhã, mesmo antes do café', 'A forma como cuidas de toda a gente', 'Danças kizomba mal e com o maior orgulho do mundo', 'Acreditas em mim mais do que eu', 'O teu abraço resolve qualquer dia mau', 'Porque és tu. Simplesmente.'],
      vouchers: ['Vale um mufete na Ilha, só nós dois', 'Vale uma noite de kizomba (eu deixo-te conduzir)', 'Vale um dia sem loiça'],
      secret: { hint: 'Onde foi o nosso primeiro beijo?', answer: 'Mussulo', message: 'No Mussulo, ao pôr do sol, com areia nos pés e o coração aos saltos. Foi nesse segundo que percebi: era contigo.' },
      finale: { text: 'Amo-te mais do que ontem e menos do que amanhã.', gesture: 'raspar' },
      later: { date: '2027-03-14', message: 'Mais um ano contigo. Abre esta parte no teu próximo aniversário: tenho uma nova surpresa à tua espera.' },
    },
    photos: [{ caption: 'Um dia qualquer que ficou especial', hue: 350, img: 'photo-1644041852210-4873f99366be', credit: 'Francis Odeyemi' }, { caption: 'O teu sorriso', hue: 10, img: 'photo-1508002366005-75a695ee2d17', credit: 'Isaiah McClean' }, { caption: 'Domingo', hue: 25, img: 'photo-1743172086091-b95acd708315', credit: 'Shawn Clark' }, { caption: 'Nós', hue: 340, img: 'photo-1655683576616-c40706fa79f2', credit: 'Iwaria Inc.' }],
  },
  {
    slug: 'pergunta-para-ti', category: 'pedido-namoro', occasion: 'Pedido de namoro', theme: 'elegante', title: 'Tenho uma pergunta para ti', recipient: 'Carla Exemplo', sender: 'Diogo Exemplo',
    blurb: 'A pergunta que muda tudo.', date: '2026-02-14',
    intro: 'Li isto mil vezes antes de te mostrar. Peço-te só que leias até ao fim.',
    message: 'Carla,\n\nDesde que te conheço, os dias têm outra cor. Gosto da forma como ouves, de como ris de ti própria e de como fazes as pessoas sentirem-se em casa.\n\nNão sei fazer discursos bonitos, mas sei o que sinto: quero estar ao teu lado, com calma, com respeito e com muitas gargalhadas.\n\nPor isso, a pergunta é simples.',
    closing: 'Queres namorar comigo?', memories: [
      { title: 'O dia da biblioteca', description: 'Foi ali que percebi que a tua companhia era o meu sítio favorito.', date: '2025-03-10', place: 'Baixa de Luanda' },
      { title: 'A chuva inesperada', description: 'Partilhámos um guarda-chuva e nunca mais o devolvemos.', date: '2025-11-22', place: 'Maianga' }],
    experience: {
      teaser: 'Carla, respira fundo… isto é só para ti.', mood: 'chuva',
      cardsTitle: 'Porque és tu', cards: ['Ouves de verdade, mesmo quando falo demais', 'Ris de ti própria sem medo', 'Fazes toda a gente sentir-se em casa', 'Contigo, até a chuva é boa'],
      finale: { text: 'Já sei a resposta que espero ouvir… mas a decisão é toda tua.', gesture: 'caixa' },
    },
    photos: [{ caption: 'Um instante nosso', hue: 38, img: 'photo-1765292783377-e2b769632228', credit: 'sammy swae' }, { caption: 'Onde tudo começou', hue: 30, img: 'photo-1682107845065-f89ebccb1523', credit: 'Ruben Cabango' }, { caption: 'Sempre a rir', hue: 45, img: 'photo-1611619669093-ea9860cf027f', credit: 'Gama. Films' }],
  },
  {
    slug: 'proximo-capitulo', category: 'formatura', extra: { course: 'Engenharia Informática' }, occasion: 'Formatura', theme: 'celebracao', title: 'O teu próximo capítulo começa agora', recipient: 'Eduardo Exemplo', sender: 'A tua família',
    blurb: 'Uma homenagem a quem conquistou o diploma.', date: '2026-07-10',
    intro: 'Cada madrugada de estudo valeu a pena. Hoje, o país ganha mais um profissional e nós ganhamos mais um orgulho.',
    message: 'Eduardo,\n\nVimos-te crescer, cair, levantar e continuar. Vimos as noites em claro, os cadernos cheios e a teimosia de quem não desiste.\n\nHoje fechas um capítulo com o teu nome escrito em cada página. Que o próximo seja ainda maior, e que nunca percas a humildade que te trouxe até aqui.\n\nEstamos sempre contigo.',
    closing: 'Parabéns, doutor(a) da nossa vida!', memories: [
      { title: 'O primeiro dia', description: 'Entraste com medo e um caderno novo. A mãe acordou às cinco para te fazer o pequeno-almoço.', date: '2021-09-20', place: 'Luanda' },
      { title: 'A semana de exames', description: 'Café, foco, falhas de luz e a promessa de que ia valer a pena.', date: '2025-06-12', place: 'Biblioteca da faculdade' },
      { title: 'A defesa', description: 'O dia em que todos choraram de orgulho, até o tio que diz que nunca chora.', date: '2026-06-30', place: 'Auditório principal' }],
    experience: {
      teaser: 'Eduardo, a família inteira tem uma coisa para te dizer…', mood: 'panos',
      cardsTitle: 'Porque temos orgulho de ti', cards: ['Nunca desististe, nem nas noites sem luz', 'Ajudaste os teus irmãos mesmo em época de exames', 'Continuas humilde', 'És o primeiro engenheiro da família', 'Porque o melhor ainda está para vir'],
      vouchers: ['Vale um almoço de domingo com a muamba da avó', 'Vale uma festa com a família toda'],
      finale: { text: 'O primeiro engenheiro da família. E o orgulho de todos nós.', gesture: 'fita' },
    },
    photos: [{ caption: 'Dia de festa', hue: 5, img: 'photo-1612214495858-4f32b96155a7', credit: 'Felipe Gregate' }, { caption: 'Com quem nunca desistiu de ti', hue: 20, img: 'photo-1594750852532-822048f24b14', credit: 'Nqobile Vundla' }, { caption: 'O futuro é teu', hue: 350, img: 'photo-1594750852563-5ed8e0421d40', credit: 'Nqobile Vundla' }],
  },
  {
    slug: 'convite-casamento', category: 'convite-casamento', extra: { time: '16:00', venue: 'Salão Jardim das Acácias', address: 'Talatona, Luanda (exemplo)', dressCode: 'Traje social', rsvpDeadline: '2027-05-15', transport: 'Um autocarro privado parte às 15:00 do Largo da Independência e leva os convidados diretamente ao salão.\nNo fim da noite haverá regresso à cidade.', stay: 'Para quem vem de fora, reservámos quartos no Hotel Exemplo, a 5 minutos do salão.\nTarifa especial com o código “MARTA & RUI”.', gift: 'A vossa presença é o nosso maior presente. Se quiserem contribuir para a nossa lua de mel:\nIBAN AO06 0000 0000 0000 0000 0000 0 (exemplo)' },
    occasion: 'Convite de casamento', theme: 'gala', title: 'Vamos celebrar o nosso sim', recipient: 'Família e amigos', sender: 'Marta & Rui Exemplo',
    blurb: 'Convite digital com confirmação de presença.', date: '2027-06-19',
    intro: 'Duas famílias, um só coração. Queremos-te connosco neste dia.',
    message: 'Queridos amigos e familiares,\n\nDepois de tantos passos dados lado a lado, chegou o dia de dizermos sim diante de quem mais amamos.\n\nSerá uma honra ter-vos connosco para celebrar, dançar e brindar ao futuro.',
    closing: 'Contamos convosco!', memories: [
      { title: '16:00 Cerimónia', description: 'Receção dos convidados às 15:30.' },
      { title: '18:00 Copo de água', description: 'Cocktail nos jardins.' },
      { title: '20:00 Jantar e festa', description: 'Muita música e alegria.' }],
    experience: { teaser: 'A Marta e o Rui têm uma notícia para te dar…' },
    photos: [{ caption: 'Marta & Rui', hue: 45, img: 'photo-1695281536457-01f9a07c575b', credit: 'Samwel francis' }, { caption: 'O nosso caminho', hue: 30, img: 'photo-1595157724160-4aca7d33ea23', credit: 'Roman Derrick Okello' }],
  },
  {
    slug: 'para-a-mae', category: 'dia-mae', extra: { lesson: 'A nunca desistir' }, occasion: 'Dia da Mãe', theme: 'familiar', title: 'Obrigado, mãe', recipient: 'Mamã', sender: 'Os teus filhos',
    blurb: 'Uma carta cheia de recordações para a mãe.', date: '2027-05-02',
    intro: 'Há coisas que só uma mãe sabe fazer: amar sem pedir nada em troca.',
    message: 'Mamã,\n\nCresci a ver-te acordar antes de todos e adormecer depois de todos. Só agora percebo quanto isso custava e como o fazias parecer fácil.\n\nObrigado pelos domingos com cheiro a comida de casa, pelos conselhos que nunca pedi e que sempre precisei, e pelo abraço que resolve tudo.',
    closing: 'Amo-te, mãe. Feliz Dia da Mãe.', memories: [
      { title: 'A cozinha aos domingos', description: 'O cheiro do teu guisado a chamar toda a gente à mesa.' },
      { title: 'O primeiro dia de aulas', description: 'Seguraste-me a mão até eu ganhar coragem.', date: '2005-09-12' },
      { title: 'As viagens de carro', description: 'As tuas canções desafinadas que ainda sei de cor.' }],
    photos: [{ caption: 'Domingo em família', hue: 28 }, { caption: 'Os teus abraços', hue: 15 }, { caption: 'Sempre juntos', hue: 40 }],
  },
];

export function placeholderSvg(hue: number, label: string, w = 800, h = 1000): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="hsl(${hue} 60% 86%)"/><stop offset="1" stop-color="hsl(${(hue + 25) % 360} 45% 62%)"/></linearGradient></defs>
<rect width="${w}" height="${h}" fill="url(#g)"/><circle cx="${w * 0.7}" cy="${h * 0.3}" r="${w * 0.18}" fill="rgba(255,255,255,.35)"/>
<path d="M0 ${h * 0.75} Q ${w * 0.3} ${h * 0.6} ${w * 0.6} ${h * 0.78} T ${w} ${h * 0.7} V ${h} H0Z" fill="rgba(110,31,47,.25)"/>
<text x="50%" y="92%" text-anchor="middle" font-family="Georgia,serif" font-size="30" fill="rgba(255,255,255,.9)">Imagem de demonstração</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** URL da foto de demonstração: Unsplash se houver `img`, senão o SVG gerado. */
export function demoImage(p: { hue: number; img?: string }, label: string, w = 800, h = 1000): string {
  if (p.img) return `https://images.unsplash.com/${p.img}?w=${w}&h=${h}&fit=crop&crop=faces&auto=format&q=70`;
  return placeholderSvg(p.hue, label, w, h);
}
