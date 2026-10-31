# Estado atual

**Fase:** M0–M4 concluídos (S-001…S-012, S-014…S-030), exceto S-013 (projeto Firebase real,
espera input). E-M5 detalhado pelo Arquiteto em S-031…S-049 (ADR-0012…0015).
**Próximo passo:** builder executa **S-031** (`docs/backlog/stories/S-031.md`) e segue a ordem de
`backlog/index.md`. Regras S-031→S-034 são sequenciais (mesmo `firestore.rules`); domínio
S-035/S-036 pode ser adiantado. Depois de S-049 o Arquiteto detalha E-M6.

## Decisões vigentes
- Stack (ADR-0002). users/families/invites + regras sem Cloud Functions (ADR-0003, emenda 0007).
- Offline via cache persistente do Firestore, escritas sem `await` (ADR-0004). Layout `src/` (ADR-0005).
- Emuladores `demo-verbus`, scripts e CI (ADR-0006).
- Itens (ADR-0008); catálogo e item sem `cycle` (ADR-0009); recorrência em `catalog.recurring` (ADR-0010).
- "Quem marcou" via `members/{uid}`; Mercado e Lista compartilham `toggleItemStatus` (ADR-0011).
- Finalizar compra: batch(es) de até 200 itens = `purchases` + `purchaseLines/{itemId}` (create-only)
  + delete dos `items`; funciona offline; duplo fechamento negado pela linha create-only (ADR-0012).
- Ciclo = mês local; na 1ª abertura do mês (com rede) um marcador create-only `cycles/{YYYY-MM}`
  e os recorrentes "tenho em casa" voltam como pendentes no mesmo batch (ADR-0013).
- Categorias: 6 padrões fixos semeados no batch de criar família; CRUD só das próprias;
  agrupamento único Lista/Mercado; histórico soma pela cópia `categoryName` (ADR-0014).
- `priceCents` só com `status == 'bought'`; desmarcar limpa o preço; mercado opcional (ADR-0015).

## Autonomia
S-031…S-049 rodam só com emuladores, sem input do usuário. S-013 pode correr em paralelo
quando o usuário fornecer os dados abaixo.

## Inputs do usuário pendentes (não bloqueiam M5)
- S-006: repositório remoto no GitHub para o CI rodar de fato.
- S-013: projeto Firebase (ID, região sugerida `southamerica-east1`), provedores Google +
  e-mail/senha ativos, config web, `pnpm firebase login` na máquina do usuário.
- Ícones finais do PWA (hoje placeholders de `scripts/gen-icons.mjs`).
- Confirmar (reversível): "limpeza e higiene pessoal" virou 2 padrões; padrões não editáveis.

## Ambiente verificado
Node 22, pnpm 11, JDK 21 presentes. Repo git local em `main`, sem remoto.
