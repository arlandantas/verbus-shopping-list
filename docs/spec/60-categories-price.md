# 60 — Categorias, preço e mercado (V0)

> Padrões fixos semeados ao criar a família; o usuário gerencia só as próprias (ADR-0014). Valor pelo sheet "Editar item", independente do carrinho: aceito em item pendente e desmarcar não limpa (ADR-0022, emenda 0015/0020). Histórias S-031…S-047, E-UX S-062.

## Categorias
1. Padrão: mercearia, hortifruti (frutas e verduras), carnes, laticínios, limpeza e higiene pessoal.
2. Usuário cria, renomeia e exclui as próprias categorias.
3. Categoria é opcional ao adicionar item; o autocompletar traz a última usada para aquele item.
4. Lista atual (e uso no mercado) agrupa por categoria.
5. No histórico, o gasto do mês é somado por categoria.
6. Tela Categorias (E-UX): as do usuário primeiro, com ações editar e apagar; as padrão depois, em seção própria, com ícone de cadeado, estilo atenuado e sem ações (rótulo acessível "Categoria padrão, não editável").

## Preço e mercado
1. Em cada item o usuário pode informar o preço, inclusive durante a compra, pelo sheet "Editar item", esteja ou não no carrinho (ex.: anotar o preço da gôndola só para conferir). Nunca obrigatório.
2. Campos de valor: prefixo "R$", formato pt-BR ("12,90"), teclado decimal.
3. Ao finalizar a compra, pergunta opcional do mercado e registro da data. Só itens no carrinho vão para o histórico (com o valor); pendentes ficam na lista mantendo o valor anotado, fora de qualquer total.
4. O histórico guarda preço, mercado e data de cada item comprado, preparando a comparação mês a mês e entre mercados (V1). Valor e quantidade podem ser corrigidos depois (ADR-0021).
