# Estado atual

**Fase:** E-UX/E-UX2 concluídos (aguardam 3ª rodada de testes manuais). E-SEC (S-075..S-079, S-084..S-086) e E-M6 (S-080..S-083) concluídos (ADR-0023). E-LISTS / vários grupos (ADR-0024, S-087..S-092) concluído. App já publicado no GitHub Pages; o usuário validou login, adicionar itens e marcar no carrinho (2026-11-01).
**Verificação (2026-11-01):** lint, typecheck, 430 unit, rules 453, data 62, E2E 107/107, `pnpm check:bundle` verde.

## Como testar
`pnpm dev:local` (reinicie se já estiver rodando) + roteiro em `docs/manual-test.md` (atualizado para o Material 3). Contas Ana, Beto, Carla no login (só emulador).

## Publicação
`.github/workflows/deploy-pages.yml` publica no GitHub Pages a cada push em main (base derivada do nome do repo). Falta o usuário: variáveis `VITE_FIREBASE_*` no repositório, Pages com Source = GitHub Actions, domínio no Firebase Auth, projeto Firebase real (S-013).

## Próximo passo
S-093 (colar lista de itens, ADR-0027; ~10 arquivos, pode dividir). Depois: dívidas abaixo, E-MCP, terceira rodada de testes do usuário (grupos, categorias sugeridas).

## Pendências do usuário
- S-013: projeto Firebase (ID, região sugerida `southamerica-east1`), Google + e-mail/senha, config web, `firebase login`; variáveis do Vite no GitHub.
- Ícones finais do PWA, nome de marca, cor final, teste em iPhone real (aviso de instalação, S-080).
- No 1º deploy real: se o login Google violar a CSP, ajustar `vite/csp.ts` (ADR-0026: origens assumidas); rever App Check e proteção contra enumeração de e-mail.

## Dívidas conhecidas
- `Overlay` sem `onClosed`: `signOut` (FamilyScreen) e a navegação do `GroupSwitcher` usam fallback de 500 ms; criar o callback resolve os dois.
- Sair/remover de grupo não existe: ledger `groupIds` é append-only, quem sai não volta (ADR-0024).
- Guarda de paleta só cobre algumas famílias de cor; conferência visual da Despensa colapsável, do aviso iOS e de telas largas não feita no navegador embutido.
- Sessão antiga restaurada após reset dos emuladores deixa o app em "Carregando…" até limpar o storage do site.
- Tokens de cor aproximados à mão: regenerar com Material Theme Builder na cor final.
- `parseQuantity` mora em `components/ItemForm.tsx`: mover para `src/domain`.
- Portas fixas em ~15 arquivos de teste: centralizar em env.
- Riscos aceitos de regras (ADR-0016/0025); ações `actions/*` no CI ainda por tag flutuante.
- Grupos novos nascem sem categorias (sugestões na tela Categorias); grupos legados mantêm as 6 padrão com cadeado.

## Ambiente
Node 22, pnpm 11 (use `CI=true`), JDK 21. Remoto `origin` em arlandantas/verbus-shopping-list.
