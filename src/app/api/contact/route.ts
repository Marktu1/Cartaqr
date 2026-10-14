import { z } from 'zod';
import { ok, fail, limit, handle, botBlock } from '@/lib/api';
import { readJson } from '@/lib/security';
import { saveContactMessage } from '@/lib/messages';

export async function POST(req: Request) {
  try {
  const rl = limit(req, 'contact', 5, 60 * 60_000); if (rl) return rl;
  const raw = await readJson(req, 16 * 1024);
  const bot = botBlock(raw); if (bot) return bot;
  const b = z.object({ name: z.string().trim().min(1, 'Indica o teu nome.').max(80), contact: z.string().trim().min(3, 'Indica um email ou telefone.').max(120), message: z.string().trim().min(5, 'Escreve a tua mensagem.').max(1500) }).safeParse(raw);
  if (!b.success) return fail(b.error.issues[0]?.message || 'Dados inválidos.', 422, 'validation');
  saveContactMessage(b.data);
  return ok();
  } catch (e) { return handle(e); }
}
