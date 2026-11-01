# Estado atual

**Fase:** MVP (M0–M5) implementado; 1ª rodada de testes manuais feita. Foco atual: épico E-UX (redesign Material 3), prioridade para o MVP ser compartilhável com a família.
**Última verificação (2026-10-31):** `pnpm check` verde e `pnpm test:e2e` 78/78 (antes do redesign).

## Próximo passo
Plano E-UX aprovado (S-051..S-068, ADR-0018..0022). Manager loop a partir de S-051 (builder → reviewer), uma história por vez (todas mexem nas mesmas telas).

## Decisões do redesign
- Material 3 básico, componentes próprios, ícones SVG inline (ADR-0018). Cor semente `#1816a6` provisória (discutível).
- Abas inferiores fixas; Home e "Ir ao mercado" fundidas em lista única (ADR-0019, aprovado).
- Sheet "Editar item" reaproveitável, renomear item (ADR-0020). Editar linhas do histórico (ADR-0021).
- Valor independente do carrinho: preço em pendente aceito, desmarcar não limpa (ADR-0022). Snackbar "Desfazer" ao marcar (ADR-0019).

## Depois do E-UX
E-SEC (segurança, ADR-0016/0017), M6 (aviso iOS, polimento PWA), S-013 (Firebase real). Épicos futuros: E-LISTS (várias listas por família), E-MCP (integração com agentes de IA).

## Pendências do usuário (nada bloqueia o teste local)
- S-013: projeto Firebase (ID, região sugerida `southamerica-east1`), Google + e-mail/senha ativos, config web, `firebase login`.
- Remoto no GitHub para o CI (S-006). Ícones finais do PWA e nome de marca. Teste em iPhone real.

## Ambiente
Node 22, pnpm 11, JDK 21. Repo git local em `main`, sem remoto. Testes: `pnpm dev:local`, `docs/manual-test.md`.
