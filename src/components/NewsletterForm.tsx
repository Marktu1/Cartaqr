'use client';
import { useState } from 'react';
import { api, jsonInit } from '@/lib/client';

export function NewsletterForm({ source, compact = false, onDone, autoFocus = false }: { source: string; compact?: boolean; onDone?: () => void; autoFocus?: boolean }) {
  const [email, setEmail] = useState(''); const [consent, setConsent] = useState(false); const [trap, setTrap] = useState('');
  const [offer, setOffer] = useState<{ code: string; label: string } | null>(null); const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle'); const [error, setError] = useState('');
  const id = `nl-${source}`;
  async function send(e: React.FormEvent) {
    e.preventDefault(); setError('');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setError('Indica um email válido.'); return; }
    if (!consent) { setError('Marca a caixa para aceitares receber emails.'); return; }
    setState('sending');
    const r: any = await api('/api/newsletter', jsonInit('POST', { email, consent: true, source, website: trap }));
    if (!r.ok) { setState('idle'); setError(r.error); return; }
    try { localStorage.setItem('cq_nl', JSON.stringify({ t: Date.now(), s: 1 })); } catch { /* */ }
    setOffer(r.offer || null); setState('sent'); onDone?.();
  }
  if (state === 'sent') return <div role="status" className="rounded-xl bg-rose-soft/60 p-4 text-wine"><p className="font-semibold">Obrigado! Já estás na lista. ♡</p>{offer ? <p className="mt-2 text-sm">Aqui tens {offer.label} na tua primeira encomenda: <strong className="rounded bg-white px-2 py-0.5 font-mono tracking-wider">{offer.code}</strong><br /><span className="text-muted">Escreve este código no passo do pagamento.</span></p> : <p className="mt-1 text-sm">Vais receber ideias e novidades da Carta QR.</p>}</div>;
  return (
    <form onSubmit={send} noValidate className={compact ? 'space-y-2' : 'space-y-3'}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor={id}>O teu email</label>
        <input id={id} type="email" inputMode="email" autoComplete="email" placeholder="O teu melhor email" className="field flex-1" value={email} onChange={e => setEmail(e.target.value)} autoFocus={autoFocus} aria-invalid={!!error} aria-describedby={error ? id + '-e' : undefined} />
        <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" value={trap} onChange={e => setTrap(e.target.value)} name="website" />
        <button className="btn btn-primary" disabled={state === 'sending'}>{state === 'sending' ? 'A inscrever…' : 'Quero receber'}</button>
      </div>
      <label className="flex cursor-pointer items-start gap-2 text-xs text-muted"><input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0" checked={consent} onChange={e => setConsent(e.target.checked)} /><span>Aceito receber emails da Carta QR (ideias de mensagens, novidades e ofertas). Posso sair a qualquer momento. Ver <a href="/privacidade" className="underline">privacidade</a>.</span></label>
      {error && <p id={id + '-e'} role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
    </form>
  );
}
