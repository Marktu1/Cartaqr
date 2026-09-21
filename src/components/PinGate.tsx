'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function PinGate({ token }: { token: string }) {
  const [pin, setPin] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const router = useRouter();
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const r = await fetch(`/api/carta/${token}/pin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin }) });
      const j = await r.json().catch(() => null);
      if (j?.ok) router.refresh(); else setError(j?.error || 'PIN incorreto. Tenta novamente.');
    } catch { setError('Sem ligação à internet. Tenta novamente.'); }
    setBusy(false);
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-5">
      <form onSubmit={submit} className="card w-full max-w-sm p-7 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-rose-soft text-2xl" aria-hidden>🔒</div>
        <h1 className="h-display text-2xl font-semibold text-wine">Esta carta está protegida</h1>
        <p className="mt-2 text-muted">Quem ta ofereceu deve ter-te dito o PIN.</p>
        <label htmlFor="pin" className="label mt-5 text-left">PIN</label>
        <input id="pin" inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="field text-center text-2xl tracking-[.4em]" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} required />
        {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{error}</p>}
        <button className="btn btn-primary mt-5 w-full" disabled={busy || pin.length < 4}>{busy ? 'A verificar…' : 'Abrir carta'}</button>
      </form>
    </main>
  );
}
