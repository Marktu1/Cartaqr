import { getSettings } from '@/lib/settings';
import { requireAdmin } from '@/lib/auth';
import { listPlans, listOccasions } from '@/lib/orders';
import { THEME_INFO } from '@/lib/themes';
import * as A from '../../actions';
import { all } from '@/lib/db';
import { formatDate, formatMoney, utcToLuanda } from '@/lib/format';
import { listDiscountCodes } from '@/lib/orders';

export default async function Settings(props: { searchParams: Promise<{ msg?: string }> }) {
  await requireAdmin();
  const searchParams = await props.searchParams;
  const s = getSettings(); const plans = listPlans(false); const occasions = all('SELECT * FROM occasions ORDER BY sort_order, id');
  const codes = listDiscountCodes(); const rawPlans = all('SELECT id, promo_price, promo_ends_at FROM plans'); const logs = all('SELECT * FROM admin_logs ORDER BY id DESC LIMIT 25');
  return (
    <div className="space-y-8">
      <h1 className="h-display text-3xl font-semibold text-wine">Configurações</h1>
      {searchParams.msg && <p role="status" className="rounded-xl bg-green-50 p-3 text-green-900">{searchParams.msg}</p>}

      <form action={A.saveSettingsAction} className="card space-y-4 p-5">
        <input type="hidden" name="_group" value="general" /><h2 className="h-display text-xl font-semibold text-wine">Geral, pagamento e limites</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="whatsapp_number">Número de WhatsApp (com indicativo)</label><input id="whatsapp_number" name="whatsapp_number" className="field" defaultValue={s.whatsapp_number} inputMode="tel" /><p className="hint">Ex.: 244923456789</p></div>
          <div><label className="label" htmlFor="currency">Moeda padrão</label><input id="currency" name="currency" className="field" defaultValue={s.currency} maxLength={8} /></div>
        </div>
        <div><label className="label" htmlFor="payment_instructions">Instruções de pagamento</label><textarea id="payment_instructions" name="payment_instructions" className="field min-h-[90px]" defaultValue={s.payment_instructions} /></div>
        <div><label className="label" htmlFor="payment_account">Número ou conta de pagamento (IBAN, Multicaixa Express…)</label><textarea id="payment_account" name="payment_account" className="field min-h-[90px]" defaultValue={s.payment_account} /></div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {[['max_image_mb', 'Imagem (MB)'], ['max_video_mb', 'Vídeo (MB)'], ['max_audio_mb', 'Áudio (MB)'], ['max_proof_mb', 'Comprovativo (MB)'], ['default_expiry_days', 'Expiração (dias)']].map(([k, l]) => <div key={k}><label className="label" htmlFor={k}>{l}</label><input id={k} name={k} type="number" min={1} className="field" defaultValue={s[k]} /></div>)}
        </div>
        <label className="flex min-h-[48px] cursor-pointer items-center gap-3"><input type="checkbox" name="newsletter_popup" defaultChecked={s.newsletter_popup !== '0'} className="h-5 w-5" /><span><span className="font-semibold">Mostrar pop-up da newsletter</span><br /><span className="text-sm text-muted">Aparece uma vez a visitantes novos na página inicial, preços e categorias.</span></span></label>
        <button className="btn btn-primary">Guardar configurações</button>
      </form>

      <section className="space-y-4"><h2 className="h-display text-xl font-semibold text-wine">Planos e preços</h2>
        {plans.map(p => (
          <form key={p.id} action={A.savePlanAction} className="card grid gap-3 p-5 sm:grid-cols-2"><input type="hidden" name="id" value={p.id} />
            <div><label className="label" htmlFor={`pn-${p.id}`}>Nome</label><input id={`pn-${p.id}`} name="name" className="field" defaultValue={p.name} /></div>
            <div><label className="label" htmlFor={`pd-${p.id}`}>Descrição</label><input id={`pd-${p.id}`} name="description" className="field" defaultValue={p.description} /></div>
            <div><label className="label" htmlFor={`pp-${p.id}`}>Preço</label><input id={`pp-${p.id}`} name="price" type="number" min={0} className="field" defaultValue={p.price} /></div>
            <div><label className="label" htmlFor={`pc-${p.id}`}>Moeda</label><input id={`pc-${p.id}`} name="currency" className="field" defaultValue={p.currency} /></div>
            <p className="sm:col-span-2"><span className="chip">{p.kind === 'evento' ? 'Pacote de Eventos' : 'Plano de cartas'}</span></p>
            <div className="grid grid-cols-5 gap-2 sm:col-span-2">{[['max_photos', 'Fotos'], ['max_videos', 'Vídeos'], ['max_audio_files', 'Áudios'], ['max_guests', 'Convidados'], ['duration_days', 'Dias']].map(([k, l]) => <div key={k}><label className="label" htmlFor={`${k}-${p.id}`}>{l}</label><input id={`${k}-${p.id}`} name={k} type="number" min={0} className="field" defaultValue={p[k]} /></div>)}</div>
            {(() => { const rp = rawPlans.find(x => x.id === p.id); const live = !!p.promo_active; return (
              <fieldset className="rounded-xl border border-gold/40 bg-gold/5 p-3 sm:col-span-2"><legend className="px-2 text-sm font-semibold text-wine">Promoção com data de fim (opcional){live ? ' · ATIVA' : ''}</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><label className="label" htmlFor={`pr-${p.id}`}>Preço promocional</label><input id={`pr-${p.id}`} name="promo_price" type="number" min={500} className="field" defaultValue={rp?.promo_price ?? ''} placeholder="vazio = sem promoção" /></div>
                  <div><label className="label" htmlFor={`pe-${p.id}`}>Termina em (hora de Luanda)</label><input id={`pe-${p.id}`} name="promo_ends_at" type="datetime-local" className="field" defaultValue={utcToLuanda(rp?.promo_ends_at)} /></div>
                </div>
                <p className="hint">O “Preço” acima é o preço <strong>normal</strong>: o que cobras depois de a promoção acabar. Aparece riscado ao lado do promocional, por isso tem de ser um valor que vais mesmo praticar. Máximo de 90 dias; termina sozinha na data. Para retirar, apaga o preço promocional.</p></fieldset>); })()}
            <div className="sm:col-span-2"><label className="label" htmlFor={`pf-${p.id}`}>Benefícios (um por linha)</label><textarea id={`pf-${p.id}`} name="features" className="field min-h-[110px]" defaultValue={p.features.join('\n')} /></div>
            <label className="flex items-center gap-2 sm:col-span-2"><input type="checkbox" name="is_active" defaultChecked={!!p.is_active} className="h-5 w-5" /> Plano ativo</label>
            <button className="btn btn-primary btn-sm sm:col-span-2">Guardar plano {p.name}</button></form>))}
      </section>

      <section id="descontos" className="space-y-4 scroll-mt-6"><h2 className="h-display text-xl font-semibold text-wine">Códigos de desconto</h2>
        <p className="text-sm text-muted">O cliente escreve o código no passo do pagamento. O campo só aparece na página de criar se houver pelo menos um código ativo e válido. Nunca deixamos o preço final abaixo de {formatMoney(500, 'Kz')}.</p>
        <form action={A.createDiscountAction} className="card grid gap-3 p-4 sm:grid-cols-6 sm:items-end">
          <div className="sm:col-span-2"><label className="label" htmlFor="dc-code">Código</label><input id="dc-code" name="code" className="field uppercase" placeholder="Ex.: BEMVINDO10" maxLength={24} required /></div>
          <div><label className="label" htmlFor="dc-kind">Tipo</label><select id="dc-kind" name="kind" className="field"><option value="percent">Percentagem (%)</option><option value="fixed">Valor fixo (Kz)</option></select></div>
          <div><label className="label" htmlFor="dc-val">Valor</label><input id="dc-val" name="value" type="number" min={1} className="field" required /></div>
          <div><label className="label" htmlFor="dc-app">Vale para</label><select id="dc-app" name="applies_to" className="field"><option value="all">Tudo</option><option value="carta">Só cartas</option><option value="evento">Só eventos</option></select></div>
          <div><label className="label" htmlFor="dc-max">Máx. usos</label><input id="dc-max" name="max_uses" type="number" min={0} className="field" placeholder="0 = sem limite" /></div>
          <div className="sm:col-span-3"><label className="label" htmlFor="dc-until">Válido até (opcional, hora de Luanda)</label><input id="dc-until" name="valid_until" type="datetime-local" className="field" /></div>
          <div className="sm:col-span-3"><button className="btn btn-primary w-full">Criar código</button></div>
        </form>
        {codes.length > 0 && <div className="card overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><caption className="sr-only">Códigos de desconto</caption>
          <thead><tr className="border-b border-wine/10 text-muted"><th scope="col" className="p-3">Código</th><th scope="col" className="p-3">Desconto</th><th scope="col" className="p-3">Vale para</th><th scope="col" className="p-3">Usos</th><th scope="col" className="p-3">Validade</th><th scope="col" className="p-3">Estado</th><th scope="col" className="p-3"><span className="sr-only">Ações</span></th></tr></thead>
          <tbody>{codes.map(c => (<tr key={c.id} className="border-b border-wine/5 last:border-0"><td className="p-3 font-mono font-semibold">{c.code}</td><td className="p-3">{c.kind === 'percent' ? `${c.value} %` : formatMoney(c.value, 'Kz')}</td><td className="p-3">{c.applies_to === 'all' ? 'Tudo' : c.applies_to === 'carta' ? 'Cartas' : 'Eventos'}</td>
            <td className="p-3">{c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ''}</td><td className="p-3">{c.valid_until ? formatDate(c.valid_until) : 'Sem fim'}</td><td className="p-3">{c.is_active ? <span className="chip">Ativo</span> : <span className="chip !bg-red-100 !text-red-800">Desativado</span>}</td>
            <td className="flex gap-1 p-3"><form action={A.toggleDiscountAction}><input type="hidden" name="id" value={c.id} /><button className="btn btn-ghost btn-sm">{c.is_active ? 'Desativar' : 'Ativar'}</button></form><form action={A.deleteDiscountAction}><input type="hidden" name="id" value={c.id} /><button className="btn btn-ghost btn-sm">Eliminar</button></form></td></tr>))}</tbody></table></div>}
        <form action={A.saveSettingsAction} className="card space-y-3 p-4">
          <p className="text-sm text-muted">Opções gerais dos descontos (guardadas em conjunto com as configurações gerais):</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="nl-code">Código oferecido a quem se inscreve na newsletter</label><select id="nl-code" name="newsletter_code" className="field" defaultValue={s.newsletter_code}><option value="">Nenhum</option>{codes.map(c => <option key={c.id} value={c.code}>{c.code}</option>)}</select><p className="hint">Aparece no pop-up depois de a pessoa se inscrever.</p></div>
            <label className="flex min-h-[48px] cursor-pointer items-start gap-3"><input type="checkbox" name="discount_stack_with_promo" defaultChecked={s.discount_stack_with_promo === '1'} className="mt-1 h-5 w-5" /><span><span className="font-semibold">Acumular códigos com preços promocionais</span><br /><span className="text-sm text-muted">Desligado: um plano em promoção não aceita códigos.</span></span></label>
          </div>
          <input type="hidden" name="_group" value="discount" /><button className="btn btn-secondary btn-sm">Guardar opções de desconto</button></form>
      </section>

      <section className="space-y-3"><h2 className="h-display text-xl font-semibold text-wine">Ocasiões e templates</h2>
        {occasions.map(o => (
          <form key={o.id} action={A.saveOccasionAction} className="card grid gap-3 p-4 sm:grid-cols-[1fr_1.4fr_1fr_auto_auto] sm:items-end"><input type="hidden" name="id" value={o.id} />
            <div><label className="label" htmlFor={`on-${o.id}`}>Nome <span className="text-xs text-muted">({o.kind === 'evento' ? 'evento' : 'carta'})</span></label><input id={`on-${o.id}`} name="name" className="field" defaultValue={o.name} /></div>
            <div><label className="label" htmlFor={`od-${o.id}`}>Descrição</label><input id={`od-${o.id}`} name="description" className="field" defaultValue={o.description} /></div>
            <div><label className="label" htmlFor={`ot-${o.id}`}>Estilo padrão</label><select id={`ot-${o.id}`} name="default_theme" className="field" defaultValue={o.default_theme}>{Object.entries(THEME_INFO).map(([k, t]) => <option key={k} value={k}>{t.name}</option>)}</select></div>
            <label className="flex min-h-[48px] items-center gap-2"><input type="checkbox" name="is_active" defaultChecked={!!o.is_active} className="h-5 w-5" /> Ativa</label>
            <button className="btn btn-secondary btn-sm">Guardar</button></form>))}
      </section>

      <section className="card p-5"><h2 className="h-display mb-3 text-xl font-semibold text-wine">Registo de ações administrativas</h2>
        <ul className="space-y-1 text-sm">{logs.map(l => <li key={l.id}><span className="text-muted">{l.created_at}</span> · {l.action} {l.target ? `· ${l.target}` : ''}</li>)}</ul></section>
    </div>
  );
}
