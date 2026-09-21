'use client';
import { useFormState, useFormStatus } from 'react-dom';
import { loginAction } from '../actions';

function Submit() { const { pending } = useFormStatus(); return <button className="btn btn-primary mt-5 w-full" disabled={pending}>{pending ? 'A entrar…' : 'Entrar'}</button>; }

export function LoginForm() {
  const [state, action] = useFormState(loginAction, undefined);
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-5">
      <form action={action} className="card w-full max-w-sm p-7">
        {/* eslint-disable-next-line @next/next/no-img-element */}<img src="/logo-full.png" alt="Carta QR" width={511} height={422} className="mx-auto mb-3 h-28 w-auto" /><h1 className="h-display text-2xl font-semibold text-wine">Painel Carta QR</h1>
        <label className="label mt-5" htmlFor="email">Email</label><input id="email" name="email" type="email" className="field" autoComplete="username" defaultValue={state?.email} required />
        <label className="label mt-4" htmlFor="password">Password</label><input id="password" name="password" type="password" className="field" autoComplete="current-password" required />
        {state?.error && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{state.error}</p>}
        <Submit />
      </form>
    </main>
  );
}
