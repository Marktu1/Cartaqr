'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

type Tok = { t: string; at: number };
async function fetchToken(): Promise<Tok | null> {
  try { const r = await fetch('/api/form-token', { cache: 'no-store' }); const j = await r.json(); return j?.t ? { t: j.t, at: Date.now() } : null; } catch { return null; }
}

/**
 * Proteção contra robôs para formulários públicos.
 * - pede um token assinado ao servidor quando o formulário aparece;
 * - inclui um campo-armadilha invisível ("website") que só os robôs preenchem.
 * Uso: const { guard, trap } = useFormGuard(); ... body: { ...dados, ...(await guard()) } ... {trap}
 */
export function useFormGuard() {
  const tok = useRef<Tok | null>(null); const [trapValue, setTrapValue] = useState('');
  useEffect(() => { fetchToken().then(t => { tok.current = t; }); }, []);
  const guard = useCallback(async () => {
    if (!tok.current || Date.now() - tok.current.at > 11 * 3600_000) tok.current = await fetchToken();
    const wait = tok.current ? 2100 - (Date.now() - tok.current.at) : 0;
    if (wait > 0) await new Promise(r => setTimeout(r, wait)); // o servidor rejeita envios com menos de 2 s
    const used = tok.current?.t || '';
    // cada token só serve uma vez: prepara já o próximo (para um novo envio, se for preciso)
    tok.current = null; fetchToken().then(t => { tok.current = t; });
    return { _t: used, website: trapValue };
  }, [trapValue]);
  const trap = (
    <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
      <label>Não preenchas este campo<input type="text" name="website" tabIndex={-1} autoComplete="off" value={trapValue} onChange={e => setTrapValue(e.target.value)} /></label>
    </div>
  );
  return { guard, trap };
}
