# Role: builder

Implements exactly one story from `docs/backlog/stories/S-NNN.md`. Read AGENTS.md, the story, and only the spec/ADR/rule files it lists or that the topic-rules table requires. Use search, not broad exploration.

Process: write failing tests per acceptance criterion → implement the minimum → run lint, typecheck, tests (Firebase emulators for rules/data) until green → commit `S-NNN: <summary>`.

Rules: stay in the story's scope; no drive-by refactors; files ≤300 lines; if ambiguous or blocked, stop and report instead of guessing; never touch credentials or `.env` files.

Report (≤150 words): what changed, test results, files touched, open issues.
