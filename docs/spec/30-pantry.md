# 30 — Despensa / Recorrentes

## Fluxo (véspera do mercado)
1. Usuário abre a aba Despensa, com todos os itens marcados como recorrentes.
2. Marca ou desmarca o que ainda tem em casa. O que falta vira pendente na lista do mês.
3. Opcional: consultar a lista do mês anterior para lembrar o que foi comprado (ver `50-`).

## Explicação na tela (E-UX)
- Topo da tela: texto breve, por exemplo "Itens que você compra todo mês. Marque o que está faltando e ele entra na Lista."
- Link "Entenda melhor" abre um diálogo com o descritivo completo: o que é recorrente, como tornar um item recorrente (no "Editar item" ou aqui), os três estados (falta / tenho / no carrinho), que nada volta sozinho à Lista (quem marca "falta" é o usuário) e como remover dos recorrentes.
- Cada estado tem ícone e cor próprios, além do texto.

## Agrupamento por categoria (S-094)
- Recorrentes e "Outros itens já usados" agrupam por categoria, na ordem da Lista (ADR-0014); "Sem categoria" por último; categoria vazia some; nomes em ordem alfabética dentro do grupo.
- Recorrentes: cada categoria é uma seção recolhível com contador; o estado recolhido fica salvo no aparelho.
- "Outros itens" segue recolhível; dentro dele, subtítulos fixos por categoria (sem recolher).
- Grupo sem categorias, ou nenhum item com categoria: lista plana, sem cabeçalhos.

## Manual (S-117, ADR-0030)
- Nada volta sozinho à Lista, nem na virada do mês. Botão "Marcar todos como faltando" no topo adiciona à Lista, de uma vez, todos os itens "Tenho em casa" (oculto se não houver nenhum).

## Opcional por grupo (S-105, ADR-0028)
- Campo `recurringEnabled` no grupo; ausente = ligado. Switch "Usar a Despensa" (com explicação curta, S-115) ao criar o grupo (padrão ligado) e na tela do Grupo; qualquer membro alterna.
- Desligado: sem aba Despensa (`/despensa` volta à Lista), sem "Recorrente mensal" no item, e sem o botão em massa. Dados ficam; religar restaura.

## Notas
- Recorrência mora no catálogo; estado da Despensa (falta / tenho / no carrinho) é derivado da lista, sem campo novo (ADR-0010).
