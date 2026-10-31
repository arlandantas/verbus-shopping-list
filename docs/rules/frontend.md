# Rules: front-end

- Mobile-first; touch targets ≥48px; high contrast; market mode usable one-handed, no forms.
- Optimistic updates; the UI never waits for the network. Show a discreet offline indicator.
- All user-visible strings in pt-BR, kept in one i18n/strings module.
- Service worker + manifest changes need a Lighthouse PWA check in the story's acceptance criteria.
- Components ≤300 lines; one screen per folder under `src/screens/`.
