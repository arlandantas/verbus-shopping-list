# 0005 — Organização de `src/` e `tests/`

**Status:** aceito · **Data:** 2026-10-31 · **Autor:** arquiteto

## Contexto
Builders diferentes, uma história por sessão: precisam saber onde cada coisa vive sem ler o repositório inteiro.

## Decisão
```
src/
  main.tsx              entrada; registra SW
  app/                  App.tsx, rotas (routes.tsx), providers (AuthProvider, FamilyProvider)
  screens/<Screen>/     uma tela por pasta (Login, Family, List, Market...), componente + hooks locais
  components/           componentes reutilizáveis sem acesso a dados
  data/                 acesso ao Firestore: firebase.ts (init), converters.ts, <entidade>.ts (repositórios)
  domain/               lógica pura sem Firebase/React (parser de texto livre, código de convite...)
  hooks/                hooks genéricos (useOnlineStatus...)
  strings/pt-BR.ts      todos os textos visíveis
tests/
  rules/                testes das regras (@firebase/rules-unit-testing, emulador)
  data/                 testes da camada data/ contra o emulador
  e2e/                  Playwright (viewport mobile)
```
- Testes unitários ficam ao lado do arquivo (`*.test.ts(x)`).
- `screens/` e `components/` só falam com o Firestore via `data/` (nunca importam `firebase/firestore` direto). Regra checada por ESLint (`no-restricted-imports`).
- Rotas (pt-BR na URL): `/entrar`, `/familia`, `/convite/:code`, `/` (lista).
- Alias `@/` → `src/`.

## Alternativas consideradas
- Organização por feature (`features/items/...`): boa para apps grandes; aqui as telas já são as fronteiras.

## Consequências
- `domain/` testável sem emulador; `data/` testável sem UI.
