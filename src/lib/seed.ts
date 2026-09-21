import { get, run } from './db';
import { hashPassword } from './auth-hash';
import { CATEGORIES } from './categories';

export const PLANS = [
  // ---- Cartas ----
  { slug: 'essencial', kind: 'carta', name: 'Essencial', description: 'Para uma mensagem bonita e direta.', price: 4500, max_photos: 6, max_videos: 0, max_audio_files: 0, max_guests: 0, duration_days: 90, sort_order: 1,
    features: ['Página personalizada', 'Até 6 fotografias', 'Texto personalizado', 'Link privado', 'QR Code'] },
  { slug: 'romantico', kind: 'carta', name: 'Romântico', description: 'O mais escolhido para surpresas especiais.', price: 8500, max_photos: 15, max_videos: 1, max_audio_files: 2, max_guests: 0, duration_days: 180, sort_order: 2,
    features: ['Tudo do Essencial', 'Até 15 fotografias', 'Vídeo curto', 'Áudio', 'Música ou ambiente sonoro opcional', 'Animações especiais'] },
  { slug: 'premium', kind: 'carta', name: 'Premium', description: 'Cuidado máximo, com revisão da nossa equipa.', price: 14000, max_photos: 30, max_videos: 3, max_audio_files: 3, max_guests: 0, duration_days: 365, sort_order: 3,
    features: ['Tudo do Romântico', 'Mais fotografias e vídeos', 'Design mais personalizado', 'Revisão manual da equipa', 'Entrega prioritária', 'Maior período de disponibilidade'] },
  // ---- Eventos (convites com confirmação de presença) ----
  { slug: 'evento-basico', kind: 'evento', name: 'Evento Básico', description: 'Convite digital para eventos pequenos.', price: 25000, max_photos: 20, max_videos: 1, max_audio_files: 1, max_guests: 100, duration_days: 180, sort_order: 11,
    features: ['Convite com programa, local e mapa', 'Contagem decrescente', 'Confirmação de presença (RSVP) até 100 pessoas', 'Lista de confirmados exportável (CSV)', 'Até 20 fotografias e 1 vídeo', 'Link privado e QR Code para os convites'] },
  { slug: 'evento-premium', kind: 'evento', name: 'Evento Premium', description: 'Para casamentos e celebrações maiores.', price: 45000, max_photos: 40, max_videos: 3, max_audio_files: 2, max_guests: 300, duration_days: 365, sort_order: 12,
    features: ['Tudo do Evento Básico', 'Confirmação de presença até 300 pessoas', 'Até 40 fotografias e 3 vídeos', 'Música ou ambiente sonoro', 'Revisão manual da equipa', 'Entrega prioritária', 'Disponível durante 1 ano'] },
  { slug: 'evento-exclusivo', kind: 'evento', name: 'Evento Exclusivo', description: 'Design à medida e apoio até ao grande dia.', price: 80000, max_photos: 60, max_videos: 5, max_audio_files: 3, max_guests: 1000, duration_days: 365, sort_order: 13,
    features: ['Tudo do Evento Premium', 'Confirmação de presença até 1000 pessoas', 'Design personalizado à medida', 'Até 60 fotografias e 5 vídeos', 'Apoio da equipa no dia do evento', 'Suporte prioritário por WhatsApp'] },
];
// preços antigos (v1) que devem ser atualizados automaticamente em bases de dados existentes
const LEGACY_PRICES: Record<string, number> = { essencial: 5000, romantico: 9000, premium: 15000 };

export async function seed(opts: { adminEmail?: string; adminPassword?: string } = {}) {
  for (const p of PLANS) {
    const cur = get<{ id: number; price: number }>('SELECT id, price FROM plans WHERE slug = ?', p.slug);
    if (!cur) {
      run(`INSERT INTO plans(slug, kind, name, description, price, currency, max_photos, max_videos, max_audio_files, max_guests, duration_days, features, sort_order)
           VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`, p.slug, p.kind, p.name, p.description, p.price, 'Kz', p.max_photos, p.max_videos, p.max_audio_files, p.max_guests, p.duration_days, JSON.stringify(p.features), p.sort_order);
    } else {
      run('UPDATE plans SET kind = ? WHERE id = ?', p.kind, cur.id);
      if (LEGACY_PRICES[p.slug] === cur.price) run('UPDATE plans SET price = ? WHERE id = ?', p.price, cur.id); // só se o admin não tiver alterado
    }
  }
  CATEGORIES.forEach((c, i) => {
    if (!get('SELECT 1 FROM occasions WHERE slug = ?', c.slug)) run('INSERT INTO occasions(slug, name, description, default_theme, kind, sort_order) VALUES(?,?,?,?,?,?)', c.slug, c.name, c.short, c.theme, c.kind, i);
    else run('UPDATE occasions SET kind = ?, sort_order = ? WHERE slug = ?', c.kind, i, c.slug);
  });
  const email = (opts.adminEmail || process.env.ADMIN_EMAIL || 'admin@cartaqr.local').toLowerCase();
  const pass = opts.adminPassword || process.env.ADMIN_PASSWORD;
  if (!get('SELECT 1 FROM users WHERE email = ?', email)) {
    if (!pass || pass.length < 10) throw new Error('Define ADMIN_PASSWORD com pelo menos 10 caracteres antes de correr o seed.');
    run('INSERT INTO users(email, role, password_hash) VALUES(?,?,?)', email, 'admin', await hashPassword(pass));
  }
}
