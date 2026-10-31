# 0010 — Despensa: recorrência no catálogo (emenda a 0009)

**Status:** aceito · **Data:** 2026-10-31 · **Autor:** arquiteto

## Contexto
Spec 30: a Despensa lista os recorrentes e o que falta vira pendente. No M5 os comprados saem de `items` ao finalizar (ADR-0009), então `items.recurring` sozinho perderia a lista de recorrentes. O item não tem `cycle` e o M3 não pode criar um.

## Decisão
- **Fonte da verdade da recorrência = `families/{F}/catalog/{nameKey}.recurring`** (bool, **opcional**; ausente = false). Regras: chaves obrigatórias da ADR-0009 + `recurring` opcional (`hasAll` obrigatórias, `hasOnly` obrigatórias + `recurring`, `recurring is bool` se presente).
- Escritas no catálogo passam a usar `set(..., { merge: true })` (emenda "sem merge" da 0009), sempre com `lastUsedAt` = `serverTimestamp()`. Adicionar item ou salvar detalhe **não apaga** `recurring`; só escreve `recurring` quem o muda de propósito. Continua sem transação e sem `await`.
- `items.recurring` vira espelho: gravado no mesmo batch que muda o catálogo (criar a partir do catálogo, detalhe, Despensa). Ao adicionar por texto livre, a tela passa o `recurring` da entrada do catálogo com o mesmo `nameKey`, se houver.
- **Estado da Despensa é derivado, sem campo novo** (`domain/pantry.ts`): por entrada recorrente, `missing` (há item `pending` com o `nameKey`), `inCart` (só há `bought`) ou `atHome` (nenhum item).
- Tocar em `atHome` → `addItem` com quantidade/unidade/categoria do catálogo e `recurring: true`. Tocar em `missing` → apaga o item `pending` mais recente com o `nameKey` (desfaz). `inCart` não é tocável.
- "Remover dos recorrentes": um batch grava `catalog.recurring = false` e `recurring = false` nos itens com o `nameKey`.

## Relação com o M5 (ciclos)
- Finalizar compra arquiva e remove os comprados; a recorrência sobrevive no catálogo.
- "Recorrentes voltam como pendentes no novo ciclo" é decisão do E-M5: pode chamar `addItem` para cada entrada `atHome` ou só levar o usuário à Despensa. O M3 não grava ciclo, data do último acréscimo nem nada no item além da ADR-0008.

## Alternativas consideradas
- Coleção `pantry` separada: mais regras e sincronização com o catálogo, sem ganho.
- Só `items.recurring`: some no fechamento (M5).
- Estado "tenho em casa" gravado: precisa zerar a cada ciclo, que só existe no M5.

## Consequências
- Docs do catálogo do emulador sem `recurring` continuam válidos; sem migração (nada em produção ainda).
- Itens repetidos com o mesmo `nameKey` aparecem como uma linha na Despensa.
