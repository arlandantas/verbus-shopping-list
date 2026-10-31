# Roles

Tool-neutral role definitions. Any agent runtime can load them as a system prompt or task brief.
Tool-specific wrappers (e.g. `.claude/agents/`) must stay thin: frontmatter + "follow docs/agents/<role>.md".

| Role | Tier | Runs | File |
|---|---|---|---|
| architect | high reasoning | project start, milestone boundaries | architect.md |
| builder | standard | once per story | builder.md |
| reviewer | standard (fast for mechanical checks) | after each story | reviewer.md |
| researcher | fast/cheap | on demand | researcher.md |

Claude Code mapping: architect=opus, builder/reviewer=sonnet, researcher=haiku.
Every role: read `AGENTS.md` first, then only the files the task names. Reply ≤150 words.
