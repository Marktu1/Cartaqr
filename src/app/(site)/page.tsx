import Link from 'next/link';
import { listPlans, listOccasions } from '@/lib/orders';
import { DEMOS, placeholderSvg } from '@/lib/demo';
import { qrSvg } from '@/lib/qr';
import { config } from '@/lib/config';
import { PlanCards } from '@/components/PlanCards';
import { Faq } from '@/components/Faq';
import { NewsletterForm } from '@/components/NewsletterForm';
import { Track } from '@/components/Track';
import { CATEGORIES } from '@/lib/categories';
import { formatMoney } from '@/lib/format';


export default async function Home() {
  const plans = listPlans(true, 'carta'); const eventPlans = listPlans(true, 'evento');
  const minEvent = eventPlans.length ? Math.min(...eventPlans.map(p => p.effective_price)) : 0;
  const letterCats = CATEGORIES.filter(c => c.kind === 'carta' && c.slug !== 'outra'); const eventCats = CATEGORIES.filter(c => c.kind === 'evento');
  const demoQr = await qrSvg(`${config.appUrl}/exemplos/${DEMOS[0].slug}`);
  return (
    <>
      <Track name="landing_view" />
      {/* Hero */}
      <section className="section grid items-center gap-10 pb-16 pt-10 md:grid-cols-2 md:pt-16">
        <div className="fade-up">
          <span className="chip">Um presente digital, feito com carinho</span>
          <h1 className="h-display mt-4 text-4xl font-semibold leading-[1.1] text-wine sm:text-5xl lg:text-6xl">Cria uma surpresa que vai ser lembrada para sempre.</h1>
          <p className="mt-5 max-w-lg text-lg text-muted">Transforma as tuas fotografias, palavras e memórias numa carta digital personalizada com link privado e QR Code.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/criar" className="btn btn-primary">Criar a minha Carta QR</Link>
            <a href="#exemplos" className="btn btn-secondary">Ver exemplos</a>
          </div>
          <p className="mt-4 text-sm text-muted">Sem instalar nada · Pagamento por transferência · Confirmação por WhatsApp</p>
        </div>
        <div className="relative mx-auto w-full max-w-sm" aria-hidden>
          <div className="mx-auto w-[240px] rounded-[2.2rem] border-[7px] border-ink bg-ink p-0 shadow-2xl">
            <div className="overflow-hidden rounded-[1.7rem] bg-cream">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={placeholderSvg(350, '', 480, 520)} alt="" className="h-[230px] w-full object-cover" />
              <div className="p-4 text-center">
                <p className="text-[10px] uppercase tracking-[.25em] text-gold-deep">Para Ana Exemplo</p>
                <p className="h-display mt-1 text-lg font-semibold leading-tight text-wine">Para a minha pessoa favorita</p>
                <div className="mx-auto mt-3 h-1.5 w-2/3 rounded bg-rose-soft" /><div className="mx-auto mt-1.5 h-1.5 w-1/2 rounded bg-rose-soft" />
                <div className="mt-4 rounded-full bg-wine py-2 text-xs font-semibold text-white">Abrir a minha carta</div>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-2 w-40 rotate-6 rounded-xl2 border border-wine/10 bg-paper p-3 text-center shadow-soft sm:-right-8">
            <div className="mx-auto h-24 w-24" dangerouslySetInnerHTML={{ __html: demoQr }} />
            <p className="h-display mt-1 text-xs font-semibold text-wine">Lê o código para abrir a tua surpresa</p>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="section py-14" aria-labelledby="como">
        <h2 id="como" className="h-display text-center text-3xl font-semibold text-wine">Como funciona</h2>
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {['Escolhe a ocasião', 'Personaliza a mensagem e adiciona memórias', 'Recebe o teu link e QR Code', 'Partilha ou coloca o QR Code num presente'].map((t, i) => (
            <li key={t} className="card p-6"><span className="h-display text-4xl font-semibold text-gold-deep">{i + 1}</span><p className="mt-2 font-semibold">{t}</p></li>
          ))}
        </ol>
      </section>

      {/* Ocasiões */}
      <section className="section py-14" aria-labelledby="ocasioes">
        <h2 id="ocasioes" className="h-display text-center text-3xl font-semibold text-wine">Uma carta diferente para cada momento</h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-muted">Cada categoria tem perguntas, estilo e texto próprios, pensados para essa ocasião.</p>
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3">
          {letterCats.map(c => (
            <Link key={c.slug} href={`/ocasioes/${c.slug}`} className="card group p-5 transition hover:-translate-y-0.5 hover:border-gold">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-soft text-xl text-wine" aria-hidden>{c.glyph}</span>
              <p className="h-display mt-3 text-lg font-semibold text-wine">{c.name}</p><p className="text-sm text-muted">{c.short}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Eventos */}
      <section className="section py-14" aria-labelledby="eventos">
        <div className="rounded-xl2 bg-ink px-6 py-12 text-white sm:px-10">
          <span className="chip bg-gold-deep text-white">Novo · Eventos</span>
          <h2 id="eventos" className="h-display mt-4 text-3xl font-semibold sm:text-4xl">Convites digitais com confirmação de presença</h2>
          <p className="mt-3 max-w-2xl text-white/80">Casamentos, festas, batizados e eventos de empresa. Os convidados abrem o convite no telemóvel, veem o local e o programa e confirmam presença. Tu acompanhas a lista em tempo real.{minEvent ? ` A partir de ${formatMoney(minEvent, 'Kz')}.` : ''}</p>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {eventCats.map(c => (
              <Link key={c.slug} href={`/ocasioes/${c.slug}`} className="rounded-xl2 border border-white/15 p-4 transition hover:border-gold hover:bg-white/5">
                <span className="text-2xl text-gold" aria-hidden>{c.glyph}</span><p className="h-display mt-2 text-lg font-semibold">{c.name}</p>
              </Link>
            ))}
          </div>
          <Link href="/precos#eventos" className="btn mt-8 bg-white text-wine hover:bg-cream">Ver pacotes de Eventos</Link>
        </div>
      </section>

      {/* Exemplos */}
      <section id="exemplos" className="section scroll-mt-20 py-14" aria-labelledby="exemplos-t">
        <h2 id="exemplos-t" className="h-display text-center text-3xl font-semibold text-wine">Vê como fica</h2>
        <p className="mx-auto mt-2 max-w-md text-center text-muted">Exemplos com dados fictícios. Toca para abrir como se fosses quem recebe.</p>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {DEMOS.map(d => (
            <Link key={d.slug} href={`/exemplos/${d.slug}`} className="card overflow-hidden transition hover:-translate-y-0.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={placeholderSvg(d.photos[0].hue, d.title, 600, 420)} alt={`Imagem de demonstração para o exemplo “${d.title}”`} className="h-48 w-full object-cover" loading="lazy" />
              <div className="p-5"><span className="chip">{d.occasion}</span><p className="h-display mt-2 text-xl font-semibold text-wine">{d.title}</p><p className="text-sm text-muted">{d.blurb}</p><p className="mt-3 text-sm font-semibold text-wine">Ver exemplo →</p></div>
            </Link>
          ))}
        </div>
      </section>

      {/* Benefícios */}
      <section className="section py-14" aria-labelledby="beneficios">
        <h2 id="beneficios" className="h-display text-center text-3xl font-semibold text-wine">Simples para ti, inesquecível para quem recebe</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[['Personalização', 'Cores, estilo, fotos e palavras à tua maneira.'], ['Criação rápida', 'Em poucos minutos, direto no telemóvel.'], ['Link privado', 'Só abre para quem tiver o teu link (e o PIN, se quiseres).'],
            ['QR Code pronto', 'Descarrega, imprime um cartão ou envia por WhatsApp.'], ['Feito para telemóvel', 'Leve, rápido e sem instalar aplicações.'], ['Fotos, vídeo, áudio e música', 'Inclui os ficheiros e a música que tu escolheres (com direitos de uso).']].map(([t, d]) => (
            <div key={t} className="card p-5"><p className="h-display text-lg font-semibold text-wine">{t}</p><p className="mt-1 text-muted">{d}</p></div>
          ))}
        </div>
      </section>

      {/* Preços */}
      <section className="section py-14" aria-labelledby="precos">
        <h2 id="precos" className="h-display text-center text-3xl font-semibold text-wine">Planos para cartas</h2>
        <div className="mt-10"><PlanCards plans={plans} /></div>
        <p className="mt-6 text-center text-sm text-muted">Para convites de evento, vê os <Link href="/precos#eventos" className="font-semibold text-wine underline">pacotes de Eventos</Link>.</p>
      </section>

      {/* Newsletter */}
      <section className="section py-10" aria-labelledby="news">
        <div className="mx-auto max-w-2xl rounded-xl2 border border-gold/40 bg-paper p-8 text-center shadow-soft">
          <h2 id="news" className="h-display text-2xl font-semibold text-wine">Recebe ideias para surpreender</h2>
          <p className="mx-auto mt-2 max-w-md text-muted">Mensagens prontas para cada ocasião, dicas de presentes e novidades. Sem spam.</p>
          <div className="mx-auto mt-5 max-w-md text-left"><NewsletterForm source="home" /></div>
        </div>
      </section>

      <section className="section py-14" aria-labelledby="faq"><h2 id="faq" className="h-display mb-8 text-center text-3xl font-semibold text-wine">Perguntas frequentes</h2><Faq /></section>

      {/* CTA final */}
      <section className="section py-14">
        <div className="rounded-xl2 bg-wine px-6 py-14 text-center text-white">
          <h2 className="h-display mx-auto max-w-xl text-3xl font-semibold sm:text-4xl">A tua memória merece mais do que uma mensagem comum.</h2>
          <Link href="/criar" className="btn mt-8 bg-white text-wine hover:bg-cream">Criar agora</Link>
        </div>
      </section>
    </>
  );
}
