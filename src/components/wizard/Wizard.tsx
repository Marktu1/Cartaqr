'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { api, jsonInit, uploadWithProgress } from '@/lib/client';
import { formatMoney, normalizePhone } from '@/lib/format';
import { THEME_INFO } from '@/lib/themes';
import { LetterView, type LetterViewData } from '../LetterView';
import { Price } from '../Price';
import { MediaStep } from './MediaStep';
import { EMPTY_FORM, TONES, type Form, type OccasionRow, type PlanRow, type ServerState } from './types';
import { getCategory, sanitizeExtra, missingRequired, type ExtraField } from '@/lib/categories';

const STEPS = ['Ocasião', 'Plano', 'Informações', 'Mensagem', 'Conteúdos', 'Música', 'Pré-visualização', 'Pagamento'];
const STORE = 'cq_wizard_v1';
const AMBIENTS: [string, string][] = [['piano-suave', 'Piano suave'], ['chuva-leve', 'Chuva leve'], ['ondas', 'Ondas do mar']];

type Props = { plans: PlanRow[]; occasions: OccasionRow[]; whatsapp: string; payment: { instructions: string; account: string }; aiAvailable: boolean; discountsAvailable?: boolean; initialPlan?: string; initialOccasion?: string };

export function Wizard({ plans, occasions, whatsapp, payment, aiAvailable, discountsAvailable = false, initialPlan, initialOccasion }: Props) {
  const [step, setStep] = useState(1);
  const [f, setF] = useState<Form>(EMPTY_FORM);
  const [token, setToken] = useState<string | null>(null);
  const [server, setServer] = useState<ServerState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fieldErr, setFieldErr] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);
  const top = useRef<HTMLDivElement>(null);

  // --- restaurar progresso (voltar atrás / recarregar sem perder dados) ---
  useEffect(() => {
    let saved: any = null;
    try { saved = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch { /* ignore */ }
    let form = { ...EMPTY_FORM };
    if (saved?.f) form = { ...form, ...saved.f };
    if (saved?.token && !saved.f) form.contact = '';
    const plan = plans.find(p => p.slug === initialPlan); const occ = occasions.find(o => o.slug === initialOccasion);
    if (!saved?.token) { if (plan) form.planId = plan.id; if (occ) { form.occasion = occ.slug; form.theme = occ.default_theme; } }
    if (plan && occ && plan.kind !== occ.kind) form.planId = null;
    setF(form);
    if (saved?.token) {
      setToken(saved.token);
      api<ServerState>(`/api/orders/${saved.token}`).then((r: any) => {
        if (r.ok) {
          setServer(r);
          setF(prev => (prev.title || prev.recipientName ? prev : formFromServer(r, prev)));
          if (r.order.status === 'published') { window.location.href = `/minha/${saved.token}`; return; }
          setStep(r.order.status === 'draft' || saved.step ? Math.min(saved.step || 1, 8) : 8);
          if (r.order.status === 'proof_submitted') setStep(8);
        } else { setToken(null); localStorage.removeItem(STORE); }
        setReady(true);
      });
    } else { setStep(plan && occ ? 3 : occ ? 2 : 1); setReady(true); }
  }, [plans, occasions, initialPlan, initialOccasion]);

  useEffect(() => { if (ready) { try { localStorage.setItem(STORE, JSON.stringify({ f, token, step })); } catch { /* ignore */ } } }, [f, token, step, ready]);
  useEffect(() => { top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, [step]);

  const set = useCallback(<K extends keyof Form>(k: K, v: Form[K]) => setF(p => ({ ...p, [k]: v })), []);
  const plan = plans.find(p => p.id === f.planId) || null;
  const cat = getCategory(f.occasion);
  const kindPlans = plans.filter(p => p.kind === cat.kind);

  const patch = useCallback(async (body: Record<string, unknown>): Promise<boolean> => {
    if (!token) return false;
    const r: any = await api(`/api/orders/${token}`, jsonInit('PATCH', body));
    if (r.ok) { setServer(r); return true; }
    setError(r.error); return false;
  }, [token]);

  // --- validação por etapa ---
  function validate(): boolean {
    const e: Record<string, string> = {};
    if (step === 1 && !f.occasion) e.occasion = 'Escolhe uma ocasião para continuar.';
    if (step === 2 && (!f.planId || !kindPlans.some(p => p.id === f.planId))) e.plan = 'Escolhe um plano para continuar.';
    if (step === 3) {
      if (!f.recipientName.trim()) e.recipientName = `Preenche: ${cat.labels.recipient.toLowerCase()}.`;
      if (!f.senderName.trim()) e.senderName = `Preenche: ${cat.labels.sender.toLowerCase()}.`;
      if (!f.title.trim()) e.title = 'Dá um título à experiência.';
      if (cat.labels.dateRequired && !f.specialDate) e.specialDate = `Indica: ${cat.labels.date.toLowerCase()}.`;
      for (const x of cat.extra) if (x.required && !(f.extra[x.key] || '').trim()) e['x_' + x.key] = `Preenche: ${x.label.toLowerCase()}.`;
      for (const x of cat.extra) if (x.type === 'url' && f.extra[x.key] && !/^https?:\/\/\S+$/i.test(f.extra[x.key])) e['x_' + x.key] = 'O link deve começar por http:// ou https://.';
      if (token) { /* contacto já guardado na criação da encomenda */ }
      else if (!f.contact.trim()) e.contact = 'Indica um email ou número de WhatsApp.';
      else if (!/^\S+@\S+\.\S+$/.test(f.contact.trim()) && !normalizePhone(f.contact)) e.contact = 'Indica um email válido ou um telefone (ex.: 923 456 789).';
    }
    if (step === 4 && f.mainMessage.trim().length < 10) e.mainMessage = `Escreve: ${cat.message.label.toLowerCase()} (ou usa “Ajudar-me a escrever com IA”).`;
    if (step === 6 && f.musicMode === 'own' && !f.musicRightsAck) e.rights = 'Confirma que tens direitos para usar a música.';
    if (step === 6 && f.musicMode === 'own' && !server?.media.some(m => m.type === 'music')) e.music = 'Carrega o ficheiro de música ou escolhe outra opção.';
    if (step === 7) {
      if (!f.title.trim()) e.title = 'O título não pode ficar vazio.';
      if (f.mainMessage.trim().length < 10) e.mainMessage = 'A mensagem principal está vazia.';
      if (f.pin && !/^\d{4,6}$/.test(f.pin)) e.pin = 'O PIN deve ter 4 a 6 números.';
    }
    setFieldErr(e); return Object.keys(e).length === 0;
  }

  async function next() {
    setError('');
    if (!validate()) return;
    setBusy(true);
    try {
      if (step === 2 && token && plan) {
        const r: any = await api(`/api/orders/${token}`, jsonInit('PUT', { planId: plan.id, occasion: f.occasion }));
        if (!r.ok) { setError(r.error); return; } setServer(r);
      }
      if (step === 3) {
        if (!token) {
          const r: any = await api('/api/orders', jsonInit('POST', { occasion: f.occasion, planId: f.planId, recipientName: f.recipientName, senderName: f.senderName, title: f.title, specialDate: f.specialDate, contact: f.contact, language: f.language, theme: f.theme, extra: sanitizeExtra(f.occasion, f.extra) }));
          if (!r.ok) { setError(r.error); return; }
          setToken(r.token);
          const s: any = await api(`/api/orders/${r.token}`); if (s.ok) setServer(s);
        } else if (!(await patch({ recipientName: f.recipientName, senderName: f.senderName, title: f.title, specialDate: f.specialDate, theme: f.theme, extra: sanitizeExtra(f.occasion, f.extra) }))) return;
      }
      if (step === 4 && !(await patch({ howMet: f.howMet, admire: f.admire, tone: f.tone, mainMessage: f.mainMessage, closingMessage: f.closingMessage, memories: f.memories.filter(m => m.title || m.description).map(m => ({ ...m })), aiUsed: f.aiUsed || undefined }))) return;
      if (step === 6 && !(await patch({ musicMode: f.musicMode, ambient: f.ambient, musicRightsAck: f.musicRightsAck }))) return;
      if (step === 7) {
        if (!(await patch({ title: f.title, mainMessage: f.mainMessage, closingMessage: f.closingMessage, theme: f.theme, allowReply: cat.proposal ? true : f.allowReply, pin: f.pin, unlockAt: f.unlockAt, musicMode: f.musicMode, ambient: f.ambient, musicRightsAck: f.musicRightsAck }))) return;
        const r: any = await api(`/api/orders/${token}/submit`, { method: 'POST' });
        if (!r.ok) { setError(r.error); return; } setServer(r);
      }
      setStep(s => Math.min(8, s + 1));
    } finally { setBusy(false); }
  }
  const back = () => { setError(''); setFieldErr({}); setStep(s => Math.max(1, s - 1)); };

  // --- dados para pré-visualização ---
  const view: LetterViewData = useMemo(() => {
    const m = server?.media || [];
    const cover = m.find(x => x.id === server?.letter.coverMediaId) || m.find(x => x.type === 'cover') || m.find(x => x.type === 'photo');
    const photos = m.filter(x => x.type === 'photo').sort((a, b) => a.sortOrder - b.sortOrder);
    return {
      title: f.title, recipientName: f.recipientName, senderName: f.senderName, intro: '', mainMessage: f.mainMessage, closingMessage: f.closingMessage, specialDate: f.specialDate, theme: f.theme,
      memories: f.memories.filter(x => x.title || x.description), cover: cover ? { url: cover.url, alt: 'Capa' } : null,
      photos: photos.map(p => ({ url: p.url, caption: p.caption, alt: p.altText || p.caption || 'Fotografia' })),
      video: m.find(x => x.type === 'video') ? { url: m.find(x => x.type === 'video')!.url } : null,
      audios: m.filter(x => x.type === 'audio' || (x.type === 'music' && f.musicMode === 'own')).map(x => ({ url: x.url, label: x.type === 'music' ? 'Música' : 'Mensagem de áudio' })),
      ambient: f.musicMode === 'ambient' ? f.ambient : null, allowReply: false, category: f.occasion, extra: sanitizeExtra(f.occasion, f.extra), rsvp: cat.rsvp ? { open: true } : undefined, demo: true,
    };
  }, [f, server, cat]);

  function resetAll() { try { localStorage.removeItem(STORE); } catch { /* */ } window.location.href = '/criar'; }

  if (!ready) return <div className="section py-20 text-center text-muted" role="status">A carregar…</div>;
  const done = server && ['proof_submitted', 'payment_confirmed', 'in_production', 'published'].includes(server.order.status) && step === 8;

  return (
    <div className="section max-w-2xl py-8" ref={top}>
      <div className="mb-6" aria-label="Progresso">
        <div className="mb-2 flex items-center justify-between text-sm"><span className="font-semibold text-wine">Passo {step} de 8 · {STEPS[step - 1]}</span>{token && !done && <button className="text-muted underline" onClick={() => { if (window.confirm('Começar uma nova encomenda? O rascunho atual continua guardado no link da encomenda, mas sairás desta.')) resetAll(); }}>Recomeçar</button>}</div>
        <div className="h-2 overflow-hidden rounded-full bg-rose-soft" role="progressbar" aria-valuemin={1} aria-valuemax={8} aria-valuenow={step} aria-label={`Passo ${step} de 8`}><div className="h-full rounded-full bg-wine transition-all" style={{ width: `${(step / 8) * 100}%` }} /></div>
      </div>

      <div className="card p-5 sm:p-8">
        {/* 1. Ocasião */}
        {step === 1 && (
          <fieldset><legend className="h-display text-2xl font-semibold text-wine">O que queres criar?</legend>
            {(['carta', 'evento'] as const).map(kind => (
              <div key={kind} className="mt-6">
                <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted">{kind === 'carta' ? 'Cartas para oferecer' : 'Convites para eventos (com confirmação de presença)'}</p>
                <div className="grid grid-cols-2 gap-3">
                  {occasions.filter(o => o.kind === kind).map(o => (
                    <label key={o.slug} className={`flex min-h-[64px] cursor-pointer flex-col justify-center rounded-xl border-2 p-3 transition ${f.occasion === o.slug ? 'border-wine bg-rose-soft/50' : 'border-wine/15 hover:border-wine/40'}`}>
                      <input type="radio" name="occasion" className="sr-only" checked={f.occasion === o.slug} onChange={() => {
                        const c = getCategory(o.slug);
                        setF(p => ({ ...p, occasion: o.slug, theme: o.default_theme, extra: sanitizeExtra(o.slug, p.extra), planId: plans.find(x => x.id === p.planId)?.kind === c.kind ? p.planId : null,
                          memories: p.memories.every(m => !m.title && !m.description) ? Array.from({ length: c.memories.count }, () => ({ title: '', description: '' })) : p.memories, closingMessage: p.closingMessage || '' }));
                      }} />
                      <span className="font-semibold">{f.occasion === o.slug ? '✓ ' : ''}{getCategory(o.slug).glyph} {o.name}</span><span className="text-xs text-muted">{o.description}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            {fieldErr.occasion && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{fieldErr.occasion}</p>}
          </fieldset>
        )}

        {/* 2. Plano */}
        {step === 2 && (
          <fieldset><legend className="h-display text-2xl font-semibold text-wine">{cat.kind === 'evento' ? 'Escolhe o pacote de evento' : 'Escolhe o teu plano'}</legend>
            <p className="mt-1 text-sm text-muted">{cat.kind === 'evento' ? 'Os pacotes de Eventos incluem confirmação de presença (RSVP), mapa e programa.' : 'Todos incluem link privado e QR Code.'}</p>
            <div className="mt-5 space-y-3">
              {kindPlans.map(p => (
                <label key={p.id} className={`block cursor-pointer rounded-xl border-2 p-4 transition ${f.planId === p.id ? 'border-wine bg-rose-soft/40' : 'border-wine/15 hover:border-wine/40'}`}>
                  <input type="radio" name="plan" className="sr-only" checked={f.planId === p.id} onChange={() => set('planId', p.id)} />
                  <div className="flex items-baseline justify-between gap-3"><span className="h-display text-xl font-semibold text-wine">{f.planId === p.id ? '✓ ' : ''}{p.name}</span><span className="text-right"><Price plan={p} className="text-lg font-bold text-ink" /></span></div>
                  <p className="mt-1 text-sm text-muted">Até {p.max_photos} fotos{p.max_videos ? ` · ${p.max_videos} vídeo(s)` : ''}{p.max_audio_files ? ' · áudio' : ''}{p.max_guests ? ` · até ${p.max_guests} convidados` : ''} · {p.duration_days} dias</p>
                  <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">{p.features.map(x => <li key={x}>• {x}</li>)}</ul>
                </label>
              ))}
            </div>
            {fieldErr.plan && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{fieldErr.plan}</p>}
          </fieldset>
        )}

        {/* 3. Informações */}
        {step === 3 && (
          <div className="space-y-4"><h2 className="h-display text-2xl font-semibold text-wine">{cat.glyph} {cat.name}: informações principais</h2>
            <T id="recipient" label={cat.labels.recipient} v={f.recipientName} on={v => set('recipientName', v)} err={fieldErr.recipientName} auto="off" ph={cat.labels.recipientPh} />
            <T id="sender" label={cat.labels.sender} v={f.senderName} on={v => set('senderName', v)} err={fieldErr.senderName} auto="name" ph={cat.labels.senderPh} />
            <div><T id="title" label={cat.labels.title} v={f.title} on={v => set('title', v)} err={fieldErr.title} ph={cat.labels.titlePh} />
              <div className="mt-2 flex flex-wrap gap-2" aria-label="Sugestões de título">{cat.titleSuggestions.map(t => <button key={t} type="button" className="rounded-full border border-wine/20 px-3 py-1.5 text-xs font-semibold text-wine hover:bg-rose-soft/50" onClick={() => set('title', t)}>{t}</button>)}</div></div>
            <div><label className="label" htmlFor="date">{cat.labels.date}</label><input id="date" type="date" className="field" value={f.specialDate} onChange={e => set('specialDate', e.target.value)} aria-invalid={!!fieldErr.specialDate} />{fieldErr.specialDate && <p role="alert" className="mt-1 text-sm font-semibold text-red-700">{fieldErr.specialDate}</p>}</div>
            {cat.extra.length > 0 && <fieldset className="space-y-4 rounded-xl border border-wine/10 p-4"><legend className="px-2 text-sm font-semibold text-wine">{cat.kind === 'evento' ? 'Detalhes do evento' : `Detalhes de ${cat.name.toLowerCase()}`}</legend>
              {cat.extra.map(x => <ExtraInput key={x.key} field={x} value={f.extra[x.key] || ''} err={fieldErr['x_' + x.key]} onChange={v => setF(p => ({ ...p, extra: { ...p.extra, [x.key]: v } }))} />)}</fieldset>}
            {token ? <p className="rounded-xl bg-rose-soft/40 p-3 text-sm">O teu contacto já está guardado nesta encomenda.</p> : <T id="contact" label="O teu email ou WhatsApp" v={f.contact} on={v => set('contact', v)} err={fieldErr.contact} hint="Só nós vemos isto. Nunca aparece na carta." auto="email" inputMode="email" />}
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="label" htmlFor="lang">Idioma da carta</label><select id="lang" className="field" value={f.language} onChange={e => set('language', e.target.value as 'pt' | 'en')}><option value="pt">Português</option><option value="en">English</option></select></div>
            </div>
            <fieldset><legend className="label">Estilo visual</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {Object.entries(THEME_INFO).map(([k, t]) => (
                  <label key={k} className={`cursor-pointer rounded-xl border-2 p-3 text-sm ${f.theme === k ? 'border-wine bg-rose-soft/40' : 'border-wine/15'}`}>
                    <input type="radio" name="theme" className="sr-only" checked={f.theme === k} onChange={() => set('theme', k)} />
                    <span className="mb-2 flex gap-1" aria-hidden><i className="h-4 w-4 rounded-full" style={{ background: t.vars['--c-accent'] }} /><i className="h-4 w-4 rounded-full" style={{ background: t.vars['--c-soft'] }} /><i className="h-4 w-4 rounded-full border" style={{ background: t.vars['--c-bg'] }} /></span>
                    <span className="font-semibold">{f.theme === k ? '✓ ' : ''}{t.name}</span><br /><span className="text-xs text-muted">{t.description}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        )}

        {/* 4. Mensagem */}
        {step === 4 && <MessageStep f={f} set={set} err={fieldErr} token={token!} aiAvailable={aiAvailable} occasionName={occasions.find(o => o.slug === f.occasion)?.name || ''} />}

        {/* 5. Conteúdos */}
        {step === 5 && token && server && <div><h2 className="h-display mb-5 text-2xl font-semibold text-wine">Fotografias, vídeo e áudio</h2><MediaStep token={token} server={server} setServer={setServer} /></div>}

        {/* 6. Música */}
        {step === 6 && token && server && <MusicStep f={f} set={set} err={fieldErr} token={token} server={server} setServer={setServer} />}

        {/* 7. Pré-visualização */}
        {step === 7 && token && server && (
          <div className="space-y-6"><h2 className="h-display text-2xl font-semibold text-wine">Vê como vai ficar</h2>
            <div className="mx-auto w-full max-w-[320px] rounded-[2rem] border-[7px] border-ink bg-ink"><div className="max-h-[520px] overflow-y-auto overscroll-contain rounded-[1.5rem]"><LetterView data={view} startOpen embedded /></div></div>
            <p className="text-center text-sm text-muted">Desliza dentro do telemóvel para veres tudo.</p>
            <div className="space-y-4">
              <T id="p-title" label="Título" v={f.title} on={v => set('title', v)} err={fieldErr.title} />
              <div><label className="label" htmlFor="p-msg">Mensagem principal</label><textarea id="p-msg" className="field min-h-[180px]" value={f.mainMessage} onChange={e => set('mainMessage', e.target.value)} />{fieldErr.mainMessage && <p role="alert" className="mt-1 text-sm font-semibold text-red-700">{fieldErr.mainMessage}</p>}</div>
              <T id="p-close" label="Frase final" v={f.closingMessage} on={v => set('closingMessage', v)} />
              <fieldset><legend className="label">Estilo e cores</legend><div className="flex flex-wrap gap-2">{Object.entries(THEME_INFO).map(([k, t]) => <label key={k} className={`cursor-pointer rounded-full border-2 px-4 py-2 text-sm font-semibold ${f.theme === k ? 'border-wine bg-rose-soft/50' : 'border-wine/15'}`}><input type="radio" name="p-theme" className="sr-only" checked={f.theme === k} onChange={() => set('theme', k)} />{f.theme === k ? '✓ ' : ''}{t.name}</label>)}</div></fieldset>
              <PhotoOrder token={token} server={server} setServer={setServer} />
              <div><p className="label">Música</p>
                <div className="flex flex-wrap gap-2">{(['none', 'ambient', 'own'] as const).map(m => (<label key={m} className={`cursor-pointer rounded-full border-2 px-4 py-2 text-sm font-semibold ${f.musicMode === m ? 'border-wine bg-rose-soft/50' : 'border-wine/15'}`}><input type="radio" name="p-music" className="sr-only" checked={f.musicMode === m} onChange={() => set('musicMode', m)} />{f.musicMode === m ? '✓ ' : ''}{m === 'none' ? 'Sem música' : m === 'ambient' ? 'Ambiente sonoro' : 'A minha música'}</label>))}</div></div>
              {!cat.proposal && !cat.rsvp && <label className="flex min-h-[48px] cursor-pointer items-start gap-3"><input type="checkbox" className="mt-1 h-5 w-5" checked={f.allowReply} onChange={e => set('allowReply', e.target.checked)} /><span><span className="font-semibold">Permitir que a pessoa responda</span><br /><span className="text-sm text-muted">Mostra um pequeno formulário no fim da carta. Só tu e a nossa equipa recebem as respostas.</span></span></label>}
              <div><label className="label" htmlFor="unlock">Entrega agendada (opcional)</label><input id="unlock" type="datetime-local" className="field max-w-[260px]" value={f.unlockAt} min={new Date(Date.now() + 3600_000).toISOString().slice(0, 16)} onChange={e => set('unlockAt', e.target.value)} aria-describedby="unlock-h" />
                <p id="unlock-h" className="hint">{f.unlockAt ? 'Quem abrir o link antes desta data e hora vê uma contagem decrescente e só pode abrir a surpresa depois. Hora de Luanda.' : 'Deixa vazio para a carta abrir logo que for publicada. Ex.: à meia-noite do aniversário.'}{f.unlockAt && <> <button type="button" className="font-semibold text-wine underline" onClick={() => set('unlockAt', '')}>Remover agendamento</button></>}</p>{fieldErr.unlockAt && <p role="alert" className="text-sm font-semibold text-red-700">{fieldErr.unlockAt}</p>}</div>
              <div><label className="label" htmlFor="pin">PIN de proteção (opcional)</label><input id="pin" inputMode="numeric" maxLength={6} className="field max-w-[180px]" value={f.pin} onChange={e => set('pin', e.target.value.replace(/\D/g, ''))} aria-describedby="pin-h" />
                <p id="pin-h" className="hint">4 a 6 números. Quem abrir o link terá de o introduzir. {server.letter.hasPin && !f.pin ? 'Já tens um PIN guardado; escreve outro para o mudar.' : ''}</p>{fieldErr.pin && <p role="alert" className="text-sm font-semibold text-red-700">{fieldErr.pin}</p>}</div>
            </div>
            <p className="rounded-xl bg-rose-soft/50 p-3 text-sm">Ao continuares, confirmas que tens autorização para usar todas as fotografias, vídeos, áudios e músicas carregados e aceitas os <Link href="/termos" className="font-semibold underline" target="_blank">Termos de uso</Link>.</p>
          </div>
        )}

        {/* 8. Pagamento */}
        {step === 8 && token && server && (done ? <Done token={token} server={server} whatsapp={whatsapp} /> : <PaymentStep discountsAvailable={discountsAvailable} token={token} server={server} setServer={setServer} whatsapp={whatsapp} payment={payment} />)}

        {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>}
        {!done && step < 8 && (
          <div className="mt-8 flex gap-3">
            {step > 1 && <button type="button" className="btn btn-secondary" onClick={back} disabled={busy}>Voltar</button>}
            <button type="button" className="btn btn-primary flex-1" onClick={next} disabled={busy}>{busy ? 'A guardar…' : step === 7 ? 'Continuar para o pagamento' : 'Continuar'}</button>
          </div>
        )}
        {!done && step === 8 && <div className="mt-6"><button type="button" className="btn btn-ghost" onClick={back}>← Voltar e rever a carta</button></div>}
      </div>
    </div>
  );
}

function ExtraInput({ field, value, onChange, err }: { field: ExtraField; value: string; onChange: (v: string) => void; err?: string }) {
  const id = 'x-' + field.key; const common = { id, className: 'field', value, placeholder: field.placeholder, 'aria-invalid': !!err, 'aria-describedby': err ? id + '-e' : field.hint ? id + '-h' : undefined } as const;
  return (
    <div><label className="label" htmlFor={id}>{field.label}{field.required && <span className="text-wine"> *</span>}</label>
      {field.type === 'textarea' ? <textarea {...common} className="field min-h-[110px]" maxLength={600} onChange={e => onChange(e.target.value)} />
        : <input {...common} type={field.type === 'number' ? 'number' : field.type === 'url' ? 'url' : field.type} inputMode={field.type === 'number' ? 'numeric' : undefined} maxLength={field.max || 160} onChange={e => onChange(e.target.value)} />}
      {field.hint && !err && <p id={id + '-h'} className="hint">{field.hint}</p>}{err && <p id={id + '-e'} role="alert" className="mt-1 text-sm font-semibold text-red-700">{err}</p>}</div>
  );
}

function formFromServer(r: ServerState, prev: Form): Form {
  const l = r.letter; const mem = r.memories.map(m => ({ title: m.title, description: m.description }));
  const want = getCategory(r.order.occasion).memories.count; while (mem.length < want) mem.push({ title: '', description: '' });
  return { ...prev, occasion: r.order.occasion, planId: r.order.planId, recipientName: l.recipientName, senderName: l.senderName, title: l.title, specialDate: l.specialDate || '', theme: l.theme,
    howMet: l.howMet || '', admire: l.admire || '', memories: mem, mainMessage: l.mainMessage, closingMessage: l.closingMessage, tone: l.tone || 'romantico',
    musicMode: (l.musicMode as Form['musicMode']) || 'none', ambient: l.ambient || 'piano-suave', musicRightsAck: l.musicRightsAck, allowReply: l.allowReply, unlockAt: l.unlockAt || '', contact: prev.contact, extra: l.extra || {} };
}

function T({ id, label, v, on, err, hint, auto, inputMode, ph }: { id: string; label: string; v: string; on: (v: string) => void; err?: string; hint?: string; auto?: string; inputMode?: 'email' | 'text'; ph?: string }) {
  return (<div><label className="label" htmlFor={id}>{label}</label><input id={id} className="field" value={v} onChange={e => on(e.target.value)} aria-invalid={!!err} aria-describedby={err ? `${id}-e` : hint ? `${id}-h` : undefined} autoComplete={auto} inputMode={inputMode} placeholder={ph} />
    {hint && !err && <p id={`${id}-h`} className="hint">{hint}</p>}{err && <p id={`${id}-e`} role="alert" className="mt-1 text-sm font-semibold text-red-700">{err}</p>}</div>);
}

// ---------------- Etapa 4 ----------------
function MessageStep({ f, set, err, token, aiAvailable, occasionName }: { f: Form; set: <K extends keyof Form>(k: K, v: Form[K]) => void; err: Record<string, string>; token: string; aiAvailable: boolean; occasionName: string }) {
  const cat = getCategory(f.occasion);
  const [busy, setBusy] = useState(''); const [aiErr, setAiErr] = useState(''); const [draft, setDraft] = useState<string | null>(null); const [draftFor, setDraftFor] = useState('');
  async function ai(action: string, extra: Record<string, unknown> = {}) {
    setAiErr(''); setBusy(action);
    const r: any = await api(`/api/ai?t=${token}`, jsonInit('POST', { action, recipientName: f.recipientName, senderName: f.senderName, occasion: occasionName, category: f.occasion, extra: sanitizeExtra(f.occasion, f.extra), tone: f.tone, howMet: f.howMet, admire: f.admire, memories: f.memories, text: f.mainMessage, ...extra }));
    setBusy('');
    if (!r.ok) { setAiErr(r.error); return; }
    if (action === 'suggest_title') { set('title', r.text.replace(/^["“]|["”]$/g, '')); set('aiUsed', true); }
    else if (action === 'suggest_closing') { set('closingMessage', r.text); set('aiUsed', true); }
    else { setDraft(r.text); setDraftFor(action); }
  }
  const mem = (i: number, k: 'title' | 'description', v: string) => set('memories', f.memories.map((m, j) => (j === i ? { ...m, [k]: v } : m)));
  return (
    <div className="space-y-5"><h2 className="h-display text-2xl font-semibold text-wine">Memórias e mensagem</h2>
      <p className="text-muted">Quanto mais contares, mais especial fica. Nada é obrigatório, exceto a mensagem principal.</p>
      {cat.howMet && <div><label className="label" htmlFor="howmet">{cat.howMet.label}</label><textarea id="howmet" className="field min-h-[80px]" placeholder={cat.howMet.ph} value={f.howMet} onChange={e => set('howMet', e.target.value)} /></div>}
      <fieldset className="space-y-3"><legend className="label">{cat.memories.heading}</legend><p className="hint">{cat.memories.hint}</p>
        {f.memories.map((m, i) => (<div key={i} className="rounded-xl border border-wine/10 p-3"><label className="sr-only" htmlFor={`m-t-${i}`}>Título da memória {i + 1}</label><input id={`m-t-${i}`} className="field mb-2" placeholder={cat.memories.itemPh} value={m.title} onChange={e => mem(i, 'title', e.target.value)} maxLength={100} />
          <label className="sr-only" htmlFor={`m-d-${i}`}>Descrição da memória {i + 1}</label><textarea id={`m-d-${i}`} className="field min-h-[64px]" placeholder={cat.memories.descPh} value={m.description} onChange={e => mem(i, 'description', e.target.value)} maxLength={600} /></div>))}
      </fieldset>
      {cat.admire && <div><label className="label" htmlFor="admire">{cat.admire.label}</label><textarea id="admire" className="field min-h-[80px]" placeholder={cat.admire.ph} value={f.admire} onChange={e => set('admire', e.target.value)} /></div>}
      <fieldset><legend className="label">Tom da mensagem</legend><div className="flex flex-wrap gap-2">{TONES.map(([k, n]) => <label key={k} className={`cursor-pointer rounded-full border-2 px-4 py-2 text-sm font-semibold ${f.tone === k ? 'border-wine bg-rose-soft/50' : 'border-wine/15'}`}><input type="radio" name="tone" className="sr-only" checked={f.tone === k} onChange={() => set('tone', k)} />{f.tone === k ? '✓ ' : ''}{n}</label>)}</div></fieldset>

      <div className="rounded-xl2 border-2 border-gold/40 bg-gold/5 p-4">
        <button type="button" className="btn btn-secondary w-full" onClick={() => ai('generate_letter')} disabled={!!busy}>{busy === 'generate_letter' ? 'A escrever o rascunho…' : '✨ Ajudar-me a escrever com IA'}</button>
        <p className="hint text-center">A IA usa só o que escreveste acima. O texto é um rascunho que podes editar.{!aiAvailable && ' (Neste momento a IA não está ativa: escreve manualmente abaixo.)'}</p>
        {aiErr && <p role="alert" className="mt-2 text-sm font-semibold text-red-700">{aiErr} <span className="font-normal">Podes continuar a escrever a mensagem manualmente.</span></p>}
        {draft !== null && (
          <div className="mt-4"><label className="label" htmlFor="draft">Rascunho da IA (edita à vontade)</label><textarea id="draft" className="field min-h-[200px]" value={draft} onChange={e => setDraft(e.target.value)} />
            <p className="hint">Revê com atenção: frases entre [Sugestão: …] são ideias, não factos. Apaga ou muda o que não fizer sentido.</p>
            <div className="mt-3 flex gap-2"><button type="button" className="btn btn-primary btn-sm" onClick={() => { set('mainMessage', draft); set('aiUsed', true); setDraft(null); }}>Usar este texto</button><button type="button" className="btn btn-ghost btn-sm" onClick={() => setDraft(null)}>Descartar</button></div></div>
        )}
      </div>

      <div><label className="label" htmlFor="main">{cat.message.label}</label><p className="hint">{cat.message.hint}</p><textarea id="main" placeholder={cat.message.ph} className="field min-h-[200px]" value={f.mainMessage} onChange={e => set('mainMessage', e.target.value)} aria-invalid={!!err.mainMessage} maxLength={6000} />
        {err.mainMessage && <p role="alert" className="mt-1 text-sm font-semibold text-red-700">{err.mainMessage}</p>}
        {aiAvailable && f.mainMessage.length > 10 && <div className="mt-2 flex flex-wrap gap-2">{[['fix_grammar', 'Corrigir ortografia'], ['rewrite_tone', 'Reescrever no tom escolhido'], ['summarize', 'Encurtar']].map(([a, l]) => <button key={a} type="button" className="btn btn-ghost btn-sm border border-wine/15" disabled={!!busy} onClick={() => ai(a)}>{busy === a ? 'A trabalhar…' : l}</button>)}</div>}
      </div>
      <div><label className="label" htmlFor="closing">{cat.closing.label}</label><input id="closing" className="field" value={f.closingMessage} onChange={e => set('closingMessage', e.target.value)} maxLength={300} />
        <div className="mt-2 flex flex-wrap gap-2">{cat.closing.suggestions.map(x => <button key={x} type="button" className="btn btn-ghost btn-sm border border-wine/15" onClick={() => set('closingMessage', x)}>{x}</button>)}</div>
        {aiAvailable && <div className="mt-2 flex flex-wrap gap-2"><button type="button" className="btn btn-ghost btn-sm border border-wine/15" disabled={!!busy} onClick={() => ai('suggest_closing')}>Sugerir frase final</button><button type="button" className="btn btn-ghost btn-sm border border-wine/15" disabled={!!busy} onClick={() => ai('suggest_title')}>Sugerir novo título</button></div>}</div>
      {draftFor && null}
    </div>
  );
}

// ---------------- Etapa 6 ----------------
function MusicStep({ f, set, err, token, server, setServer }: { f: Form; set: <K extends keyof Form>(k: K, v: Form[K]) => void; err: Record<string, string>; token: string; server: ServerState; setServer: (s: ServerState) => void }) {
  const [up, setUp] = useState<{ pct: number; error?: string } | null>(null);
  const music = server.media.find(m => m.type === 'music');
  const canOwn = server.plan.maxAudio > 0;
  async function upload(file: File | undefined) {
    if (!file) return; setUp({ pct: 0 });
    if (file.size > server.limits.audio * 1048576) { setUp({ pct: 0, error: `Ficheiro demasiado grande. O máximo é ${server.limits.audio} MB.` }); return; }
    const form = new FormData(); form.append('file', file); form.append('kind', 'music');
    const r: any = await uploadWithProgress(`/api/orders/${token}/media`, form, pct => setUp({ pct }));
    if (r.ok) { setServer(r); setUp(null); } else setUp({ pct: 0, error: r.error });
  }
  async function removeMusic() { if (!music || !window.confirm('Remover a música?')) return; const r: any = await api(`/api/orders/${token}/media/${music.id}`, { method: 'DELETE' }); if (r.ok) setServer(r); }
  const opt = (v: Form['musicMode'], title: string, desc: string, disabled = false) => (
    <label className={`block rounded-xl border-2 p-4 ${disabled ? 'cursor-not-allowed opacity-55' : 'cursor-pointer'} ${f.musicMode === v ? 'border-wine bg-rose-soft/40' : 'border-wine/15'}`}>
      <input type="radio" name="music" className="sr-only" disabled={disabled} checked={f.musicMode === v} onChange={() => set('musicMode', v)} /><span className="font-semibold">{f.musicMode === v ? '✓ ' : ''}{title}</span><br /><span className="text-sm text-muted">{desc}</span></label>);
  return (
    <div className="space-y-4"><h2 className="h-display text-2xl font-semibold text-wine">Música ou ambiente</h2>
      <p className="text-sm text-muted">O som só começa quando a pessoa tocar em “Abrir a minha carta” e no botão de som.</p>
      {opt('none', 'Sem música', 'Só a carta, em silêncio.')}
      {opt('ambient', 'Ambiente sonoro simples', 'Piano suave, chuva leve ou ondas. Sem direitos de autor.')}
      {f.musicMode === 'ambient' && <div className="ml-2"><label className="label" htmlFor="amb">Escolhe o ambiente</label><select id="amb" className="field" value={f.ambient} onChange={e => set('ambient', e.target.value)}>{AMBIENTS.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></div>}
      {opt('own', 'A minha música', canOwn ? 'Carrega um ficheiro, se tiveres direitos para o usar.' : `O plano ${server.plan.name} não inclui áudio. Muda de plano na etapa 2 para usar esta opção.`, !canOwn)}
      {f.musicMode === 'own' && canOwn && (
        <div className="ml-2 space-y-3">
          <div><label className="label" htmlFor="mus">Ficheiro de música</label><input id="mus" type="file" accept="audio/mpeg,audio/mp4,audio/ogg,audio/wav" className="field cursor-pointer file:mr-3 file:rounded-full file:border-0 file:bg-rose-soft file:px-4 file:py-2 file:font-semibold file:text-wine" onChange={e => { upload(e.target.files?.[0]); e.target.value = ''; }} /></div>
          {up && !up.error && <div className="h-2 overflow-hidden rounded bg-rose-soft"><div className="h-full bg-wine" style={{ width: `${up.pct}%` }} /></div>}
          {up?.error && <p role="alert" className="text-sm font-semibold text-red-700">{up.error}</p>}
          {music && <div className="flex items-center justify-between rounded-xl border border-wine/10 p-3 text-sm"><span>🎵 {music.name}</span><button type="button" className="btn btn-ghost btn-sm" onClick={removeMusic}>Remover</button></div>}
          {err.music && <p role="alert" className="text-sm font-semibold text-red-700">{err.music}</p>}
          <label className="flex cursor-pointer items-start gap-3"><input type="checkbox" className="mt-1 h-5 w-5" checked={f.musicRightsAck} onChange={e => set('musicRightsAck', e.target.checked)} /><span className="text-sm">Confirmo que tenho direitos ou autorização para usar esta música. Não carregues música comercial sem licença.</span></label>
          {err.rights && <p role="alert" className="text-sm font-semibold text-red-700">{err.rights}</p>}
        </div>
      )}
      {opt('library', 'Biblioteca de músicas livres de direitos', 'Em breve. Ainda não existe biblioteca disponível.', true)}
    </div>
  );
}

// ---------------- Reordenar fotos ----------------
function PhotoOrder({ token, server, setServer }: { token: string; server: ServerState; setServer: (s: ServerState) => void }) {
  const photos = server.media.filter(m => m.type === 'photo').sort((a, b) => a.sortOrder - b.sortOrder);
  if (photos.length === 0) return <p className="rounded-xl border border-dashed border-wine/25 p-3 text-center text-sm text-muted">Sem fotografias. A carta fica só com texto, e tudo bem.</p>;
  async function move(i: number, d: number) {
    const ids = photos.map(p => p.id); const j = i + d; if (j < 0 || j >= ids.length) return; [ids[i], ids[j]] = [ids[j], ids[i]];
    const r: any = await api(`/api/orders/${token}/media`, jsonInit('PUT', { order: ids })); if (r.ok) setServer(r);
  }
  async function cover(id: number) { const r: any = await api(`/api/orders/${token}/media/${id}`, jsonInit('PATCH', { setCover: true })); if (r.ok) setServer(r); }
  return (
    <div><p className="label">Fotografias: ordem e capa</p>
      <ul className="space-y-2">{photos.map((p, i) => (
        <li key={p.id} className="flex items-center gap-3 rounded-xl border border-wine/10 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}<img src={p.url} alt={p.caption || `Fotografia ${i + 1}`} className="h-14 w-14 rounded-lg object-cover" />
          <span className="flex-1 text-sm">{server.letter.coverMediaId === p.id ? <strong>Capa</strong> : `Foto ${i + 1}`}</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Subir fotografia ${i + 1}`}>↑</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => move(i, 1)} disabled={i === photos.length - 1} aria-label={`Descer fotografia ${i + 1}`}>↓</button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => cover(p.id)} disabled={server.letter.coverMediaId === p.id}>Usar como capa</button>
        </li>))}</ul></div>
  );
}

// ---------------- Etapa 8 ----------------
function PaymentStep({ token, server, setServer, whatsapp, payment, discountsAvailable }: { discountsAvailable: boolean; token: string; server: ServerState; setServer: (s: ServerState) => void; whatsapp: string; payment: { instructions: string; account: string } }) {
  const [code, setCode] = useState(''); const [codeMsg, setCodeMsg] = useState(''); const [codeBusy, setCodeBusy] = useState(false);
  async function applyCode(remove = false) {
    setCodeMsg(''); setCodeBusy(true);
    const r: any = await api(`/api/orders/${token}/discount`, remove ? { method: 'DELETE' } : jsonInit('POST', { code }));
    setCodeBusy(false); if (r.ok) { setServer(r); setCode(''); setCodeMsg(remove ? '' : 'Código aplicado ✓'); } else setCodeMsg(r.error);
  }
  const [file, setFile] = useState<File | null>(null); const [note, setNote] = useState(''); const [busy, setBusy] = useState(false); const [pct, setPct] = useState(0); const [err, setErr] = useState('');
  const wa = `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Fiz a encomenda ${server.order.reference} (plano ${server.plan.name}, ${formatMoney(server.order.amount, server.order.currency)}). Segue o comprovativo de pagamento.`)}`;
  async function send() {
    setErr('');
    if (!file) { setErr('Anexa o comprovativo de pagamento (imagem ou PDF) para continuar.'); return; }
    if (file.size > server.limits.proof * 1048576) { setErr(`Ficheiro demasiado grande. O máximo é ${server.limits.proof} MB.`); return; }
    setBusy(true); const form = new FormData(); form.append('file', file); form.append('note', note);
    const r: any = await uploadWithProgress(`/api/orders/${token}/proof`, form, setPct);
    setBusy(false);
    if (r.ok) setServer(r); else setErr(r.error);
  }
  return (
    <div className="space-y-5"><h2 className="h-display text-2xl font-semibold text-wine">Pagamento</h2>
      <div className="rounded-xl bg-rose-soft/50 p-4"><p className="text-sm text-muted">Encomenda <strong className="text-ink">{server.order.reference}</strong> · Plano {server.plan.name}</p>{server.order.discountAmount > 0 && <p className="mt-1 text-sm text-muted">Preço do plano {formatMoney(server.order.amount + server.order.discountAmount, server.order.currency)} · desconto <strong>{server.order.discountCode}</strong> −{formatMoney(server.order.discountAmount, server.order.currency)}</p>}<p className="mt-1 text-3xl font-bold" data-testid="order-total">{formatMoney(server.order.amount, server.order.currency)}</p><p className="text-sm text-muted">Disponível durante {server.plan.durationDays} dias após a publicação.</p></div>
      {(discountsAvailable || server.order.discountCode) && (
        <div><label className="label" htmlFor="dcode">Tens um código de desconto?</label>
          {server.order.discountCode ? <p className="flex items-center gap-3 text-sm"><span>Código <strong>{server.order.discountCode}</strong> aplicado.</span><button type="button" className="font-semibold text-wine underline" onClick={() => applyCode(true)} disabled={codeBusy}>Remover</button></p> : (
            <div className="flex gap-2"><input id="dcode" className="field flex-1 uppercase" value={code} onChange={e => setCode(e.target.value)} maxLength={24} autoComplete="off" placeholder="CÓDIGO" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (code.trim()) applyCode(); } }} /><button type="button" className="btn btn-secondary" onClick={() => applyCode()} disabled={codeBusy || !code.trim()}>{codeBusy ? '…' : 'Aplicar'}</button></div>)}
          {codeMsg && <p role={codeMsg.includes('✓') ? 'status' : 'alert'} className={`mt-1 text-sm font-semibold ${codeMsg.includes('✓') ? 'text-green-800' : 'text-red-700'}`}>{codeMsg}</p>}</div>)}
      <div><h3 className="font-semibold">Como pagar</h3><p className="mt-1 whitespace-pre-line text-muted">{payment.instructions}</p><pre className="mt-3 whitespace-pre-wrap rounded-xl border border-wine/10 bg-white p-4 font-sans text-sm">{payment.account}</pre>
        <p className="hint">Usa <strong>{server.order.reference}</strong> como referência do pagamento.</p></div>
      <a href={wa} target="_blank" rel="noopener noreferrer" className="btn w-full bg-[#1F8A4C] text-white hover:bg-[#186f3d]">Falar connosco no WhatsApp</a>
      <div className="space-y-3 border-t border-wine/10 pt-5"><h3 className="font-semibold">Enviar comprovativo</h3>
        <div><label className="label" htmlFor="proof">Comprovativo (imagem ou PDF)</label><input id="proof" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="field cursor-pointer file:mr-3 file:rounded-full file:border-0 file:bg-rose-soft file:px-4 file:py-2 file:font-semibold file:text-wine" onChange={e => setFile(e.target.files?.[0] || null)} /></div>
        <div><label className="label" htmlFor="pnote">Referência ou observação (opcional)</label><input id="pnote" className="field" value={note} onChange={e => setNote(e.target.value)} maxLength={300} /></div>
        {busy && <div className="h-2 overflow-hidden rounded bg-rose-soft"><div className="h-full bg-wine" style={{ width: `${pct}%` }} /></div>}
        {err && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">{err}</p>}
        <button type="button" className="btn btn-primary w-full" onClick={send} disabled={busy}>{busy ? 'A enviar…' : 'Enviar comprovativo'}</button>
        <p className="hint">Só publicamos a tua carta depois de a nossa equipa confirmar o pagamento.</p></div>
    </div>
  );
}

function Done({ token, server, whatsapp }: { token: string; server: ServerState; whatsapp: string }) {
  const link = typeof window !== 'undefined' ? `${window.location.origin}/minha/${token}` : `/minha/${token}`;
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-5 text-center" role="status"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-soft text-2xl text-wine" aria-hidden>✓</div>
      <h2 className="h-display text-2xl font-semibold text-wine">Recebemos o teu pedido.</h2>
      <p className="text-lg">A nossa equipa irá confirmar o pagamento e desbloquear a tua Carta QR.</p>
      <p className="text-sm text-muted">Código da encomenda: <strong className="text-ink">{server.order.reference}</strong></p>
      <div className="rounded-xl bg-rose-soft/50 p-4 text-left text-sm"><p className="font-semibold">Guarda este link privado</p><p className="mt-1 break-all text-muted">{link}</p><p className="mt-1">É por ele que acompanhas o estado da encomenda e descarregas o QR Code quando a carta for publicada.</p>
        <button type="button" className="btn btn-secondary btn-sm mt-3" onClick={async () => { try { await navigator.clipboard.writeText(link); setCopied(true); } catch { /* */ } }}>{copied ? 'Copiado ✓' : 'Copiar link'}</button></div>
      <Link href={`/minha/${token}`} className="btn btn-primary w-full">Acompanhar a minha encomenda</Link>
      <a className="btn btn-ghost" href={`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Sobre a encomenda ${server.order.reference}.`)}`} target="_blank" rel="noopener noreferrer">Falar com a equipa no WhatsApp</a>
    </div>
  );
}
