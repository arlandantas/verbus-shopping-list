# Estado atual

**Fase:** M0, M1 e M2 concluídos (S-001…S-012, S-014…S-021), exceto S-013 (projeto Firebase
real, espera input). E-M3 e E-M4 detalhados pelo Arquiteto em S-022…S-030.
**Próximo passo:** builder executa **S-022** (`docs/backlog/stories/S-022.md`) e segue a ordem de
`backlog/index.md`. M3 (S-022→S-025) e M4 (S-026→S-030) são independentes; S-026 e S-028 podem
ser adiantadas. Depois de S-030 o Arquiteto detalha E-M5.

## Decisões vigentes
- Stack (ADR-0002). users/families/invites + regras sem Cloud Functions (ADR-0003, emenda 0007).
- Offline via cache persistente do Firestore, escritas sem `await` (ADR-0004). Layout `src/` (ADR-0005).
- Emuladores `demo-verbus`, scripts e CI (ADR-0006).
- Itens: forma e regras de `families/{F}/items`, marcação por campo (ADR-0008).
- Catálogo para autocompletar; item sem `cycle` (ciclo nasce no fechamento, M5) (ADR-0009).
- Recorrência mora em `catalog.recurring` (opcional, escritas com `merge`); estado da Despensa é
  derivado da lista, sem campo de ciclo; reinserir recorrentes no novo ciclo é decisão do E-M5 (ADR-0010).
- "Quem marcou" via `families/{F}/members/{uid}.displayName`; modo mercado é outra tela sobre os
  mesmos dados, com `toggleItemStatus` único para Lista e Mercado (ADR-0011).
- Agrupar por categoria, preço e finalizar compra ficam para o E-M5.

## Autonomia
S-022…S-030 rodam só com emuladores, sem input do usuário. S-013 pode correr em paralelo
quando o usuário fornecer os dados abaixo.

## Inputs do usuário pendentes (não bloqueiam M3/M4)
- S-006: repositório remoto no GitHub para o CI rodar de fato.
- S-013: projeto Firebase (ID, região sugerida `southamerica-east1`), provedores Google +
  e-mail/senha ativos, config web, `pnpm firebase login` na máquina do usuário.
- Ícones finais do PWA (hoje placeholders de `scripts/gen-icons.mjs`).

## Ambiente verificado
Node 22, pnpm 11, JDK 21 presentes. Repo git local em `main`, sem remoto.
