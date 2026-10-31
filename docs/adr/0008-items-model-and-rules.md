# 0008 — Modelo e regras de `items`

**Status:** aceito · **Data:** 2026-10-31 · **Autor:** arquiteto

## Contexto
M2 cria itens (spec 20); M4 marca comprado, M5 grava preço. As regras precisam validar a forma de uma vez (ADR-0003), com escritas offline e por campo (ADR-0004).

## Decisão
Emenda a spec 70 / ADR-0003. `families/{F}/items/{auto-id}`, chaves exatas:
- `name` string 1–80 (aparada) · `nameKey` string 1–80, `^[a-z0-9]+( [a-z0-9]+)*$` (ver `domain/nameKey`).
- `quantity` number, `> 0` e `≤ 9999` (decimais: 0,5 kg) · `unit` ∈ `['un','kg','g','l','ml','pct','cx','dz']` (padrão `un`; UI mostra `L`).
- `note` string ≤120 ou null · `categoryId` string 1–40 ou null (categorias só no E-M5) · `recurring` bool.
- `status` `'pending' | 'bought'` · `markedBy` string|null · `markedAt` timestamp|null · `priceCents` int 0–10 000 000 ou null.
- `createdBy` == uid · `createdAt` == `request.time`. Sem `cycle` no item (ADR-0009).

Regras (só membros, via `isMember`):
- **create:** forma válida, `status == 'pending'`, `markedBy`/`markedAt`/`priceCents` null.
- **update:** forma válida; `createdBy`, `createdAt` inalterados. Se `affectedKeys()` toca `status|markedBy|markedAt`: `bought` ⇒ `markedBy == uid` e `markedAt == request.time`; `pending` ⇒ ambos null.
- **delete:** membro. Outras subcoleções sem match explícito: negadas.

## Alternativas consideradas
- Unidade texto livre: rompe agrupamento/autocompletar e a validação; lista fechada cobre o mercado.
- `updatedAt` em toda escrita: nenhuma tela precisa; o catálogo guarda o "último uso" (ADR-0009).
- Validar `nameKey` contra `name` nas regras: regras não normalizam acentos; só o formato é checado.

## Consequências
- `UNITS` em `src/domain/units.ts` e a lista nas regras devem ser iguais (teste de regras cobre cada unidade).
- Marcar comprado (M4) já é permitido pelas regras; M2 usa o mesmo `setItemStatus`.
- O teste "denies writing items (out of scope)" de S-007 é substituído pelos testes de S-015.
