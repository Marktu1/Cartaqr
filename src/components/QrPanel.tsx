'use client';
import { useState } from 'react';

export function QrPanel({ token, link, title, date, phrase, instruction = 'Lê o código para abrir a tua surpresa', event = false }: { token: string; link: string; title: string; date: string; phrase: string; instruction?: string; event?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const png = `/api/orders/${token}/qr?format=png`;
  async function copy() { try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { window.prompt('Copia o link:', link); } }
  async function share() {
    if (navigator.share) { try { await navigator.share({ title, text: `${event ? 'Estás convidado(a):' : 'Tenho uma surpresa para ti:'} ${title}`, url: link }); } catch { /* cancelado */ } } else copy();
  }
  const wa = `https://wa.me/?text=${encodeURIComponent(`${event ? 'Estás convidado(a) 💌' : 'Tenho uma surpresa para ti 💌'} ${link}`)}`;
  const Card = () => (
    <div className="mx-auto w-full max-w-[300px] rounded-xl2 border-2 border-gold/50 bg-paper p-6 text-center shadow-soft">
      {/* eslint-disable-next-line @next/next/no-img-element */}<img src="/logo-mark.png" alt="" width={34} height={36} className="mx-auto mb-1 h-9 w-auto" /><p className="text-[11px] uppercase tracking-[.3em] text-gold-deep">{event ? 'Convite QR' : 'Carta QR'}</p>
      <h3 className="h-display mt-2 text-xl font-semibold leading-tight text-wine">{title}</h3>
      {date && <p className="mt-1 text-sm text-muted">{date}</p>}
      {!imgErr ? (/* eslint-disable-next-line @next/next/no-img-element */ <img src={png} alt={`QR Code de “${title}”`} className="mx-auto my-4 h-44 w-44" onError={() => setImgErr(true)} />)
        : <p role="alert" className="my-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">Não foi possível criar o QR Code agora. Copia o link e tenta de novo mais tarde.</p>}
      {phrase && <p className="h-display text-sm italic text-ink">“{phrase}”</p>}
      <p className="mt-3 text-sm font-semibold text-wine">{instruction}</p>
    </div>
  );
  return (
    <div>
      <div className="no-print space-y-5">
        <Card />
        <div className="grid gap-2 sm:grid-cols-2">
          <a className="btn btn-primary" href={`${png}&download=1`}>Descarregar PNG</a>
          <a className="btn btn-secondary" href={`/api/orders/${token}/qr?format=svg&download=1`}>Descarregar SVG</a>
          <button type="button" className="btn btn-secondary" onClick={copy}>{copied ? 'Link copiado ✓' : 'Copiar link'}</button>
          <a className="btn btn-secondary" href={wa} target="_blank" rel="noopener noreferrer">Partilhar no WhatsApp</a>
          <button type="button" className="btn btn-secondary" onClick={share}>Partilhar…</button>
          <button type="button" className="btn btn-secondary" onClick={() => window.print()}>Imprimir cartão</button>
        </div>
        <div className="rounded-xl2 border border-gold/40 bg-gold/5 p-4"><p className="font-semibold text-wine">Cartão para imprimir (PDF)</p><p className="text-sm text-muted">Já com o teu QR Code e o logo. Imprime, recorta e cola no presente.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <a className="btn btn-secondary btn-sm" href={`/api/orders/${token}/card?size=a6`}>Cartão A6</a>
            <a className="btn btn-secondary btn-sm" href={`/api/orders/${token}/card?size=mini`}>Cartão pequeno</a>
            <a className="btn btn-secondary btn-sm" href={`/api/orders/${token}/card?size=a4`}>Folha A4 (4 cartões)</a>
          </div></div>
        <p className="break-all rounded-xl bg-white p-3 text-center text-sm text-muted" aria-label="Link da carta">{link}</p>
      </div>
      <div className="print-only"><Card /></div>
    </div>
  );
}
