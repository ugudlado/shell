# RULES

Hard constraints when working in this repository (and when applying the same standards in other checkouts of it).

1. **Do not edit `src/claude/CLAUDE.md` as a substitute for Cursor docs** — global Claude instructions stay there; Cursor-facing prose lives in `AGENTS.md` / `RULES.md` / `.cursor/rules/`. If both need the same policy, update both deliberately.

2. **Spec-first for Spec work** — under `spec/`, treat schemas, step YAML, and templates as the contract. Do not skip documented phases or gates without an explicit human decision.

3. **Stow vs Claude boundaries** — `src/home/` is GNU Stow → `$HOME`. Claude Code config lives under `src/claude/` and is symlinked by `configure_claude_code()`, not stowed. Do not move Claude-only assets into `src/home/` or vice versa without updating `CLAUDE.md` (repo root) and setup scripts.

4. **Evidence before claims** — run checks, read outputs, cite paths. Prefer `make doctor`, targeted scripts, or project test commands over “should work.”

5. **Minimal diffs** — change only what the task requires; avoid unrelated formatting or file churn.

6. **Secrets and machine-specific state** — do not commit API keys, tokens, or host-specific paths that aren’t already established patterns in this repo.

7. **Hooksmith / Hook edits** — if you touch `src/hooksmith/`, remind the human to run `hooksmith build` where applicable so rules compile to hooks.
