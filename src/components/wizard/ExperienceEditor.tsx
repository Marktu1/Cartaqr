'use client';
import { useEffect, useState } from 'react';
import { MOODS, GESTURES, songEmbed, defaultCardsTitle, type Experience } from '@/lib/experience';

const TEASERS = ['Tenho uma coisa para te dizer…', 'Alguém preparou algo especial para ti…', 'Fecha os olhos… agora abre.', 'Isto é só para ti.'];
const VOUCHERS = ['Vale um mufete na Ilha', 'Vale uma noite de kizomba só nós dois', 'Vale um dia sem loiça', 'Vale um pequeno-almoço na cama', 'Vale um passeio na Marginal ao pôr do sol', 'Vale um abraço sem prazo'];

function Block({ icon, title, desc, active, children, open }: { icon: string; title: string; desc: string; active: boolean; children: React.ReactNode; open?: boolean }) {
  return (
    <details className="group rounded-xl2 border-2 border-wine/10 bg-white/60 open:border-wine/30" open={open}>
      <summary className="flex min-h-[64px] cursor-pointer list-none items-center gap-3 p-4">
        <span className="text-2xl" aria-hidden>{icon}</span>
        <span className="min-w-0 flex-1"><span className="block font-semibold text-wine">{title}{active && <span className="ml-2 rounded-full bg-wine px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Ativo</span>}</span><span className="block text-sm text-muted">{desc}</span></span>
        <span className="text-wine transition group-open:rotate-180" aria-hidden>⌄</span>
      </summary>
      <div className="space-y-3 px-4 pb-4">{children}</div>
    </details>
  );
}

/** Lista "uma por linha" que deixa escrever à vontade (guarda o texto e devolve só as linhas preenchidas). */
function Lines({ id, value, onChange, max, ph, rows = 4 }: { id: string; value: string[]; onChange: (v: string[]) => void; max: number; ph: string; rows?: number }) {
  const [text, setText] = useState(value.join('\n'));
  const joined = value.join('\n');
  useEffect(() => { // valor mudado fora do campo (ex.: sugestões) → atualiza o texto
    setText(t => (t.split('\n').map(x => x.trim()).filter(Boolean).join('\n') === joined ? t : joined));
  }, [joined]);
  return <textarea id={id} rows={rows} className="field" placeholder={ph} value={text}
    onChange={e => { const t = e.target.value; setText(t); onChange(t.split('\n').map(x => x.trim()).filter(Boolean).slice(0, max)); }} />;
}

export function ExperienceEditor({ value, onChange, category, isEvent, recipientName, err }: {
  value: Experience; onChange: (e: Experience) => void; category: string; isEvent: boolean; recipientName: string; err: Record<string, string>;
}) {
  const e = value;
  const set = <K extends keyof Experience>(k: K, v: Experience[K]) => {
    const n = { ...e, [k]: v }; if (v === undefined || v === '' || (Array.isArray(v) && !v.length)) delete n[k]; onChange(n);
  };
  const songOk = !e.song || !!songEmbed(e.song);
  const secret = e.secret || { hint: '', answer: '', message: '' };
  const later = e.later || { date: '', message: '' };
  const tomorrow = new Date(Date.now() + 86400_000).toISOString().slice(0, 10);

  return (
    <div className="space-y-3">
      <Block icon="🎬" title="Abertura cinematográfica" desc="O ecrã escurece, aparece a tua frase e depois o envelope." active={!!e.teaser} open>
        <label className="label" htmlFor="x-teaser">A primeira frase que {recipientName || 'a pessoa'} vai ler</label>
        <input id="x-teaser" className="field" maxLength={140} placeholder={isEvent ? 'Tens um convite especial à tua espera…' : 'Alguém preparou algo especial para ti…'} value={e.teaser || ''} onChange={x => set('teaser', x.target.value)} />
        <div className="flex flex-wrap gap-2">{TEASERS.map(t => <button key={t} type="button" className="btn btn-ghost btn-sm border border-wine/15" onClick={() => set('teaser', t)}>{t}</button>)}</div>
      </Block>

      <Block icon="🌅" title="Ambiente da carta" desc="Um pequeno mundo à volta da mensagem." active={!!e.mood && e.mood !== 'classico'}>
        <div className="grid gap-2 sm:grid-cols-2">{MOODS.map(m => (
          <label key={m.key} className={`cursor-pointer rounded-xl border-2 p-3 text-sm ${(e.mood || 'classico') === m.key ? 'border-wine bg-rose-soft/40' : 'border-wine/15'}`}>
            <input type="radio" name="x-mood" className="sr-only" checked={(e.mood || 'classico') === m.key} onChange={() => set('mood', m.key === 'classico' ? undefined : m.key)} />
            <span className="font-semibold">{(e.mood || 'classico') === m.key ? '✓ ' : ''}{m.name}</span><br /><span className="text-xs text-muted">{m.desc}</span>
          </label>))}</div>
        {!isEvent && <p className="hint">Quem recebe pode ainda ligar a “Luz de velas” para ler à noite.</p>}
      </Block>

      <Block icon="🎵" title="A nossa música" desc="Cola o link do YouTube ou do Spotify da vossa canção." active={!!e.song}>
        <label className="label" htmlFor="x-song">Link da música</label>
        <input id="x-song" type="url" inputMode="url" className="field" placeholder="https://youtu.be/… ou https://open.spotify.com/track/…" value={e.song || ''} onChange={x => set('song', x.target.value.trim())} aria-invalid={!songOk} />
        <p className={`text-sm ${songOk ? 'text-muted' : 'font-semibold text-red-700'}`}>{!e.song ? 'Uma kizomba, um semba… a canção que é vossa.' : songOk ? '✓ Link válido. Toca dentro da carta.' : 'Este link não é do YouTube nem do Spotify.'}</p>
        {err.song && <p role="alert" className="text-sm font-semibold text-red-700">{err.song}</p>}
      </Block>

      {!isEvent && <>
        <Block icon="🃏" title="Cartões para virar" desc="A pessoa toca em cada cartão para descobrir uma frase." active={!!e.cards?.length}>
          <label className="label" htmlFor="x-ct">Título</label>
          <input id="x-ct" className="field" maxLength={60} placeholder={defaultCardsTitle(category)} value={e.cardsTitle || ''} onChange={x => set('cardsTitle', x.target.value)} />
          <label className="label" htmlFor="x-cards">Uma frase por linha (até 10)</label>
          <Lines id="x-cards" value={e.cards || []} onChange={v => set('cards', v)} max={10} rows={5} ph={'O teu sorriso logo de manhã\nA forma como cuidas de todos\nComo me fazes rir sem esforço'} />
        </Block>

        <Block icon="🎟" title="Vales-presente" desc="Promessas que a pessoa resgata com um toque. Tu recebes o aviso." active={!!e.vouchers?.length}>
          <label className="label" htmlFor="x-v">Um vale por linha (até 6)</label>
          <Lines id="x-v" value={e.vouchers || []} onChange={v => set('vouchers', v)} max={6} ph={'Vale um mufete na Ilha\nVale um dia sem loiça'} />
          <div className="flex flex-wrap gap-2">{VOUCHERS.filter(v => !(e.vouchers || []).includes(v)).map(v => <button key={v} type="button" className="btn btn-ghost btn-sm border border-wine/15" disabled={(e.vouchers || []).length >= 6} onClick={() => set('vouchers', [...(e.vouchers || []), v])}>+ {v}</button>)}</div>
        </Block>

        <Block icon="🔐" title="Detalhe secreto" desc="Uma mensagem que só abre com uma resposta que só ela(e) sabe." active={!!e.secret}>
          <label className="label" htmlFor="x-sh">A pergunta ou pista</label>
          <input id="x-sh" className="field" maxLength={140} placeholder="Onde foi o nosso primeiro beijo?" value={secret.hint} onChange={x => set('secret', { ...secret, hint: x.target.value })} />
          <label className="label" htmlFor="x-sa">A resposta certa</label>
          <input id="x-sa" className="field" maxLength={60} placeholder="Ilha do Mussulo" value={secret.answer} onChange={x => set('secret', { ...secret, answer: x.target.value })} />
          <p className="hint">Não importam maiúsculas nem acentos. A resposta nunca aparece na página.</p>
          <label className="label" htmlFor="x-sm">A mensagem escondida</label>
          <textarea id="x-sm" className="field min-h-[90px]" maxLength={600} placeholder="Sabias que…" value={secret.message} onChange={x => set('secret', { ...secret, message: x.target.value })} />
          {err.secret && <p role="alert" className="text-sm font-semibold text-red-700">{err.secret}</p>}
          {e.secret && <button type="button" className="btn btn-ghost btn-sm" onClick={() => set('secret', undefined)}>Remover segredo</button>}
        </Block>

        <Block icon="🎁" title="Surpresa final" desc="Uma frase revelada com um gesto, como num presente de verdade." active={!!e.finale}>
          <div className="grid gap-2 sm:grid-cols-3">{GESTURES.map(g => (
            <label key={g.key} className={`cursor-pointer rounded-xl border-2 p-3 text-sm ${(e.finale?.gesture || 'raspar') === g.key ? 'border-wine bg-rose-soft/40' : 'border-wine/15'}`}>
              <input type="radio" name="x-g" className="sr-only" checked={(e.finale?.gesture || 'raspar') === g.key} onChange={() => set('finale', { text: e.finale?.text || '', gesture: g.key })} />
              <span className="font-semibold">{(e.finale?.gesture || 'raspar') === g.key ? '✓ ' : ''}{g.name}</span><br /><span className="text-xs text-muted">{g.desc}</span>
            </label>))}</div>
          <label className="label" htmlFor="x-ft">A frase escondida</label>
          <input id="x-ft" className="field" maxLength={200} placeholder="Amo-te mais do que ontem e menos do que amanhã." value={e.finale?.text || ''} onChange={x => set('finale', x.target.value ? { text: x.target.value, gesture: e.finale?.gesture || 'raspar' } : undefined)} />
        </Block>

        <Block icon="⏳" title="Surpresa para mais tarde" desc="A carta continua: uma mensagem que só abre numa data especial." active={!!e.later}>
          <label className="label" htmlFor="x-ld">Abre a</label>
          <input id="x-ld" type="date" min={tomorrow} className="field max-w-[220px]" value={later.date} onChange={x => set('later', { ...later, date: x.target.value })} />
          <label className="label" htmlFor="x-lm">A mensagem</label>
          <textarea id="x-lm" className="field min-h-[90px]" maxLength={600} placeholder="Se estás a ler isto, é porque passou mais um mês contigo…" value={later.message} onChange={x => set('later', { ...later, message: x.target.value })} />
          <p className="hint">Até lá, a pessoa vê apenas que há uma surpresa guardada e a data. Escolhe uma data dentro do período do teu plano.</p>
          {err.later && <p role="alert" className="text-sm font-semibold text-red-700">{err.later}</p>}
          {e.later && <button type="button" className="btn btn-ghost btn-sm" onClick={() => set('later', undefined)}>Remover</button>}
        </Block>

        <Block icon="💬" title="Respostas de quem recebe" desc="Reações num toque e uma cápsula do tempo para daqui a um ano." active={e.reactions !== false || e.capsule !== false}>
          <label className="flex cursor-pointer items-start gap-3"><input type="checkbox" className="mt-1 h-5 w-5" checked={e.reactions !== false} onChange={x => set('reactions', x.target.checked ? undefined : false)} /><span><span className="font-semibold">Reações rápidas</span><br /><span className="text-sm text-muted">“Li tudo ❤”, “Também me lembro desse dia”, “Quero falar contigo”…</span></span></label>
          <label className="flex cursor-pointer items-start gap-3"><input type="checkbox" className="mt-1 h-5 w-5" checked={e.capsule !== false} onChange={x => set('capsule', x.target.checked ? undefined : false)} /><span><span className="font-semibold">Cápsula do tempo</span><br /><span className="text-sm text-muted">Quem recebe pode escrever uma promessa que só abre daqui a um ano.</span></span></label>
        </Block>
      </>}
    </div>
  );
}

/** Erros a mostrar antes de avançar. */
export function experienceErrors(e: Experience): Record<string, string> {
  const out: Record<string, string> = {};
  if (e.song && !songEmbed(e.song)) out.song = 'O link da música tem de ser do YouTube ou do Spotify.';
  if (e.secret && [e.secret.hint, e.secret.answer, e.secret.message].some(v => !v.trim()) && [e.secret.hint, e.secret.answer, e.secret.message].some(v => v.trim())) out.secret = 'Para o segredo funcionar, preenche a pergunta, a resposta e a mensagem.';
  if (e.later && ((e.later.date && !e.later.message.trim()) || (!e.later.date && e.later.message.trim()))) out.later = 'Escolhe a data e escreve a mensagem.';
  return out;
}
