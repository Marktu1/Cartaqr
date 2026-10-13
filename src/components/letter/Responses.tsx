'use client';
import { useFormGuard } from '../useFormGuard';
import { useState } from 'react';
import { REACTIONS } from '@/lib/experience';
import { celebrate, type BurstKind } from './Celebration';

const fmt = (d: string) => new Intl.DateTimeFormat('pt-PT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(d + 'T12:00:00Z'));
async function post(token: string, body: unknown) {
  try {
    const r = await fetch(`/api/carta/${token}/reply`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return (await r.json().catch(() => null)) || { ok: false, error: 'Não foi possível enviar.' };
  } catch { return { ok: false, error: 'Sem ligação à internet. Tenta novamente.' }; }
}

/** Reações num toque, para quando ainda não se sabe o que dizer. */
export function Reactions({ token, demo, sender, burst }: { token?: string; demo?: boolean; sender: string; burst: BurstKind }) {
  const { guard } = useFormGuard();
  const [sent, setSent] = useState<string[]>([]); const [err, setErr] = useState('');
  async function react(r: string) {
    if (sent.includes(r)) return; setErr('');
    if (!demo && token) { const j = await post(token, { kind: 'reaction', message: r, ...(await guard()) }); if (!j.ok) { setErr(j.error); return; } }
    setSent(s => [...s, r]); if (sent.length === 0) celebrate(burst);
  }
  return (
    <section aria-label="Reagir" className="reveal mt-12 text-center">
      <h2 className="h-display text-xl text-[var(--c-accent)]">Diz {sender ? `a ${sender}` : ''} o que sentiste</h2>
      <p className="mt-1 text-sm opacity-70">Basta um toque.</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {REACTIONS.map(r => (
          <button key={r} type="button" onClick={() => react(r)} aria-pressed={sent.includes(r)}
            className={`rounded-full border-2 px-4 py-2 text-sm font-semibold transition ${sent.includes(r) ? 'border-[var(--c-accent)] bg-[var(--c-accent)] text-[var(--c-bg)]' : 'border-[var(--c-accent)]/25 bg-[var(--c-card)] hover:border-[var(--c-accent)]/60'}`}>
            {sent.includes(r) ? '✓ ' : ''}{r}
          </button>))}
      </div>
      <p className="mt-2 text-sm" role="status">{sent.length > 0 ? (demo ? 'Enviado! (Exemplo: nada foi enviado.)' : `Enviado${sender ? ` a ${sender}` : ''} ❤`) : ''}</p>
      {err && <p role="alert" className="text-sm font-semibold text-red-600">{err}</p>}
    </section>
  );
}

/** Cápsula do tempo: uma promessa que só abre daqui a um ano, neste mesmo link. */
export function Capsule({ token, demo, capsules }: { token?: string; demo?: boolean; capsules: { author: string; message?: string; openAt: string; open: boolean }[] }) {
  const { guard, trap } = useFormGuard();
  const [open, setOpen] = useState(false); const [msg, setMsg] = useState(''); const [author, setAuthor] = useState('');
  const [saved, setSaved] = useState<string | null>(null); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    if (msg.trim().length < 3) { setErr('Escreve a tua promessa ou mensagem.'); return; }
    if (demo || !token) { const d = new Date(); d.setFullYear(d.getFullYear() + 1); setSaved(d.toISOString().slice(0, 10)); return; }
    setBusy(true); const j = await post(token, { kind: 'capsule', author, message: msg, ...(await guard()) }); setBusy(false);
    if (j.ok) setSaved(j.openAt); else setErr(j.error);
  }
  return (
    <section aria-label="Cápsula do tempo" className="reveal mt-12">
      <div className="capsule-card">
        <p className="text-3xl" aria-hidden>⌛</p>
        <h2 className="h-display mt-1 text-xl text-[var(--c-accent)]">Cápsula do tempo</h2>
        {capsules.map((c, i) => c.open
          ? <div key={i} className="mt-4 rounded-xl bg-[var(--c-soft)] p-4 text-left"><p className="text-xs font-semibold uppercase tracking-wider opacity-70">Aberta a {fmt(c.openAt)}{c.author ? ` · ${c.author}` : ''}</p><p className="h-display letter-text mt-1 whitespace-pre-line text-lg">{c.message}</p></div>
          : <p key={i} className="mt-3 text-sm opacity-80">🔒 Há uma cápsula fechada{c.author ? ` de ${c.author}` : ''} que abre a <strong>{fmt(c.openAt)}</strong>.</p>)}
        {saved ? <p role="status" className="mt-4 font-semibold">Guardada! Abre aqui, neste link, a {fmt(saved)}.{demo && <span className="block text-xs font-normal opacity-60">(Exemplo: nada foi guardado.)</span>}</p>
          : !open ? <><p className="mt-2 text-sm opacity-80">Escreve uma promessa ou mensagem para abrirem juntos daqui a um ano.</p>
            <button type="button" className="btn btn-sm mt-4 border-2 border-[var(--c-accent)]/40 bg-transparent" onClick={() => setOpen(true)}>Escrever para daqui a 1 ano</button></>
          : <form onSubmit={save} className="relative mt-4 text-left">{trap}
              <label className="label" htmlFor="cap-msg">A tua promessa</label>
              <textarea id="cap-msg" className="field min-h-[100px]" maxLength={600} value={msg} onChange={e => setMsg(e.target.value)} placeholder="Daqui a um ano, quero que…" />
              <label className="label mt-3" htmlFor="cap-a">O teu nome (opcional)</label>
              <input id="cap-a" className="field" maxLength={60} value={author} onChange={e => setAuthor(e.target.value)} />
              {err && <p role="alert" className="mt-2 text-sm font-semibold text-red-600">{err}</p>}
              <button className="btn mt-4 w-full" style={{ background: 'var(--c-accent)', color: 'var(--c-bg)' }} disabled={busy}>{busy ? 'A guardar…' : 'Fechar a cápsula'}</button>
            </form>}
      </div>
    </section>
  );
}
