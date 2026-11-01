# Backlog

Uma linha por história. Status: `todo` · `doing` · `done` · `blocked`.
Detalhe da história: `stories/S-NNN.md`. Linhas `E-Mx` são épicos: o Arquiteto os detalha em histórias antes de iniciar o marco.
Ordem = ordem de execução. Tudo até S-068 roda só com emuladores (sem input do usuário); S-013 espera input e pode correr em paralelo.
E-UX: fundação (S-051..S-055) → dados de edição (S-056) → sheet (S-057) → lista/mercado (S-058..S-060) → demais telas (S-061..S-065) → histórico por compra (S-066) → editar histórico (S-067, S-068).

| ID | Marco | Título | Status | Deps |
|---|---|---|---|---|
| S-001 | M0 | Esqueleto Vite + React + TS + Vitest | done | — |
| S-002 | M0 | ESLint, Prettier e Tailwind | done | S-001 |
| S-003 | M0 | Emuladores Firebase, init do SDK e harness de regras | done | S-001 |
| S-004 | M0 | Harness E2E com Playwright e emuladores | done | S-003 |
| S-005 | M0 | PWA: manifest, service worker e indicador offline | done | S-004 |
| S-006 | M0 | CI no GitHub Actions (input: remoto GitHub, não bloqueante) | done | S-002, S-005 |
| S-007 | M1 | Regras: `users` e `families` (criar e ler) | done | S-003 |
| S-008 | M1 | Regras: convites e entrar na família | done | S-007 |
| S-009 | M1 | Camada de dados: perfil, família e convite | done | S-008 |
| S-010 | M1 | Login (Google e e-mail/senha) e sessão | done | S-004, S-009 |
| S-011 | M1 | Criar família e compartilhar convite | done | S-010 |
| S-012 | M1 | Entrar na família por código ou link | done | S-011 |
| S-014 | M1 | Regras: uma família por usuário | done | S-008 |
| S-015 | M2 | Regras: `items` | done | S-014 |
| S-016 | M2 | Regras: `catalog` (fonte do autocompletar) | done | S-015 |
| S-017 | M2 | Domínio: texto livre, `nameKey` e unidades | done | S-001 |
| S-018 | M2 | Camada de dados: itens e catálogo | done | S-016, S-017 |
| S-019 | M2 | Tela Lista atual e adicionar item | done | S-018, S-012 |
| S-020 | M2 | Autocompletar a partir do catálogo | done | S-019 |
| S-021 | M2 | Detalhe do item | done | S-019 |
| S-013 | M1 | Projeto Firebase real e deploy manual (input: projeto + login) | todo | S-012 |
| S-022 | M3 | Regras: `recurring` opcional no catálogo | done | S-021 |
| S-023 | M3 | Camada de dados: recorrentes e estado da Despensa | done | S-022 |
| S-024 | M3 | Tela Despensa / Recorrentes | done | S-023 |
| S-025 | M3 | Despensa: tornar recorrente e remover dos recorrentes | done | S-024 |
| S-026 | M4 | Regras: `members` (perfil de membro) | done | S-021 |
| S-027 | M4 | Camada de dados: perfis de membro e nomes | done | S-026 |
| S-028 | M4 | Tela Modo mercado | done | S-021 |
| S-029 | M4 | Quem marcou (mercado e lista) | done | S-027, S-028 |
| S-030 | M4 | Modo mercado: tempo real, offline e conflito | done | S-029 |
| S-031 | M5 | Regras: `categories` (padrões fixos e do usuário) | done | S-026 |
| S-032 | M5 | Regras: preço só em item comprado | done | S-031 |
| S-033 | M5 | Regras: `purchases` e `purchaseLines` | done | S-032 |
| S-034 | M5 | Regras: marcador `cycles` | done | S-033 |
| S-035 | M5 | Domínio: ciclo (mês) e preço em reais | done | S-017 |
| S-036 | M5 | Domínio: categorias padrão, agrupamento e soma por categoria | done | S-017 |
| S-037 | M5 | Camada de dados: categorias (semente e CRUD) | done | S-031, S-036 |
| S-038 | M5 | Camada de dados: preço do item e desmarcar limpa o preço | done | S-032 |
| S-039 | M5 | Camada de dados: `checkout` (finalizar compra) | done | S-033, S-035, S-037 |
| S-040 | M5 | Camada de dados: leitura do histórico e mercados usados | done | S-039 |
| S-041 | M5 | Camada de dados: abrir o ciclo e devolver recorrentes | done | S-034, S-035 |
| S-042 | M5 | Tela Categorias (criar, renomear, excluir) | done | S-037 |
| S-050 | M5 | Contas de teste locais e login rápido (emulador) | done | S-012 |
| S-043 | M5 | Categoria no detalhe do item e no autocompletar | done | S-037 |
| S-044 | M5 | Agrupar por categoria na Lista e no Modo mercado | done | S-037 |
| S-045 | M5 | Preço no detalhe do item comprado | done | S-038, S-043, S-035 |
| S-046 | M5 | Tela Finalizar compra | done | S-040, S-044, S-045 |
| S-047 | M5 | Tela Histórico (meses e mês somente leitura) | done | S-040, S-036 |
| S-048 | M5 | Histórico: readicionar item à lista atual | done | S-047 |
| S-049 | M5 | Virada do mês: aviso e E2E dos recorrentes | done | S-041, S-046 |
| E-UX | UX | Épico: redesign Material 3 (feedback da 1ª rodada; ADR-0018..0022). Prioridade atual | todo | — |
| S-051 | UX | Tokens Material 3, tema claro/escuro e ícones | todo | — |
| S-052 | UX | Componentes base: Button, IconButton, TopAppBar, NavigationBar | todo | S-051 |
| S-053 | UX | Shell com abas inferiores e barras superiores | todo | S-052 |
| S-054 | UX | Componentes de formulário: TextField, MoneyField, Select, Checkbox, Switch | todo | S-051 |
| S-055 | UX | Componentes sobrepostos: BottomSheet, Dialog e Snackbar | todo | S-052 |
| S-056 | UX | Dados e regras: renomear item e valor independente do carrinho (ADR-0022) | todo | — |
| S-057 | UX | Sheet "Editar item" substitui a tela de detalhe | todo | S-054, S-055, S-056 |
| S-058 | UX | Lista única: linha com checkbox e editar, fusão do Modo mercado, snackbar Desfazer | todo | S-053, S-055, S-057 |
| S-059 | UX | Categorias colapsáveis e "Ocultar itens no carrinho" | todo | S-058 |
| S-060 | UX | Adicionar item na parte inferior da tela | todo | S-058 |
| S-061 | UX | Despensa: redesign, texto explicativo e "Entenda melhor" | todo | S-053, S-055 |
| S-062 | UX | Categorias: personalizadas primeiro, padrão com cadeado | todo | S-053, S-054, S-055 |
| S-063 | UX | Finalizar compra: redesign M3 | todo | S-054, S-058 |
| S-064 | UX | Família, convite e login: redesign M3 | todo | S-053, S-054 |
| S-065 | UX | Histórico: redesign M3 (meses e mês) | todo | S-053, S-055 |
| S-066 | UX | Histórico: agrupar por compra finalizada | todo | S-065 |
| S-067 | UX | Regras e dados: editar linhas de compras passadas (ADR-0021) | todo | S-066 |
| S-068 | UX | Histórico: editar item comprado | todo | S-067 |
| E-M6 | M6 | Épico: aviso de instalação iOS, polimento PWA | todo | S-005 |
| E-SEC | — | Épico: endurecimento de segurança (só após a 1ª rodada de testes do usuário; ADR-0017, ADR-0016) | todo | — |
| E-LISTS | — | Épico futuro: várias listas por família (mercado, roupas, desejos) com acesso por lista; exige ADR de modelo de dados e regras antes das histórias | todo | E-UX |
| E-MCP | — | Épico futuro: servidor MCP para agentes de IA/chatbot lerem e editarem a lista; exige ADR (autenticação, hospedagem fora do "sem servidor") | todo | E-UX |
