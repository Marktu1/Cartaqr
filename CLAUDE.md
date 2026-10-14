# Carta QR — notas para o assistente

## Mapa do código (Graphify)
O mapa do código está em `graphify-out/` (`graph.json` + `GRAPH_REPORT.md`, blocos com nomes em português).

**Antes de mexer no código, consulta o mapa:**
- `pip install graphifyy` (se ainda não estiver instalado)
- `graphify affected "<função>"` — o que é afetado se mudares isto (ex.: `graphify affected "getCategory()"`)
- `graphify query "<pergunta>"` — parte do mapa relevante para uma pergunta
- `graphify path "A" "B"` — como duas peças se ligam
- `graphify explain "<peça>"` — o que é e com quê se liga
- `graphify god-nodes` — peças por onde passa quase tudo (mexer com cuidado e com testes)

**Depois de mudar código, atualiza o mapa** (sem custo, sem IA) e inclui-o no mesmo commit:
`graphify update . && graphify cluster-only .`

## Verificações antes de juntar ao main
`npx tsc --noEmit -p .`, `npm test`, `npm run build`. O Render publica o ramo `main` automaticamente.

## Camadas do back-end (regra)
- **Rotas e páginas** (`src/app/**`): só limitam pedidos, verificam acesso e validam o formato (zod). Nunca importam `@/lib/db` (exceto o tipo `Row`).
- **Negócio** (`src/lib/*.ts`): regras e SQL por domínio — `order-core` (tipos, erros, estados), `orders` (encomendas e ações do admin; também re-exporta tudo), `plans`, `media`, `public-letter`, `replies`, `discounts`, `analytics`, `messages`, `backup`.
- **Dados** (`src/lib/db.ts`): ligação SQLite, migrações e `all/get/run`.
- Erros de negócio: `throw new AppError(code, mensagem, status)`; as rotas devolvem com `handle(e)`.
