# Estado atual

**Fase:** E-UX (redesign Material 3, S-051..S-068) e E-UX2 (ajustes da 2ª rodada, S-069..S-074) concluídos; aguardando a 3ª rodada de testes manuais do usuário.
**Verificação (2026-11-01):** lint, typecheck, 402 unit e E2E completo 100/100 (rodados direto no repo; o `dev:local` é só dev e os agentes podem pará-lo/reiniciá-lo); regras 319 e dados 61 (S-067).

## Como testar
`pnpm dev:local` (reinicie se já estiver rodando) + roteiro em `docs/manual-test.md`, que ainda descreve as telas antigas (Home/Mercado) e precisa ser atualizado. Contas Ana, Beto, Carla no login (só emulador).

## O que mudou no E-UX
Material 3 (ADR-0018, cor semente `#1816a6` provisória), abas inferiores e lista única casa+mercado (ADR-0019), sheet "Editar item" com renomear e checkbox de carrinho (ADR-0020), valor independente do carrinho (ADR-0022), histórico agrupado por compra e edição de linhas passadas (ADR-0021).

## Próximo passo
Feedback da 2ª rodada de testes. Depois: manual-test.md atualizado, dívidas abaixo, E-SEC (ADR-0016/0017), M6 (aviso iOS, polimento PWA), S-013 (Firebase real). Futuro: E-LISTS (várias listas), E-MCP (agentes de IA).

## Pendências do usuário
- S-013: projeto Firebase (ID, região sugerida `southamerica-east1`), Google + e-mail/senha, config web, `firebase login`.
- Remoto no GitHub (CI S-006), ícones finais do PWA, nome de marca, teste em iPhone real, escolha da cor final.

## Dívidas conhecidas
- `Overlay` sem callback `onClosed`: `signOut` do diálogo de sair usa fallback de 500 ms (FamilyScreen).
- Guarda de paleta (tests/tooling.test.ts) só cobre gray/green/red/blue/slate/zinc/neutral/white/black; foco da pílula de adicionar só testado por CSS.
- Conferência visual no navegador embutido da Despensa colapsável (S-074) e das telas largas ainda por fazer (o pane ficou oculto/instável); coberto só por E2E.
- Sessão antiga restaurada após reset dos emuladores deixa o app em "Carregando…" até limpar o storage do site (login rápido troca de uid).
- `OfflineBadge` e `WriteErrorNotice` usam o mesmo `bottom` do campo de adicionar item e podem sobrepô-lo.
- Tokens de cor aproximados à mão: regenerar com Material Theme Builder na cor final.
- `parseQuantity` mora em `components/ItemForm.tsx` e é importado por `EditLineSheet`: mover para `src/domain`.
- Esc do `EditLineSheet` sem teste próprio; E2E depende de cópia com portas alternativas (portas fixas em ~15 arquivos): centralizar em env.
- Famílias criadas antes do S-037 não têm categorias padrão (sem dados reais).

## Ambiente
Node 22, pnpm 11 (use `CI=true`), JDK 21. Repo git local em `main`, sem remoto.
