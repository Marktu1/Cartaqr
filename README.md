# Carta QR

Web app mobile-first em português para criar cartas digitais personalizadas (texto, fotos, vídeo, áudio) e entregá-las por **link privado + QR Code**. Pagamento **manual**, confirmado pelo administrador (sem gateway).

## Estado do MVP

| Área | Estado |
|---|---|
| Landing, preços, contacto, privacidade, termos, 3 exemplos fictícios | Real |
| Wizard de 8 etapas com progresso, voltar sem perder dados, retomar por link | Real |
| Uploads (fotos, capa, vídeo, áudio, música) com validação por conteúdo e limites por plano | Real |
| IA de escrita (rascunho editável) | **Real com Anthropic** (precisa de chave); `mock` para demonstração; sem chave → escrita manual |
| Ambiente sonoro (piano, chuva, ondas) | Real (gerado no navegador, sem direitos de autor) |
| Biblioteca de músicas livres de direitos | **Não existe** (opção visível como “Em breve”) |
| Pagamento | Manual + WhatsApp (link `wa.me`). **Sem envio automático de mensagens** |
| Carta pública `/carta/<token>`, PIN, expiração, bloqueio, respostas | Real |
| QR Code PNG/SVG, cartão imprimível, partilha | Real |
| Painel admin (encomendas, comprovativo, confirmar/rejeitar, publicar, bloquear, PIN, expiração, planos, ocasiões, configurações, métricas, registos) | Real |
| Base de dados / storage | **SQLite + disco local** (ver “Limitações”) |

## Instalação

Requisitos: **Node 22.13 ou superior** (usa `node:sqlite`).

```bash
npm install
cp .env.example .env.local        # edita os valores (ver abaixo)
npm run seed                      # opcional: a app também faz isto no primeiro arranque
npm run dev                       # http://localhost:3000
```

Painel: `/admin` (email e password definidos em `ADMIN_EMAIL` / `ADMIN_PASSWORD` antes do seed; mínimo 10 caracteres).

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `APP_URL` | URL público (usado nos QR Codes). Ex.: `https://cartaqr.ao` |
| `DATA_DIR` | Pasta para a base de dados e ficheiros. Tem de ser **persistente** e **privada** |
| `SESSION_SECRET` | Segredo longo e aleatório (32+ chars). Assina sessões, URLs de ficheiros e cookies de PIN. Obrigatório em produção |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Administrador criado pelo seed |
| `AI_PROVIDER` | `anthropic`, `mock` ou `none` |
| `ANTHROPIC_API_KEY`, `AI_MODEL` | Chave e modelo (só no servidor, nunca no frontend) |
| `CRON_SECRET` | Protege `/api/cron/expire` |

## Configurar a IA

1. Cria uma chave em console.anthropic.com e define `AI_PROVIDER=anthropic`, `ANTHROPIC_API_KEY=...` e `AI_MODEL` (um modelo Claude disponível na tua conta).
2. Reinicia a app. O botão “Ajudar-me a escrever com IA” passa a gerar rascunhos.
3. Os prompts (em português) estão em `src/lib/ai/prompts.ts`. Para outro fornecedor, implementa a interface `AIProvider` em `src/lib/ai/index.ts` e escolhe-o em `provider()`.
4. Sem chave ou com falha do serviço, o utilizador vê uma mensagem útil e escreve manualmente. Nunca bloqueia.

## Alterar preços, WhatsApp e pagamentos

Tudo no painel, sem mexer em código: **Admin → Configurações**.
- WhatsApp (com indicativo, ex.: `244923456789`), moeda, instruções e conta de pagamento (IBAN, Multicaixa Express…).
- Limites de upload (MB) e expiração por defeito.
- Planos: nome, preço, moeda, limites de fotos/vídeos/áudios, dias de disponibilidade, benefícios e ativo/inativo.
- Ocasiões: nome, descrição, estilo por defeito, ativa/inativa.

Os valores iniciais são **exemplos** editáveis em Admin → Configurações: cartas 4 500 / 8 500 / 14 000 Kz e pacotes de Eventos 25 000 / 45 000 / 80 000 Kz (100 / 300 / 1 000 convidados). Número de WhatsApp e IBAN também: altera antes de publicar.

## Fluxo operacional

1. Cliente conclui o wizard → `payment_pending`.
2. Cliente envia comprovativo → `proof_submitted` (**não** é pagamento confirmado).
3. Admin abre a encomenda, vê o comprovativo e **Confirma** (→ `payment_confirmed`) ou **Rejeita** (volta a `payment_pending`).
4. Admin **Publica** (→ `published`, define `expires_at` pelo plano). Só é possível após confirmação.
5. Cliente descarrega o QR Code em `/minha/<token>`.
6. A carta expira sozinha (verificada em cada acesso e por `GET /api/cron/expire` com `Authorization: Bearer $CRON_SECRET`, ex. de hora a hora).

## Deploy

A app usa disco e SQLite, por isso precisa de **um servidor com volume persistente** (VPS, Fly.io, Railway com volume, Docker). **Não funciona em serverless sem disco persistente** (ex.: Vercel).

Docker (não testado neste ambiente):
```bash
docker build -t carta-qr .
docker run -d -p 3000:3000 -v cartaqr-data:/data \
  -e APP_URL=https://o-teu-dominio -e SESSION_SECRET=... -e AI_PROVIDER=anthropic -e ANTHROPIC_API_KEY=... \
  -e ADMIN_EMAIL=... -e ADMIN_PASSWORD=... -e CRON_SECRET=... carta-qr
```
No primeiro arranque a app cria sozinha os planos, as ocasiões e o administrador (`ADMIN_EMAIL`/`ADMIN_PASSWORD`).
```bash
```
Sem Docker: `npm run build && npm start` atrás de um proxy HTTPS (Caddy/Nginx). **Usa HTTPS**: os cookies de sessão só são `secure` em produção. Faz cópias de segurança regulares da pasta `DATA_DIR`.

## Limitações conhecidas

- **Supabase/Postgres/S3 não estão ligados.** O acesso a dados está isolado em `src/lib/db.ts` + `src/lib/orders.ts`, e o de ficheiros em `src/lib/storage.ts`. Para migrar, reimplementa essas funções; o schema equivalente é `src/lib/db.ts`.
- `node:sqlite` é marcado como experimental pelo Node (funciona, mas emite um aviso).
- Rate limiting é **em memória** (1 instância). Com várias instâncias usa Redis/Upstash.
- Uploads passam pelo servidor (limite prático ~50 MB por vídeo). Para vídeos maiores, usa URLs de upload direto para S3.
- Sem envio automático de WhatsApp/SMS/email: só links `wa.me` abertos pelo utilizador. Ponto de extensão: `src/lib/notifications.ts`.
- Vídeo não é transcodificado; formatos suportados: MP4, MOV, WebM.
- As páginas legais são modelos e devem ser revistas por um profissional.
- Vulnerabilidade `postcss` reportada pelo `npm audit` vem de uma dependência interna do Next.js usada só em tempo de build (não processa conteúdo de utilizadores).
- Cupões/referências, biblioteca de música e templates avançados: fora do MVP.

## Estrutura

```
src/app/            páginas (site, /carta, /admin) e rotas /api
src/components/     UI reutilizável (wizard, LetterView, QrPanel, …)
src/lib/            db, orders (regras de negócio), storage, ai/, qr, auth, security, settings, notifications
scripts/seed.ts     planos, ocasiões, administrador
tests/              testes de lógica, E2E HTTP e jornada no browser
```
Ver também `SECURITY.md` e `TESTING.md`.


## Fase 3: categorias, eventos e preços

- **17 categorias** (`src/lib/categories.ts`): 13 cartas (amor, aniversário, pedido de namoro, pedido de casamento, Dia dos Namorados, relação à distância, formatura, Dia da Mãe, Dia do Pai, homenagem familiar, amizade, despedida, outra) e 4 convites de evento (casamento, festa, batizado, evento de empresa). Cada uma define os campos do assistente, os textos, o estilo, o que a carta mostra, a instrução do cartão QR e as instruções à IA.
- **Pedidos** (namoro/casamento): a carta termina numa pergunta com botões; a resposta fica guardada e destacada em “A minha encomenda” e no admin (o texto vem sempre da configuração da carta, nunca do cliente).
- **Eventos**: pacotes próprios (Evento Básico/Premium/Exclusivo) com programa, local, mapa, contagem decrescente e **confirmação de presença (RSVP)** com limite de convidados, prazo, deduplicação por nome e exportação CSV. Um plano de cartas não pode ser usado num evento (e vice-versa): validado no servidor.
- **Analytics** sem dados pessoais: só contadores diários (visitas, preços, categorias, criador) + aberturas por carta. Funil e receita por tipo no painel admin.
- **Migração**: bases de dados existentes são atualizadas ao arrancar; os preços antigos só são substituídos se ainda não tiverem sido alterados por ti.
- Páginas novas: `/ocasioes/[slug]` (SEO por categoria), `/sitemap.xml`; `/precos` separa Cartas e Eventos.

## Marca e extras

- Logótipo em `public/logo-full.png` e `public/logo-mark.png` (fundo transparente); favicon em `src/app/icon.png`. Paleta alinhada com o logótipo: vinho `#521328`, dourado `#C9A45C` (texto dourado usa `gold-deep` `#94722D` para contraste), fundo `#FAF8F3`.
- Limite de tentativas agora **persistente** (tabela `rate_limits` em SQLite).
- **WhatsApp automático (opcional)**: define `WHATSAPP_TOKEN` e `WHATSAPP_PHONE_ID` (WhatsApp Cloud API) para avisar o admin quando chega um comprovativo e o cliente quando o pagamento é confirmado e a carta publicada. Sem estas variáveis só há links wa.me. Fora da janela de 24h a Meta exige templates aprovados. O registo guarda apenas um hash do número.

## Fase 4: newsletter, entrega agendada e cartão imprimível

- **Newsletter**: pop-up para visitantes novos (uma vez, após ~12 s, 45 % de scroll ou intenção de sair; só em início, preços e categorias; depois de fechar não volta durante 14 dias), formulário no rodapé e na página inicial. Exige consentimento, tem campo-armadilha anti-robôs e limite de pedidos. Os inscritos vêem-se em **Admin → Newsletter** e exportam-se em CSV (só ativos) para Mailchimp/Brevo/MailerLite. Página de saída: `/newsletter/sair/[token]` (cada inscrito tem um token; inclui-o nos emails que enviares). O pop-up desliga-se em Admin → Configurações. **Nota:** a app guarda os emails mas não envia campanhas; para isso usa um serviço de email marketing.
- **Entrega agendada**: no passo de pré-visualização o cliente escolhe data e hora (hora de Luanda). Antes disso o link mostra uma contagem decrescente sem revelar nada e abre sozinho à hora marcada; respostas/RSVP ficam bloqueados até lá.
- **Cartão imprimível (PDF)**: A6, cartão pequeno (9×5,5 cm) ou folha A4 com 4 cartões e linhas de corte, com logo, título, QR e frase da categoria. Disponível em “A minha encomenda” depois de publicada (`/api/orders/[token]/card?size=a6|mini|a4`).

## Promoções e descontos (Admin → Configurações)
- **Promoção com data de fim** (por plano): o "Preço" do plano é o preço *normal*, praticado depois da promoção; o preço promocional aparece com o normal riscado e a data de fim. Máx. 90 dias, termina sozinha, nunca há preços "de" inventados.
- **Códigos de desconto** (secção "Códigos de desconto"): % ou valor fixo, para tudo/cartas/eventos, validade e máx. de usos. O preço final nunca desce de 500 Kz; o uso só conta quando o pagamento é confirmado.
- Códigos não acumulam com promoção ativa (opção para permitir). Pode oferecer-se um código a quem se inscreve na newsletter.
- Tudo desligado por defeito.
