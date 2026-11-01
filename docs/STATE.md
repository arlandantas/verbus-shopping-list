# Estado atual

**Fase:** E-UX/E-UX2 concluídos (aguardam 3ª rodada de testes manuais). E-SEC (S-075..S-079, S-084..S-086) e E-M6 (S-080..S-083) concluídos (ADR-0023). Em seguida: E-LISTS / vários grupos (ADR-0024, S-087..S-092).
**Verificação (2026-11-01):** lint, typecheck, 430 unit, rules 453, data 62, E2E 107/107, `pnpm check:bundle` verde.

## Como testar
`pnpm dev:local` (reinicie se já estiver rodando) + roteiro em `docs/manual-test.md` (atualizado para o Material 3). Contas Ana, Beto, Carla no login (só emulador).

## Publicação
`.github/workflows/deploy-pages.yml` publica no GitHub Pages a cada push em main (base derivada do nome do repo). Falta o usuário: variáveis `VITE_FIREBASE_*` no repositório, Pages com Source = GitHub Actions, domínio no Firebase Auth, projeto Firebase real (S-013).

## Próximo passo
S-087..S-092 (vários grupos por usuário, seletor de grupo, categorias como sugestões). Depois: dívidas abaixo, S-013, E-MCP.

## Pendências do usuário
- S-013: projeto Firebase (ID, região sugerida `southamerica-east1`), Google + e-mail/senha, config web, `firebase login`; variáveis do Vite no GitHub.
- Ícones finais do PWA, nome de marca, cor final, teste em iPhone real (aviso de instalação, S-080).
- No 1º deploy real: se o login Google violar a CSP, ajustar `vite/csp.ts` (ADR-0026: origens assumidas); rever App Check e proteção contra enumeração de e-mail.

## Dívidas conhecidas
- `Overlay` sem `onClosed`: `signOut` do diálogo de sair usa fallback de 500 ms.
- Guarda de paleta só cobre algumas famílias de cor; conferência visual da Despensa colapsável, do aviso iOS e de telas largas não feita no navegador embutido.
- Sessão antiga restaurada após reset dos emuladores deixa o app em "Carregando…" até limpar o storage do site.
- Tokens de cor aproximados à mão: regenerar com Material Theme Builder na cor final.
- `parseQuantity` mora em `components/ItemForm.tsx`: mover para `src/domain`.
- Portas fixas em ~15 arquivos de teste: centralizar em env.
- Riscos aceitos de regras (ADR-0016/0025); ações `actions/*` no CI ainda por tag flutuante.
- Famílias criadas antes do S-037 não têm categorias padrão.

## Ambiente
Node 22, pnpm 11 (use `CI=true`), JDK 21. Remoto `origin` em arlandantas/verbus-shopping-list.
