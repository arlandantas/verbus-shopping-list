# 0022 — Valor independente do carrinho (emenda 0015 e 0020)

**Status:** aceito · **Data:** 2026-11-01 · **Autor:** usuário (pedido) + arquiteto (forma)

## Contexto
ADR-0015 só aceitava `priceCents` em item comprado e desmarcar limpava o preço; ADR-0020 fazia "informar valor" pôr o item no carrinho. O usuário quer anotar o preço só para conferir (ex.: na gôndola) sem marcar, e não perder o valor ao desmarcar.

## Decisão
- **Status e valor são independentes.** O sheet "Editar item" ganha o `Checkbox` "Já coloquei no carrinho" (status; checkbox para casar com o da linha da Lista). Informar valor NÃO marca; mudar o checkbox não mexe no valor. Sai a ajuda "Ao informar o valor, o item vai para o carrinho."
- **Dados:** `setItemStatus(..., 'pending')` grava só `status`, `markedBy: null`, `markedAt: null` (sem `priceCents`). `setItemPrice` vale em qualquer status. `updateItemDetails` só inclui `status`/`markedBy`/`markedAt` quando o checkbox mudou (`bought` → `markedBy: uid`, `markedAt: serverTimestamp()`; `pending` → nulls).
- **Regras (mudança mínima em `firestore.rules`):** em `validItemShape`, trocar `(d.priceCents == null || (d.status == 'bought' && ...int 0–10 000 000))` por `validPriceCents(d.priceCents, 10000000)` (já existe; mover para os validadores do topo se preciso). `validItemCreate` continua exigindo `priceCents == null`. `validItemUpdate` não muda.
- **Finalizar compra:** só itens no carrinho viram `purchaseLines` (já é assim em `data/checkout.ts`); o valor deles entra na linha e no `totalCents`. Itens pendentes ficam na lista **com** o valor anotado e não entram em total nenhum.
- **Histórico e gráficos:** leem só `purchaseLines`/`purchases` (ADR-0012/0021); nada muda. Preço de item pendente nunca aparece no histórico até ser comprado e finalizado.

## Alternativas consideradas
- Manter 0015/0020: obriga marcar para anotar preço; desmarcar acidental perde o valor.
- Limpar o valor de pendentes ao finalizar: apagaria uma anotação útil para a próxima ida.

## Consequências
- Preço "antigo" pode seguir em pendente que atravessa o mês (aceito; editável no sheet). Recorrentes que voltam nascem com `priceCents: null` (ADR-0013, sem mudança).
- Testes de M5 que assumem a regra antiga mudam na S-056 (rules S-032 AC2/AC3, dados S-038 AC2, unit S-028 AC1) e na S-057 (unit S-045 AC2, E2E S-045 AC3).
- Linha da Lista mostra o valor também em pendente (S-058).
