# 12 — Primeiro acesso (onboarding)

> E-ONB (S-107…S-112, S-115, S-116; ADR-0028, 0029, 0030). Textos em `src/strings/`; o fluxo nunca bloqueia: tudo tem **Pular**.

## Sequência
1. **Landing** (visitante sem login, `/`): proposta de valor, CTA "Criar minha conta grátis", CTA "Recebi um convite" (ver `10-auth-family.md`).
2. **Entrar ou criar grupo** (`/entrar` → tela do Grupo sem grupo): duas ou três frases curtas (lista compartilhada pelo grupo, todos veem e editam juntos, funciona sem internet). Não fala da Despensa. A ação principal fica acima da dobra em 375×667.
3. **Boas-vindas** (`/boas-vindas`), logo depois de **criar ou entrar** em um grupo.
4. **Sugestão de itens** (`/sugestao`), só para grupo vazio.
5. **Lista**, com estado vazio guiado.

## Boas-vindas (S-110, S-116)
- **Modal flutuante** sobre a navegação (reaproveita o visual de `overlay.css`): cobre a barra inferior, sem rolagem da página, `role="dialog"` e `aria-modal`.
- Três passos deslizáveis (toque nos botões ou arrastar): (1) adicionar itens, incluindo colar uma lista; (2) riscar no mercado; (3) **Despensa**.
- "Passo N de 3" e **Pular** em todos os passos; Voltar/Próximo; o último termina em "Começar".
- Passo 3 sempre aparece. Com a Despensa desligada no grupo oferece **"Usar a Despensa"** (liga `recurringEnabled`, ADR-0028); ligada, só explica.
- Aparece **uma vez por usuário e grupo**, por aparelho (`localStorage`, ADR-0029); marcada ao exibir, não ao terminar. Fora do fluxo criar/entrar, a rota volta à Lista.
- Ao terminar ou pular segue para a sugestão de itens (se couber) ou para a Lista.

## Sugestão de itens essenciais (S-111)
- Para quem **cria** o grupo (ou entra em grupo vazio): categorias recolhíveis, itens marcados e editáveis, "marcar todos" por categoria, botões **Começar vazia** e **Adicionar N itens**.
- Itens entram na lista de hoje pelo fluxo de "adicionar vários" (S-093); as categorias usadas são criadas junto (grupo novo nasce sem categorias).
- Quem entra em grupo que já tem itens não vê a tela. Vista uma vez por usuário e grupo (também em `localStorage`).
- O modelo da lista é **dado** (`src/data/suggested.ts`): hoje só "família brasileira"; novos modelos entram sem mexer na tela.

## Estado vazio da Lista (S-112)
Lista sem itens mostra texto curto e o botão **Adicionar primeiro item**, que leva o foco ao campo de adicionar.

## Tela do Grupo (S-108, S-118)
De cima para baixo: **Ir para a lista**; **membros** (colapsável, começa recolhido); **Categorias**; **Renomear grupo** (só o criador, ADR-0030); **Usar a Despensa** (switch com explicação curta); convite; criar novo / entrar em outro grupo. Membros, Categorias, Renomear e o switch usam o mesmo componente de linha (`GroupRow`).

## Despensa nos textos (S-107, S-115)
A aba se chama **Despensa**; "Não pode faltar" é o nome curto dos itens que moram nela. Rótulos usam "Usar a Despensa" e "Não pode faltar"; "recorrente" não aparece como nome da função na UI.

## Fora do escopo (to-dos)
- S-113: analytics de primeiro uso. S-114: boas-vindas versionadas (novos veem tudo, antigos só a novidade). Ambos exigem ADR.
