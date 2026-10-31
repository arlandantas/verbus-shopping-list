# 0009 — Catálogo para autocompletar, ciclos e categorias no M2

**Status:** aceito · **Data:** 2026-10-31 · **Autor:** arquiteto

## Contexto
Spec 20 pede autocompletar "de listas anteriores" com última unidade, quantidade e categoria. No M5 os comprados saem da lista atual ao finalizar a compra; um item pendente atravessa meses. Consultar o histórico a cada tecla não funciona bem offline.

## Decisão
- **Lista atual = a coleção `items` inteira.** O item não guarda `cycle`; o ciclo (`YYYY-MM`) nasce no fechamento (M5) em `purchases`/`cycles`. Virar o mês não muda nada no M2.
- **Catálogo:** `families/{F}/catalog/{nameKey}`, um doc por nome normalizado, chaves exatas: `name` (última grafia, 1–80), `nameKey` == id, `quantity`, `unit`, `categoryId` (mesmas regras de `items`, ADR-0008), `lastUsedAt` == `request.time`.
- Gravado no **mesmo `writeBatch`** que cria o item ou salva o detalhe (`set` completo, sem `merge`, sem transação, sem `await`). Regras: membro lê, cria e atualiza com forma válida; `delete` negado no MVP.
- **Sugestões no cliente:** `watchCatalog` escuta o catálogo inteiro (porte familiar: centenas de docs, cache offline do SDK); `domain/suggest.ts` filtra e ordena. Sem índice composto.
- **Categorias:** nenhuma semente no M2. `categoryId` fica null e a lista não agrupa; coleção `categories`, padrões e agrupamento vêm no E-M5.

## Alternativas consideradas
- Sugerir a partir de `items` + `purchases`: varre histórico, precisa de índice e deduplicação no cliente.
- `cycle` no item (spec 70): pendentes levados ao mês seguinte precisariam de reescrita em massa.
- Semear categorias padrão já no M2: nenhuma tela do M2 as usa.

## Consequências
- Apagar itens (ou finalizar compra) não perde sugestões. Doc id = `nameKey` (sem `/`, regex da ADR-0008).
- E-M5 escreve `categoryId` no catálogo junto do item e cria regras de `categories`.
