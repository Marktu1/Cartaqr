'use client';
import { useEffect } from 'react';
/** Conta uma visita por sessão do navegador (sem cookies nem identificadores). */
export function Track({ name }: { name: 'landing_view' | 'wizard_start' | 'category_view' | 'pricing_view' }) {
  useEffect(() => {
    try { if (sessionStorage.getItem('t_' + name)) return; sessionStorage.setItem('t_' + name, '1'); } catch { /* */ }
    fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }), keepalive: true }).catch(() => {});
  }, [name]);
  return null;
}
