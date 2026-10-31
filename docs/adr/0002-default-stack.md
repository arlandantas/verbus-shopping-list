# 0002 — Stack padrão

**Status:** aceito · **Data:** 2026-10-31 · **Autor:** gestor (confirmado pelo arquiteto)

## Contexto
PWA mobile-first, tempo real e offline, sem servidor próprio no MVP (spec 00 e 80).

## Decisão
React 19 + Vite + TypeScript (strict); React Router 7 (modo biblioteca, sem SSR); vite-plugin-pwa (service worker + manifest); Firebase SDK modular v11+ (Auth, Firestore com persistência offline); Tailwind CSS v4; Vitest + Testing Library; Playwright; Firebase Emulator Suite (`firebase-tools` como devDependency, nunca global); `@firebase/rules-unit-testing`; ESLint (flat config) + Prettier; pnpm; GitHub Actions para CI; Firebase Hosting para deploy.

Ambiente de referência: Node 22 LTS, pnpm 11, JDK 21 (exigido pelo emulador do Firestore).

Confirmação do arquiteto: nenhum requisito das specs 00–90 pede SSR, servidor ou estado global complexo; a stack cobre offline (Firestore + SW) e testes sem rede (emuladores). Sem estado global extra (Redux/Zustand): contexto React + hooks sobre `onSnapshot` bastam.

## Alternativas consideradas
- SvelteKit/Solid: menores, porém ecossistema e familiaridade dos agentes menores.
- Next.js: SSR desnecessário para um PWA com dados privados.
- TanStack Query sobre Firestore: duplicaria o cache offline do próprio Firestore.

## Consequências
- Boa cobertura de documentação para agentes; build simples; deploy estático (Firebase Hosting).
- Versões exatas fixadas no `package.json` pela S-001; atualizações maiores exigem nova ADR.
