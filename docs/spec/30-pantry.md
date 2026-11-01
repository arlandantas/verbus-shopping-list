# 30 — Despensa / Recorrentes

## Fluxo (véspera do mercado)
1. Usuário abre a aba Despensa, com todos os itens marcados como recorrentes.
2. Marca ou desmarca o que ainda tem em casa. O que falta vira pendente na lista do mês.
3. Opcional: consultar a lista do mês anterior para lembrar o que foi comprado (ver `50-`).

## Explicação na tela (E-UX)
- Topo da tela: texto breve, por exemplo "Itens que você compra todo mês. Marque o que está faltando e ele entra na Lista."
- Link "Entenda melhor" abre um diálogo com o descritivo completo: o que é recorrente, como tornar um item recorrente (no "Editar item" ou aqui), os três estados (falta / tenho / no carrinho), que os recorrentes voltam sozinhos à Lista no começo de cada mês e como remover dos recorrentes.
- Cada estado tem ícone e cor próprios, além do texto.

## Notas
- Recorrentes voltam como pendentes no início do próximo mês ou ao iniciar novo ciclo (ver `50-checkout-history.md`).
- Recorrência mora no catálogo; estado da Despensa (falta / tenho / no carrinho) é derivado da lista, sem campo novo (ADR-0010).
