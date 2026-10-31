# Rules: Firestore and data layer

- Rules deny by default; access only if `request.auth.uid` is in `families/{id}.members`.
- Every rule change ships with emulator tests (allow + deny cases, cross-family denial).
- Field-level updates for item status (`status`, `marcadoPor`, `marcadoEm`); last mark wins.
- Prices are integers in cents. Never store CPF.
- Schema source of truth: `docs/spec/70-data-model.md`.
