# Estado atual

**Fase:** M0 e M1 concluídos (S-001…S-012), exceto S-014 (regras: uma família por usuário) e
S-013 (projeto Firebase real, espera input). E-M2 detalhado pelo Arquiteto em S-015…S-021.
**Próximo passo:** builder executa **S-014** (`docs/backlog/stories/S-014.md`) e segue a ordem de
`backlog/index.md` (S-015 → S-021). S-017 (domínio puro) não depende das regras e pode ser adiantada.

## Decisões vigentes
- Stack (ADR-0002). users/families/invites + regras sem Cloud Functions (ADR-0003, emenda 0007).
- Offline via cache persistente do Firestore, escritas sem `await` (ADR-0004). Layout `src/` (ADR-0005).
- Emuladores `demo-verbus`, scripts e CI (ADR-0006).
- Itens: forma e regras de `families/{F}/items`, unidades fechadas, marcação por campo (ADR-0008).
- Autocompletar via `families/{F}/catalog/{nameKey}` gravado no mesmo batch do item; item sem
  `cycle` (ciclo nasce no fechamento, M5); categorias e agrupamento ficam para E-M5 (ADR-0009).

## Autonomia
S-014…S-021 rodam só com emuladores, sem input do usuário. S-013 pode correr em paralelo
quando o usuário fornecer os dados abaixo. Após S-021 o Arquiteto detalha E-M3/E-M4.

## Inputs do usuário pendentes (não bloqueiam M2)
- S-006: repositório remoto no GitHub para o CI rodar de fato.
- S-013: projeto Firebase (ID, região sugerida `southamerica-east1`), provedores Google +
  e-mail/senha ativos, config web, `pnpm firebase login` na máquina do usuário.
- Ícones finais do PWA (hoje placeholders de `scripts/gen-icons.mjs`).

## Ambiente verificado
Node 22, pnpm 11, JDK 21 presentes. Repo git local em `main`, sem remoto.
