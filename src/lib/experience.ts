// "Magia" da carta: surpresas e efeitos opcionais escolhidos por quem oferece.
// Ficheiro puro (sem servidor): usado pelo wizard, pela carta e pela API.
// Guardado como JSON na coluna letters.experience. O segredo e a "surpresa para mais tarde"
// nunca vão para o navegador antes de serem desbloqueados (ver publicExperience).

export type Mood = 'classico' | 'por-do-sol' | 'chuva' | 'diario' | 'panos';
export type Gesture = 'raspar' | 'caixa' | 'fita';

export type Experience = {
  teaser?: string;                 // frase da abertura cinematográfica
  mood?: Mood;                     // ambiente sensorial (efeito visual)
  song?: string;                   // link YouTube ou Spotify da "nossa música"
  cardsTitle?: string;             // ex.: "Razões porque te amo"
  cards?: string[];                // cartões para virar
  vouchers?: string[];             // vales-presente
  secret?: { hint: string; answer: string; message: string }; // detalhe secreto
  finale?: { text: string; gesture: Gesture };                 // surpresa final
  later?: { date: string; message: string };                    // surpresa para mais tarde
  reactions?: boolean;             // reações rápidas (por defeito: sim)
  capsule?: boolean;               // cápsula do tempo (por defeito: sim)
};

/** O que a página pública recebe: sem a resposta do segredo e sem conteúdo ainda fechado. */
export type PublicExperience = Omit<Experience, 'secret' | 'later'> & {
  secret?: { hint: string; message?: string };          // message só em exemplos/pré-visualização
  later?: { date: string; message?: string; open: boolean };
};

export const MOODS: { key: Mood; name: string; desc: string }[] = [
  { key: 'classico', name: 'Clássico', desc: 'Só as cores do tema' },
  { key: 'por-do-sol', name: 'Pôr do sol no Mussulo', desc: 'Tons dourados e luz quente' },
  { key: 'chuva', name: 'Noite de chuva', desc: 'Chuva suave e aconchego' },
  { key: 'diario', name: 'Diário de memórias', desc: 'Papel, textura e escrita à mão' },
  { key: 'panos', name: 'Panos de festa', desc: 'Padrões e cores de celebração angolana' },
];
export const GESTURES: { key: Gesture; name: string; desc: string }[] = [
  { key: 'raspar', name: 'Raspar', desc: 'Raspa com o dedo para revelar' },
  { key: 'caixa', name: 'Caixa-presente', desc: 'Toca na caixa para a abrir' },
  { key: 'fita', name: 'Puxar a fita', desc: 'Arrasta a fita para desatar o laço' },
];

const MOOD_KEYS = MOODS.map(m => m.key);
const GESTURE_KEYS = GESTURES.map(g => g.key);

// eslint-disable-next-line no-control-regex
const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/<\/?[a-z][^>]*>/gi, '').trim().slice(0, max) : '');
const list = (v: unknown, n: number, max: number) => (Array.isArray(v) ? v.map(x => clean(x, max)).filter(Boolean).slice(0, n) : []);

/** Aceita apenas links de partilha do YouTube ou do Spotify. */
export function songEmbed(url: string | undefined): { kind: 'youtube' | 'spotify'; src: string } | null {
  if (!url) return null;
  let u: URL; try { u = new URL(url); } catch { return null; }
  if (u.protocol !== 'https:') return null;
  const host = u.hostname.replace(/^www\.|^m\.|^music\./, '');
  let id = '';
  if (host === 'youtu.be') id = u.pathname.slice(1);
  else if (host === 'youtube.com') id = u.searchParams.get('v') || (u.pathname.match(/^\/(?:shorts|embed)\/([^/]+)/)?.[1] ?? '');
  if (id && /^[\w-]{6,20}$/.test(id)) return { kind: 'youtube', src: `https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1` };
  if (host === 'open.spotify.com') {
    const m = u.pathname.match(/^\/(?:intl-[a-z]+\/)?(track|album|playlist|episode)\/([A-Za-z0-9]{10,40})/);
    if (m) return { kind: 'spotify', src: `https://open.spotify.com/embed/${m[1]}/${m[2]}` };
  }
  return null;
}

export function sanitizeExperience(raw: unknown): Experience {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, any>;
  const e: Experience = {};
  const teaser = clean(r.teaser, 140); if (teaser) e.teaser = teaser;
  if (MOOD_KEYS.includes(r.mood)) e.mood = r.mood;
  const song = clean(r.song, 300); if (song && songEmbed(song)) e.song = song;
  const cards = list(r.cards, 10, 160); if (cards.length) { e.cards = cards; const t = clean(r.cardsTitle, 60); if (t) e.cardsTitle = t; }
  const vouchers = list(r.vouchers, 6, 90); if (vouchers.length) e.vouchers = vouchers;
  if (r.secret && typeof r.secret === 'object') {
    const s = { hint: clean(r.secret.hint, 140), answer: clean(r.secret.answer, 60), message: clean(r.secret.message, 600) };
    if (s.hint && s.answer && s.message) e.secret = s;
  }
  if (r.finale && typeof r.finale === 'object') {
    const text = clean(r.finale.text, 200);
    if (text) e.finale = { text, gesture: GESTURE_KEYS.includes(r.finale.gesture) ? r.finale.gesture : 'raspar' };
  }
  if (r.later && typeof r.later === 'object') {
    const date = clean(r.later.date, 10); const message = clean(r.later.message, 600);
    if (/^\d{4}-\d{2}-\d{2}$/.test(date) && message) e.later = { date, message };
  }
  if (r.reactions === false) e.reactions = false;
  if (r.capsule === false) e.capsule = false;
  return e;
}

export function parseExperience(raw: string | null | undefined): Experience {
  try { return sanitizeExperience(JSON.parse(raw || '{}')); } catch { return {}; }
}

/** Compara respostas sem acentos, maiúsculas nem espaços a mais (ex.: "Ilha do Mussulo" = "ilha do mussulo"). */
export function normalizeAnswer(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
export const answerMatches = (given: string, expected: string) => !!expected && normalizeAnswer(given) === normalizeAnswer(expected);

/** Data de hoje em Luanda (YYYY-MM-DD). */
export function todayLuanda(now = new Date()): string {
  return new Date(now.getTime() + 3600_000).toISOString().slice(0, 10);
}

/** Versão segura para enviar ao navegador. `reveal` = exemplos e pré-visualização (mostra tudo). */
export function publicExperience(e: Experience, opts: { reveal?: boolean; now?: Date } = {}): PublicExperience {
  const { secret, later, ...rest } = e; const out: PublicExperience = { ...rest };
  if (secret) out.secret = opts.reveal ? { hint: secret.hint, message: secret.message } : { hint: secret.hint };
  if (later) {
    const open = opts.reveal || later.date <= todayLuanda(opts.now);
    out.later = open ? { date: later.date, message: later.message, open: true } : { date: later.date, open: false };
  }
  return out;
}

/** Títulos sugeridos para os cartões, por ocasião. */
export function defaultCardsTitle(category: string | undefined): string {
  switch (category) {
    case 'amor': case 'pedido-namoro': case 'pedido-casamento': case 'dia-namorados': case 'distancia': return 'Razões porque te amo';
    case 'familia': return 'Porque és a minha família';
    case 'formatura': return 'Porque tenho orgulho de ti';
    case 'dia-mae': return 'O que a mãe me ensinou';
    case 'dia-pai': return 'O que o pai me ensinou';
    case 'amizade': return 'Porque és o meu melhor amigo';
    default: return 'Coisas que quero que saibas';
  }
}

export const REACTIONS = ['Li tudo ❤', 'Também me lembro desse dia', 'Quero falar contigo', 'Fiquei sem palavras', 'Chorei 😭'];

/** Como mostrar cada resposta a quem ofereceu (painel do cliente e admin). A cápsula só mostra o texto quando abrir. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function describeReply(r: Record<string, any>): { badge: string; text: string; highlight: boolean } {
  switch (r.kind) {
    case 'answer': return { badge: '★ Resposta à pergunta', text: r.message, highlight: true };
    case 'reaction': return { badge: 'Reação', text: r.message, highlight: false };
    case 'voucher': return { badge: '🎟 Vale resgatado', text: r.message, highlight: true };
    case 'capsule': {
      const open = !!r.open_at && r.open_at <= todayLuanda();
      return { badge: `⌛ Cápsula do tempo · ${open ? 'aberta' : `abre a ${r.open_at}`}`, text: open ? r.message : 'O conteúdo fica fechado até à data.', highlight: false };
    }
    default: return { badge: 'Mensagem', text: r.message, highlight: false };
  }
}
