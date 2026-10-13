# Graph Report - cartaqr  (2026-10-13)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 805 nodes · 2647 edges · 29 communities (23 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `22b40afa`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- orders.ts
- security.ts
- Wizard.tsx
- carta/[token]/page.tsx
- db.ts
- actions.ts
- LetterView.tsx
- next
- categories.ts
- react
- (site)/page.tsx
- Surprises.tsx
- Config TypeScript
- Dependências
- card.ts
- package.json
- Refinado.tsx
- getCategory
- Responses.tsx
- qr/route.ts
- Scripts npm
- Raspadinha da data
- Auditoria
- Config Next
- Tailwind
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
- `analyticsSummary()` --calls--> `g`  [EXTRACTED]
  src/lib/orders.ts → src/lib/db.ts
- `submit()` --calls--> `guard()`  [EXTRACTED]
  src/app/admin/login/LoginForm.tsx → src/app/admin/actions.ts

## Import Cycles
- None detected.

## Communities (29 total, 6 thin omitted)

### Community 0 - "orders.ts"
Cohesion: 0.07
Nodes (85): bcryptjs, register(), hashPassword(), CATEGORIES, missingRequired(), sanitizeExtra(), get(), getDb() (+77 more)

### Community 1 - "security.ts"
Cohesion: 0.10
Nodes (68): zod, loginAction(), GET(), POST(), POST(), POST(), POST(), POST() (+60 more)

### Community 2 - "Wizard.tsx"
Cohesion: 0.06
Nodes (65): metadata, Sair(), UnsubscribeButton(), send(), Block(), ExperienceEditor(), experienceErrors(), Lines() (+57 more)

### Community 3 - "carta/[token]/page.tsx"
Cohesion: 0.15
Nodes (17): AdminPreview(), metadata, CartaPage(), dynamic, metadata, Notice(), demoExperience(), DemoPage() (+9 more)

### Community 4 - "db.ts"
Cohesion: 0.06
Nodes (34): main(), GET(), alt, contentType, size, dynamic, config, { DatabaseSync } (+26 more)

### Community 5 - "actions.ts"
Cohesion: 0.09
Nodes (50): blockAction(), cancelAction(), completeAction(), confirmPaymentAction(), createDiscountAction(), ctx(), deleteContentsAction(), deleteDiscountAction() (+42 more)

### Community 6 - "LetterView.tsx"
Cohesion: 0.10
Nodes (27): CandleLayer(), CandleToggle(), MoodLayer(), Intro(), Gallery(), Memory, monthYear(), Photo (+19 more)

### Community 7 - "next"
Cohesion: 0.09
Nodes (20): next, metadata, viewport, Contacto(), metadata, dynamic, SiteLayout(), metadata (+12 more)

### Community 8 - "categories.ts"
Cohesion: 0.08
Nodes (29): AIProvider, AiUnavailableError, AnthropicProvider, MockProvider, provider(), runAi(), buildUserPrompt(), facts() (+21 more)

### Community 9 - "react"
Cohesion: 0.15
Nodes (14): react, react-dom, LoginForm(), submit(), AdminLogin(), metadata, AMBIENT_LABEL, Heart() (+6 more)

### Community 10 - "(site)/page.tsx"
Cohesion: 0.08
Nodes (36): lenis, Criar(), metadata, dynamic, OcasiaoPage(), delay(), Home(), PhoneMock() (+28 more)

### Community 11 - "Surprises.tsx"
Cohesion: 0.20
Nodes (18): celebrate(), accentBtn, Finale(), FlipCards(), fmt(), GiftBox(), Hidden(), Later() (+10 more)

### Community 12 - "Config TypeScript"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, baseUrl, esModuleInterop, incremental, isolatedModules, jsx, lib (+11 more)

### Community 13 - "Dependências"
Cohesion: 0.11
Nodes (19): dependencies, @anthropic-ai/sdk, autoprefixer, bcryptjs, lenis, next, pdf-lib, postcss (+11 more)

### Community 14 - "card.ts"
Cohesion: 0.19
Nodes (16): pdf-lib, Assets, buildCardPdf(), CardInput, CardSize, center(), CREAM, frame() (+8 more)

### Community 15 - "package.json"
Cohesion: 0.11
Nodes (17): devDependencies, typescript, engines, node, name, private, version, @anthropic-ai/sdk (+9 more)

### Community 16 - "Refinado.tsx"
Cohesion: 0.15
Nodes (23): AmbientPlayer(), start(), stop(), AMBIENT_LABEL, Familia(), rot(), AMBIENT_LABEL, ArchFrame() (+15 more)

### Community 17 - "getCategory"
Cohesion: 0.10
Nodes (41): Mensagens(), OrderDetail(), AdminHome(), Settings(), GET(), dynamic, FLOW, metadata (+33 more)

### Community 18 - "Responses.tsx"
Cohesion: 0.21
Nodes (11): burstFor(), BurstKind, CelebrationLayer(), P, PALETTES, Capsule(), save(), fmt() (+3 more)

### Community 19 - "qr/route.ts"
Cohesion: 0.60
Nodes (4): qrcode, GET(), qrPng(), qrSvg()

### Community 22 - "Scripts npm"
Cohesion: 0.25
Nodes (8): scripts, audit:security, build, dev, seed, start, test, test:e2e

### Community 24 - "Raspadinha da data"
Cohesion: 0.53
Nodes (5): ScratchDate(), ScratchDisc(), check(), point(), scratch()

### Community 25 - "Auditoria"
Cohesion: 0.40
Nodes (3): bad, BUILD_ONLY, vulns

## Knowledge Gaps
- **9 isolated node(s):** `autoprefixer`, `postcss`, `tsx`, `@types/bcryptjs`, `@types/node` (+4 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 206 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `security.ts`, `Wizard.tsx`, `carta/[token]/page.tsx`, `db.ts`, `actions.ts`, `LetterView.tsx`, `react`, `(site)/page.tsx`, `package.json`, `getCategory`, `qr/route.ts`?**
  _High betweenness centrality (0.181) - this node is a cross-community bridge._
- **What connects `autoprefixer`, `postcss`, `tsx` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `orders.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06715506715506715 - nodes in this community are weakly interconnected._
- **Why does `getCategory()` connect `getCategory` to `orders.ts`, `security.ts`, `Wizard.tsx`, `carta/[token]/page.tsx`, `LetterView.tsx`, `categories.ts`, `react`, `Refinado.tsx`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Should `security.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10451770451770452 - nodes in this community are weakly interconnected._
- **Why does `react` connect `react` to `Wizard.tsx`, `carta/[token]/page.tsx`, `LetterView.tsx`, `next`, `(site)/page.tsx`, `Surprises.tsx`, `package.json`, `Refinado.tsx`, `getCategory`, `Responses.tsx`, `Raspadinha da data`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Should `Wizard.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.058596491228070174 - nodes in this community are weakly interconnected._