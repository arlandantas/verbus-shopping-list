# 0019 — Abas inferiores e lista única (Home + Modo mercado fundidos)

**Status:** aceito · **Data:** 2026-11-01 · **Autor:** arquiteto (pedido do usuário)

## Contexto
Hoje a Home (`/`) tem 4 links de texto e a lista abre o detalhe ao toque; o Modo mercado (`/mercado`) é outra tela, com toque = marcar. O redesign pede abas inferiores, checkbox à esquerda, editar à direita (também no mercado) e campo de adicionar embaixo. Com isso as duas telas ficariam com a mesma linha, o mesmo agrupamento e as mesmas ações.

## Decisão
- **Lista única** em `/` ("Lista"): linha = checkbox à esquerda (toque na linha inteira marca/desmarca, como no mercado), nome + quantidade + observação + "quem marcou", e `IconButton` editar à direita (abre o sheet, ADR-0020). Campo de adicionar fixo embaixo, acima das abas. O "modo mercado" deixa de ser tela: é o uso da mesma lista com as ajudas do mercado sempre disponíveis: contador "N de M no carrinho", categorias colapsáveis, chave "Ocultar itens no carrinho" e ação "Finalizar compra" (aparece com ≥1 item no carrinho).
- `/mercado` e `/item/:id` viram `Navigate` para `/` (links antigos não quebram). `MarketScreen`/`MarketRow`/`ItemScreen` são removidos.
- **Abas inferiores** (`NavigationBar` M3, fixas, ícone + rótulo) em todas as rotas com família pronta: Lista (`checklist`) `/`, Despensa (`kitchen`) `/despensa`, Histórico (`history`) `/historico*`, Família (`group`) `/familia` (convite, Categorias, sair). Implementadas como rota de layout (`AppShell` com `<Outlet/>`); aba ativa pelo prefixo da rota. Login, criar/entrar na família e convite não mostram abas.
- Subtelas (`/categorias`, `/historico/:cycle`, `/finalizar`) usam `TopAppBar` com ícone voltar (`arrow_back`) e mantêm a aba-mãe ativa. Sair = `IconButton` `logout` na barra da Família.
- Estado de interface local (categorias recolhidas, ocultar carrinho) fica em `localStorage` por aparelho, nunca no Firestore.

## Alternativas consideradas
- Manter duas telas: duplicaria linha, agrupamento e ações; o usuário teria de "entrar" no mercado para editar preço e "sair" para adicionar algo esquecido.
- Aba "Mercado" com a mesma lista em modo grande: 5 abas para uma única coleção; confunde.
- Menu lateral: esconde destinos; abas são o padrão M3 para 3–5 destinos.

## Consequências
- Risco de toque acidental (marcar sem querer na lista de casa) mitigado: ao **marcar** (linha ou checkbox), Snackbar M3 "Item adicionado ao carrinho" com ação "Desfazer" (volta o item para pendente; o valor fica, ADR-0022), duração padrão ~4 s; um novo toque substitui o snackbar anterior. Desmarcar não mostra snackbar. Tocar de novo continua desfazendo; a linha marcada fica visível (riscada) salvo se "ocultar" estiver ativo.
- Specs 20 e 40 passam a descrever uma tela só; E2E `market*.spec.ts` e `item-detail.spec.ts` migram para `/`.
- Regra "modo mercado sem formulários" vira: nenhuma digitação é necessária para marcar; editar é opcional, no sheet.
