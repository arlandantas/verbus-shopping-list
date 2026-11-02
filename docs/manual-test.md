# Roteiro de teste manual (Material 3)

Rode `pnpm dev:local` (JDK 21) e abra o endereço do Vite. Na tela de login, use o painel **Contas de teste**:
**Ana** e **Beto** (casal, "Casa Teste", com itens) e **Carla** (sem grupo). Dica: abra Ana e Beto em duas janelas (uma anônima) para ver o tempo real.
Navegação: abas inferiores **Lista**, **Despensa**, **Histórico**, **Grupo**.

## Lista (única, também no mercado)

1. **Adicionar:** na barra flutuante inferior, digitar "3 kg feijão" e confirmar; depois "leite". Itens entram agrupados por categoria.
2. **Autocompletar:** digitar "fei" e escolher a sugestão (traz unidade e categoria usadas antes).
3. **Marcar:** tocar na caixa de um item: vai ao carrinho (risca, mostra quem marcou) e aparece o Snackbar com **Desfazer**; testar o desfazer. Ver a mudança na outra janela.
4. **Categorias colapsáveis:** recolher/expandir uma categoria pelo cabeçalho (contagem visível, ex.: "2/5"); foco e teclado funcionam.
5. **Ocultar itens no carrinho:** ligar a chave; itens marcados somem; desligar os traz de volta.
6. **Editar item:** tocar em editar (lápis) para abrir o sheet "Editar item": renomear, quantidade, unidade, observação, categoria, recorrente.
7. **Carrinho e valor:** no sheet, marcar **Já coloquei no carrinho** e informar o valor (máscara de centavos: digitar 1190 vira 11,90) sem mudar o estado do carrinho; o valor é independente da marcação.

## Despensa

8. Ler o texto explicativo e abrir **Entenda melhor**. Marcar o que falta; tornar item recorrente; remover dos recorrentes.
9. Expandir/recolher a seção **Outros itens já usados**.
9a. **Por categoria:** com categorias no grupo, os recorrentes aparecem em seções por categoria ("Sem categoria" por último); recolher uma e recarregar mantém recolhida. Em **Outros itens já usados**, os itens aparecem sob subtítulos por categoria com contagem. Grupo sem categorias: lista plana.

## Finalizar compra e Histórico

10. **Finalizar compra:** na Lista, finalizar; informar mercado (opcional) e confirmar. Itens no carrinho vão ao histórico, pendentes ficam.
11. **Histórico:** ver meses, abrir um mês: compras agrupadas por compra finalizada, gasto por categoria; alternar o agrupamento (botão segmentado); readicionar um item à lista.
12. **Editar linhas:** em uma compra passada, editar um item comprado (nome, quantidade, valor) e salvar; conferir os totais.

## Categorias e Grupo

13. Grupo → Categorias: as personalizadas aparecem primeiro; criar, renomear, excluir uma própria. As padrão ficam fixas (cadeado, sem editar/excluir).
14. **Carla:** criar um grupo novo, copiar o convite; entrar com o código/link em outra conta.
15. **Sair:** Grupo → sair; aparece diálogo de confirmação; cancelar mantém a sessão, confirmar volta ao login.
16. **Trocar de grupo:** na Lista, tocar no título (ou na seta) abre o sheet com os grupos, o ativo marcado; escolher outro mostra os itens dele (Lista, Despensa, Histórico). Com um só grupo o título também abre o sheet. "Criar novo grupo" e "Entrar com código" levam à aba Grupo já com o formulário correspondente aberto. Recarregar mantém o grupo escolhido.
    **Mais grupos (S-091):** na aba Grupo, "Criar novo grupo" e "Entrar em outro grupo" abrem os formulários; sucesso ativa o novo grupo e volta à Lista. Abrir o convite de um grupo em que já está troca para ele com "Você já está neste grupo". Com 10 grupos aparece "Limite de 10 grupos atingido" e as ações ficam desabilitadas.
    **Colar lista (S-093):** na Lista, colar no campo "Adicionar item" um texto de várias linhas (ex.: do WhatsApp, com `-`, `[ ]`, numeração, linhas vazias e repetidos, ou "arroz, feijão, leite"). Abre o sheet "Colar lista" com uma linha por item; o que já está pendente vem desmarcado com "Já está na lista". "Adicionar (N)" grava tudo de uma vez e mostra "N itens adicionados". Colar uma linha só ("1,5 kg arroz") preenche o campo como antes.
17. **Virada do mês:** nada volta sozinho à Lista; na Despensa, "Marcar todos como faltando" adiciona os itens em casa.
17a. **Renomear grupo (criador):** Grupo → Renomear grupo; o título muda. Outro membro não vê o botão.
17b. **Boas-vindas:** após criar grupo aparece um modal que cobre a barra de navegação, sem rolagem da página.

## Offline, tema e tela larga

18. **Offline:** desligar a rede do navegador, marcar/adicionar itens (UI responde na hora); religar e ver sincronizar na outra janela.
19. **Escuro/claro:** alternar o tema do sistema; checar legibilidade, contraste e bordas de campos, sheet e diálogos nos dois.
20. **Tela larga:** abrir em janela de desktop; conteúdo centralizado, abas centralizadas, barra de adicionar não estoura a largura.
21. **Celular (360 px):** alvos de toque confortáveis com uma mão; nada cortado pelo teclado ou pelas abas.

Anote o que estranhar (comportamento, textos, layout). Reiniciar o `dev:local` apaga os dados e recarrega a semente.

## Publicação (Firebase Hosting)

`pnpm deploy` publica o hosting; regras com `pnpm exec firebase deploy --project prod --only firestore:rules`. O domínio publicado deve constar em Authentication → Domínios autorizados.
