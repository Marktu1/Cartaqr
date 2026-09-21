import type { Metadata } from 'next';
import { UnsubscribeButton } from './UnsubscribeButton';
export const metadata: Metadata = { title: 'Sair da newsletter', robots: { index: false, follow: false } };
export default async function Sair(props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;
  return (
    <div className="section max-w-md py-16 text-center"><h1 className="h-display text-3xl font-semibold text-wine">Sair da newsletter</h1>
      <p className="mt-3 text-muted">Queres mesmo deixar de receber os nossos emails?</p><div className="mt-6"><UnsubscribeButton token={token} /></div></div>
  );
}
