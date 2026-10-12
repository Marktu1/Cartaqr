// Resolução dos segredos do servidor. Nunca importado por componentes de cliente.
// Regras:
//  - Em produção, um segredo ausente, curto ou igual ao exemplo do .env.example NUNCA é usado.
//    Em vez disso é gerado um segredo aleatório e guardado em DATA_DIR (permissões 0600),
//    para a app continuar segura mesmo que a variável de ambiente não tenha sido configurada.
//  - Em desenvolvimento/testes usa-se um valor fixo, para não depender de ficheiros.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const PLACEHOLDERS = [/^troca/i, /^change/i, /^dev-insecure/i, /^\.\.\.$/, /^secret$/i, /^password/i];
const isProd = () => process.env.NODE_ENV === 'production';

export function looksLikePlaceholder(v: string | undefined): boolean {
  return !v || PLACEHOLDERS.some(re => re.test(v.trim()));
}

/** Passwords publicadas em exemplos/documentação: nunca aceites. */
const EXAMPLE_PASSWORDS = ['troca-esta-password', 'change-me', 'changeme', 'password', 'password123', 'admin', 'admin123', '12345678', '123456789012'];
export function isExamplePassword(p: string | undefined): boolean { return !!p && EXAMPLE_PASSWORDS.includes(p.trim().toLowerCase()); }

function dataDir() { return path.resolve(process.env.DATA_DIR || './data'); }

function fileSecret(name: string): string {
  const dir = dataDir(); const p = path.join(dir, name);
  try { const v = fs.readFileSync(p, 'utf8').trim(); if (v.length >= 43) return v; } catch { /* cria abaixo */ }
  fs.mkdirSync(dir, { recursive: true });
  const v = crypto.randomBytes(48).toString('base64url');
  try { fs.writeFileSync(p, v, { mode: 0o600, flag: 'wx' }); } catch { return fs.readFileSync(p, 'utf8').trim(); }
  console.warn(`[segurança] ${name} gerado automaticamente em DATA_DIR. Define a variável de ambiente correspondente para o fixar.`);
  return v;
}

const cache: Record<string, string> = {};

/** Segredo para assinar sessões, cookies e URLs (HMAC). */
export function sessionSecret(): string {
  if (cache.session) return cache.session;
  const env = process.env.SESSION_SECRET;
  if (env && env.length >= 32 && !looksLikePlaceholder(env)) return (cache.session = env);
  if (isProd()) return (cache.session = fileSecret('.session-secret'));
  return (cache.session = 'dev-insecure-secret-change-me-please-0000');
}

/** Chave AES-256 para cifrar dados sensíveis em repouso (contactos e ficheiros). */
export function dataKey(): Buffer {
  if (cache.data) return Buffer.from(cache.data, 'base64');
  const env = process.env.DATA_ENCRYPTION_KEY;
  let material: string;
  if (env && env.length >= 32 && !looksLikePlaceholder(env)) material = env;
  else if (isProd()) material = fileSecret('.data-key');
  else material = 'dev-insecure-data-key-change-me-please-0000';
  const key = Buffer.from(crypto.hkdfSync('sha256', material, 'carta-qr', 'data-at-rest-v1', 32));
  cache.data = key.toString('base64');
  return key;
}

/** Só para testes. */
export function resetSecretCache() { for (const k of Object.keys(cache)) delete cache[k]; }
