# 0012 — Finalizar compra: `purchases` + `purchaseLines` (emenda spec 70 / 0009)

**Status:** aceito · **Data:** 2026-10-31 · **Autor:** arquiteto

## Contexto
Spec 50/60: "Finalizar compra" arquiva os comprados no histórico do mês (preço, mercado, data) e os tira da lista. Precisa funcionar offline (ADR-0004: sem transação, sem `await`), caber no limite de 500 escritas por batch e no de chamadas `get()/exists()` das regras (10 por escrita, 20 por batch), e regras não iteram listas (sem validar array embutido).

## Decisão
- **`families/{F}/purchases/{auto-id}`** (uma ida ao mercado), chaves exatas: `cycle` (`^[0-9]{4}-(0[1-9]|1[0-2])$`), `market` string 1–60 (aparada) ou null, `itemCount` int 1–200, `totalCents` int 0–2 000 000 000 ou null (soma dos preços informados; null se nenhum), `createdBy` == uid, `purchasedAt` == `request.time`.
- **`families/{F}/purchaseLines/{itemId}`** (coleção plana, id = id do item arquivado), chaves exatas: `purchaseId` string, `cycle`, `name`, `nameKey`, `quantity`, `unit` (ADR-0008), `categoryId` (como ADR-0008), `categoryName` string 1–40 ou null (cópia do nome na hora), `priceCents` (como ADR-0008), `market` (igual ao da compra), `markedBy` string|null, `purchasedAt` == `request.time`.
- Regras de ambas: membro lê; `create` com forma válida; `update` e `delete` negados (histórico somente leitura). Só `isMember` (1 `get()` ao doc da família, repetido = mesma chamada); **nenhum** `get/existsAfter` por linha nem cruzamento linha↔compra.
- **Checkout** = `checkout(familyId, boughtItems, { market, categories })` em `src/data/checkout.ts`: fatias de até **200** itens (`CHECKOUT_CHUNK`); cada fatia é um `writeBatch` com 1 `purchases` + N `purchaseLines` + N `delete` de `items` = até 401 escritas. `void`, sem `await`, sem transação. `cycle` = mês local do aparelho no toque (`domain/cycle.ts`); é ele, não `purchasedAt`, que agrupa o histórico.
- **Offline:** permitido. O batch entra na fila do SDK; os comprados somem da lista no snapshot local na hora e o histórico já mostra a compra pelo cache (`hasPendingWrites`).
- **Duplo fechamento:** linha é create-only com id = itemId. Se dois membros finalizam os mesmos itens, o segundo batch vira `update` numa linha e é negado inteiro (sem compra duplicada); o handler central mostra aviso e o snapshot do servidor corrige a tela.
- Pendentes ficam em `items`. Histórico lê `purchaseLines where cycle == M` e `purchases` ordenadas por `purchasedAt` (índices de campo único, automáticos). Mercados já usados = valores distintos de `market` nas compras.

## Alternativas consideradas
- Array `items` dentro de `purchases`: 1 doc, mas regras não validam os elementos.
- Subcoleção `purchases/{P}/lines`: histórico do mês precisa de 1 consulta por compra ou de collection group + índice.
- Mover itens com `status: 'archived'`: lista atual teria de filtrar para sempre; viola o "Lista atual = `items` inteira" (ADR-0009).

## Consequências
- Corrida aceita: membro offline devolve um item a `pending` enquanto outro finaliza; o `delete` vence e o item aparece como comprado no histórico.
- Teste de regras cobre batch de 200 itens (401 escritas) aceito, linha duplicada negada, update/delete negados, outra família negada.
- V1 (NFC-e) acrescenta chaves a `purchases` em nova ADR.
