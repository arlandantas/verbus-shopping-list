# 0015 — Preço só em item comprado; mercado opcional (emenda a 0008)

**Status:** aceito · **Data:** 2026-10-31 · **Autor:** arquiteto

## Contexto
Spec 60: preço pago é opcional e fora do fluxo rápido do mercado. ADR-0008 já tem `priceCents` (int 0–10 000 000 ou null), mas aceita preço em item pendente (nit do revisor). Mercado é perguntado ao finalizar.

## Decisão
- **Regra de `items`:** forma válida exige `priceCents == null || status == 'bought'` (create já exige null). Vale para toda escrita.
- **Desmarcar limpa o preço:** `setItemStatus(..., 'pending')` grava `status`, `markedBy`, `markedAt` e `priceCents: null` no mesmo `updateDoc`. `bought` não toca o preço.
- **`setItemPrice(familyId, id, cents | null)`** em `src/data/items.ts`: `updateDoc` só de `priceCents`, `void`. Catálogo não guarda preço.
- **Entrada:** só no detalhe do item (quando comprado) e na tela Finalizar compra; nunca no Modo mercado. `domain/price.ts`: `parsePriceBRL("12,90" | "12.90" | "R$ 12,90") → 1290`, vazio → null, inválido → erro de formulário; `formatBRL(1290) → "R$ 12,90"` (`Intl.NumberFormat('pt-BR')`).
- **Mercado:** campo opcional na tela Finalizar compra (1–60 após aparar; vazio = null), com sugestões dos mercados já usados (ADR-0012). Data = `purchasedAt` (servidor).

## Alternativas consideradas
- Preço em qualquer status: preço "fantasma" em pendente cairia na próxima compra.
- Desmarcar mantendo o preço: exigiria a regra aceitar preço em pendente.
- Coleção `markets`: lista distinta das compras basta no porte familiar.

## Consequências
- Desfazer uma marcação perde o preço digitado (aceito; raro).
- Testes de regras: preço em pendente negado (create e update), preço em comprado aceito, desmarcar com preço sem limpar negado.
