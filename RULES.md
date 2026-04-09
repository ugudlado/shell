# RULES

Hard constraints when working in this repository.

1. **Single source of truth** — `spec/project.yaml` holds all project context (vision, architecture, rules, learnings, gotchas). CLAUDE.md and AGENTS.md are pointers. Do not duplicate project context elsewhere.

2. **Spec-first for Spec work** — under `spec/`, treat schemas, step YAML, and templates as the contract. Do not skip documented phases or gates without explicit human decision.

3. **Stow vs Claude boundaries** — `src/home/` is GNU Stow → `$HOME`. Claude Code config lives under `src/claude/` and is symlinked by `configure_claude_code()`, not stowed.

4. **Evidence before claims** — run checks, read outputs, cite paths. Prefer `make doctor` or project verify commands over "should work."

5. **Minimal diffs** — change only what the task requires; avoid unrelated formatting or file churn.

6. **Secrets and machine-specific state** — do not commit API keys, tokens, or host-specific paths.

7. **Hooksmith edits** — if you touch `src/hooksmith/`, run `hooksmith build` so rules compile to hooks.
