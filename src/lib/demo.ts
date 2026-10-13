// Experiências de demonstração: dados totalmente fictícios, imagens geradas (SVG), sem pessoas reais.
export type DemoLetter = {
  slug: string; category: string; extra?: Record<string, string>; occasion: string; theme: string; title: string; recipient: string; sender: string; intro: string; message: string;
  closing: string; date: string; memories: { title: string; description: string; date?: string }[]; photos: { caption: string; hue: number }[]; blurb: string;
};

export const DEMOS: DemoLetter[] = [
  {
    slug: 'pessoa-favorita', category: 'aniversario', extra: { age: '30' }, occasion: 'Aniversário romântico', theme: 'romantico', title: 'Para a minha pessoa favorita', recipient: 'Ana Exemplo', sender: 'Bruno Exemplo',
    blurb: 'Um aniversário com memórias a dois.', date: '2026-03-14',
    intro: 'Hoje o dia é teu, mas o presente também é meu: poder escrever isto.',
    message: 'Ana,\n\nHá pessoas que chegam devagar e ficam para sempre. Tu chegaste a rir, com aquele jeito de quem já conhece o mundo todo, e de repente o meu mundo ficou mais pequeno e mais bonito.\n\nObrigado pelas conversas sem hora, pelos domingos sem pressa e por acreditares em mim quando eu ainda estava a aprender a acreditar.\n\nQue este novo ano te devolva tudo o que dás aos outros.',
    closing: 'Parabéns, meu amor. Vamos continuar?', memories: [
      { title: 'A primeira conversa', description: 'Começou com uma pergunta simples e acabou às duas da manhã.', date: '2022-05-08' },
      { title: 'A viagem à praia', description: 'O dia em que o carro avariou e nós rimos o caminho todo.', date: '2023-08-19' },
      { title: 'O nosso café de domingo', description: 'O ritual que já ninguém nos tira.', date: '2024-11-03' }],
    photos: [{ caption: 'Um dia qualquer que ficou especial', hue: 350 }, { caption: 'O teu sorriso', hue: 10 }, { caption: 'Domingo', hue: 25 }, { caption: 'Nós', hue: 340 }],
  },
  {
    slug: 'pergunta-para-ti', category: 'pedido-namoro', occasion: 'Pedido de namoro', theme: 'elegante', title: 'Tenho uma pergunta para ti', recipient: 'Carla Exemplo', sender: 'Diogo Exemplo',
    blurb: 'A pergunta que muda tudo.', date: '2026-02-14',
    intro: 'Li isto mil vezes antes de te mostrar. Peço-te só que leias até ao fim.',
    message: 'Carla,\n\nDesde que te conheço, os dias têm outra cor. Gosto da forma como ouves, de como ris de ti própria e de como fazes as pessoas sentirem-se em casa.\n\nNão sei fazer discursos bonitos, mas sei o que sinto: quero estar ao teu lado, com calma, com respeito e com muitas gargalhadas.\n\nPor isso, a pergunta é simples.',
    closing: 'Queres namorar comigo?', memories: [
      { title: 'O dia da biblioteca', description: 'Foi ali que percebi que a tua companhia era o meu sítio favorito.' },
      { title: 'A chuva inesperada', description: 'Partilhámos um guarda-chuva e nunca mais o devolvemos.' }],
    photos: [{ caption: 'Um instante nosso', hue: 38 }, { caption: 'Onde tudo começou', hue: 30 }, { caption: 'Sempre a rir', hue: 45 }],
  },
  {
    slug: 'proximo-capitulo', category: 'formatura', extra: { course: 'Engenharia Informática' }, occasion: 'Formatura', theme: 'celebracao', title: 'O teu próximo capítulo começa agora', recipient: 'Eduardo Exemplo', sender: 'A tua família',
    blurb: 'Uma homenagem a quem conquistou o diploma.', date: '2026-07-10',
    intro: 'Cada madrugada de estudo valeu a pena. Hoje, o país ganha mais um profissional e nós ganhamos mais um orgulho.',
    message: 'Eduardo,\n\nVimos-te crescer, cair, levantar e continuar. Vimos as noites em claro, os cadernos cheios e a teimosia de quem não desiste.\n\nHoje fechas um capítulo com o teu nome escrito em cada página. Que o próximo seja ainda maior, e que nunca percas a humildade que te trouxe até aqui.\n\nEstamos sempre contigo.',
    closing: 'Parabéns, doutor(a) da nossa vida!', memories: [
      { title: 'O primeiro dia', description: 'Entraste com medo e um caderno novo.', date: '2021-09-20' },
      { title: 'A semana de exames', description: 'Café, foco e a promessa de que ia valer a pena.', date: '2025-06-12' },
      { title: 'A defesa', description: 'O dia em que todos choraram de orgulho.', date: '2026-06-30' }],
    photos: [{ caption: 'Dia de festa', hue: 5 }, { caption: 'Com quem nunca desistiu de ti', hue: 20 }, { caption: 'O futuro é teu', hue: 350 }],
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
    photos: [{ caption: 'Marta & Rui', hue: 45 }, { caption: 'O nosso caminho', hue: 30 }],
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
