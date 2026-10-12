import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { get, run } from './db';
import { sign, verifySigned, rateLimit } from './security';
import { adminCookieName, adminCookieOptions } from './cookies';
import { isExamplePassword } from './secrets';

const TTL = 60 * 60 * 8; // 8 horas
// Hash bcrypt válido de uma password aleatória: a comparação demora o mesmo com ou sem conta.
const DUMMY_HASH = '$2b$12$BN1dXM30ei4klZ9LtIqxk.4up23A7mk/jzN4XUF43aYR..IcabDXC';

export async function hashPassword(p: string) { return bcrypt.hash(p, 12); }

export async function login(email: string, password: string, ip: string): Promise<{ ok: boolean; error?: string }> {
  const em = email.trim().toLowerCase().slice(0, 254);
  // Três travões: por IP, por conta (contra ataques distribuídos) e global (contra enxurradas).
  const byIp = rateLimit(`login:${ip}`, 8, 15 * 60_000);
  const byAccount = rateLimit(`login-acct:${em}`, 5, 15 * 60_000);
  const global = rateLimit('login-all', 100, 15 * 60_000);
  const blocked = [byIp, byAccount, global].find(r => !r.ok);
  if (blocked) return { ok: false, error: `Demasiadas tentativas. Tenta novamente em ${Math.max(1, Math.ceil(blocked.retryAfter / 60))} min.` };
  if (password.length > 200) return { ok: false, error: 'Email ou password incorretos.' };
  // A password de exemplo do .env.example é pública: nunca dá acesso, mesmo que tenha sido usada.
  if (isExamplePassword(password)) return { ok: false, error: 'Esta password é a de exemplo e foi bloqueada. Define uma ADMIN_PASSWORD forte com ADMIN_RESET_PASSWORD=1 (ver SECURITY.md).' };
  const u = get<{ id: number; password_hash: string; role: string; session_version: number }>('SELECT id, password_hash, role, session_version FROM users WHERE email = ?', em);
  // compara sempre, para não revelar se o email existe
  const ok = await bcrypt.compare(password, u?.password_hash || DUMMY_HASH);
  if (!u || !ok || u.role !== 'admin') {
    run(`INSERT INTO admin_logs(admin_id, action, details) VALUES(NULL, 'login_failed', ?)`, `ip=${ip}`);
    return { ok: false, error: 'Email ou password incorretos.' };
  }
  const exp = Math.floor(Date.now() / 1000) + TTL;
  (await cookies()).set(adminCookieName(), sign(`admin:${u.id}:${exp}:${u.session_version || 0}`), adminCookieOptions(TTL));
  run(`INSERT INTO admin_logs(admin_id, action, details) VALUES(?, 'login', ?)`, u.id, `ip=${ip}`);
  return { ok: true };
}

/** Termina a sessão neste browser e invalida todas as outras sessões deste administrador. */
export async function logout() {
  const id = await currentAdminId();
  if (id) run('UPDATE users SET session_version = session_version + 1 WHERE id = ?', id);
  (await cookies()).delete(adminCookieName());
}

export async function currentAdminId(): Promise<number | null> {
  const v = verifySigned((await cookies()).get(adminCookieName())?.value);
  if (!v) return null;
  const [tag, idS, expS, verS] = v.split(':');
  const id = Number(idS); const exp = Number(expS); const ver = Number(verS);
  if (tag !== 'admin' || !id || !exp || exp < Date.now() / 1000 || !Number.isInteger(ver)) return null;
  const u = get<{ session_version: number }>('SELECT session_version FROM users WHERE id = ? AND role = ?', id, 'admin');
  return u && (u.session_version || 0) === ver ? id : null;
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
