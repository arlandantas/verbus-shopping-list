# 0006 — Emuladores, scripts de teste e CI

**Status:** aceito · **Data:** 2026-10-31 · **Autor:** arquiteto

## Contexto
Máxima autonomia: o máximo do trabalho deve rodar sem projeto Firebase real nem credenciais. Testes nunca chamam Firebase real (rules/testing.md).

## Decisão
- `.firebaserc` com projeto padrão **`demo-verbus`**: o prefixo `demo-` faz os emuladores rodarem sem login nem projeto real. O projeto real entra só como alias `prod` (S-013).
- `firebase.json`: emuladores `auth` 9099, `firestore` 8080, UI desligada em CI; `firestore.rules` na raiz; `hosting.public = dist` com rewrite SPA.
- App usa emuladores quando `VITE_USE_EMULATOR=true` (`.env.development` versionado só com chaves fake do `demo-verbus`; config real em `.env.production`, valores web públicos, fornecidos pelo usuário).
- Scripts (`package.json`):
  - `test` → Vitest unitário (sem emulador)
  - `test:rules` → `firebase emulators:exec --only firestore "vitest run --project rules"`
  - `test:data` → `firebase emulators:exec --only auth,firestore "vitest run --project data"`
  - `test:e2e` → `firebase emulators:exec --only auth,firestore "playwright test"` (Playwright sobe `vite preview` do build em modo emulador)
  - `check` → lint + typecheck + test + test:rules + test:data
- Projetos Vitest separados (`unit`, `rules`, `data`) num só `vitest.config.ts`.
- CI (GitHub Actions, `.github/workflows/ci.yml`): Node 22, pnpm, JDK 21 (temurin), cache do pnpm e dos binários do emulador; roda `check` e `test:e2e` em push/PR. Sem segredos no CI do MVP; deploy é manual (S-013).
- Verificação PWA: o Lighthouse 12 removeu a categoria PWA; a checagem é um E2E que valida manifest (name, icons 192/512, `display: standalone`), SW ativo e recarga offline do app shell.

## Alternativas consideradas
- Projeto Firebase real de testes: exige credenciais e custa cota; quebra a autonomia.
- Deploy automático no CI: exige token/segredo do usuário; adiar até após o MVP.

## Consequências
- Tudo até a S-012 roda localmente sem input do usuário (Java 21 já presente na máquina).
- Rodar o CI de fato exige um remoto GitHub (input do usuário, não bloqueante).
