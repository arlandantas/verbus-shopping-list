# 30 — Despensa / Recorrentes

## Fluxo (véspera do mercado)
1. Usuário abre a aba Despensa, com todos os itens marcados como recorrentes.
2. Marca ou desmarca o que ainda tem em casa. O que falta vira pendente na lista do mês.
3. Opcional: consultar a lista do mês anterior para lembrar o que foi comprado (ver `50-`).

## Explicação na tela (E-UX)
- Topo da tela: texto breve, por exemplo "Itens que você compra todo mês. Marque o que está faltando e ele entra na Lista."
- Link "Entenda melhor" abre um diálogo com o descritivo completo: o que é recorrente, como tornar um item recorrente (no "Editar item" ou aqui), os três estados (falta / tenho / no carrinho), que os recorrentes voltam sozinhos à Lista no começo de cada mês e como remover dos recorrentes.
- Cada estado tem ícone e cor próprios, além do texto.

## Agrupamento por categoria (S-094)
- Recorrentes e "Outros itens já usados" agrupam por categoria, na ordem da Lista (ADR-0014); "Sem categoria" por último; categoria vazia some; nomes em ordem alfabética dentro do grupo.
- Recorrentes: cada categoria é uma seção recolhível com contador; o estado recolhido fica salvo no aparelho.
- "Outros itens" segue recolhível; dentro dele, subtítulos fixos por categoria (sem recolher).
- Grupo sem categorias, ou nenhum item com categoria: lista plana, sem cabeçalhos.

## Opcional por grupo (S-105, ADR-0028)
- Campo `recurringEnabled` no grupo; ausente = ligado. Switch "Despensa e compras recorrentes" (com explicação) ao criar o grupo (padrão ligado) e na tela do Grupo; qualquer membro alterna.
- Desligado: sem aba Despensa (`/despensa` volta à Lista), sem "Recorrente mensal" no item, sem aviso "N recorrentes voltaram" e nada volta ao abrir o mês. Dados ficam; religar restaura.

## Notas
- Recorrentes voltam como pendentes no início do próximo mês ou ao iniciar novo ciclo (ver `50-checkout-history.md`).
- Recorrência mora no catálogo; estado da Despensa (falta / tenho / no carrinho) é derivado da lista, sem campo novo (ADR-0010).
