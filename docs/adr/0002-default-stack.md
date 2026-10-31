# 0002 — Stack padrão

**Status:** proposto (o Arquiteto confirma ou substitui) · **Data:** 2026-10-31 · **Autor:** gestor

## Contexto
PWA mobile-first, tempo real e offline, sem servidor próprio no MVP (spec 00 e 80).

## Decisão
React + Vite + TypeScript; vite-plugin-pwa (service worker + manifest); Firebase SDK modular (Auth, Firestore com persistência offline); Tailwind CSS; Vitest; Playwright; Firebase Emulator Suite; ESLint + Prettier; pnpm; GitHub Actions para CI.

## Alternativas consideradas
- SvelteKit/Solid: menores, porém ecossistema e familiaridade dos agentes menores.
- Next.js: SSR desnecessário para um PWA com dados privados.

## Consequências
- Boa cobertura de documentação para agentes; build simples; deploy estático (Firebase Hosting).
