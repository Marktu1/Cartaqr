import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Termos de uso' };

export default function Termos() {
  return (
    <article className="section max-w-3xl space-y-4 py-12 leading-7 text-ink">
      <h1 className="h-display text-4xl font-semibold text-wine">Termos de uso</h1>
      <p className="text-sm text-muted">Modelo inicial. Deve ser revisto por um profissional jurídico antes de ir para produção.</p>
      <p>A Carta QR serve para criar presentes digitais afetuosos e respeitosos. Ao usares a plataforma, aceitas as regras abaixo.</p>
      <h2 className="h-display pt-4 text-2xl font-semibold text-wine">Conteúdos proibidos</h2>
      <ul className="list-disc space-y-2 pl-6">
        <li>Conteúdo ilegal de qualquer tipo.</li>
        <li>Imagens íntimas ou sexuais de alguém partilhadas sem o seu consentimento, e qualquer conteúdo sexual envolvendo menores.</li>
        <li>Assédio, ameaças, chantagem, perseguição ou pressão abusiva sobre outra pessoa.</li>
        <li>Conteúdo que viole direitos de terceiros (direitos de autor, imagem, privacidade).</li>
        <li>Uso abusivo da plataforma, incluindo tentativas de aceder a dados de outras pessoas ou de sobrecarregar o serviço.</li>
      </ul>
      <h2 className="h-display pt-4 text-2xl font-semibold text-wine">Autorização de conteúdos</h2>
      <p>Deves ter autorização para carregar fotografias, vídeos, áudios e músicas de terceiros. Não incluas música comercial sem licença. És responsável pelo conteúdo que carregas.</p>
      <h2 className="h-display pt-4 text-2xl font-semibold text-wine">Pagamento e publicação</h2>
      <p>O pagamento é manual. A carta só é publicada depois de a nossa equipa confirmar o pagamento. Enviar um comprovativo não significa que o pagamento está confirmado.</p>
      <h2 className="h-display pt-4 text-2xl font-semibold text-wine">Remoção e bloqueio</h2>
      <p>Podemos bloquear ou remover cartas que violem estes termos, sem aviso prévio nos casos graves. Cartas expiram no fim do período do plano.</p>
    </article>
  );
}
