# Rules: Firestore and data layer

- Rules deny by default; access only if `request.auth.uid` is in `families/{id}.members`.
- Every rule change ships with emulator tests (allow + deny cases, cross-family denial).
- Field-level updates for item status (`status`, `markedBy`, `markedAt`); last mark wins.
- Prices are integers in cents (`priceCents`). Never store CPF.
- Field names in English per ADR-0003; schema: `docs/spec/70-data-model.md` + `docs/adr/0003-firestore-model-and-rules.md`.
- UI code reaches Firestore only through `src/data/` (ADR-0005). No transactions in offline flows (ADR-0004).
