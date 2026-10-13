# Graph Report - wt  (2026-10-13)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 800 nodes · 2636 edges · 35 communities (27 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8606aa4f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Encomendas e base de dados
- API pública e segurança
- Assistente de criação (wizard)
- Montagem da carta pública e exemplos
- QR, cartões PDF e ficheiros
- Painel admin e login
- Carta com magia (ecrã)
- Layout do site e proteção (CSP)
- Validação e IA de mensagens
- Formulários protegidos anti-robô
- Landing e preços
- Surpresas da carta
- Config TypeScript
- Dependências
- Experiências Pedido e Família
- Dependências (dev)
- Experiência Refinada e RSVP
- Formatação e mensagens admin
- Planos, temas e definições
- Configuração e sitemap
- Página do cliente (minha encomenda)
- Páginas de ocasiões
- Scripts npm
- Painel admin: resumo
- Raspadinha da data
- Auditoria
- Newsletter admin
- Config Next
- Tailwind
- Pacote
- Pacote
- Tipos CSS

## God Nodes (most connected - your core abstractions)
1. `run()` - 61 edges
2. `limit()` - 49 edges
3. `next` - 48 edges
4. `getCategory()` - 43 edges
5. `get()` - 41 edges
6. `handle()` - 41 edges
7. `LetterView()` - 39 edges
8. `fail()` - 38 edges
9. `ok()` - 35 edges
10. `react` - 33 edges

## Surprising Connections (you probably didn't know these)
- `deleteSubscriber()` --calls--> `run()`  [EXTRACTED]
  src/lib/newsletter.ts → src/lib/db.ts
- `resetRateLimits()` --calls--> `run()`  [EXTRACTED]
  src/lib/security.ts → src/lib/db.ts
- `LoginForm()` --indirect_call--> `loginAction()`  [INFERRED]
  src/app/admin/login/LoginForm.tsx → src/app/admin/actions.ts
- `contactSchema` --calls--> `normalizePhone()`  [EXTRACTED]
  src/lib/validation.ts → src/lib/format.ts
- `analyticsSummary()` --calls--> `g`  [EXTRACTED]
  src/lib/orders.ts → src/lib/db.ts

## Import Cycles
- None detected.

## Communities (35 total, 8 thin omitted)

### Community 0 - "Encomendas e base de dados"
Cohesion: 0.06
Nodes (88): bcryptjs, register(), hashPassword(), missingRequired(), get(), getDb(), run(), luandaToUtc() (+80 more)

### Community 1 - "API pública e segurança"
Cohesion: 0.11
Nodes (61): zod, loginAction(), GET(), POST(), POST(), POST(), POST(), GET() (+53 more)

### Community 2 - "Assistente de criação (wizard)"
Cohesion: 0.07
Nodes (56): metadata, Sair(), UnsubscribeButton(), send(), Block(), ExperienceEditor(), experienceErrors(), Lines() (+48 more)

### Community 3 - "Montagem da carta pública e exemplos"
Cohesion: 0.08
Nodes (44): AdminPreview(), metadata, POST(), POST(), CartaPage(), dynamic, metadata, Notice() (+36 more)

### Community 4 - "QR, cartões PDF e ficheiros"
Cohesion: 0.05
Nodes (45): main(), GET(), GET(), GET(), alt, contentType, size, Assets (+37 more)

### Community 5 - "Painel admin e login"
Cohesion: 0.09
Nodes (48): blockAction(), cancelAction(), completeAction(), confirmPaymentAction(), createDiscountAction(), ctx(), deleteContentsAction(), deleteDiscountAction() (+40 more)

### Community 6 - "Carta com magia (ecrã)"
Cohesion: 0.09
Nodes (32): CandleLayer(), CandleToggle(), MoodLayer(), burstFor(), BurstKind, CelebrationLayer(), P, PALETTES (+24 more)

### Community 7 - "Layout do site e proteção (CSP)"
Cohesion: 0.09
Nodes (19): next, metadata, viewport, Contacto(), metadata, dynamic, SiteLayout(), metadata (+11 more)

### Community 8 - "Validação e IA de mensagens"
Cohesion: 0.11
Nodes (22): AIProvider, AiUnavailableError, AnthropicProvider, MockProvider, provider(), runAi(), buildUserPrompt(), facts() (+14 more)

### Community 9 - "Formulários protegidos anti-robô"
Cohesion: 0.14
Nodes (16): react, LoginForm(), submit(), AdminLogin(), metadata, ContactForm(), Envelope(), Capsule() (+8 more)

### Community 10 - "Landing e preços"
Cohesion: 0.20
Nodes (15): lenis, delay(), Home(), PhoneMock(), Compare(), metadata, Precos(), Faq() (+7 more)

### Community 11 - "Surpresas da carta"
Cohesion: 0.18
Nodes (19): celebrate(), accentBtn, Finale(), FlipCards(), fmt(), GiftBox(), Hidden(), Later() (+11 more)

### Community 12 - "Config TypeScript"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, baseUrl, esModuleInterop, incremental, isolatedModules, jsx, lib (+11 more)

### Community 13 - "Dependências"
Cohesion: 0.11
Nodes (19): dependencies, @anthropic-ai/sdk, autoprefixer, bcryptjs, lenis, next, pdf-lib, postcss (+11 more)

### Community 14 - "Experiências Pedido e Família"
Cohesion: 0.22
Nodes (12): AmbientPlayer(), start(), stop(), AMBIENT_LABEL, Familia(), rot(), AMBIENT_LABEL, Heart() (+4 more)

### Community 15 - "Dependências (dev)"
Cohesion: 0.12
Nodes (16): name, private, version, @anthropic-ai/sdk, autoprefixer, pdf-lib, postcss, qrcode (+8 more)

### Community 16 - "Experiência Refinada e RSVP"
Cohesion: 0.20
Nodes (14): AMBIENT_LABEL, ArchFrame(), Bow(), Bus(), Lace(), Refinado(), Sprig(), stroke (+6 more)

### Community 17 - "Formatação e mensagens admin"
Cohesion: 0.28
Nodes (11): Mensagens(), OrderDetail(), ConfirmButton(), P, Price(), describeReply(), formatDate(), formatLuanda() (+3 more)

### Community 18 - "Planos, temas e definições"
Cohesion: 0.26
Nodes (13): Settings(), Criar(), metadata, aiStatus(), all(), getEvents(), hasActiveDiscountCodes(), listDiscountCodes() (+5 more)

### Community 19 - "Configuração e sitemap"
Cohesion: 0.18
Nodes (7): dynamic, CATEGORIES, config, { DatabaseSync }, DB, g, Row

### Community 20 - "Página do cliente (minha encomenda)"
Cohesion: 0.23
Nodes (11): dynamic, FLOW, metadata, MinhaPage(), QrPanel(), copy(), share(), ResumeButton() (+3 more)

### Community 21 - "Páginas de ocasiões"
Cohesion: 0.20
Nodes (9): dynamic, OcasiaoPage(), CATEGORY_MAP, BY_CATEGORY, ExperienceId, ExperienceInfo, experienceOf(), EXPERIENCES (+1 more)

### Community 22 - "Scripts npm"
Cohesion: 0.25
Nodes (8): scripts, audit:security, build, dev, seed, start, test, test:e2e

### Community 23 - "Painel admin: resumo"
Cohesion: 0.39
Nodes (7): AdminHome(), STATUS_LABEL, analyticsSummary(), expireDue(), listOrders(), metrics(), ORDER_STATUSES

### Community 24 - "Raspadinha da data"
Cohesion: 0.53
Nodes (5): ScratchDate(), ScratchDisc(), check(), point(), scratch()

### Community 25 - "Auditoria"
Cohesion: 0.40
Nodes (3): bad, BUILD_ONLY, vulns

### Community 27 - "Newsletter admin"
Cohesion: 0.83
Nodes (3): NewsletterAdmin(), listSubscribers(), subscriberStats()

## Knowledge Gaps
- **9 isolated node(s):** `autoprefixer`, `postcss`, `tsx`, `@types/bcryptjs`, `@types/node` (+4 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 204 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Layout do site e proteção (CSP)` to `API pública e segurança`, `Assistente de criação (wizard)`, `Montagem da carta pública e exemplos`, `QR, cartões PDF e ficheiros`, `Painel admin e login`, `Carta com magia (ecrã)`, `Formulários protegidos anti-robô`, `Landing e preços`, `Dependências (dev)`, `Formatação e mensagens admin`, `Planos, temas e definições`, `Configuração e sitemap`, `Página do cliente (minha encomenda)`, `Páginas de ocasiões`, `Painel admin: resumo`?**
  _High betweenness centrality (0.181) - this node is a cross-community bridge._
- **What connects `autoprefixer`, `postcss`, `tsx` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Encomendas e base de dados` be split into smaller, more focused modules?**
  _Cohesion score 0.06293859649122807 - nodes in this community are weakly interconnected._
- **Why does `getCategory()` connect `Montagem da carta pública e exemplos` to `Encomendas e base de dados`, `API pública e segurança`, `Assistente de criação (wizard)`, `Carta com magia (ecrã)`, `Validação e IA de mensagens`, `Experiências Pedido e Família`, `Experiência Refinada e RSVP`, `Formatação e mensagens admin`, `Página do cliente (minha encomenda)`, `Painel admin: resumo`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Should `API pública e segurança` be split into smaller, more focused modules?**
  _Cohesion score 0.11321890996687745 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Formulários protegidos anti-robô` to `Assistente de criação (wizard)`, `Montagem da carta pública e exemplos`, `Carta com magia (ecrã)`, `Layout do site e proteção (CSP)`, `Landing e preços`, `Surpresas da carta`, `Experiências Pedido e Família`, `Dependências (dev)`, `Experiência Refinada e RSVP`, `Página do cliente (minha encomenda)`, `Raspadinha da data`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Should `Assistente de criação (wizard)` be split into smaller, more focused modules?**
  _Cohesion score 0.07291666666666667 - nodes in this community are weakly interconnected._