'use client';
import { useState } from 'react';

export function ReplyForm({ token }: { token: string }) {
  const [author, setAuthor] = useState(''); const [message, setMessage] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle'); const [error, setError] = useState('');
  async function send(e: React.FormEvent) {
    e.preventDefault(); setError(''); setState('sending');
    try {
      const r = await fetch(`/api/carta/${token}/reply`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ author, message }) });
      const j = await r.json();
      if (!j.ok) { setError(j.error || 'Não foi possível enviar.'); setState('idle'); } else setState('sent');
    } catch { setError('Sem ligação à internet. Tenta novamente.'); setState('idle'); }
  }
  if (state === 'sent') return <p className="mt-12 rounded-xl2 bg-[var(--c-soft)] p-5 text-center font-semibold" role="status">Mensagem enviada. Obrigado!</p>;
  return (
    <form onSubmit={send} className="mt-12 rounded-xl2 bg-[var(--c-card)] p-5 shadow-soft">
      <h2 className="h-display mb-3 text-xl text-[var(--c-accent)]">Queres responder?</h2>
      <label className="label" htmlFor="r-author">O teu nome (opcional)</label>
      <input id="r-author" className="field mb-3" value={author} maxLength={60} onChange={e => setAuthor(e.target.value)} />
      <label className="label" htmlFor="r-msg">A tua mensagem</label>
      <textarea id="r-msg" className="field min-h-[110px]" value={message} maxLength={1000} onChange={e => setMessage(e.target.value)} required />
      {error && <p role="alert" className="mt-2 text-sm font-semibold text-red-700">{error}</p>}
      <button className="btn btn-primary mt-4 w-full" disabled={state === 'sending'}>{state === 'sending' ? 'A enviar…' : 'Enviar resposta'}</button>
    </form>
  );
}
