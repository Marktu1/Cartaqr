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
