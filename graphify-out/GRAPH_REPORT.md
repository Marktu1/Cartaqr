# Graph Report - wt  (2026-10-14)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 860 nodes · 2820 edges · 33 communities (27 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0210f9c6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Encomendas, respostas e base de dados
- API pública e segurança
- Assistente de criação (wizard)
- Montagem da carta pública e PIN
- Segredos, ficheiros e QR
- Painel admin e newsletter
- Carta com magia (ecrã)
- Layout do site e páginas legais
- Validação, ocasiões e IA
- Experiências e formulários protegidos
- Landing e preços
- Surpresas da carta
- Config TypeScript
- Dependências
- card.ts
- art.ts
- Experiência Refinada e RSVP
- Formatação e mensagens admin
- Responses.tsx
- page.tsx
- page.tsx
- experiences.ts
- Motion.tsx
- layout.tsx
- Raspadinha da data
- Auditoria
- proxy.ts
- Config Next
- AmbientPlayer.tsx
- css.d.ts

## God Nodes (most connected - your core abstractions)
1. `run()` - 65 edges
2. `limit()` - 49 edges
3. `next` - 48 edges
4. `get()` - 46 edges
5. `getCategory()` - 43 edges
6. `handle()` - 41 edges
7. `LetterView()` - 39 edges
8. `fail()` - 38 edges
9. `all()` - 37 edges
10. `ok()` - 35 edges

## Surprising Connections (you probably didn't know these)
- `deleteSubscriber()` --calls--> `run()`  [EXTRACTED]
  src/lib/newsletter.ts → src/lib/db.ts
- `resetRateLimits()` --calls--> `run()`  [EXTRACTED]
  src/lib/security.ts → src/lib/db.ts
- `intParam()` --calls--> `AppError`  [EXTRACTED]
  src/lib/api.ts → src/lib/order-core.ts
- `orderFromToken()` --calls--> `AppError`  [EXTRACTED]
  src/lib/api.ts → src/lib/order-core.ts
- `demoExperience()` --calls--> `publicExperience`  [EXTRACTED]
  src/app/(site)/exemplos/[slug]/page.tsx → src/lib/experience.ts

## Import Cycles
- None detected.

## Communities (33 total, 6 thin omitted)

### Community 0 - "Encomendas, respostas e base de dados"
Cohesion: 0.06
Nodes (102): today(), TRACK_EVENTS, trackEvent(), trackLetterView(), viewStats(), missingRequired(), all(), { DatabaseSync } (+94 more)

### Community 1 - "API pública e segurança"
Cohesion: 0.08
Nodes (71): zod, GET(), POST(), POST(), Body, POST(), POST(), POST() (+63 more)

### Community 2 - "Assistente de criação (wizard)"
Cohesion: 0.06
Nodes (65): metadata, Sair(), UnsubscribeButton(), send(), Block(), ExperienceEditor(), experienceErrors(), Lines() (+57 more)

### Community 3 - "Montagem da carta pública e PIN"
Cohesion: 0.18
Nodes (12): AdminPreview(), metadata, CartaPage(), dynamic, metadata, Notice(), LockedCountdown(), PinGate() (+4 more)

### Community 4 - "Segredos, ficheiros e QR"
Cohesion: 0.05
Nodes (47): bcryptjs, main(), GET(), GET(), GET(), GET(), alt, contentType (+39 more)

### Community 5 - "Painel admin e newsletter"
Cohesion: 0.09
Nodes (45): react-dom, blockAction(), cancelAction(), completeAction(), confirmPaymentAction(), createDiscountAction(), ctx(), deleteContentsAction() (+37 more)

### Community 6 - "Carta com magia (ecrã)"
Cohesion: 0.09
Nodes (32): CandleLayer(), CandleToggle(), MoodLayer(), burstFor(), CelebrationLayer(), Intro(), ScratchDate(), Gallery() (+24 more)

### Community 7 - "Layout do site e páginas legais"
Cohesion: 0.13
Nodes (14): next, Contacto(), metadata, dynamic, SiteLayout(), metadata, metadata, ContactForm() (+6 more)

### Community 8 - "Validação, ocasiões e IA"
Cohesion: 0.07
Nodes (33): dynamic, AIProvider, aiStatus(), AiUnavailableError, AnthropicProvider, MockProvider, provider(), runAi() (+25 more)

### Community 9 - "Experiências e formulários protegidos"
Cohesion: 0.22
Nodes (9): react, AMBIENT_LABEL, Heart(), Pedido(), ReplyForm(), RsvpForm(), fetchToken(), Tok (+1 more)

### Community 10 - "Landing e preços"
Cohesion: 0.25
Nodes (12): delay(), Home(), PhoneMock(), Compare(), metadata, Precos(), Faq(), FAQ_ITEMS (+4 more)

### Community 11 - "Surpresas da carta"
Cohesion: 0.23
Nodes (16): celebrate(), accentBtn, Finale(), fmt(), GiftBox(), Hidden(), Later(), post() (+8 more)

### Community 12 - "Config TypeScript"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, baseUrl, esModuleInterop, incremental, isolatedModules, jsx, lib (+11 more)

### Community 13 - "Dependências"
Cohesion: 0.04
Nodes (47): dependencies, @anthropic-ai/sdk, autoprefixer, bcryptjs, lenis, next, pdf-lib, postcss (+39 more)

### Community 14 - "card.ts"
Cohesion: 0.19
Nodes (16): pdf-lib, Assets, buildCardPdf(), CardInput, CardSize, center(), CREAM, frame() (+8 more)

### Community 15 - "art.ts"
Cohesion: 0.17
Nodes (11): dynamic, OcasiaoPage(), ART, artFor(), CATEGORY_ART, CATEGORIES, demoImage(), DemoLetter (+3 more)

### Community 16 - "Experiência Refinada e RSVP"
Cohesion: 0.17
Nodes (21): AMBIENT_LABEL, Familia(), rot(), AMBIENT_LABEL, ArchFrame(), Bow(), Bus(), Lace() (+13 more)

### Community 17 - "Formatação e mensagens admin"
Cohesion: 0.08
Nodes (31): Mensagens(), OrderDetail(), AdminHome(), Settings(), dynamic, FLOW, metadata, MinhaPage() (+23 more)

### Community 18 - "Responses.tsx"
Cohesion: 0.25
Nodes (9): BurstKind, P, PALETTES, Capsule(), save(), fmt(), post(), Reactions() (+1 more)

### Community 19 - "page.tsx"
Cohesion: 0.36
Nodes (5): demoExperience(), DemoPage(), ExperienceView(), LetterViewData, experienceIdOf()

### Community 20 - "page.tsx"
Cohesion: 0.32
Nodes (4): Criar(), metadata, hasActiveDiscountCodes(), listOccasions()

### Community 21 - "experiences.ts"
Cohesion: 0.33
Nodes (5): BY_CATEGORY, ExperienceId, ExperienceInfo, EXPERIENCES, MONTHS

### Community 22 - "Motion.tsx"
Cohesion: 0.60
Nodes (4): lenis, HeroVideo(), LandingMotion(), reduced()

### Community 24 - "Raspadinha da data"
Cohesion: 0.83
Nodes (4): ScratchDisc(), check(), point(), scratch()

### Community 25 - "Auditoria"
Cohesion: 0.40
Nodes (3): bad, BUILD_ONLY, vulns

### Community 27 - "proxy.ts"
Cohesion: 0.67
Nodes (3): config, csp(), proxy()

### Community 29 - "AmbientPlayer.tsx"
Cohesion: 1.00
Nodes (3): AmbientPlayer(), start(), stop()

## Knowledge Gaps
- **9 isolated node(s):** `autoprefixer`, `postcss`, `tsx`, `@types/bcryptjs`, `@types/node` (+4 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 234 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Layout do site e páginas legais` to `API pública e segurança`, `Assistente de criação (wizard)`, `Montagem da carta pública e PIN`, `Segredos, ficheiros e QR`, `Painel admin e newsletter`, `Carta com magia (ecrã)`, `Validação, ocasiões e IA`, `Landing e preços`, `Dependências`, `art.ts`, `Formatação e mensagens admin`, `page.tsx`, `page.tsx`, `layout.tsx`, `proxy.ts`?**
  _High betweenness centrality (0.187) - this node is a cross-community bridge._
- **What connects `autoprefixer`, `postcss`, `tsx` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Encomendas, respostas e base de dados` be split into smaller, more focused modules?**
  _Cohesion score 0.06262894193928677 - nodes in this community are weakly interconnected._
- **Why does `getCategory()` connect `Experiência Refinada e RSVP` to `Encomendas, respostas e base de dados`, `API pública e segurança`, `Assistente de criação (wizard)`, `Montagem da carta pública e PIN`, `Carta com magia (ecrã)`, `Validação, ocasiões e IA`, `Experiências e formulários protegidos`, `Formatação e mensagens admin`, `page.tsx`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Should `API pública e segurança` be split into smaller, more focused modules?**
  _Cohesion score 0.07773144286905755 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Experiências e formulários protegidos` to `Assistente de criação (wizard)`, `Montagem da carta pública e PIN`, `Painel admin e newsletter`, `Carta com magia (ecrã)`, `Layout do site e páginas legais`, `Landing e preços`, `Surpresas da carta`, `Dependências`, `Experiência Refinada e RSVP`, `Formatação e mensagens admin`, `Responses.tsx`, `Motion.tsx`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Should `Assistente de criação (wizard)` be split into smaller, more focused modules?**
  _Cohesion score 0.061458718992965566 - nodes in this community are weakly interconnected._