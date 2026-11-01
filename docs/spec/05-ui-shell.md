# 05 — Interface: design system e navegação

> Material 3 básico com tokens e componentes próprios (ADR-0018); abas inferiores e lista única (ADR-0019). Épico E-UX (S-051…S-068).

## Visual
1. Material 3: papéis de cor, tipografia, formas e elevação por tokens; tema claro e escuro conforme o sistema.
2. Ícones padrão no lugar de texto onde o significado é universal: voltar (`arrow_back`), fechar (`close`), editar (`edit`), apagar (`delete`), sair (`logout`), adicionar (`add`), compartilhar (`share`), informação (`info`), cadeado (`lock`), recolher/expandir (`expand_less`/`expand_more`). Todo ícone sem texto tem rótulo acessível em pt-BR.
3. Hierarquia: título da tela na barra superior; seções (categorias) com cabeçalho destacado; conteúdo secundário (quem marcou, observação) em texto menor e cor de variante.
4. Campos de valor sempre com prefixo "R$" e formatação pt-BR ("12,90"), teclado numérico.
5. Alvos de toque ≥48 px; contraste AA nos dois temas.

## Navegação
1. Abas inferiores fixas com ícone e rótulo, visíveis em todas as telas depois de entrar na família:
   - **Lista** (`/`): lista do mês, adicionar, marcar no carrinho, finalizar compra.
   - **Despensa** (`/despensa`): recorrentes.
   - **Histórico** (`/historico`, `/historico/:mes`).
   - **Família** (`/familia`): convite, acesso a Categorias, sair.
2. Subtelas (Categorias, mês do histórico, Finalizar compra) têm barra superior com voltar e mantêm a aba-mãe ativa.
3. Login, criar/entrar na família e abrir convite: sem abas.
4. Links antigos `/mercado` e `/item/:id` levam à Lista.

## Componentes reaproveitáveis
- Bottom sheet modal (edição de item na Lista e de linha no Histórico).
- Diálogo (confirmações, "Entenda melhor" da Despensa).
- Snackbar (confirmações breves com "Desfazer", ex.: item adicionado ao carrinho).
- Botão segmentado (agrupamento do Histórico), chave (ocultar itens no carrinho).
