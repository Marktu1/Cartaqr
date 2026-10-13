// Artes do site (imagens geradas com IA para o Carta QR, em public/media/artes/).
// Ficheiro puro (sem servidor): usado pelas páginas de marketing.
export type Art = { src: string; alt: string; /** Ponto de foco ao recortar (CSS object-position). */ pos?: string };

const a = (file: string, alt: string, pos?: string): Art => ({ src: `/media/artes/${file}.webp`, alt, pos });

export const ART = {
  marginal: a('marginal', 'Jovem sorri para o telemóvel na Marginal de Luanda ao pôr do sol', '62% 50%'),
  produto: a('produto', 'Telemóvel com um envelope dourado no ecrã, sobre fundo bordô'),
  envelope: a('envelope', 'Envelope dourado com selo de cera em forma de QR Code sobre tecido bordô'),
} as const;

/** Imagem de cada ocasião (slug da categoria). As ocasiões sem imagem mostram o ícone. */
export const CATEGORY_ART: Record<string, Art> = {
  amor: a('amor', 'Casal angolano a partilhar uma carta digital, com uma rosa vermelha na mesa', '50% 35%'),
  aniversario: a('aniversario', 'Jovem angolana sorridente mostra uma carta digital no telemóvel', '50% 30%'),
  'pedido-namoro': a('marginal', 'Jovem sorri ao ler uma mensagem no telemóvel na Marginal de Luanda', '62% 50%'),
  'pedido-casamento': a('pedido-casamento', 'Pedido de casamento na Marginal de Luanda ao pôr do sol'),
  'dia-namorados': a('envelope', 'Envelope dourado com selo de cera sobre tecido bordô'),
  distancia: a('produto', 'Telemóvel com um envelope dourado no ecrã'),
  formatura: a('formatura', 'Recém-formado angolano de beca mostra uma carta digital no telemóvel', '50% 30%'),
  'dia-mae': a('dia-mae', 'Mãe e filha angolanas abraçadas a ver uma carta no telemóvel', '50% 35%'),
  familia: a('familia', 'Família angolana reunida à mesa num jantar de festa'),
  amizade: a('amizade', 'Três amigos angolanos a rir numa esplanada em Luanda'),
  despedida: a('despedida', 'Lírios brancos e uma vela acesa junto a um telemóvel'),
  'convite-casamento': a('casamento', 'Noivos angolanos sorridentes a ver o convite no telemóvel', '50% 30%'),
  'convite-festa': a('eventos', 'Mesa de festa elegante com flores bordô e um convite digital'),
  'convite-batizado': a('cha-de-bebe', 'Futura mãe angolana sorri ao ver um convite no telemóvel', '50% 30%'),
  'convite-evento': a('empresarial', 'Empresária angolana num escritório em Luanda com o telemóvel na mão', '40% 50%'),
};

export const artFor = (slug: string): Art | undefined => CATEGORY_ART[slug];
