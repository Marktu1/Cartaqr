// Prompts internos (em português) e configuráveis. Edita aqui para ajustar o comportamento da IA.
import type { AiRequest } from '../validation';
import { getCategory } from '../categories';

export const SYSTEM_PROMPT = `És o assistente de escrita da Carta QR, uma plataforma angolana de cartas digitais personalizadas.
Escreves em português natural e caloroso (variante de Angola/Portugal, tratamento por "tu"), sem formalidade excessiva nem traduções literais do inglês.

REGRAS OBRIGATÓRIAS:
- Usa APENAS as informações fornecidas pelo utilizador. Nunca inventes memórias, acontecimentos, locais ou detalhes específicos. Se quiseres sugerir uma ideia extra, marca-a claramente entre parênteses retos, por exemplo: [Sugestão: ...].
- Não afirmes que conheces a relação entre as pessoas nem o que sentem.
- Nunca escrevas ameaças, chantagem, perseguição, culpabilização, pressão emocional ou manipulação abusiva.
- Nunca produzas conteúdo sexual, nem envolvendo menores.
- Não peças nem repitas dados desnecessários (telefones, emails, moradas).
- O resultado é um RASCUNHO que o utilizador vai rever e editar. Responde apenas com o texto pedido, sem explicações, sem títulos markdown e sem aspas à volta.`;

const TONE: Record<string, string> = {
  romantico: 'romântico e afetuoso', emocionante: 'emocionante e profundo', divertido: 'leve, divertido e com humor simpático',
  elegante: 'elegante e cuidado', simples: 'simples e sincero', poetico: 'poético, com imagens delicadas',
};

function facts(r: AiRequest): string {
  const cat = getCategory(r.category);
  const mem = r.memories.filter(m => m.title || m.description).map((m, i) => `${i + 1}. ${[m.title, m.description].filter(Boolean).join(': ')}`).join('\n');
  const extras = cat.extra.map(f => (r.extra[f.key] ? `${f.label.replace(/\s*\(.*\)\s*$/, '')}: ${r.extra[f.key]}` : '')).filter(Boolean).join('\n');
  return [
    `Ocasião: ${cat.name}`,
    `Orientação para esta ocasião: ${cat.aiHint}`,
    extras ? `Detalhes fornecidos:\n${extras}` : '',
    `Nome de quem recebe: ${r.recipientName || 'não indicado'}`,
    `Nome de quem oferece: ${r.senderName || 'não indicado'}`,
    `Como se conheceram: ${r.howMet || 'não indicado'}`,
    `O que admira: ${r.admire || 'não indicado'}`,
    `${cat.memories.heading}:\n${mem || 'não indicados'}`,
  ].filter(Boolean).join('\n');
}

export function buildUserPrompt(r: AiRequest): string {
  const tone = TONE[r.tone] || TONE.simples;
  switch (r.action) {
    case 'generate_letter':
      if (getCategory(r.category).kind === 'evento') return `Escreve o texto de um convite em tom ${tone}, com 60 a 120 palavras, em nome dos anfitriões, dirigido aos convidados. Usa só estes dados (data, hora e local tal como indicados; não inventes detalhes):\n\n${facts(r)}`;
      return `Escreve uma carta em tom ${tone}, com 120 a 220 palavras, na primeira pessoa de quem oferece, dirigida a quem recebe. Usa só estes dados:\n\n${facts(r)}\n\nSe faltar informação, escreve algo mais geral em vez de inventar.`;
    case 'rewrite_tone':
      return `Reescreve o texto abaixo em tom ${tone}, mantendo o significado e sem acrescentar factos novos:\n\n${r.text}`;
    case 'suggest_title':
      return `Sugere UM título curto (máx. 8 palavras) para esta experiência, em tom ${tone}. Usa só estes dados:\n\n${facts(r)}\n\nTexto atual (se existir):\n${r.text}`;
    case 'suggest_closing':
      return `Sugere UMA frase final curta (máx. 20 palavras), em tom ${tone}, para terminar esta carta:\n\n${r.text || facts(r)}`;
    case 'fix_grammar':
      return `Corrige apenas a ortografia, a gramática e a pontuação do texto abaixo. Não mudes o estilo nem o conteúdo:\n\n${r.text}`;
    case 'summarize':
      return `Resume o texto abaixo em cerca de metade do tamanho, mantendo o tom e as ideias principais:\n\n${r.text}`;
    case 'photo_caption':
      return `Escreve UMA legenda curta e afetuosa (máx. 12 palavras) para uma fotografia. Descrição dada pelo utilizador: "${r.photoHint}". Não inventes o que não foi descrito.`;
  }
}
