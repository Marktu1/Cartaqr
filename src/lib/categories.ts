// Categorias (ocasiões). Ficheiro puro (sem servidor): usado pelo wizard, pela carta, pela IA e pelas páginas de marketing.
// Cada categoria define os campos que pede, os textos, o estilo, o que a carta mostra e as instruções à IA.
export type ExtraField = { key: string; label: string; type: 'text' | 'textarea' | 'date' | 'time' | 'url' | 'number'; placeholder?: string; required?: boolean; max?: number; hint?: string };
export type Category = {
  slug: string; kind: 'carta' | 'evento'; name: string; short: string; glyph: string; theme: string;
  labels: { recipient: string; recipientPh: string; sender: string; senderPh: string; title: string; titlePh: string; date: string; dateRequired?: boolean };
  extra: ExtraField[];
  howMet?: { label: string; ph: string };
  admire?: { label: string; ph: string };
  memories: { heading: string; hint: string; itemPh: string; descPh: string; count: number; max: number; publicTitle: string };
  message: { label: string; hint: string; ph: string };
  closing: { label: string; suggestions: string[]; default?: string };
  titleSuggestions: string[];
  kicker: string; open: string; qrInstruction: string;
  proposal?: { question: string; yes: string; no: string; thanksYes: string; thanksNo: string };
  rsvp?: boolean;
  countdown?: { source: 'date' | 'extra'; key?: string; label: string; past?: string };
  aiHint: string;
  page: { title: string; text: string; seo: string };
};

const eventExtra = (dressHint = 'Ex.: Traje social'): ExtraField[] => [
  { key: 'time', label: 'Hora', type: 'time', required: true },
  { key: 'venue', label: 'Local', type: 'text', placeholder: 'Ex.: Salão Jardim das Acácias', required: true, max: 100 },
  { key: 'address', label: 'Morada ou ponto de referência', type: 'text', placeholder: 'Ex.: Talatona, ao lado do…', max: 160 },
  { key: 'mapUrl', label: 'Link do mapa (opcional)', type: 'url', placeholder: 'https://maps.google.com/…', hint: 'Cola o link de partilha do Google Maps.' },
  { key: 'dressCode', label: 'Código de vestuário (opcional)', type: 'text', placeholder: dressHint, max: 80 },
  { key: 'rsvpDeadline', label: 'Confirmar presença até (opcional)', type: 'date' },
];

const eventBase = {
  kind: 'evento' as const, rsvp: true,
  countdown: { source: 'date' as const, label: 'para o grande dia', past: 'Obrigado por celebrarem connosco' },
  labels: { recipient: 'Para quem é o convite?', recipientPh: 'Ex.: Família e amigos', sender: 'Anfitriões', senderPh: 'Ex.: Ana & Bruno', title: 'Título do convite', titlePh: 'Ex.: Vamos celebrar juntos', date: 'Data do evento', dateRequired: true },
  memories: { heading: 'Programa', hint: 'Os momentos do dia, por ordem. Ex.: “16:00 Cerimónia”.', itemPh: 'Ex.: 16:00 Cerimónia', descPh: 'Detalhes (opcional)', count: 3, max: 8, publicTitle: 'Programa' },
  message: { label: 'Mensagem de boas-vindas', hint: 'Convida com carinho e explica o essencial.', ph: 'Será uma honra ter-te connosco…' },
  closing: { label: 'Frase final', suggestions: ['Contamos contigo!', 'A tua presença vai ser o melhor presente.', 'Não faltes: vai ser inesquecível.'] },
  titleSuggestions: ['Vamos celebrar juntos', 'Estás convidado(a)', 'Guarda a data'],
  open: 'Abrir o convite', qrInstruction: 'Lê o código para abrir o convite',
};

export const CATEGORIES: Category[] = [
  {
    slug: 'amor', kind: 'carta', name: 'Amor', short: 'Para quem faz o teu coração sorrir.', glyph: '♡', theme: 'romantico',
    labels: { recipient: 'Nome de quem vai receber', recipientPh: 'Ex.: Ana', sender: 'Nome de quem oferece', senderPh: 'Ex.: Bruno', title: 'Título da experiência', titlePh: 'Ex.: Para a minha pessoa favorita', date: 'Data especial (opcional)' },
    extra: [{ key: 'together', label: 'Desde quando estão juntos? (opcional)', type: 'date' }],
    howMet: { label: 'Como se conheceram?', ph: 'Conta o início da vossa história.' }, admire: { label: 'O que mais admiras nessa pessoa?', ph: 'O que te faz apaixonar todos os dias.' },
    memories: { heading: 'Três memórias importantes', hint: 'Momentos que vos marcaram.', itemPh: 'Título (ex.: A primeira viagem)', descPh: 'Conta o que aconteceu', count: 3, max: 6, publicTitle: 'Memórias que ficam' },
    message: { label: 'Mensagem principal', hint: 'Escreve como se estivesses a falar com ela(e).', ph: 'Desde que chegaste…' },
    closing: { label: 'Frase final', suggestions: ['Obrigado(a) por fazeres parte da minha história.', 'Contigo, tudo faz mais sentido.', 'Amo-te, hoje e sempre.'] },
    titleSuggestions: ['Para a minha pessoa favorita', 'Uma carta só para ti', 'O meu lugar preferido és tu'],
    kicker: 'Para {recipient}', open: 'Abrir a minha carta', qrInstruction: 'Lê o código para abrir a tua surpresa',
    aiHint: 'Carta de amor sincera e afetuosa, sem exageros nem clichés em excesso.',
    page: { title: 'Cartas de amor digitais', text: 'Palavras, fotos e memórias a dois, numa carta que abre com um toque.', seo: 'Cria uma carta de amor digital com fotos, vídeo e áudio e recebe um link privado e QR Code.' },
  },
  {
    slug: 'aniversario', kind: 'carta', name: 'Aniversário', short: 'Um parabéns que fica para sempre.', glyph: '✦', theme: 'celebracao',
    labels: { recipient: 'Nome do(a) aniversariante', recipientPh: 'Ex.: Ana', sender: 'Nome de quem oferece', senderPh: 'Ex.: Bruno ou “A tua família”', title: 'Título da experiência', titlePh: 'Ex.: Parabéns, Ana!', date: 'Data do aniversário' },
    extra: [{ key: 'age', label: 'Que idade faz? (opcional)', type: 'number', placeholder: 'Ex.: 30', max: 3 }, { key: 'wish', label: 'O teu desejo para este novo ano (opcional)', type: 'text', placeholder: 'Ex.: Que sejas feliz em tudo o que fizeres', max: 160 }],
    howMet: { label: 'Como começou a vossa amizade ou relação?', ph: 'Opcional' }, admire: { label: 'O que mais admiras nessa pessoa?', ph: 'As qualidades que a tornam única.' },
    memories: { heading: 'Momentos para recordar', hint: 'Três momentos de que gostes de lembrar.', itemPh: 'Título (ex.: A festa surpresa)', descPh: 'Conta o que aconteceu', count: 3, max: 6, publicTitle: 'Momentos para recordar' },
    message: { label: 'Mensagem de parabéns', hint: 'Fala do que ela(e) significa para ti.', ph: 'Hoje é o teu dia e eu queria dizer-te…' },
    closing: { label: 'Frase final', suggestions: ['Parabéns! Que este ano seja o teu melhor.', 'Feliz aniversário, muitas vidas de alegria.', 'Que todos os teus sonhos se realizem.'] },
    titleSuggestions: ['Parabéns! O dia é teu', 'Para a minha pessoa favorita', 'Mais um ano de vida, mais um motivo para celebrar'],
    kicker: 'Feliz aniversário, {recipient}', open: 'Abrir o meu presente', qrInstruction: 'Lê o código para abrir o teu presente',
    countdown: { source: 'date', label: 'para o teu aniversário', past: '' },
    aiHint: 'Mensagem de aniversário calorosa e festiva. Se for indicada a idade, pode ser mencionada uma vez.',
    page: { title: 'Cartas de aniversário', text: 'Surpreende quem faz anos com uma mensagem, fotos e memórias que ficam.', seo: 'Cria uma carta digital de aniversário com fotos e vídeo e recebe um QR Code para colar no presente.' },
  },
  {
    slug: 'pedido-namoro', kind: 'carta', name: 'Pedido de namoro', short: 'A pergunta que muda tudo.', glyph: '?', theme: 'elegante',
    labels: { recipient: 'Nome de quem vai receber', recipientPh: 'Ex.: Carla', sender: 'O teu nome', senderPh: 'Ex.: Diogo', title: 'Título da experiência', titlePh: 'Ex.: Tenho uma pergunta para ti', date: 'Data (opcional)' },
    extra: [
      { key: 'question', label: 'A tua pergunta', type: 'text', placeholder: 'Queres namorar comigo?', max: 120 },
      { key: 'yes', label: 'Resposta positiva (botão)', type: 'text', placeholder: 'Sim!', max: 30 },
      { key: 'no', label: 'Outra resposta (botão)', type: 'text', placeholder: 'Preciso de tempo', max: 30, hint: 'Sugerimos uma opção gentil, para não pressionar.' }],
    howMet: { label: 'Como se conheceram?', ph: 'Conta o início da vossa história.' }, admire: { label: 'O que mais admiras nela(e)?', ph: 'O que te fez querer dar este passo.' },
    memories: { heading: 'Momentos que me fizeram decidir', hint: 'Até três momentos que te marcaram.', itemPh: 'Título (ex.: O dia da biblioteca)', descPh: 'Conta o que aconteceu', count: 2, max: 5, publicTitle: 'Momentos que me marcaram' },
    message: { label: 'A tua mensagem', hint: 'Sê sincero(a) e respeita o tempo dela(e).', ph: 'Desde que te conheço…' },
    closing: { label: 'Frase antes da pergunta', suggestions: ['Por isso, a pergunta é simples.', 'E é por tudo isto que te pergunto…', 'Tenho uma pergunta para ti.'] },
    titleSuggestions: ['Tenho uma pergunta para ti', 'Li isto mil vezes antes de to mostrar', 'Podemos começar uma história?'],
    kicker: '{recipient}, tenho uma pergunta para ti', open: 'Abrir', qrInstruction: 'Lê o código. Tenho uma pergunta para ti',
    proposal: { question: 'Queres namorar comigo?', yes: 'Sim!', no: 'Preciso de tempo', thanksYes: 'A tua resposta foi enviada. Que comece uma linda história!', thanksNo: 'Obrigado pela sinceridade. A tua resposta foi enviada com respeito.' },
    aiHint: 'Pedido de namoro sincero e respeitoso. Não pressiona nem culpa; deixa a pessoa livre para responder.',
    page: { title: 'Pedido de namoro digital', text: 'Faz a pergunta com carinho, com fotos, palavras e uma resposta com um toque.', seo: 'Cria um pedido de namoro digital com link privado e QR Code e recebe a resposta na tua página.' },
  },
  {
    slug: 'pedido-casamento', kind: 'carta', name: 'Pedido de casamento', short: 'O maior sim da vida.', glyph: '∞', theme: 'elegante',
    labels: { recipient: 'Nome de quem vai receber', recipientPh: 'Ex.: Carla', sender: 'O teu nome', senderPh: 'Ex.: Diogo', title: 'Título da experiência', titlePh: 'Ex.: A pergunta mais importante', date: 'Data (opcional)' },
    extra: [
      { key: 'question', label: 'A tua pergunta', type: 'text', placeholder: 'Queres casar comigo?', max: 120 },
      { key: 'yes', label: 'Resposta positiva (botão)', type: 'text', placeholder: 'Sim, mil vezes!', max: 30 },
      { key: 'no', label: 'Outra resposta (botão)', type: 'text', placeholder: 'Vamos falar', max: 30 }],
    howMet: { label: 'Como se conheceram?', ph: 'A vossa história.' }, admire: { label: 'O que mais admiras nela(e)?', ph: 'O que te faz querer passar a vida ao seu lado.' },
    memories: { heading: 'A nossa história em momentos', hint: 'Os marcos do vosso caminho.', itemPh: 'Título (ex.: A primeira viagem)', descPh: 'Conta o que aconteceu', count: 3, max: 6, publicTitle: 'A nossa história' },
    message: { label: 'A tua mensagem', hint: 'Fala do futuro que imaginas.', ph: 'Quando penso no futuro…' },
    closing: { label: 'Frase antes da pergunta', suggestions: ['E por isso, tenho de perguntar.', 'Quero todos os meus dias contigo.', 'Chegou a hora da pergunta.'] },
    titleSuggestions: ['A pergunta mais importante', 'Para sempre começa aqui', 'Tenho uma pergunta para toda a vida'],
    kicker: '{recipient}, chegou a hora', open: 'Abrir', qrInstruction: 'Lê o código. Tenho uma pergunta para ti',
    proposal: { question: 'Queres casar comigo?', yes: 'Sim, mil vezes!', no: 'Vamos falar', thanksYes: 'A tua resposta foi enviada. Parabéns aos dois!', thanksNo: 'A tua resposta foi enviada com respeito.' },
    aiHint: 'Pedido de casamento emocionante e sincero, sem pressionar.',
    page: { title: 'Pedido de casamento digital', text: 'Um pedido inesquecível, com a vossa história em fotos e a pergunta no fim.', seo: 'Cria um pedido de casamento digital com fotos, vídeo, link privado e QR Code.' },
  },
  {
    slug: 'dia-namorados', kind: 'carta', name: 'Dia dos Namorados', short: 'Uma declaração para o dia 14 de fevereiro.', glyph: '♥', theme: 'romantico',
    labels: { recipient: 'Nome do(a) teu/tua namorado(a)', recipientPh: 'Ex.: Ana', sender: 'O teu nome', senderPh: 'Ex.: Bruno', title: 'Título da experiência', titlePh: 'Ex.: 14 razões para te amar', date: 'Data (opcional)' },
    extra: [{ key: 'reasons', label: 'Razões pelas quais a(o) amas (uma por linha, opcional)', type: 'textarea', placeholder: 'O teu sorriso\nA tua paciência\nComo me fazes rir', max: 600 }],
    howMet: { label: 'Como se conheceram?', ph: 'Opcional' },
    memories: { heading: 'Memórias a dois', hint: 'Momentos que vos definem.', itemPh: 'Título', descPh: 'Conta o que aconteceu', count: 3, max: 6, publicTitle: 'Memórias a dois' },
    message: { label: 'Declaração', hint: 'Diz o que sentes.', ph: 'Neste Dia dos Namorados quero dizer-te…' },
    closing: { label: 'Frase final', suggestions: ['Feliz Dia dos Namorados, meu amor.', 'Todos os dias são teus, mas hoje é ainda mais.', 'Sou feliz porque te tenho.'] },
    titleSuggestions: ['14 razões para te amar', 'Feliz Dia dos Namorados', 'Só para ti, hoje e sempre'],
    kicker: 'Para {recipient}, com amor', open: 'Abrir a minha declaração', qrInstruction: 'Lê o código para abrir a tua declaração',
    aiHint: 'Declaração romântica para o Dia dos Namorados. Se houver razões listadas, usa-as tal como foram escritas.',
    page: { title: 'Cartas para o Dia dos Namorados', text: 'Uma declaração digital com as razões pelas quais amas.', seo: 'Cria uma declaração digital para o Dia dos Namorados com fotos e QR Code.' },
  },
  {
    slug: 'distancia', kind: 'carta', name: 'Relação à distância', short: 'Perto no coração, mesmo longe.', glyph: '✈', theme: 'minimalista',
    labels: { recipient: 'Nome de quem vai receber', recipientPh: 'Ex.: Ana', sender: 'O teu nome', senderPh: 'Ex.: Bruno', title: 'Título da experiência', titlePh: 'Ex.: Falta cada vez menos', date: 'Data especial (opcional)' },
    extra: [
      { key: 'places', label: 'Onde está cada um? (opcional)', type: 'text', placeholder: 'Luanda ↔ Lisboa', max: 80 },
      { key: 'nextMeeting', label: 'Data do próximo reencontro (opcional)', type: 'date', hint: 'A carta mostra quantos dias faltam.' }],
    howMet: { label: 'Como se conheceram?', ph: 'Opcional' }, admire: { label: 'O que mais te faz falta nela(e)?', ph: 'Os pequenos detalhes.' },
    memories: { heading: 'Momentos que nos aproximam', hint: 'Memórias que te fazem sorrir.', itemPh: 'Título', descPh: 'Conta o que aconteceu', count: 3, max: 6, publicTitle: 'Momentos que nos aproximam' },
    message: { label: 'Mensagem', hint: 'Diz o que gostavas de dizer ao vivo.', ph: 'Hoje, mais uma vez, queria estar aí…' },
    closing: { label: 'Frase final', suggestions: ['A distância é só um número.', 'Falta cada vez menos.', 'Mesmo longe, estou aí.'] },
    titleSuggestions: ['Falta cada vez menos', 'Longe dos olhos, dentro do coração', 'A distância é só um número'],
    kicker: 'Para {recipient}, onde quer que estejas', open: 'Abrir a minha carta', qrInstruction: 'Lê o código para abrir a tua carta',
    countdown: { source: 'extra', key: 'nextMeeting', label: 'até nos vermos', past: 'Já nos reencontrámos!' },
    aiHint: 'Carta para alguém que está longe, com saudade mas esperança. Sem dramatismo.',
    page: { title: 'Cartas para relações à distância', text: 'Uma carta com contagem decrescente até ao próximo reencontro.', seo: 'Cria uma carta digital para uma relação à distância, com contagem decrescente e QR Code.' },
  },
  {
    slug: 'formatura', kind: 'carta', name: 'Formatura', short: 'Um novo capítulo começa.', glyph: '★', theme: 'celebracao',
    labels: { recipient: 'Nome do(a) formando(a)', recipientPh: 'Ex.: Eduardo', sender: 'De quem é a homenagem', senderPh: 'Ex.: A tua família', title: 'Título da experiência', titlePh: 'Ex.: O teu próximo capítulo começa agora', date: 'Data da formatura' },
    extra: [{ key: 'course', label: 'Curso (opcional)', type: 'text', placeholder: 'Ex.: Engenharia de Petróleos', max: 100 }, { key: 'institution', label: 'Instituição (opcional)', type: 'text', placeholder: 'Ex.: ISPTEC', max: 100 }],
    memories: { heading: 'O caminho até aqui', hint: 'Marcos do percurso.', itemPh: 'Título (ex.: O primeiro dia)', descPh: 'Conta o que aconteceu', count: 3, max: 6, publicTitle: 'O teu percurso' },
    admire: { label: 'O que admiras no esforço dele(a)?', ph: 'A dedicação, a persistência…' },
    message: { label: 'Mensagem de parabéns', hint: 'Reconhece o esforço e deseja o futuro.', ph: 'Vimos-te crescer…' },
    closing: { label: 'Frase final', suggestions: ['Parabéns! O futuro é teu.', 'Orgulho é a palavra.', 'Que este seja só o primeiro de muitos capítulos.'] },
    titleSuggestions: ['O teu próximo capítulo começa agora', 'Conseguiste!', 'Diploma na mão, futuro pela frente'],
    kicker: 'Parabéns, {recipient}', open: 'Abrir a homenagem', qrInstruction: 'Lê o código para abrir a tua homenagem',
    aiHint: 'Homenagem de formatura orgulhosa e inspiradora. Se houver curso e instituição, pode mencioná-los.',
    page: { title: 'Cartas de formatura', text: 'Homenageia quem se formou com o percurso em fotos e palavras de orgulho.', seo: 'Cria uma homenagem digital de formatura com fotos, vídeo e QR Code.' },
  },
  {
    slug: 'dia-mae', kind: 'carta', name: 'Dia da Mãe', short: 'Obrigado, mãe.', glyph: '❀', theme: 'familiar',
    labels: { recipient: 'Nome da mãe (ou como a chamas)', recipientPh: 'Ex.: Mamã', sender: 'De quem é a carta', senderPh: 'Ex.: Os teus filhos', title: 'Título da experiência', titlePh: 'Ex.: Obrigado, mãe', date: 'Data (opcional)' },
    extra: [{ key: 'lesson', label: 'O que mais aprendeste com ela? (opcional)', type: 'text', placeholder: 'Ex.: A nunca desistir', max: 160 }],
    admire: { label: 'O que mais admiras nela?', ph: 'A força, o carinho, os conselhos…' },
    memories: { heading: 'Momentos com a mãe', hint: 'Recordações que guardas.', itemPh: 'Título (ex.: A cozinha aos domingos)', descPh: 'Conta o que aconteceu', count: 3, max: 6, publicTitle: 'Recordações' },
    message: { label: 'A tua mensagem', hint: 'Agradece com o coração.', ph: 'Mãe, queria dizer-te obrigado por…' },
    closing: { label: 'Frase final', suggestions: ['Amo-te, mãe.', 'Tudo o que sou, devo-te a ti.', 'Feliz Dia da Mãe.'] },
    titleSuggestions: ['Obrigado, mãe', 'Para a melhor mãe do mundo', 'Tudo começou em ti'],
    kicker: 'Para {recipient}', open: 'Abrir a minha carta', qrInstruction: 'Lê o código para abrir a tua carta',
    aiHint: 'Carta de agradecimento e amor a uma mãe. Calorosa, simples e respeitosa.',
    page: { title: 'Cartas para o Dia da Mãe', text: 'Agradece à mãe com uma carta digital cheia de recordações.', seo: 'Cria uma carta digital para o Dia da Mãe com fotos, áudio e QR Code para colar no presente.' },
  },
  {
    slug: 'dia-pai', kind: 'carta', name: 'Dia do Pai', short: 'Um herói de todos os dias.', glyph: '⚑', theme: 'natureza',
    labels: { recipient: 'Nome do pai (ou como o chamas)', recipientPh: 'Ex.: Papá', sender: 'De quem é a carta', senderPh: 'Ex.: Os teus filhos', title: 'Título da experiência', titlePh: 'Ex.: Obrigado, pai', date: 'Data (opcional)' },
    extra: [{ key: 'lesson', label: 'O que mais aprendeste com ele? (opcional)', type: 'text', placeholder: 'Ex.: A ser responsável', max: 160 }],
    admire: { label: 'O que mais admiras nele?', ph: 'A força, o exemplo, o humor…' },
    memories: { heading: 'Momentos com o pai', hint: 'Recordações que guardas.', itemPh: 'Título (ex.: Os passeios de domingo)', descPh: 'Conta o que aconteceu', count: 3, max: 6, publicTitle: 'Recordações' },
    message: { label: 'A tua mensagem', hint: 'Agradece e reconhece.', ph: 'Pai, queria dizer-te obrigado por…' },
    closing: { label: 'Frase final', suggestions: ['Amo-te, pai.', 'És o meu exemplo.', 'Feliz Dia do Pai.'] },
    titleSuggestions: ['Obrigado, pai', 'O meu herói de todos os dias', 'Tudo o que sou aprendi contigo'],
    kicker: 'Para {recipient}', open: 'Abrir a minha carta', qrInstruction: 'Lê o código para abrir a tua carta',
    aiHint: 'Carta de agradecimento a um pai, sincera e sem exageros.',
    page: { title: 'Cartas para o Dia do Pai', text: 'Uma homenagem digital ao pai, com recordações e palavras de gratidão.', seo: 'Cria uma carta digital para o Dia do Pai com fotos, áudio e QR Code.' },
  },
  {
    slug: 'familia', kind: 'carta', name: 'Homenagem familiar', short: 'Para quem é família.', glyph: '⌂', theme: 'familiar',
    labels: { recipient: 'Homenageado(a)', recipientPh: 'Ex.: Avó Maria', sender: 'De quem é a homenagem', senderPh: 'Ex.: Toda a família', title: 'Título da experiência', titlePh: 'Ex.: Obrigado por tudo, avó', date: 'Data (opcional)' },
    extra: [{ key: 'relation', label: 'Quem é para si? (opcional)', type: 'text', placeholder: 'Ex.: Avó, tio, irmão…', max: 40 }],
    admire: { label: 'O que mais admiram nessa pessoa?', ph: 'O exemplo que dá à família.' },
    memories: { heading: 'Recordações da família', hint: 'Histórias que ficam.', itemPh: 'Título (ex.: O Natal na casa da avó)', descPh: 'Conta o que aconteceu', count: 3, max: 6, publicTitle: 'Recordações da família' },
    message: { label: 'Mensagem de homenagem', hint: 'Reconhece o que essa pessoa fez pela família.', ph: 'Queremos agradecer-te por…' },
    closing: { label: 'Frase final', suggestions: ['A família é onde tudo começa.', 'Obrigado por tudo.', 'Com todo o nosso carinho.'] },
    titleSuggestions: ['Obrigado por tudo', 'A nossa família, graças a ti', 'Uma homenagem a quem nos une'],
    kicker: 'Para {recipient}, com gratidão', open: 'Abrir a homenagem', qrInstruction: 'Lê o código para abrir a homenagem',
    aiHint: 'Homenagem familiar respeitosa, calorosa e agradecida.',
    page: { title: 'Homenagens familiares', text: 'Reúne a família numa homenagem digital cheia de recordações.', seo: 'Cria uma homenagem familiar digital com fotos, vídeo e QR Code.' },
  },
  {
    slug: 'amizade', kind: 'carta', name: 'Amizade', short: 'Para o amigo que é família.', glyph: '☺', theme: 'divertido',
    labels: { recipient: 'Nome do(a) amigo(a)', recipientPh: 'Ex.: Kiala', sender: 'O teu nome', senderPh: 'Ex.: Nelson', title: 'Título da experiência', titlePh: 'Ex.: Amigos para a vida', date: 'Data (opcional)' },
    extra: [{ key: 'insideJoke', label: 'Uma piada só vossa (opcional)', type: 'text', placeholder: 'Ex.: “O carro que nunca pegava”', max: 120 }],
    howMet: { label: 'Como se conheceram?', ph: 'O início da amizade.' }, admire: { label: 'O que mais admiras no teu amigo?', ph: 'A lealdade, o humor…' },
    memories: { heading: 'Aventuras juntos', hint: 'Momentos que só vocês entendem.', itemPh: 'Título (ex.: A viagem que correu mal)', descPh: 'Conta o que aconteceu', count: 3, max: 6, publicTitle: 'Aventuras juntos' },
    message: { label: 'Mensagem', hint: 'Podes misturar carinho e humor.', ph: 'Amigo, queria dizer-te…' },
    closing: { label: 'Frase final', suggestions: ['Amigos para a vida.', 'Obrigado por estares sempre lá.', 'Conta comigo, sempre.'] },
    titleSuggestions: ['Amigos para a vida', 'Obrigado por seres tu', 'O amigo que é família'],
    kicker: 'Para {recipient}', open: 'Abrir a minha carta', qrInstruction: 'Lê o código para abrir a tua surpresa',
    aiHint: 'Mensagem de amizade leve, com humor simpático quando o tom for divertido.',
    page: { title: 'Cartas de amizade', text: 'Diz ao teu amigo o que ele significa para ti.', seo: 'Cria uma carta digital de amizade com fotos e QR Code.' },
  },
  {
    slug: 'despedida', kind: 'carta', name: 'Despedida', short: 'Até já, com gratidão.', glyph: '❦', theme: 'minimalista',
    labels: { recipient: 'Quem parte (ou quem fica)', recipientPh: 'Ex.: Equipa comercial', sender: 'De quem é a mensagem', senderPh: 'Ex.: Os teus colegas', title: 'Título da experiência', titlePh: 'Ex.: Até já, e obrigado', date: 'Data da despedida (opcional)' },
    extra: [{ key: 'reason', label: 'Motivo (opcional)', type: 'text', placeholder: 'Ex.: Nova etapa noutro país', max: 120 }],
    admire: { label: 'O que vão levar de melhor?', ph: 'O que essa pessoa deixou.' },
    memories: { heading: 'O que vivemos juntos', hint: 'Momentos marcantes.', itemPh: 'Título', descPh: 'Conta o que aconteceu', count: 3, max: 6, publicTitle: 'O que vivemos juntos' },
    message: { label: 'Mensagem de despedida', hint: 'Agradece e deseja boa sorte.', ph: 'Antes de partires, queríamos dizer-te…' },
    closing: { label: 'Frase final', suggestions: ['Até já.', 'As portas estarão sempre abertas.', 'Boa sorte nesta nova etapa.'] },
    titleSuggestions: ['Até já, e obrigado', 'Uma nova etapa começa', 'Vamos sentir a tua falta'],
    kicker: 'Para {recipient}', open: 'Abrir a mensagem', qrInstruction: 'Lê o código para abrir a mensagem',
    aiHint: 'Despedida grata, positiva e serena.',
    page: { title: 'Cartas de despedida', text: 'Despede-te com gratidão, memórias e votos de boa sorte.', seo: 'Cria uma carta digital de despedida com fotos, vídeo e QR Code.' },
  },
  {
    slug: 'outra', kind: 'carta', name: 'Outra ocasião', short: 'Agradecimentos, felicitações e mais.', glyph: '✉', theme: 'minimalista',
    labels: { recipient: 'Nome de quem vai receber', recipientPh: 'Ex.: Ana', sender: 'Nome de quem oferece', senderPh: 'Ex.: Bruno', title: 'Título da experiência', titlePh: 'Ex.: Uma mensagem para ti', date: 'Data especial (opcional)' },
    extra: [],
    howMet: { label: 'Contexto (opcional)', ph: 'Conta o que quiseres sobre a vossa relação.' }, admire: { label: 'O que mais admiras nessa pessoa?', ph: 'Opcional' },
    memories: { heading: 'Memórias importantes', hint: 'Até três momentos.', itemPh: 'Título', descPh: 'Conta o que aconteceu', count: 3, max: 6, publicTitle: 'Memórias que ficam' },
    message: { label: 'Mensagem principal', hint: 'Escreve o que queres dizer.', ph: 'Queria dizer-te…' },
    closing: { label: 'Frase final', suggestions: ['Com carinho.', 'Obrigado por tudo.', 'Até breve.'] },
    titleSuggestions: ['Uma mensagem para ti', 'Só para ti', 'Guardei isto para ti'],
    kicker: 'Para {recipient}', open: 'Abrir a minha carta', qrInstruction: 'Lê o código para abrir a tua surpresa',
    aiHint: 'Mensagem sincera e adaptada às informações dadas.',
    page: { title: 'Cartas para qualquer ocasião', text: 'Para tudo o que merece mais do que uma mensagem comum.', seo: 'Cria uma carta digital personalizada com fotos, vídeo, áudio e QR Code.' },
  },

  // ---------------- EVENTOS ----------------
  {
    ...eventBase, slug: 'convite-casamento', name: 'Convite de casamento', short: 'Um convite digital com confirmação de presença.', glyph: '⚭', theme: 'gala',
    labels: { ...eventBase.labels, sender: 'Os noivos', senderPh: 'Ex.: Ana & Bruno', title: 'Título do convite', titlePh: 'Ex.: Vamos casar!' },
    extra: eventExtra('Ex.: Traje social'),
    message: { label: 'Mensagem aos convidados', hint: 'Convida com carinho e explica o essencial.', ph: 'Depois de tantos anos juntos, vamos dizer sim…' },
    kicker: 'Estás convidado(a)', open: 'Abrir o convite', qrInstruction: 'Lê o código para abrir o convite',
    aiHint: 'Convite de casamento caloroso e elegante. Usa os dados do evento (data, hora, local) tal como foram indicados.',
    page: { title: 'Convites de casamento digitais', text: 'Convite com programa, mapa, contagem decrescente e confirmação de presença dos convidados.', seo: 'Cria um convite de casamento digital com QR Code, mapa, programa e confirmação de presença.' },
  },
  {
    ...eventBase, slug: 'convite-festa', name: 'Festa e aniversário', short: 'Convida para a tua festa com RSVP.', glyph: '✧', theme: 'celebracao',
    labels: { ...eventBase.labels, sender: 'Anfitrião(s)', senderPh: 'Ex.: Bruno', title: 'Título do convite', titlePh: 'Ex.: Vem celebrar comigo' },
    extra: eventExtra('Ex.: Vestido e fato de festa'),
    memories: { ...eventBase.memories, hint: 'Ex.: “20:00 Receção”, “21:00 Jantar”, “23:00 Festa”.' },
    kicker: 'Estás convidado(a)', open: 'Abrir o convite', qrInstruction: 'Lê o código para abrir o convite',
    aiHint: 'Convite de festa animado e acolhedor. Usa os dados do evento tal como foram indicados.',
    page: { title: 'Convites de festa e aniversário', text: 'Um convite digital com mapa e confirmação de presença, num só QR Code.', seo: 'Cria um convite digital para a tua festa com QR Code, mapa e confirmação de presença.' },
  },
  {
    ...eventBase, slug: 'convite-batizado', name: 'Batizado e celebrações', short: 'Batizados, chás de bebé e comunhões.', glyph: '❁', theme: 'natureza',
    labels: { ...eventBase.labels, sender: 'A família', senderPh: 'Ex.: Família Exemplo', title: 'Título do convite', titlePh: 'Ex.: O batizado da Sofia' },
    extra: eventExtra('Ex.: Cores claras'),
    memories: { ...eventBase.memories, hint: 'Ex.: “10:00 Cerimónia”, “12:00 Almoço”.' },
    kicker: 'Estás convidado(a)', open: 'Abrir o convite', qrInstruction: 'Lê o código para abrir o convite',
    aiHint: 'Convite familiar, terno e simples, para uma celebração com a família.',
    page: { title: 'Convites de batizado e celebrações', text: 'Convida a família para batizados, chás de bebé e comunhões, com confirmação de presença.', seo: 'Cria um convite digital de batizado ou chá de bebé com QR Code e confirmação de presença.' },
  },
  {
    ...eventBase, slug: 'convite-evento', name: 'Evento e empresa', short: 'Lançamentos, conferências e eventos de empresa.', glyph: '◈', theme: 'gala',
    labels: { ...eventBase.labels, recipient: 'Para quem é o convite?', recipientPh: 'Ex.: Clientes e parceiros', sender: 'Organização', senderPh: 'Ex.: Empresa Exemplo', title: 'Título do evento', titlePh: 'Ex.: Lançamento do nosso novo espaço' },
    extra: eventExtra('Ex.: Traje casual elegante'),
    message: { label: 'Mensagem de convite', hint: 'Explica o motivo e o que os convidados vão encontrar.', ph: 'Temos o prazer de convidar…' },
    memories: { ...eventBase.memories, hint: 'Ex.: “18:00 Receção”, “18:30 Apresentação”.' },
    kicker: 'Convite', open: 'Abrir o convite', qrInstruction: 'Lê o código para abrir o convite',
    aiHint: 'Convite profissional, claro e cordial. Sem exageros.',
    page: { title: 'Convites para eventos e empresas', text: 'Convite digital com programa, mapa e lista de confirmações, ideal para lançamentos e conferências.', seo: 'Cria um convite digital para eventos e empresas com QR Code e confirmação de presença.' },
  },
];

export const CATEGORY_MAP: Record<string, Category> = Object.fromEntries(CATEGORIES.map(c => [c.slug, c]));
export const CATEGORY_SLUGS = CATEGORIES.map(c => c.slug) as [string, ...string[]];
export function getCategory(slug: string | null | undefined): Category { return CATEGORY_MAP[slug || ''] || CATEGORY_MAP.outra; }
export const isEvent = (slug: string) => getCategory(slug).kind === 'evento';
export function kickerFor(cat: Category, recipient: string): string { return cat.kicker.replace('{recipient}', recipient || '').replace(/^,\s*/, '').trim(); }

/** Limpa e valida os campos extra de uma categoria (chaves fora da configuração são ignoradas). */
export function sanitizeExtra(slug: string, raw: unknown): Record<string, string> {
  const cat = getCategory(slug); const out: Record<string, string> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const f of cat.extra) {
    const rawV = (raw as Record<string, unknown>)[f.key];
    if (typeof rawV !== 'string') continue;
    // eslint-disable-next-line no-control-regex
    const v = rawV.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/<\/?[a-z][^>]*>/gi, '').trim().slice(0, f.type === 'textarea' ? 600 : f.max || 160);
    if (!v) continue;
    if (f.type === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(v)) continue;
    if (f.type === 'time' && !/^\d{2}:\d{2}$/.test(v)) continue;
    if (f.type === 'url' && !/^https?:\/\/[^\s]+$/i.test(v)) continue;
    if (f.type === 'number' && !/^\d{1,3}$/.test(v)) continue;
    out[f.key] = v;
  }
  return out;
}
/** Campos obrigatórios em falta (para mensagens de erro no wizard e no servidor). */
export function missingRequired(slug: string, extra: Record<string, string>, specialDate: string | null | undefined): string[] {
  const cat = getCategory(slug); const miss: string[] = [];
  if (cat.labels.dateRequired && !specialDate) miss.push(cat.labels.date);
  for (const f of cat.extra) if (f.required && !extra[f.key]) miss.push(f.label);
  return miss;
}

// ---------------- Derivados para apresentar a carta ----------------
export type Derived = {
  subtitle?: string; quote?: { label: string; text: string }; list?: { title: string; items: string[] };
  proposal?: { question: string; yes: string; no: string; thanksYes: string; thanksNo: string };
  event?: { time?: string; venue?: string; address?: string; mapUrl?: string; dressCode?: string; rsvpDeadline?: string };
  countdown?: { target: string; label: string; past: string };
};
export function derive(slug: string, extra: Record<string, string>, specialDate?: string | null): Derived {
  const cat = getCategory(slug); const d: Derived = {};
  const sub: string[] = [];
  if (extra.age) sub.push(`${extra.age} anos`);
  if (extra.course) sub.push(extra.course);
  if (extra.institution) sub.push(extra.institution);
  if (extra.places) sub.push(extra.places);
  if (extra.relation) sub.push(extra.relation);
  if (extra.reason) sub.push(extra.reason);
  if (sub.length && cat.kind === 'carta') d.subtitle = sub.join(' · ');
  if (extra.wish) d.quote = { label: 'O meu desejo para ti', text: extra.wish };
  else if (extra.lesson) d.quote = { label: 'O que aprendi contigo', text: extra.lesson };
  else if (extra.insideJoke) d.quote = { label: 'A nossa piada', text: extra.insideJoke };
  if (extra.reasons) d.list = { title: 'Razões para te amar', items: extra.reasons.split(/\n+/).map(x => x.trim()).filter(Boolean).slice(0, 20) };
  if (cat.proposal) d.proposal = { ...cat.proposal, question: extra.question || cat.proposal.question, yes: extra.yes || cat.proposal.yes, no: extra.no || cat.proposal.no };
  if (cat.kind === 'evento') d.event = { time: extra.time, venue: extra.venue, address: extra.address, mapUrl: extra.mapUrl, dressCode: extra.dressCode, rsvpDeadline: extra.rsvpDeadline };
  if (cat.countdown) {
    const target = cat.countdown.source === 'date' ? specialDate : extra[cat.countdown.key || ''];
    if (target) d.countdown = { target, label: cat.countdown.label, past: cat.countdown.past || '' };
  }
  return d;
}
