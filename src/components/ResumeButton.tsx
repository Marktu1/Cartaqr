'use client';
import { useRouter } from 'next/navigation';

/** Guarda o token no navegador e abre o wizard, que restaura o estado a partir do servidor. */
export function ResumeButton({ token, label }: { token: string; label: string }) {
  const r = useRouter();
  return (
    <button type="button" className="btn btn-primary w-full" onClick={() => {
      try { localStorage.setItem('cq_wizard_v1', JSON.stringify({ f: null, token, step: 8, fromServer: true })); } catch { /* */ }
      r.push('/criar');
    }}>{label}</button>
  );
}
