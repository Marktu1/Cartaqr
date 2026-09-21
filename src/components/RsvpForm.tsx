'use client';
import { useState } from 'react';

export function RsvpForm({ token, open, reason, deadline, demo }: { token: string; open: boolean; reason?: string; deadline?: string; demo?: boolean }) {
  const [name, setName] = useState(''); const [attending, setAttending] = useState<'yes' | 'no' | 'maybe'>('yes'); const [guests, setGuests] = useState(1); const [message, setMessage] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle'); const [error, setError] = useState(''); const [updated, setUpdated] = useState(false);
  if (!open) return <section className="mt-12 rounded-xl2 bg-[var(--c-card)] p-5 text-center shadow-soft" aria-label="Confirmação de presença"><h2 className="h-display text-xl text-[var(--c-accent)]">Confirmação de presença</h2><p className="mt-2 opacity-80">{reason || 'As confirmações estão encerradas.'}</p></section>;
  async function send(e: React.FormEvent) {
    e.preventDefault(); setError('');
    if (!name.trim()) { setError('Indica o teu nome.'); return; }
    if (demo) { setState('sent'); return; }
    setState('sending');
    try {
      const r = await fetch(`/api/carta/${token}/rsvp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, attending, guests, message }) });
      const j = await r.json().catch(() => null);
      if (j?.ok) { setUpdated(!!j.updated); setState('sent'); } else { setError(j?.error || 'Não foi possível enviar. Tenta novamente.'); setState('idle'); }
    } catch { setError('Sem ligação à internet. Tenta novamente.'); setState('idle'); }
  }
  if (state === 'sent') return <section role="status" className="mt-12 rounded-xl2 bg-[var(--c-soft)] p-6 text-center"><p className="h-display text-xl text-[var(--c-accent)]">{attending === 'no' ? 'Obrigado por avisares.' : attending === 'maybe' ? 'Registámos o teu “talvez”.' : 'Presença confirmada!'}</p><p className="mt-1 opacity-80">{demo ? 'Isto é um exemplo: nada foi enviado.' : updated ? 'Atualizámos a tua resposta.' : 'Os anfitriões já receberam a tua resposta.'}</p></section>;
  const opts: ['yes' | 'no' | 'maybe', string][] = [['yes', 'Vou'], ['maybe', 'Talvez'], ['no', 'Não vou']];
  return (
    <form onSubmit={send} className="mt-12 rounded-xl2 bg-[var(--c-card)] p-5 shadow-soft" aria-labelledby="rsvp-t">
      <h2 id="rsvp-t" className="h-display text-xl text-[var(--c-accent)]">Confirma a tua presença</h2>
      {deadline && <p className="text-sm opacity-70">Até {new Intl.DateTimeFormat('pt-PT', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(deadline + 'T12:00:00Z'))}</p>}
      <label className="label mt-3" htmlFor="rs-name">O teu nome</label><input id="rs-name" className="field" value={name} onChange={e => setName(e.target.value)} maxLength={80} autoComplete="name" required />
      <fieldset className="mt-3"><legend className="label">Vais?</legend><div className="grid grid-cols-3 gap-2">
        {opts.map(([v, l]) => <label key={v} className={`flex min-h-[48px] cursor-pointer items-center justify-center rounded-xl border-2 text-sm font-semibold ${attending === v ? 'border-[var(--c-accent)] bg-[var(--c-soft)]' : 'border-[var(--c-accent)]/25'}`}><input type="radio" name="attending" className="sr-only" checked={attending === v} onChange={() => setAttending(v)} />{attending === v ? '✓ ' : ''}{l}</label>)}
      </div></fieldset>
      {attending === 'yes' && <div className="mt-3"><label className="label" htmlFor="rs-g">Quantas pessoas (contigo)?</label><select id="rs-g" className="field" value={guests} onChange={e => setGuests(Number(e.target.value))}>{Array.from({ length: 10 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}</select></div>}
      <label className="label mt-3" htmlFor="rs-m">Mensagem (opcional)</label><input id="rs-m" className="field" value={message} onChange={e => setMessage(e.target.value)} maxLength={300} />
      {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
      <button className="btn btn-primary mt-4 w-full" disabled={state === 'sending'}>{state === 'sending' ? 'A enviar…' : 'Enviar resposta'}</button>
    </form>
  );
}
