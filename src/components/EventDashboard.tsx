'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, jsonInit } from '@/lib/client';
import type { EventDashboard as Data } from '@/lib/orders';

type Filter = 'all' | 'yes' | 'maybe' | 'no' | 'arrived' | 'waiting';
const FILTERS: [Filter, string][] = [['all', 'Todos'], ['yes', 'Vão'], ['maybe', 'Talvez'], ['no', 'Não vão'], ['arrived', 'Chegaram'], ['waiting', 'Por chegar']];
const ATT: Record<string, { label: string; cls: string }> = {
  yes: { label: 'Vai', cls: 'bg-emerald-50 text-emerald-800' },
  maybe: { label: 'Talvez', cls: 'bg-amber-50 text-amber-800' },
  no: { label: 'Não vai', cls: 'bg-mist text-muted' },
};
const fmtDate = (d: string) => new Intl.DateTimeFormat('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(d + 'T12:00:00Z'));
const fmtWhen = (sqlUtc: string) => new Intl.DateTimeFormat('pt-PT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Luanda' }).format(new Date(sqlUtc.replace(' ', 'T') + 'Z'));
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function Stat({ label, value, sub, children }: { label: string; value: string | number; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-[22px] bg-mist p-5">
      <p className="text-[13px] font-medium text-muted">{label}</p>
      <p className="mt-1 text-[34px] font-semibold leading-none tracking-[-.02em] text-ink">{value}</p>
      {sub && <p className="mt-1.5 text-[13px] text-muted">{sub}</p>}
      {children}
    </div>
  );
}

export function EventDashboard({ token, initial }: { token: string; initial: Data }) {
  const [d, setD] = useState<Data>(initial);
  const [q, setQ] = useState(''); const [filter, setFilter] = useState<Filter>('all');
  const [busy, setBusy] = useState<number | null>(null); const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState(Date.now()); const [now, setNow] = useState(Date.now());
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    const r: any = await api(`/api/orders/${token}/rsvps?format=json`, { cache: 'no-store' });
    if (r.ok) { setD(r.dashboard); setUpdatedAt(Date.now()); setError(''); }
  }, [token]);

  // Atualiza sozinho de 20 em 20 segundos (útil à porta do evento) e quando se volta à página
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, 20_000);
    const tick = setInterval(() => setNow(Date.now()), 5_000);
    const vis = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', vis);
    return () => { clearInterval(t); clearInterval(tick); document.removeEventListener('visibilitychange', vis); };
  }, [refresh]);

  async function checkIn(id: number, on: boolean) {
    setBusy(id); setError('');
    const r: any = await api(`/api/orders/${token}/rsvps/${id}`, jsonInit('PATCH', { checkedIn: on }));
    setBusy(null);
    if (r.ok) { setD(r.dashboard); setUpdatedAt(Date.now()); } else setError(r.error);
  }
  async function remove(id: number, name: string) {
    if (!window.confirm(`Remover a resposta de ${name}? Esta ação não se pode desfazer.`)) return;
    setBusy(id); setError('');
    const r: any = await api(`/api/orders/${token}/rsvps/${id}`, { method: 'DELETE' });
    setBusy(null);
    if (r.ok) { setD(r.dashboard); setUpdatedAt(Date.now()); } else setError(r.error);
  }
  async function copyLink() {
    if (!d.inviteUrl) return;
    try { await navigator.clipboard.writeText(d.inviteUrl); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* o link continua visível */ }
  }

  const s = d.summary;
  const expected = s.yesGuests;
  const list = useMemo(() => {
    const nq = norm(q.trim());
    return d.guests.filter(g => {
      if (nq && !norm(g.name).includes(nq)) return false;
      if (filter === 'arrived') return !!g.checkedInAt;
      if (filter === 'waiting') return g.attending !== 'no' && !g.checkedInAt;
      return filter === 'all' || g.attending === filter;
    });
  }, [d.guests, q, filter]);
  const counts: Record<Filter, number> = {
    all: d.guests.length, yes: s.yes, maybe: s.maybe, no: s.no,
    arrived: d.guests.filter(g => g.checkedInAt).length, waiting: d.guests.filter(g => g.attending !== 'no' && !g.checkedInAt).length,
  };
  const pct = s.capacity ? Math.min(100, Math.round((expected / s.capacity) * 100)) : 0;
  const ago = Math.max(0, Math.round((now - updatedAt) / 1000));
  const wa = d.inviteUrl ? `https://wa.me/?text=${encodeURIComponent(`Estás convidado(a)! ${d.event.title}\n${d.inviteUrl}`)}` : null;

  return (
    <div className="pb-24">
      {/* Cabeçalho */}
      <header className="wrap pb-10 pt-12 text-center sm:pt-16">
        <p className="t-eyebrow text-gold-deep">Painel do evento</p>
        <h1 className="t-section mx-auto mt-1 max-w-[18ch] text-ink">{d.event.title || 'O teu evento'}</h1>
        <p className="t-lead mx-auto mt-3 max-w-[44ch] text-muted">
          {[d.event.hosts, d.event.date && fmtDate(d.event.date), d.event.time, d.event.venue].filter(Boolean).join(' · ')}
        </p>
      </header>

      <div className="wrap space-y-3">
        {/* Estado do convite */}
        {!d.published ? (
          <div className="rounded-[22px] border border-gold/40 bg-gold/10 p-5 text-[15px] leading-relaxed" role="status">
            <p className="font-semibold text-ink">Pagamento confirmado. O teu painel já está ativo.</p>
            <p className="mt-1 text-muted">A nossa equipa está a preparar o convite. Assim que for publicado, o link aparece aqui e as confirmações dos convidados começam a chegar automaticamente.</p>
          </div>
        ) : (
          <div className="rounded-[22px] bg-night p-5 text-white sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6">
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-white/60">Link do convite</p>
              <p className="mt-1 truncate text-[15px]">{d.inviteUrl}</p>
              <p className="mt-1 text-[13px] text-white/60">{d.views} abertura(s){d.rsvp.open ? '' : ` · ${d.rsvp.reason}`}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 sm:mt-0 sm:shrink-0">
              <button type="button" onClick={copyLink} className="btn btn-light btn-sm">{copied ? 'Copiado ✓' : 'Copiar link'}</button>
              {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-outline-light btn-sm">Enviar por WhatsApp</a>}
            </div>
          </div>
        )}

        {/* Números */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Pessoas confirmadas" value={expected} sub={s.capacity ? `de ${s.capacity} lugares` : `${s.yes} resposta(s)`}>
            {s.capacity > 0 && <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/[.08]" aria-hidden><div className="h-full rounded-full bg-wine transition-[width] duration-700" style={{ width: `${pct}%` }} /></div>}
          </Stat>
          <Stat label="Já chegaram" value={s.checkedInGuests} sub={expected ? `de ${expected} esperadas` : 'Marca à porta do evento'} />
          <Stat label="Talvez" value={s.maybeGuests} sub={`${s.maybe} resposta(s)`} />
          <Stat label="Não vão" value={s.no} sub="resposta(s)" />
        </div>
      </div>

      {/* Lista de convidados */}
      <section className="wrap mt-10" aria-labelledby="guests-t">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="guests-t" className="t-tile text-ink">Convidados</h2>
            <p className="mt-1 text-[13px] text-muted" aria-live="polite">Atualizado {ago < 10 ? 'agora mesmo' : `há ${ago} s`} · atualiza sozinho</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={refresh} className="btn btn-secondary btn-sm">Atualizar</button>
            <a href={`/api/orders/${token}/rsvps`} className="btn btn-secondary btn-sm">Descarregar (CSV)</a>
          </div>
        </div>

        <div className="sticky top-12 z-20 -mx-5 mt-5 bg-white/85 px-5 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
          <label htmlFor="g-search" className="sr-only">Procurar convidado</label>
          <input id="g-search" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Procurar pelo nome…" className="field" autoComplete="off" />
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Filtrar convidados">
            {FILTERS.map(([k, l]) => (
              <button key={k} type="button" role="tab" aria-selected={filter === k} onClick={() => setFilter(k)}
                className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${filter === k ? 'bg-ink text-white' : 'bg-mist text-ink hover:bg-black/[.07]'}`}>
                {l} <span className={filter === k ? 'text-white/60' : 'text-muted'}>{counts[k]}</span>
              </button>
            ))}
          </div>
        </div>

        {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>}

        {d.guests.length === 0 ? (
          <div className="mt-4 rounded-[22px] bg-mist px-6 py-14 text-center">
            <p className="text-[19px] font-semibold text-ink">Ainda sem respostas</p>
            <p className="mx-auto mt-1 max-w-[36ch] text-[15px] text-muted">{d.published ? 'Partilha o link do convite. Cada confirmação aparece aqui na hora.' : 'As confirmações aparecem aqui depois de o convite ser publicado.'}</p>
          </div>
        ) : list.length === 0 ? (
          <p className="mt-6 text-center text-[15px] text-muted">Nenhum convidado corresponde a esta pesquisa.</p>
        ) : (
          <ul className="mt-2 divide-y divide-black/[.06]">
            {list.map(g => {
              const arrived = !!g.checkedInAt; const att = ATT[g.attending];
              return (
                <li key={g.id} className="flex items-center gap-3 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="text-[17px] font-semibold text-ink">{g.name}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${att.cls}`}>{att.label}{g.attending === 'yes' && g.guests > 1 ? ` · ${g.guests} pessoas` : ''}</span>
                      {arrived && <span className="rounded-full bg-wine px-2.5 py-0.5 text-[12px] font-semibold text-white">Chegou {fmtWhen(g.checkedInAt!).split(', ').pop()}</span>}
                    </p>
                    {g.message && <p className="mt-1 text-[14px] text-muted">“{g.message}”</p>}
                    <p className="mt-0.5 text-[12px] text-muted">Respondeu {fmtWhen(g.createdAt)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {g.attending !== 'no' && (
                      <button type="button" disabled={busy === g.id} onClick={() => checkIn(g.id, !arrived)} aria-pressed={arrived}
                        className={`btn btn-sm min-w-[96px] ${arrived ? 'btn-secondary' : 'btn-primary'}`}>
                        {busy === g.id ? '…' : arrived ? 'Desfazer' : 'Chegou'}
                      </button>
                    )}
                    <button type="button" disabled={busy === g.id} onClick={() => remove(g.id, g.name)} aria-label={`Remover a resposta de ${g.name}`}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-mist hover:text-red-700">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
