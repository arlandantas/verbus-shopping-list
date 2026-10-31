# 60 — Categorias, preço e mercado (V0)

> Padrões fixos semeados ao criar a família; o usuário gerencia só as próprias (ADR-0014). `priceCents` só em item comprado; desmarcar limpa (ADR-0015). Histórias S-031…S-047.

## Categorias
1. Padrão: mercearia, hortifruti (frutas e verduras), carnes, laticínios, limpeza e higiene pessoal.
2. Usuário cria, renomeia e exclui as próprias categorias.
3. Categoria é opcional ao adicionar item; o autocompletar traz a última usada para aquele item.
4. Lista atual e modo mercado agrupam por categoria.
5. No histórico, o gasto do mês é somado por categoria.

## Preço e mercado
1. Em cada item o usuário pode informar o preço pago. Nunca obrigatório; fora do fluxo rápido do mercado.
2. Ao finalizar a compra, pergunta opcional do mercado e registro da data.
3. O histórico guarda preço, mercado e data de cada item comprado, preparando a comparação mês a mês e entre mercados (V1).
