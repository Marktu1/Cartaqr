'use client';
import { useState } from 'react';
import { api, jsonInit } from '@/lib/client';
export function UnsubscribeButton({ token }: { token: string }) {
  const [s, setS] = useState<'idle' | 'done' | 'err'>('idle');
  if (s === 'done') return <p role="status" className="rounded-xl bg-rose-soft/60 p-4 font-semibold text-wine">Pronto, não vais receber mais emails.</p>;
  return (<><button className="btn btn-primary" onClick={async () => { const r: any = await api('/api/newsletter/sair', jsonInit('POST', { token })); setS(r.ok ? 'done' : 'err'); }}>Sim, sair</button>{s === 'err' && <p role="alert" className="mt-3 text-red-700">Link inválido ou já usado.</p>}</>);
}
