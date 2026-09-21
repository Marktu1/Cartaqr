export const FAQ_ITEMS = [
  { q: 'Preciso de instalar alguma aplicação?', a: 'Não. A Carta QR abre no navegador do telemóvel, tanto para quem cria como para quem recebe. Basta o link ou ler o QR Code com a câmara.' },
  { q: 'Como recebo o QR Code?', a: 'Depois de confirmarmos o teu pagamento e publicarmos a carta, o QR Code fica disponível na página da tua encomenda. Podes descarregá-lo, imprimir um cartão ou partilhar por WhatsApp.' },
  { q: 'Por quanto tempo a página fica disponível?', a: 'Depende do plano: de 90 a 365 dias. Depois desse período a página expira e os ficheiros são removidos. O prazo aparece antes de pagares.' },
  { q: 'Posso editar a mensagem?', a: 'Sim, sempre antes de submeteres o pagamento. Depois, pede-nos alterações pelo WhatsApp e a nossa equipa faz a atualização.' },
  { q: 'Os meus conteúdos ficam públicos?', a: 'Não. A carta só abre com o teu link privado (longo e impossível de adivinhar) e não aparece nos motores de pesquisa. Podes ainda proteger com um PIN.' },
  { q: 'Como faço o pagamento?', a: 'O pagamento é manual: fazes a transferência para os dados que indicamos, envias o comprovativo e a nossa equipa confirma. Só depois a carta é publicada.' },
  { q: 'Posso pedir alterações?', a: 'Sim. Fala connosco pelo WhatsApp indicando o código da tua encomenda.' },
  { q: 'Posso eliminar a página?', a: 'Sim, a qualquer momento. Pede-nos a eliminação e removemos a carta e todos os ficheiros associados.' },
];
export function Faq() {
  return (
    <div className="mx-auto max-w-3xl divide-y divide-wine/10 rounded-xl2 border border-wine/10 bg-paper">
      {FAQ_ITEMS.map(f => (
        <details key={f.q} className="group p-5">
          <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink">
            {f.q}<span className="text-xl text-gold-deep transition group-open:rotate-45" aria-hidden>+</span>
          </summary>
          <p className="mt-2 text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
