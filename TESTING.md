# Testes

## Automáticos

```bash
npm test                 # 31 testes de lógica (BD isolada em /tmp). Não precisa de servidor
```

Testes ponta a ponta HTTP (contra servidor de produção local, BD isolada):

```bash
npm run build
export DATA_DIR=/tmp/e2e-data SESSION_SECRET=e2e-secret-e2e-secret-e2e-secret-1234567 AI_PROVIDER=mock \
       APP_URL=http://localhost:3111 CRON_SECRET=e2e-cron ADMIN_EMAIL=admin@test.local ADMIN_PASSWORD='Password#12345'
node --import tsx scripts/seed.ts
npx next start -p 3111 &
npm run test:e2e         # 12 testes HTTP (eventos, RSVP, newsletter, cartão PDF, agendamento)
```
(Reinicia o servidor entre corridas: o rate limiting é em memória e o teste de IA esgota o limite.)

Jornada completa num telemóvel emulado (Playwright + leitura do QR Code):

```bash
npm i --no-save playwright-core jsqr pngjs
node tests/browser/journey.js     # usa http://localhost:3111 e o mesmo servidor
node tests/browser/journey-events.js  # convite de evento + RSVP + pedido de namoro (correr depois da anterior, mesma BD)
```

## Cobertura vs. checklist do pedido

| # | Cenário | Onde é verificado |
|---|---|---|
| 1 | Encomenda do início ao fim | logic 1, e2e 3, browser passos 1–11 |
| 2 | Escolher cada plano | logic 1 e 2 (3 planos e limites) |
| 3 | Upload de imagens válidas | logic 3, e2e 3, browser 6 |
| 4 | Rejeição de ficheiros inválidos | logic 4, e2e 3 (EXE, PHP, SVG, tamanho, tipo errado), browser 6 |
| 5 | IA: gerar e editar | logic 15, e2e 3, browser 5 |
| 6 | Falha/indisponibilidade da IA | logic 16 (erro controlado) + fluxo manual sempre disponível |
| 7 | Submissão de comprovativo | logic 7, e2e 3, browser 8 |
| 8 | Confirmação administrativa | logic 7, browser 9 (UI real) |
| 9 | Publicação e abertura pelo link | e2e 3, browser 9 e 11 |
| 10 | Geração e leitura do QR | logic 17, e2e 3, browser 10 (descodifica o PNG com jsQR) |
| 11 | Proteção por PIN | logic 8, e2e 3, browser 11 |
| 12 | Expiração | logic 9, e2e 4 |
| 13 | Eliminação | logic 11 |
| 14 | Acesso não autorizado ao painel | e2e 6 (páginas, comprovativos, cron, cookie forjado), browser 9 |
| 15 | Visualização em telemóvel | browser (Pixel 5 / iPhone 12; sem scroll horizontal) |
| 16 | Página sem media | ver manual abaixo |
| 17 | Página com muitos media | ver manual abaixo |
| 18 | Falha temporária da IA | logic 16 e mensagem no wizard |

## Checklist manual (antes de cada lançamento)
- [ ] Página sem fotos/vídeo/áudio: criar encomenda só com texto, publicar, abrir (esperado: capa neutra + carta).
- [ ] Página com muitas fotos (30, plano Premium) + vídeo: abrir num Android real com dados móveis; verificar tempo de carga e scroll.
- [ ] Vídeo e áudio reproduzem em Android (Chrome) e iPhone (Safari); o ambiente sonoro só toca após toque.
- [ ] Ler o QR impresso com a câmara de 2 telemóveis diferentes.
- [ ] “Partilhar…” e “Imprimir cartão” no telemóvel.
- [ ] Pré-visualização de link no WhatsApp: não revela nomes nem títulos.
- [ ] Definir uma chave real de IA e gerar uma carta; confirmar que não inventa factos.
- [ ] Alterar preço, WhatsApp e conta no painel e confirmar que aparecem no site e no pagamento.
- [ ] Teclado: percorrer o wizard só com Tab/Enter/Espaço.
- [ ] Leitor de ecrã: campos com label e erros anunciados.

Jornada de marketing (pop-up, agendamento, cartões): `PREP=$(node --import tsx tests/browser/prep-marketing.ts | sed -n 's/^PREP=//p') node tests/browser/journey-marketing.js` (servidor em :3111 com o mesmo DATA_DIR; usa `pdftoppm` para ler o QR dos PDFs).

## Fase 5 — promoções e códigos de desconto
- Lógica: `npm test` (34 testes; D1–D3 cobrem promoção com fim, códigos, preço mínimo, não acumulação).
- HTTP: `npm run test:e2e` (13 testes; inclui `/api/orders/[token]/discount` e o preço riscado só com promoção ativa).
- Browser: `node tests/browser/journey-discount.js` (servidor em :3111 com BD limpa): admin cria promoção/código, /precos, pagamento com código, pop-up com código.
