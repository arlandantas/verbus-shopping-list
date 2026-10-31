# Estado atual

**Fase:** planejamento M0–M1 concluído pelo Arquiteto; nenhum código ainda.
**Próximo passo:** builder executa **S-001** (`docs/backlog/stories/S-001.md`) e segue a ordem de `backlog/index.md`.

## Decisões vigentes
- Stack confirmada (ADR-0002). Modelo users/families/invites + regras sem Cloud Functions (ADR-0003).
- Offline via cache persistente do Firestore, escritas sem `await` (ADR-0004). Layout `src/` (ADR-0005).
- Emuladores com projeto `demo-verbus` (sem login), scripts e CI (ADR-0006).

## Autonomia
S-001…S-012 rodam só com emuladores, sem input do usuário. Após S-012 o M2 pode começar
(o Arquiteto detalha E-M2 em histórias) em paralelo à S-013.

## Inputs do usuário (não bloqueantes ainda)
- S-006: repositório remoto no GitHub para o CI rodar de fato.
- S-013: projeto Firebase (ID, região), provedores Google + e-mail/senha ativos, config web, `firebase login`.

## Ambiente verificado
Node 22, pnpm 11, JDK 21 presentes. Repo git local em `main`, sem remoto.
