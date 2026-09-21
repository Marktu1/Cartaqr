import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { get, run } from './db';
import { sign, verifySigned, rateLimit } from './security';

const COOKIE = 'cq_admin';
const TTL = 60 * 60 * 8; // 8 horas

export async function hashPassword(p: string) { return bcrypt.hash(p, 12); }

export async function login(email: string, password: string, ip: string): Promise<{ ok: boolean; error?: string }> {
  const rl = rateLimit(`login:${ip}`, 8, 10 * 60_000);
  if (!rl.ok) return { ok: false, error: `Demasiadas tentativas. Tenta novamente em ${Math.ceil(rl.retryAfter / 60)} min.` };
  const u = get<{ id: number; password_hash: string; role: string }>('SELECT id, password_hash, role FROM users WHERE email = ?', email.trim().toLowerCase());
  // compara sempre, para não revelar se o email existe
  const ok = await bcrypt.compare(password, u?.password_hash || '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidi');
  if (!u || !ok || u.role !== 'admin') return { ok: false, error: 'Email ou password incorretos.' };
  const exp = Math.floor(Date.now() / 1000) + TTL;
  (await cookies()).set(COOKIE, sign(`${u.id}:${exp}`), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: TTL });
  run(`INSERT INTO admin_logs(admin_id, action) VALUES(?, 'login')`, u.id);
  return { ok: true };
}

export async function logout() { (await cookies()).delete(COOKIE); }

export async function currentAdminId(): Promise<number | null> {
  const v = verifySigned((await cookies()).get(COOKIE)?.value);
  if (!v) return null;
  const [id, exp] = v.split(':').map(Number);
  if (!id || !exp || exp < Date.now() / 1000) return null;
  const u = get('SELECT id FROM users WHERE id = ? AND role = ?', id, 'admin');
  return u ? id : null;
}

/** Para páginas/ações do admin: redireciona se não autenticado. */
export async function requireAdmin(): Promise<number> {
  const id = await currentAdminId();
  if (!id) redirect('/admin/login');
  return id;
}

export function logAdmin(adminId: number | null, action: string, target?: string, details?: string) {
  run('INSERT INTO admin_logs(admin_id, action, target, details) VALUES(?,?,?,?)', adminId, action, target ?? null, details ?? null);
}
