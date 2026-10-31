# Rules: testing

- TDD: failing test first. Unit: Vitest. Rules/data: Firebase emulator. E2E: Playwright (mobile viewport, offline toggle).
- Tests name the acceptance criterion they cover (`S-NNN AC2: ...`).
- No snapshot tests for logic; no network calls to real Firebase or SEFAZ in CI.
- NFC-e parser tests use saved real-note fixtures in `tests/fixtures/nfce/` (CPF scrubbed).
