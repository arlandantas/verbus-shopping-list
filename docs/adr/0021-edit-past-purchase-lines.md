# 0021 — Editar linhas de compras passadas (emenda 0012)

**Status:** aceito · **Data:** 2026-11-01 · **Autor:** arquiteto (pedido do usuário)

## Contexto
O usuário quer corrigir valor e quantidade de itens já arquivados (preço esquecido no mercado, quantidade errada). ADR-0012 deixou `purchases` e `purchaseLines` create-only. Fase MVP (ADR-0017): sem endurecimento além da forma.

## Decisão
- **`purchaseLines` update:** membro; forma válida (ADR-0012) e `diff(resource.data).affectedKeys().hasOnly(['quantity','unit','priceCents'])`. Valores com as mesmas validações de `items` (ADR-0008). Demais chaves imutáveis. `delete` continua negado.
- **`purchases` update:** membro; `affectedKeys().hasOnly(['totalCents'])`, `totalCents` int 0–2 000 000 000 ou null. Sem cruzar com as linhas (regras não somam).
- **Dados:** `updatePurchaseLine(familyId, line, patch, siblings)` em `src/data/history.ts`: um `writeBatch` (sem `await`) com o update da linha e o `totalCents` da compra recalculado no cliente a partir das linhas da mesma `purchaseId` já em cache (null se nenhuma tem preço). Offline permitido.
- **UI:** no Histórico agrupado por compra, cada linha tem `IconButton` editar que abre um sheet "Editar item comprado" (quantidade, unidade, valor em R$; nome somente leitura). Soma por categoria e total se atualizam pelo snapshot.

## Alternativas consideradas
- Linha nova + linha antiga "anulada": histórico auditável, mas complica leitura e somas.
- Editar também nome, categoria ou mercado: muda agrupamentos e cópias em N linhas; fica para quando houver pedido.
- Total calculado só na leitura (remover `totalCents`): mudaria o modelo da 0012 sem necessidade.

## Consequências
- Corrida aceita: duas edições simultâneas na mesma compra podem deixar `totalCents` defasado até a próxima edição (última escrita vence). Registrar em E-SEC/qualidade se incomodar.
- Testes de regras: editar `priceCents`/`quantity`/`unit` aceito; tocar `name`, `purchaseId`, `cycle`, `market` negado; `purchases` só `totalCents`; outra família negada.
