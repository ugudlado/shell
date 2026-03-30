# skills/

This directory exists for **GitAgent-style** layout compatibility.

**Canonical skill packages** for this repo live under **`src/claude/skills/`** (each subfolder with a `SKILL.md`). They are symlinked into `~/.claude/skills/` by `configure_claude_code()` and into **`~/.cursor/skills-cursor/`** by `configure_cursor()` when you run `make setup` / platform setup.

Add Cursor-only skills here only if they must not ship to Claude; otherwise prefer `src/claude/skills/`.
