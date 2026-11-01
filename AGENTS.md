# verbus-shopping-list

Family shared shopping-list PWA (React + Vite + TS, Firebase Auth + Firestore with offline persistence).
Language: specs/docs in pt-BR; code, identifiers, commits in English; UI strings in pt-BR.
This file follows the AGENTS.md convention and is the single entry point for any coding agent.

## Map (read only what your task needs; never read whole dirs)

- `docs/STATE.md` — current focus and next step (overwritten, ≤40 lines)
- `docs/backlog/index.md` — one line per story. `docs/backlog/stories/S-NNN.md` — one story
- `docs/spec/` — one file per feature (≤120 lines). `docs/spec/README.md` lists them
- `docs/adr/` — one decision per file. `docs/adr/README.md` is the index
- `docs/agents/` — role definitions (architect, builder, reviewer, researcher)
- `docs/rules/` — topic rules, read only when the task touches that area (table below)
- `docs/roadmap.md` — milestones. `docs/templates/` — story and ADR templates

## Topic rules

| When you touch                                  | Read                      |
| ----------------------------------------------- | ------------------------- |
| `firestore.rules`, data layer, `tests/rules/**` | `docs/rules/firestore.md` |
| `src/**`, `public/**`, `index.html`             | `docs/rules/frontend.md`  |
| any test file                                   | `docs/rules/testing.md`   |

## Commands

- `pnpm install` — install deps (CI: `--frozen-lockfile`)
- `pnpm dev` — Vite only, NO emulators (login fails with emulator mode on); for manual tests use `pnpm dev:local`
- `pnpm dev:local` — emulators + idempotent seed (`scripts/seed/`) + Vite, with the emulator-only quick-login panel (S-050); Ctrl+C stops all
- `pnpm build` — typecheck + production build
- `pnpm typecheck` — `tsc --noEmit` (strict)
- `pnpm test` — Vitest (unit project, no emulator)
- `pnpm test:rules` — Firestore emulator + Vitest rules project (needs JDK 21)
- `pnpm test:data` — Auth + Firestore emulators + Vitest data project (needs JDK 21)
- `pnpm test:e2e` — emulators + Playwright (Pixel 7, Chromium; first run: `pnpm exec playwright install chromium`)
- `node scripts/gen-icons.mjs` — regenerate placeholder PWA icons (final icons come from the user)
- `pnpm lint` — ESLint (flat config) · `pnpm format` / `pnpm format:check` — Prettier
- `pnpm check:bundle` — builds in a temp dir and fails if the prod bundle has test accounts/panel/emulator hosts (S-086)
- `pnpm check` — lint + typecheck + test + test:rules + test:data
- `pnpm ci:local` — mirror of the CI (gitleaks if installed, audit, check, check:bundle, e2e; `--skip-e2e`). No git hook

## Size limits (split before exceeding)

AGENTS.md ≤80 lines · spec ≤120 · story ≤60 · ADR ≤40 · STATE ≤40 · source file ≤300 (`firestore.rules` exempt: Firebase takes a single file; keep it sectioned by collection and put shared validators at the top).
Logs and history live in git, not in docs. Never append to STATE.md; rewrite it.

## Manager loop (the orchestrating agent)

1. Read STATE.md, then the next `todo` line in backlog/index.md.
2. Delegate to the `builder` role with: story id + the spec/ADR paths the story lists. Nothing else.
3. Delegate the diff to the `reviewer` role. Max 2 builder↔reviewer rounds, then ask the user.
4. On approval: set status `done` in index.md, rewrite STATE.md, commit.
5. Before closing a delivery or release round (and before any push to main that deploys): run `pnpm ci:local` and report its summary; never skip a failed step.
6. Decide reversible choices alone and record them as an ADR. Ask the user only when blocked
   (credentials, Firebase project, real devices, real NFC-e samples, scope changes).

## Roles (`docs/agents/`)

Tiers, not vendors: architect = high-reasoning (rare) · builder, reviewer = standard · researcher = fast/cheap.
Role output ≤150 words: result, files touched, open issues. No file dumps.

## Git

Atomic commits: one coherent idea each (a story, or a docs/config theme), no micro-commits.
Conventional style in English: `feat: ...`, `docs: ...`, `chore: ...`; stories use `S-NNN: ...`.

## Current phase (ADR-0023, amends ADR-0017)
Security hardening resumed: E-SEC stories run now; adversarial review applies again to stories touching `firestore.rules`. Spec: `docs/spec/85-security.md`.

## Non-negotiables

Firestore rules deny by default; only family members access family data. Cloud is source of truth.
Mobile-first, one-hand market mode, optimistic UI. Never store CPF from invoices. Never commit secrets.
