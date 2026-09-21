import { z } from 'zod';
import { run } from '@/lib/db';
import { ok, fail, limit } from '@/lib/api';
import { cleanText } from '@/lib/security';

export async function POST(req: Request) {
  const rl = limit(req, 'contact', 5, 60 * 60_000); if (rl) return rl;
  const b = z.object({ name: z.string().trim().min(1, 'Indica o teu nome.').max(80), contact: z.string().trim().min(3, 'Indica um email ou telefone.').max(120), message: z.string().trim().min(5, 'Escreve a tua mensagem.').max(1500) }).safeParse(await req.json().catch(() => null));
  if (!b.success) return fail(b.error.issues[0]?.message || 'Dados inválidos.', 422, 'validation');
  run('INSERT INTO contact_messages(name, contact, message) VALUES(?,?,?)', cleanText(b.data.name, 80), cleanText(b.data.contact, 120), cleanText(b.data.message, 1500));
  return ok();
}
