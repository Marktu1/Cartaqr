'use client';
import { useState, useTransition } from 'react';
import { useFormState } from 'react-dom';
import { loginAction } from '../actions';
import { useFormGuard } from '@/components/useFormGuard';


export function LoginForm() {
  const [state, action] = useFormState(loginAction, undefined);
  const { guard, trap } = useFormGuard();
  const [pending, startTransition] = useTransition(); const [waiting, setWaiting] = useState(false);
  // Junta o token anti-robô (sempre novo, com o tempo mínimo cumprido) antes de enviar
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (pending || waiting) return;
    const fd = new FormData(e.currentTarget);
    setWaiting(true); const g = await guard(); setWaiting(false);
    fd.set('_t', g._t); fd.set('website', g.website);
    startTransition(() => action(fd));
  }
  const busy = pending || waiting;
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-5">
      <form onSubmit={submit} className="card relative w-full max-w-sm p-7">
        {trap}
        {/* eslint-disable-next-line @next/next/no-img-element */}<img src="/logo-full.png" alt="Carta QR" width={511} height={422} className="mx-auto mb-3 h-28 w-auto" /><h1 className="h-display text-2xl font-semibold text-wine">Painel Carta QR</h1>
        <label className="label mt-5" htmlFor="email">Email</label><input id="email" name="email" type="email" className="field" autoComplete="username" defaultValue={state?.email} required />
        <label className="label mt-4" htmlFor="password">Password</label><input id="password" name="password" type="password" className="field" autoComplete="current-password" required />
        {state?.error && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{state.error}</p>}
        <button className="btn btn-primary mt-5 w-full" disabled={busy}>{busy ? 'A entrar…' : 'Entrar'}</button>
      </form>
    </main>
  );
}
