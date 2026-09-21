export type PlanRow = { id: number; slug: string; kind: 'carta' | 'evento'; max_guests: number; effective_price: number; promo_active: boolean; promo_ends_at: string | null; name: string; description: string; price: number; currency: string; features: string[]; max_photos: number; max_videos: number; max_audio_files: number; duration_days: number };
export type OccasionRow = { slug: string; name: string; description: string; default_theme: string; kind: 'carta' | 'evento' };
export type ServerState = {
  order: { reference: string; status: string; paymentStatus: string; amount: number; currency: string; hasProof: boolean; paymentNote: string | null; discountCode: string | null; discountAmount: number; occasion: string; planId: number; kind: 'carta' | 'evento' };
  plan: { id: number; name: string; maxPhotos: number; maxVideos: number; maxAudio: number; maxGuests: number; durationDays: number };
  letter: { recipientName: string; senderName: string; title: string; intro: string; mainMessage: string; closingMessage: string; specialDate: string | null; unlockAt: string; theme: string; tone: string | null;
    howMet: string | null; admire: string | null; musicMode: string; ambient: string | null; musicRightsAck: boolean; allowReply: boolean; coverMediaId: number | null; hasPin: boolean; isPublished: boolean; publicPath: string | null; extra: Record<string, string> };
  memories: { title: string; description: string; date: string }[];
  media: { id: number; type: string; caption: string; altText: string; sortOrder: number; size: number; mime: string; name: string; url: string }[];
  limits: { image: number; video: number; audio: number; proof: number };
  whatsapp: string;
};
export type Form = {
  occasion: string; planId: number | null; recipientName: string; senderName: string; title: string; specialDate: string; contact: string; language: 'pt' | 'en'; theme: string;
  howMet: string; memories: { title: string; description: string }[]; admire: string; mainMessage: string; closingMessage: string; tone: string;
  musicMode: 'none' | 'own' | 'ambient' | 'library'; ambient: string; musicRightsAck: boolean; pin: string; unlockAt: string; allowReply: boolean; aiUsed: boolean; extra: Record<string, string>;
};
export const EMPTY_FORM: Form = {
  occasion: '', planId: null, recipientName: '', senderName: '', title: '', specialDate: '', contact: '', language: 'pt', theme: 'romantico',
  howMet: '', memories: [{ title: '', description: '' }, { title: '', description: '' }, { title: '', description: '' }], admire: '', mainMessage: '', closingMessage: '', tone: 'romantico',
  musicMode: 'none', ambient: 'piano-suave', musicRightsAck: false, pin: '', unlockAt: '', allowReply: false, aiUsed: false, extra: {},
};
export const TONES: [string, string][] = [['romantico', 'Romântico'], ['emocionante', 'Emocionante'], ['divertido', 'Divertido'], ['elegante', 'Elegante'], ['simples', 'Simples e sincero'], ['poetico', 'Poético']];
