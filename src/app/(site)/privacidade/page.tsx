import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Política de privacidade' };

export default function Privacidade() {
  return (
    <article className="section max-w-3xl space-y-4 py-12 leading-7 text-ink">
      <h1 className="h-display text-4xl font-semibold text-wine">Política de privacidade</h1>
      <p className="text-sm text-muted">Modelo inicial. Deve ser revisto por um profissional jurídico antes de ir para produção.</p>
      <h2 className="h-display pt-4 text-2xl font-semibold text-wine">Que dados tratamos</h2>
      <p>Para criar a experiência que encomendaste, a Carta QR pode tratar nomes, mensagens, fotografias, vídeos, áudios, datas e dados de contacto (email ou telefone/WhatsApp) e o comprovativo de pagamento.</p>
      <h2 className="h-display pt-4 text-2xl font-semibold text-wine">Para que usamos</h2>
      <p>Usamos estes dados apenas para criar, publicar e entregar a tua Carta QR, confirmar o pagamento e falar contigo sobre a encomenda. Não vendemos os teus dados. Se te inscreveres na newsletter, usamos o teu email também para te enviar ideias e novidades (ver abaixo).</p>
      <h2 className="h-display pt-4 text-2xl font-semibold text-wine">Quem pode ver a tua carta</h2>
      <p>As cartas são privadas por defeito. Só abre quem tiver o link (longo e aleatório) e, se ativares, o PIN. As páginas não são indexadas por motores de pesquisa. O teu email e telefone nunca aparecem na carta pública.</p>
      <h2 className="h-display pt-4 text-2xl font-semibold text-wine">Newsletter</h2>
      <p>Só guardamos o teu email na newsletter se o indicares e marcares a caixa de consentimento. Usamo-lo apenas para comunicações da Carta QR e não o partilhamos. Podes sair a qualquer momento pelo link no fim de cada email ou pedindo-nos a eliminação. O pop-up guarda no teu navegador apenas a indicação de que já o viste.</p>
      <h2 className="h-display pt-4 text-2xl font-semibold text-wine">Ferramentas de IA</h2>
      <p>Se usares “Ajudar-me a escrever com IA”, o texto e as memórias que escreveste são enviados a um fornecedor de IA apenas para gerar o rascunho. Não enviamos os teus contactos nem o comprovativo. O uso da IA é opcional.</p>
      <h2 className="h-display pt-4 text-2xl font-semibold text-wine">Quanto tempo guardamos</h2>
      <p>Guardamos a carta durante o período do plano escolhido. Depois de expirar, os ficheiros são removidos. Podes pedir a eliminação antecipada da carta e de todos os ficheiros a qualquer momento, através do WhatsApp ou da página de contacto.</p>
      <h2 className="h-display pt-4 text-2xl font-semibold text-wine">Conteúdos de terceiros</h2>
      <p>Ao carregares fotografias, vídeos, áudios ou músicas, declaras que tens autorização das pessoas que aparecem e dos titulares dos direitos.</p>
      <h2 className="h-display pt-4 text-2xl font-semibold text-wine">Os teus direitos</h2>
      <p>Podes pedir acesso, correção ou eliminação dos teus dados contactando-nos pela página de contacto.</p>
    </article>
  );
}
