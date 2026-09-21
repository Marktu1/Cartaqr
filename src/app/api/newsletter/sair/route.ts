import { fail, ok, handle, limit } from '@/lib/api';
import { unsubscribe } from '@/lib/newsletter';
export async function POST(req: Request) {
  try {
    const rl = limit(req, 'nl-out', 20, 3600_000); if (rl) return rl;
    const b = await req.json().catch(() => null) as { token?: string } | null;
    return unsubscribe(String(b?.token || '')) ? ok() : fail('Link inválido.', 404, 'not_found');
  } catch (e) { return handle(e); }
}
