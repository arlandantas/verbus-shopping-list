# 40 — Modo mercado (na própria Lista)

> Desde o E-UX não há tela separada: o mercado usa a aba Lista (ADR-0019). `/mercado` redireciona para `/`.

## Fluxo
1. No mercado, o usuário abre a aba Lista: itens grandes, agrupados por categoria, rolável; nenhuma digitação é necessária para marcar.
2. Ao pegar um item, toca na linha (ou no checkbox à esquerda) e ele vai para o carrinho (riscado e movido para o fim da categoria).
3. Os outros membros veem a mudança em tempo real. Cada item mostra quem marcou.
4. Sem sinal: a marcação é salva localmente, o app mostra indicador discreto de offline e sincroniza ao reconectar.
5. Ao marcar, aparece o snackbar "Item adicionado ao carrinho" com a ação "Desfazer" (volta o item para pendente), por ~4 s (padrão M3). Marcar outro item substitui o snackbar. Desmarcar não mostra snackbar.
6. Desfazer também é tocar de novo em um item marcado: volta para pendente e mantém o valor anotado (ADR-0022).
7. Opcional: o botão editar à direita abre o sheet "Editar item" para anotar o valor (sem marcar o item) ou corrigir dados (ver `20-items.md`).

## Ajudas do mercado (topo da Lista)
- Contador "N de M no carrinho".
- Chave "Ocultar itens no carrinho": quando ativa, cada categoria esconde os itens no carrinho e mostra só "N itens já adicionados" (singular: "1 item já adicionado").
- Categorias colapsáveis: o cabeçalho mostra nome, "no carrinho/total" (ex.: 2/5) e ícone de recolher. Estado lembrado no aparelho.
- "Finalizar compra" aparece com ≥1 item no carrinho (ver `50-`).

## Notas
- Conflitos: atualização por campo, a última marcação vence.
- Atualização otimista, resposta imediata ao toque.
- "Quem marcou" usa `families/{F}/members/{uid}` (ADR-0011).
- Ocultar e recolher são preferências locais do aparelho, não sincronizam.
