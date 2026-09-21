import { aiRequestSchema, firstError } from '@/lib/validation';
import { runAi, aiStatus, AiUnavailableError } from '@/lib/ai';
import { ok, fail, handle, limit, orderFromToken } from '@/lib/api';

export async function GET() { return ok(aiStatus()); }

export async function POST(req: Request) {
  try {
    const rl = limit(req, 'ai', 15, 10 * 60_000); if (rl) return rl;
    const url = new URL(req.url);
    orderFromToken(url.searchParams.get('t') || ''); // só quem tem uma encomenda pode usar a IA
    const parsed = aiRequestSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail(firstError(parsed.error), 422, 'validation');
    try {
      const r = await runAi(parsed.data);
      return ok({ text: r.text, provider: r.provider, draft: true });
    } catch (e) {
      if (e instanceof AiUnavailableError) return fail('A ajuda com IA não está ativa neste momento. Podes escrever a mensagem manualmente.', 503, 'ai_unavailable');
      console.error('[ai]', e instanceof Error ? e.message : e);
      return fail('Não conseguimos gerar o texto agora. Tenta de novo daqui a pouco ou escreve a mensagem manualmente.', 502, 'ai_failed');
    }
  } catch (e) { return handle(e); }
}
