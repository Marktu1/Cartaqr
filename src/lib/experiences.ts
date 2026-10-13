// Experiências: cada ocasião pode ter a sua própria apresentação (visual, ritmo e animação).
// Ficheiro puro (sem servidor): usado pela carta pública, pelos exemplos, pelo admin e pelas páginas de marketing.
export type ExperienceId = 'padrao' | 'refinado' | 'pedido' | 'familia';

export type ExperienceInfo = { id: ExperienceId; name: string; tagline: string; hue: string; demo?: string };

export const EXPERIENCES: Record<ExperienceId, ExperienceInfo> = {
  padrao: { id: 'padrao', name: 'Clássica', tagline: 'Simples e limpa, para qualquer ocasião.', hue: '#6B1B34' },
  refinado: { id: 'refinado', name: 'Refinada', tagline: 'Papel rosado, renda e filigrana para o dia mais elegante.', hue: '#43141F', demo: 'convite-casamento' },
  pedido: { id: 'pedido', name: 'A pergunta', tagline: 'Uma noite, uma história e uma pergunta no fim.', hue: '#1C0F16', demo: 'pergunta-para-ti' },
  familia: { id: 'familia', name: 'Álbum de família', tagline: 'Fotos polaroid, notas à mão e muito calor.', hue: '#B5532F', demo: 'para-a-mae' },
};

/** Ocasião → experiência. As que não estão aqui usam a experiência clássica. */
const BY_CATEGORY: Record<string, ExperienceId> = {
  'convite-casamento': 'refinado',
  'pedido-namoro': 'pedido', 'pedido-casamento': 'pedido',
  'dia-mae': 'familia', 'dia-pai': 'familia', familia: 'familia',
};

export const experienceIdOf = (category: string | null | undefined): ExperienceId => BY_CATEGORY[category || ''] || 'padrao';
export const experienceOf = (category: string | null | undefined): ExperienceInfo => EXPERIENCES[experienceIdOf(category)];

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
/** "2027-05-22" → "22 de maio de 2027" (sem depender do fuso horário). */
export function longDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); if (!m) return '';
  return `${Number(m[3])} de ${MONTHS[Number(m[2]) - 1]} de ${m[1]}`;
}

/** "16:30 Receção" → { time: '16:30', rest: 'Receção' }. */
export function splitTime(title: string) {
  const m = title.match(/^\s*(\d{1,2}[:h]\d{2})\s*[-–·]?\s*(.*)$/);
  return m ? { time: m[1].replace('h', ':'), rest: m[2] || title } : { time: '', rest: title };
}
