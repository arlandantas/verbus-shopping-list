# Backlog

Uma linha por história. Status: `todo` · `doing` · `done` · `blocked`.
Detalhe da história: `stories/S-NNN.md`. Linhas `E-Mx` são épicos: o Arquiteto os detalha em histórias antes de iniciar o marco.
Ordem = ordem de execução. Tudo até S-012 roda só com emuladores (sem input do usuário).

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
| S-010 | M1 | Login (Google e e-mail/senha) e sessão | todo | S-004, S-009 |
| S-011 | M1 | Criar família e compartilhar convite | todo | S-010 |
| S-012 | M1 | Entrar na família por código ou link | todo | S-011 |
| S-014 | M1 | Regras: uma família por usuário (achado do revisor, baixo impacto; sem arquivo, Arquiteto detalha) | todo | S-008 |
| S-013 | M1 | Projeto Firebase real e deploy manual (input: projeto + login) | todo | S-012 |
| E-M2 | M2 | Épico: lista atual, adicionar item, texto livre, autocompletar, detalhe | todo | S-012 |
| E-M3 | M3 | Épico: despensa / recorrentes | todo | E-M2 |
| E-M4 | M4 | Épico: modo mercado (tempo real, offline, desfazer) | todo | E-M2 |
| E-M5 | M5 | Épico: finalizar compra, ciclos, histórico, categorias, preço/mercado | todo | E-M4 |
| E-M6 | M6 | Épico: aviso de instalação iOS, polimento PWA | todo | S-005 |
