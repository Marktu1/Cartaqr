// Camada de acesso a dados (SQLite via node:sqlite). Para migrar para Postgres/Supabase,
// substitui este ficheiro e src/lib/repo.ts mantendo as mesmas funções.
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DatabaseSync } = require('node:sqlite');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, phone TEXT,
  role TEXT NOT NULL DEFAULT 'admin', password_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL, currency TEXT NOT NULL DEFAULT 'Kz', max_photos INTEGER NOT NULL, max_videos INTEGER NOT NULL,
  max_audio_files INTEGER NOT NULL, duration_days INTEGER NOT NULL, features TEXT NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0, is_active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS occasions (
  id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
  default_theme TEXT NOT NULL DEFAULT 'romantico', sort_order INTEGER NOT NULL DEFAULT 0, is_active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT, public_reference TEXT UNIQUE NOT NULL, manage_token TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL DEFAULT '', customer_email TEXT, customer_phone TEXT,
  occasion TEXT NOT NULL, plan_id INTEGER NOT NULL REFERENCES plans(id), amount INTEGER NOT NULL, currency TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'unpaid', order_status TEXT NOT NULL DEFAULT 'draft',
  payment_proof_path TEXT, payment_proof_mime TEXT, payment_note TEXT, admin_notes TEXT, completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS letters (
  id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  secure_token TEXT UNIQUE NOT NULL, recipient_name TEXT NOT NULL DEFAULT '', sender_name TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '', intro TEXT NOT NULL DEFAULT '', main_message TEXT NOT NULL DEFAULT '',
  closing_message TEXT NOT NULL DEFAULT '', special_date TEXT, theme TEXT NOT NULL DEFAULT 'romantico', language TEXT NOT NULL DEFAULT 'pt',
  tone TEXT, how_met TEXT, admire TEXT, music_mode TEXT NOT NULL DEFAULT 'none', ambient TEXT, music_rights_ack INTEGER NOT NULL DEFAULT 0,
  allow_reply INTEGER NOT NULL DEFAULT 0, cover_media_id INTEGER, pin_hash TEXT,
  is_published INTEGER NOT NULL DEFAULT 0, is_blocked INTEGER NOT NULL DEFAULT 0, ai_used INTEGER NOT NULL DEFAULT 0,
  published_at TEXT, expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS memories (
  id INTEGER PRIMARY KEY AUTOINCREMENT, letter_id INTEGER NOT NULL REFERENCES letters(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '', description TEXT NOT NULL DEFAULT '', date TEXT, sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS media_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT, letter_id INTEGER NOT NULL REFERENCES letters(id) ON DELETE CASCADE,
  type TEXT NOT NULL, storage_path TEXT NOT NULL, caption TEXT NOT NULL DEFAULT '', alt_text TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0, file_size INTEGER NOT NULL, mime_type TEXT NOT NULL, original_name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS admin_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, admin_id INTEGER, action TEXT NOT NULL, target TEXT, details TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS order_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status TEXT, to_status TEXT, actor TEXT NOT NULL, note TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS letter_replies (
  id INTEGER PRIMARY KEY AUTOINCREMENT, letter_id INTEGER NOT NULL REFERENCES letters(id) ON DELETE CASCADE,
  author TEXT NOT NULL DEFAULT '', message TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, contact TEXT NOT NULL, message TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS rsvps (
  id INTEGER PRIMARY KEY AUTOINCREMENT, letter_id INTEGER NOT NULL REFERENCES letters(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL, attending TEXT NOT NULL, guests INTEGER NOT NULL DEFAULT 1, message TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS letter_views (
  letter_id INTEGER NOT NULL REFERENCES letters(id) ON DELETE CASCADE, day TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (letter_id, day)
);
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, source TEXT NOT NULL DEFAULT 'site', consent_at TEXT NOT NULL DEFAULT (datetime('now')),
  unsub_token TEXT NOT NULL UNIQUE, unsubscribed_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS discount_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL UNIQUE, kind TEXT NOT NULL DEFAULT 'percent', value INTEGER NOT NULL, applies_to TEXT NOT NULL DEFAULT 'all',
  valid_until TEXT, max_uses INTEGER NOT NULL DEFAULT 0, used_count INTEGER NOT NULL DEFAULT 0, is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS notification_log (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at TEXT NOT NULL DEFAULT (datetime('now')), channel TEXT NOT NULL, to_hash TEXT NOT NULL, kind TEXT NOT NULL, status TEXT NOT NULL, detail TEXT);
CREATE TABLE IF NOT EXISTS analytics_events (day TEXT NOT NULL, name TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, name));
CREATE INDEX IF NOT EXISTS idx_rsvps_letter ON rsvps(letter_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_media_letter ON media_assets(letter_id);
CREATE INDEX IF NOT EXISTS idx_memories_letter ON memories(letter_id);
`;

type DB = InstanceType<typeof DatabaseSync>;
const g = globalThis as unknown as { __cartaDb?: DB };

export function getDb(): DB {
  if (g.__cartaDb) return g.__cartaDb;
  fs.mkdirSync(config.dataDir, { recursive: true });
  const db = new DatabaseSync(path.join(config.dataDir, 'cartaqr.db'));
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);
  // Migrações aditivas (bases de dados criadas por versões anteriores)
  const ensure = (table: string, col: string, ddl: string) => {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
    if (!cols.some(c => c.name === col)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${ddl}`);
  };
  ensure('letters', 'unlock_at', 'TEXT');
  ensure('plans', 'promo_price', 'INTEGER');
  ensure('plans', 'promo_ends_at', 'TEXT');
  ensure('orders', 'discount_code', 'TEXT');
  ensure('orders', 'discount_amount', 'INTEGER NOT NULL DEFAULT 0');
  ensure('plans', 'kind', "TEXT NOT NULL DEFAULT 'carta'");
  ensure('plans', 'max_guests', 'INTEGER NOT NULL DEFAULT 0');
  ensure('occasions', 'kind', "TEXT NOT NULL DEFAULT 'carta'");
  ensure('letters', 'extra', 'TEXT');
  ensure('letter_replies', 'kind', "TEXT NOT NULL DEFAULT 'message'");
  g.__cartaDb = db;
  return db;
}

/** Fecha a ligação (usado nos testes). */
export function closeDb() {
  if (g.__cartaDb) { g.__cartaDb.close(); g.__cartaDb = undefined; }
}

// Helpers tipados; usam SEMPRE parâmetros (proteção contra SQL injection).
export type Row = Record<string, any>;
export function all<T = Row>(sql: string, ...params: any[]): T[] { return getDb().prepare(sql).all(...params) as T[]; }
export function get<T = Row>(sql: string, ...params: any[]): T | undefined { return getDb().prepare(sql).get(...params) as T | undefined; }
export function run(sql: string, ...params: any[]) { return getDb().prepare(sql).run(...params) as { changes: number; lastInsertRowid: number | bigint }; }
