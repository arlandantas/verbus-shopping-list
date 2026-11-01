# 0020 — Sheet "Editar item", renomear e valor na compra (emenda 0009/0010/0015)

**Status:** aceito · **Data:** 2026-11-01 · **Autor:** arquiteto (pedido do usuário)

## Contexto
O detalhe do item é uma tela (`/item/:id`) sem renomear e sem "cancelar". O usuário pede um bottom sheet reaproveitável, título "Editar item", nome editável e informar o valor durante a compra. ADR-0015 proibia preço no modo mercado e só aceitava preço em item comprado.

## Decisão
- **`EditItemSheet`** (`src/components/EditItemSheet.tsx` + `ItemForm` movido para `src/components/`): `BottomSheet` modal, título "Editar item", campos nome, quantidade + unidade, categoria, observação, recorrente, "Já coloquei no carrinho", valor (`MoneyField`, R$). Rodapé: `Apagar` (texto, cor de erro, à esquerda), `Cancelar` e `Salvar` (filled). Fecha por Cancelar, ícone `close`, scrim, Esc e voltar do Android (`history` com estado do sheet, sem rota nova). Aberto pelo `IconButton` editar da lista (ADR-0019); outras telas podem reusar.
- **Renomear:** salvar com nome novo grava `name` (aparado) e `nameKey = toNameKey(name)` no item. No mesmo `writeBatch`: catálogo do novo `nameKey` recebe `set(merge)` com nome, quantidade, unidade, categoria **e `recurring` do item**; se o item era recorrente e o `nameKey` mudou, o catálogo antigo recebe `{recurring: false}` (merge), para a Despensa não listar os dois nomes. Catálogo antigo não é apagado (delete negado, ADR-0009). Linhas de histórico mantêm o nome antigo.
- **Regras:** para renomear, as de `items` e `catalog` já aceitam (forma válida, `createdBy/createdAt` inalterados); a única mudança é a do preço (ADR-0022). A história acrescenta **testes de regras** do caso (renomear aceito, `nameKey` inválido negado, renomear trocando `createdBy` negado, catálogo antigo `recurring:false` aceito).
- **Valor no sheet (emenda 0015, detalhada na 0022):** o campo aparece sempre e grava só `priceCents` (vazio = null), em qualquer status; não marca o item. O status é o `Checkbox` "Já coloquei no carrinho", independente do valor. Desmarcar não limpa o valor.
- Apagar pede confirmação (`Dialog`) antes de `deleteItem`.

## Alternativas consideradas
- Manter rota `/item/:id`: perde o contexto da lista e não serve no mercado.
- Valor em pendente marcar o item (versão anterior desta ADR): trocada pela 0022 a pedido do usuário.
- Apagar o catálogo antigo ao renomear: exigiria liberar `delete` em `catalog`.

## Consequências
- Sugestões passam a oferecer o nome antigo e o novo (aceito; o antigo envelhece por `lastUsedAt`).
- `updateItemDetails` ganha o status opcional (checkbox) e o tratamento do catálogo antigo; testes de dados cobrem os casos.
