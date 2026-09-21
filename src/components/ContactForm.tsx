'use client';
import { useState } from 'react';

export function ContactForm() {
  const [f, setF] = useState({ name: '', contact: '', message: '' }); const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle'); const [error, setError] = useState('');
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setState('sending');
    try {
      const r = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) }); const j = await r.json();
      if (!j.ok) { setError(j.error); setState('idle'); } else setState('sent');
    } catch { setError('Sem ligação à internet. Tenta novamente.'); setState('idle'); }
  }
  if (state === 'sent') return <p role="status" className="card p-6 font-semibold text-wine">Recebemos a tua mensagem. Vamos responder o mais breve possível.</p>;
  return (
    <form onSubmit={submit} className="card space-y-4 p-6" noValidate>
      <div><label className="label" htmlFor="c-name">O teu nome</label><input id="c-name" className="field" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} required autoComplete="name" /></div>
      <div><label className="label" htmlFor="c-contact">Email ou WhatsApp</label><input id="c-contact" className="field" value={f.contact} onChange={e => setF({ ...f, contact: e.target.value })} required autoComplete="email" /></div>
      <div><label className="label" htmlFor="c-msg">Mensagem</label><textarea id="c-msg" className="field min-h-[130px]" value={f.message} onChange={e => setF({ ...f, message: e.target.value })} required /></div>
      {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
      <button className="btn btn-primary w-full" disabled={state === 'sending'}>{state === 'sending' ? 'A enviar…' : 'Enviar mensagem'}</button>
    </form>
  );
}
