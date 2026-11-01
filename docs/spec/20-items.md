# 20 — Lista atual e itens

> Lista única (Home + Modo mercado, ADR-0019); edição em bottom sheet com renomear (ADR-0020); valor independente do carrinho (ADR-0022). Visual e navegação: `05-ui-shell.md`.

## Adicionar itens (durante o mês)
1. A aba Lista mostra os itens do mês atual, com o campo de adicionar fixo na parte inferior (acima das abas), ao alcance do polegar. As sugestões abrem para cima.
2. Usuário digita o nome (ex.: feijão) e confirma. O item entra na lista imediatamente.
3. Texto livre inteligente: ao digitar "3 kg feijão", o app separa quantidade, unidade e nome.
4. Autocompletar com itens de listas anteriores, trazendo a última unidade, quantidade (e categoria, ver `60-`) usadas.

## Colar uma lista (ADR-0027)
1. Colar no campo de adicionar um texto com várias linhas (ou uma linha com `;`/vírgulas, ex.: "arroz, feijão, leite") abre o sheet "Colar lista" em vez de preencher o campo.
2. O app limpa marcadores (`-`, `•`, `1.`, `[ ]`...), linhas vazias e repetidos, e lê cada linha como o texto livre (quantidade e unidade) e pelo catálogo (categoria, recorrente).
3. Cada linha tem checkbox; o que já está pendente na lista vem desmarcado com "Já está na lista". Máximo 100 itens por colagem.
4. "Adicionar (N)" grava tudo de uma vez no grupo ativo, inclusive offline; "Cancelar" não grava nada.

## Linha do item
- Checkbox à esquerda; tocar na linha marca/desmarca "no carrinho" (ver `40-market-mode.md`).
- Nome, quantidade + unidade, observação, valor (se houver, em qualquer status) e "quem marcou" (itens no carrinho ficam riscados).
- Botão editar à direita abre o sheet "Editar item".

## Editar item (bottom sheet)
1. Título "Editar item". Campos: nome (editável), quantidade, unidade, categoria, observação, recorrente mensal, "Já coloquei no carrinho", valor (R$).
2. Ações: Apagar (pede confirmação), Cancelar e Salvar. Fechar sem salvar não grava nada.
3. Renomear vale só para este item; a Despensa e o autocompletar passam a usar o nome novo. Compras passadas mantêm o nome antigo.
4. Valor e carrinho são independentes (ADR-0022): informar o valor não marca o item (dá para anotar o preço só para conferir); "Já coloquei no carrinho" muda só o status e não apaga o valor.

## Telas
- Lista (aba): itens, adicionar, marcar, editar, finalizar compra.
- Sheet "Editar item" (sem rota própria).

## Notas
- Só o nome é obrigatório; quantidade padrão 1.
- A lista agrupa itens por categoria (ver `60-categories-price.md`).
