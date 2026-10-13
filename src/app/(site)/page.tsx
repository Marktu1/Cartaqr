import Link from 'next/link';
import type { CSSProperties } from 'react';
import { listPlans } from '@/lib/orders';
import { DEMOS, demoImage } from '@/lib/demo';
import { qrSvg } from '@/lib/qr';
import { config } from '@/lib/config';
import { PlanCards } from '@/components/PlanCards';
import { Faq } from '@/components/Faq';
import { NewsletterForm } from '@/components/NewsletterForm';
import { Track } from '@/components/Track';
import { CATEGORIES } from '@/lib/categories';
import { EXPERIENCES } from '@/lib/experiences';
import { formatMoney } from '@/lib/format';
import { LandingMotion, HeroVideo } from '@/components/landing/Motion';

const delay = (i: number) => ({ '--rv-delay': `${i * 0.08}s` }) as CSSProperties;

/** Telemóvel com uma carta de exemplo, o "produto" em destaque, como nas páginas da Apple. */
function PhoneMock({ qr }: { qr: string }) {
  return (
    <div className="relative mx-auto w-[270px] sm:w-[300px]" aria-hidden>
      <div className="rounded-[48px] bg-night p-[10px] shadow-[0_40px_80px_-30px_rgba(58,13,28,.55)]">
        <div className="relative overflow-hidden rounded-[38px] bg-white">
          <div className="absolute left-1/2 top-2.5 z-10 h-[22px] w-[86px] -translate-x-1/2 rounded-full bg-night" />
          <div className="relative flex h-[300px] flex-col items-center justify-end overflow-hidden bg-[radial-gradient(120%_90%_at_30%_10%,#C2664A_0%,#7A1F38_45%,#3A0D1C_100%)] pb-7 text-center sm:h-[330px]">
            <div className="absolute -right-10 top-10 h-40 w-40 rounded-full bg-gold/25 blur-2xl" />
            <div className="absolute -left-8 top-24 h-32 w-32 rounded-full bg-rose/20 blur-2xl" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#E9CF94,#C9A45C_55%,#94722D)] text-2xl text-wine-dark shadow-[0_6px_18px_rgba(0,0,0,.35)]">♡</div>
            <p className="relative mt-4 text-[10px] font-semibold uppercase tracking-[.28em] text-white/75">Para Ana</p>
            <p className="h-display relative mt-1 px-6 text-[22px] font-semibold leading-tight text-white">Para a minha pessoa favorita</p>
          </div>
          <div className="px-6 pb-7 pt-5 text-center">
            <div className="mx-auto h-1.5 w-11/12 rounded-full bg-mist" />
            <div className="mx-auto mt-2 h-1.5 w-4/5 rounded-full bg-mist" />
            <div className="mx-auto mt-2 h-1.5 w-2/3 rounded-full bg-mist" />
            <div className="mt-6 rounded-full bg-wine py-2.5 text-[13px] font-medium text-white">Abrir a minha carta</div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-14 -right-8 w-[128px] rotate-[7deg] rounded-[22px] bg-white/85 p-3 text-center shadow-[0_24px_48px_-20px_rgba(0,0,0,.35)] backdrop-blur-xl sm:-right-24 sm:w-[170px]">
        <div className="mx-auto h-[96px] w-[96px] sm:h-[130px] sm:w-[130px]" dangerouslySetInnerHTML={{ __html: qr }} />
        <p className="mt-1 text-[11px] font-medium leading-snug text-ink">Lê o código e abre a surpresa</p>
      </div>
    </div>
  );
}

export default async function Home() {
  const plans = listPlans(true, 'carta'); const eventPlans = listPlans(true, 'evento');
  const minLetter = plans.length ? Math.min(...plans.map(p => p.effective_price)) : 0;
  const minEvent = eventPlans.length ? Math.min(...eventPlans.map(p => p.effective_price)) : 0;
  const letterCats = CATEGORIES.filter(c => c.kind === 'carta' && c.slug !== 'outra'); const eventCats = CATEGORIES.filter(c => c.kind === 'evento');
  const demoQr = await qrSvg(`${config.appUrl}/exemplos/${DEMOS[0].slug}`);
  return (
    <>
      <Track name="landing_view" />

      {/* Hero: um produto, uma frase, dois botões */}
      <section className="overflow-hidden bg-white pb-24 pt-14 text-center sm:pt-20">
        <div className="wrap fade-up">
          <p className="t-eyebrow text-gold-deep">Carta QR</p>
          <h1 className="t-hero mx-auto mt-2 max-w-[14ch] text-ink">Uma carta que fica para sempre.</h1>
          <p className="t-sub mx-auto mt-4 max-w-[34ch] text-muted">Fotografias, palavras e memórias num presente digital, com link privado e QR Code.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/criar" className="btn btn-primary">Criar a minha carta</Link>
            <a href="#exemplos" className="btn btn-secondary">Ver exemplos</a>
          </div>
          <p className="mt-5 text-[13px] text-muted">Sem instalar nada · Pagamento por transferência · Confirmação por WhatsApp</p>
        </div>
        <div className="relative mt-16" data-rv>
          <div className="pointer-events-none absolute inset-x-0 top-10 mx-auto h-[420px] max-w-[760px] rounded-full bg-[radial-gradient(closest-side,rgba(227,198,204,.7),rgba(255,255,255,0))]" aria-hidden />
          <PhoneMock qr={demoQr} />
        </div>
      </section>

      {/* Como funciona */}
      <section className="bg-mist py-24" aria-labelledby="como">
        <div className="wrap">
          <h2 id="como" className="t-section text-center text-ink" data-rv>Como funciona.</h2>
          <p className="t-lead mx-auto mt-3 max-w-[34ch] text-center text-muted" data-rv>Quatro passos, poucos minutos, direto no telemóvel.</p>
          <ol className="mt-14 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {['Escolhe a ocasião', 'Personaliza a mensagem e adiciona memórias', 'Recebe o teu link e QR Code', 'Partilha ou coloca o QR Code num presente'].map((t, i) => (
              <li key={t} className="rounded-[22px] bg-white p-5 sm:p-7" data-rv style={delay(i)}>
                <span className="t-tile block text-gold-deep">{i + 1}</span>
                <p className="mt-6 text-[15px] font-semibold leading-snug text-ink sm:text-[17px]">{t}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Experiências: cada momento tem o seu próprio mundo */}
      <section id="experiencias" className="scroll-mt-12 bg-white pt-24" aria-labelledby="exp-t">
        <div className="wrap-wide">
          <h2 id="exp-t" className="t-section text-center text-ink" data-rv>Cada momento, o seu próprio mundo.</h2>
          <p className="t-lead mx-auto mt-3 max-w-[44ch] text-center text-muted" data-rv>Não é um modelo com cores diferentes: cada ocasião tem o seu visual, o seu ritmo e a sua animação.</p>
          <div className="mt-12 grid gap-3 md:grid-cols-3">
            {([
              { id: 'refinado', title: 'O convite de casamento', bg: 'linear-gradient(160deg,#43141F,#6B2536)', fg: '#F6E9EC', cta: 'Ver o convite' },
              { id: 'pedido', title: 'O pedido de namoro', bg: 'linear-gradient(160deg,#12080D,#3A1424)', fg: '#F7EAEC', cta: 'Ver a pergunta' },
              { id: 'familia', title: 'A carta para a mãe', bg: 'linear-gradient(160deg,#F4E6CB,#E9C9A4)', fg: '#3A271C', cta: 'Ver o álbum' },
            ] as const).map((e, i) => (
              <Link key={e.id} href={`/exemplos/${EXPERIENCES[e.id].demo}`} data-rv style={{ ...delay(i), background: e.bg, color: e.fg }}
                className="group flex min-h-[320px] flex-col justify-between rounded-[26px] p-7 transition-transform duration-500 [transition-timing-function:var(--ease-apple)] hover:scale-[1.015]">
                <span className="text-[12px] font-semibold uppercase tracking-[.22em] opacity-70">{EXPERIENCES[e.id].name}</span>
                <span><span className="block text-[30px] font-semibold leading-tight">{e.title}</span>
                  <span className="mt-2 block text-[15px] leading-snug opacity-80">{EXPERIENCES[e.id].tagline}</span>
                  <span className="mt-5 inline-block rounded-full border border-current px-4 py-2 text-[13px] font-semibold">{e.cta} →</span></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Ocasiões */}
      <section id="ocasioes" className="scroll-mt-12 bg-white py-24" aria-labelledby="ocasioes-t">
        <div className="wrap">
          <h2 id="ocasioes-t" className="t-section text-center text-ink" data-rv>Uma carta para cada momento.</h2>
          <p className="t-lead mx-auto mt-3 max-w-[40ch] text-center text-muted" data-rv>Cada ocasião tem perguntas, estilo e texto próprios.</p>
          <div className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {letterCats.map((c, i) => (
              <Link key={c.slug} href={`/ocasioes/${c.slug}`} data-rv style={delay(i % 4)}
                className="group rounded-[22px] bg-mist p-5 transition-transform duration-500 [transition-timing-function:var(--ease-apple)] hover:scale-[1.02] sm:p-6">
                <span className="block text-[28px] leading-none text-wine" aria-hidden>{c.glyph}</span>
                <p className="mt-8 text-[17px] font-semibold text-ink">{c.name}</p>
                <p className="mt-0.5 text-[14px] leading-snug text-muted">{c.short}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Duas linhas de produto lado a lado, como a grelha de promoções da Apple */}
      <section className="bg-white pb-3" aria-label="Cartas e eventos">
        <div className="wrap-wide grid gap-3 lg:grid-cols-2">
          <div className="flex min-h-[580px] flex-col items-center overflow-hidden rounded-[28px] bg-mist px-6 pt-14 text-center" data-rv>
            <p className="t-eyebrow text-gold-deep">Cartas</p>
            <h2 className="t-tile mt-1 text-ink">Palavras que ficam.</h2>
            <p className="t-lead mt-2 text-muted">{minLetter ? `A partir de ${formatMoney(minLetter, 'Kz')}.` : 'Para quem é especial.'}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/criar" className="btn btn-primary">Criar carta</Link>
              <Link href="/precos" className="btn btn-secondary">Ver planos</Link>
            </div>
            <div className="relative mt-auto flex w-full max-w-[420px] justify-center pt-12" aria-hidden>
              <div className="w-[240px] translate-y-6 rounded-t-[28px] bg-white p-6 shadow-[0_20px_50px_-24px_rgba(58,13,28,.35)]">
                <div className="mx-auto h-[150px] w-[150px]" dangerouslySetInnerHTML={{ __html: demoQr }} />
                <p className="h-display mt-3 text-[17px] font-semibold text-wine">Carta QR</p>
                <p className="text-[11px] uppercase tracking-[.2em] text-muted">Lê para abrir</p>
              </div>
            </div>
          </div>

          <div id="eventos" className="flex min-h-[580px] scroll-mt-14 flex-col items-center rounded-[28px] bg-night px-6 pb-12 pt-14 text-center text-white" data-rv style={delay(1)}>
            <p className="t-eyebrow text-gold">Novo · Eventos</p>
            <h2 className="t-tile mx-auto mt-1 max-w-[18ch]">Convites com confirmação de presença.</h2>
            <p className="t-lead mx-auto mt-2 max-w-[36ch] text-white/70">Os convidados veem o local e o programa e confirmam no telemóvel.{minEvent ? ` A partir de ${formatMoney(minEvent, 'Kz')}.` : ''}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/precos#eventos" className="btn btn-light">Ver pacotes</Link>
              <Link href={`/exemplos/convite-casamento`} className="btn btn-outline-light">Ver um convite</Link>
            </div>
            <div className="mt-auto grid w-full max-w-[460px] grid-cols-2 gap-2 pt-12">
              {eventCats.map(c => (
                <Link key={c.slug} href={`/ocasioes/${c.slug}`} className="rounded-[18px] bg-white/[.07] p-4 text-left transition-colors hover:bg-white/[.12]">
                  <span className="text-xl text-gold" aria-hidden>{c.glyph}</span>
                  <p className="mt-3 text-[15px] font-semibold leading-tight">{c.name}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Exemplos */}
      <section id="exemplos" className="scroll-mt-12 bg-white py-24" aria-labelledby="exemplos-t">
        <div className="wrap">
          <h2 id="exemplos-t" className="t-section text-center text-ink" data-rv>Vê como fica.</h2>
          <p className="t-lead mx-auto mt-3 max-w-[40ch] text-center text-muted" data-rv>Exemplos com dados fictícios. Toca para abrir como quem recebe.</p>
        </div>
        <div className="mx-auto mt-14 flex max-w-[1240px] snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 [scrollbar-width:none] sm:px-6 md:grid md:grid-cols-2 md:overflow-visible lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
          {DEMOS.map((d, i) => (
            <Link key={d.slug} href={`/exemplos/${d.slug}`} data-rv style={delay(i)}
              className="group w-[78%] shrink-0 snap-center overflow-hidden rounded-[22px] bg-mist md:w-auto">
              <div className="overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={demoImage(d.photos[0], d.title, 600, 480)} alt={`Imagem de demonstração para o exemplo “${d.title}”`} className="aspect-[5/4] w-full object-cover transition-transform duration-700 [transition-timing-function:var(--ease-apple)] group-hover:scale-[1.04]" loading="lazy" />
              </div>
              <div className="p-6">
                <p className="text-[12px] font-semibold uppercase tracking-[.08em] text-gold-deep">{d.occasion}</p>
                <p className="mt-1.5 text-[19px] font-semibold leading-snug text-ink">{d.title}</p>
                <p className="mt-1 text-[14px] text-muted">{d.blurb}</p>
                <span className="link-more mt-4 text-[15px]">Ver exemplo</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Benefícios */}
      <section className="bg-mist py-24" aria-labelledby="beneficios">
        <div className="wrap">
          <h2 id="beneficios" className="t-section mx-auto max-w-[22ch] text-center text-ink" data-rv>Simples para ti.<br /> Inesquecível para quem recebe.</h2>
          <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[['Personalização', 'Cores, estilo, fotos e palavras à tua maneira.'], ['Criação rápida', 'Em poucos minutos, direto no telemóvel.'], ['Link privado', 'Só abre para quem tiver o teu link (e o PIN, se quiseres).'],
              ['QR Code pronto', 'Descarrega, imprime um cartão ou envia por WhatsApp.'], ['Feito para telemóvel', 'Leve, rápido e sem instalar aplicações.'], ['Fotos, vídeo, áudio e música', 'Inclui os ficheiros e a música que tu escolheres (com direitos de uso).']].map(([t, d], i) => (
              <div key={t} className="rounded-[22px] bg-white p-7" data-rv style={delay(i % 3)}>
                <p className="text-[21px] font-semibold leading-tight text-ink">{t}</p>
                <p className="mt-2 text-[17px] leading-snug text-muted">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preços */}
      <section className="bg-white py-24" aria-labelledby="precos">
        <div className="wrap">
          <h2 id="precos" className="t-section text-center text-ink" data-rv>Escolhe o teu plano.</h2>
          <p className="t-lead mx-auto mt-3 max-w-[40ch] text-center text-muted" data-rv>Pagas uma vez. Sem subscrições.</p>
          <div className="mt-14"><PlanCards plans={plans} /></div>
          <p className="mt-8 text-center text-[15px] text-muted">Para convites de evento, vê os <Link href="/precos#eventos" className="text-wine hover:underline">pacotes de Eventos ›</Link></p>
        </div>
      </section>

      {/* Perguntas frequentes */}
      <section className="bg-mist py-24" aria-labelledby="faq">
        <div className="wrap">
          <h2 id="faq" className="t-section mb-12 text-center text-ink" data-rv>Perguntas frequentes.</h2>
          <Faq />
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-white pt-24" aria-labelledby="news">
        <div className="wrap max-w-[640px] text-center" data-rv>
          <h2 id="news" className="t-tile text-ink">Ideias para surpreender.</h2>
          <p className="t-lead mt-2 text-muted">Mensagens prontas para cada ocasião, dicas de presentes e novidades. Sem spam.</p>
          <div className="mx-auto mt-6 max-w-md text-left"><NewsletterForm source="home" /></div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-white py-24">
        <div className="wrap-wide">
          <div className="rounded-[28px] bg-[radial-gradient(120%_120%_at_50%_0%,#7A1F38_0%,#521328_45%,#2A0913_100%)] px-6 py-24 text-center text-white" data-rv>
            <h2 className="t-section mx-auto max-w-[20ch]">A tua memória merece mais do que uma mensagem comum.</h2>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/criar" className="btn btn-light">Criar agora</Link>
              <Link href="/precos" className="btn btn-outline-light">Ver preços</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
