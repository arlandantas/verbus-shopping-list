# Estado atual

**Fase:** Épicos E-UX, E-UX2, E-SEC, E-M6, E-LISTS marcados `done` no backlog; E-UX/E-UX2 concluídos (aguardam 3ª rodada de testes manuais). E-SEC (S-075..S-079, S-084..S-086) e E-M6 (S-080..S-083) concluídos (ADR-0023). E-LISTS / vários grupos (ADR-0024, S-087..S-092) concluído. App publicado no Firebase Hosting (workflow do GitHub Pages removido em 2026-11-02); o usuário validou login, adicionar itens e marcar no carrinho (2026-11-01).
**Verificação (2026-11-01):** lint, typecheck, 430 unit, rules 453, data 62, E2E 107/107, `pnpm check:bundle` verde.

## Como testar
`pnpm dev:local` (reinicie se já estiver rodando) + roteiro em `docs/manual-test.md` (atualizado para o Material 3). Contas Ana, Beto, Carla no login (só emulador).

## Publicação
Deploy manual: `pnpm deploy` (hosting) e `firebase deploy --project prod --only firestore:rules`. Sem workflows no GitHub: `pnpm ci:local` é o CI (ADR-0031).

## Próximo passo
Nada em andamento. Publicado em https://nossocarrinho.web.app (Firebase Hosting + regras, `pnpm deploy` / `firebase deploy --project prod --only firestore:rules,hosting`) até a S-101. S-093 (colar lista), S-094 (Despensa por categoria) e S-095 (landing), S-098 (paleta verde), S-100 (nome Nosso Carrinho + ícone) e S-101 (aviso de instalação) concluídas e publicadas em 2026-11-01. S-102 (barra escura, splash, toggle) e S-103 (padding inferior central, Quantidade/Unidade lado a lado, rótulo Observação, ícone mais forte) publicadas em 2026-11-02; usuário confirma no Android (barra, último item, margens, ícone; pode precisar reinstalar). S-104 (scroll após modal, ordem alfabética, margens das linhas, manifest escuro) publicada em 2026-11-02. S-105 (recorrência opcional por grupo, ADR-0028, regras) publicada em 2026-11-02. Fila: E-ONB (primeiro acesso, 2026-11-02) concluído: S-107..S-112 (texto "Não pode faltar", tela do Grupo, apresentação, estado vazio, boas-vindas ADR-0029, itens essenciais). Publicado em 2026-11-02 (hosting; sem mudança de regras); `pnpm ci:local` verde. V0 pronta para usuários de teste. S-119 (landing atualizada + rodapé do autor) concluída. A fazer: S-120 (sair/apagar grupo). S-115..S-118 (texto do switch "Usar a Despensa", boas-vindas em modal, Despensa manual + "Marcar todos como faltando" sem retorno mensal automático, criador renomeia o grupo; ADR-0030, regras novas) concluídas em 2026-11-02. To-dos: S-113 analytics, S-114 boas-vindas versionadas. Decidido: o toggle fica no formulário de criar grupo. Antes: S-106 (apagado fora do histórico, regras; decidir marcar x apagar linhas). Todo pós-MVP: S-096, S-097, S-099 (i18n pt/en/es). Depois: 3ª rodada de testes do usuário, dívidas abaixo, E-MCP.

## Pendências do usuário
- Ícone final do PWA (hoje: carrinho simples branco sobre verde, placeholder gerado por `scripts/gen-icons.mjs`), teste em iPhone real (aviso de instalação, S-080).
- No 1º deploy real: se o login Google violar a CSP, ajustar `vite/csp.ts` (ADR-0026: origens assumidas); rever App Check e proteção contra enumeração de e-mail.

## Dívidas conhecidas
- `Overlay` sem `onClosed`: `signOut` (FamilyScreen) e a navegação do `GroupSwitcher` usam fallback de 500 ms; criar o callback resolve os dois.
- Sair/remover de grupo não existe: ledger `groupIds` é append-only, quem sai não volta (ADR-0024).
- Guarda de paleta só cobre algumas famílias de cor; conferência visual (Despensa agrupada, folha 'Colar lista', aviso iOS, telas largas) não feita no navegador embutido; só E2E.
- Sessão antiga restaurada após reset dos emuladores deixa o app em "Carregando…" até limpar o storage do site.
- Cores vêm do doc do designer (S-098); papéis que o doc omite foram derivados da mesma semente. Ideias não feitas: S-096 (progresso), S-097 (etiquetas), cor por categoria, tipografia Plus Jakarta Sans.
- `parseQuantity` mora em `components/ItemForm.tsx`: mover para `src/domain`.
- Portas fixas em ~15 arquivos de teste: centralizar em env.
- Riscos aceitos de regras (ADR-0016/0025).
- Grupos novos nascem sem categorias (sugestões na tela Categorias); grupos legados mantêm as 6 padrão com cadeado.

## Ambiente
Node 22, pnpm 11 (use `CI=true`), JDK 21. Remoto `origin` em arlandantas/verbus-shopping-list.
