# 0031 — Produção no Firebase Hosting e CI só local (amenda 0006, 0026)

**Status:** aceito · **Data:** 2026-11-02 · **Autor:** usuário (decisões), builder (registro)

## Contexto
O app roda em produção no Firebase (projeto real, Auth, Firestore, Hosting em https://nossocarrinho.web.app). Os workflows do GitHub (`ci.yml`, `deploy-pages.yml`) deixaram de ser usados: os agentes rodam o espelho local.

## Decisão
- **Hospedagem:** Firebase Hosting (`firebase.json`, `hosting.public = dist`, rewrite SPA). Deploy manual: `pnpm deploy` (build com `VITE_BASE=/` + hosting) e `pnpm exec firebase deploy --project prod --only firestore:rules` quando as regras mudam (regras **antes** do hosting se o cliente depender delas).
- **GitHub Pages abandonado:** `deploy-pages.yml` removido. A CSP segue por `<meta>` (ADR-0026, origens agora conhecidas); cabeçalhos via `firebase.json` ficam como melhoria possível (inclui `frame-ancestors`), sem história aberta.
- **CI só local:** `.github/workflows/ci.yml` removido. `pnpm ci:local` é a porta de qualidade (gitleaks se instalado, audit, check, check:bundle, e2e) e roda antes de fechar entrega e antes de qualquer deploy (AGENTS.md).
- S-013 (projeto Firebase real) conta como feita.

## Consequências
- Sem verificação automática em push/PR; depende da disciplina do manager. O scan de segredos só roda se o `gitleaks` local estiver instalado.
- Variáveis `VITE_FIREBASE_*` vêm do `.env` local no build, não mais do GitHub.
