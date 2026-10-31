# Rules: front-end

- Mobile-first; touch targets ≥48px; high contrast; market mode usable one-handed, no forms.
- Optimistic updates; the UI never waits for the network. Show a discreet offline indicator.
- All user-visible strings in pt-BR, kept in one i18n/strings module.
- Service worker + manifest changes need a PWA E2E check (manifest, active SW, offline reload) in the story's acceptance criteria (ADR-0006; Lighthouse 12 dropped the PWA category).
- Components ≤300 lines; one screen per folder under `src/screens/`.
