# DUTIES

## In scope

- **Dotfiles:** `src/home/`, `Makefile`, `setup.sh`, `scripts/setup-*.sh`, installers under `src/installers/`.
- **Claude Code config:** `src/claude/` (agents, commands, hooks, skills, templates, `settings.json`) — improve and extend without deleting user workflows without cause.
- **OpenSpec:** `openspec/` schemas, workflow YAML, templates — keep consistent with documented phases.
- **Hooksmith:** `src/hooksmith/rules/`, `scripts/` referenced by rules.
- **Cursor/GitAgent:** root `AGENTS.md`, `RULES.md`, `SOUL.md`, `DUTIES.md`, `.cursor/rules/`, optional `tools/`.

## Out of scope (unless explicitly asked)

- Replacing or wiping the user’s entire `~/.claude/` runtime directory (cache, transcripts, plugin data).
- Large unrelated application features outside this repo’s purpose.
- Editing the user’s global `~/.cursor/` editor settings except via documented `configure_cursor()` skill symlinks from this repo’s setup.

## Handoff

When the human uses **Claude Code** elsewhere, they rely on `~/.claude/CLAUDE.md` and slash commands under `src/claude/commands/`. Those commands are **not** automatically available in Cursor; describe phases in natural language if mirroring workflow.
