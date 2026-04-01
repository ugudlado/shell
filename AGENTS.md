# AGENTS.md

Cursor and other tools: use this file as the **repo-level** instruction set for the **shell** dotfiles project. Claude Code in this workspace still uses `src/claude/CLAUDE.md` (see dual-source note below).

## What this repository is

- **GNU Stow** maps `src/home/` → `$HOME` (shell, git, ccstatusline, etc.).
- **Claude Code** config is symlinked from `src/claude/` → `~/.claude/` via `configure_claude_code()` in `scripts/setup-common.sh`.
- **OpenSpec** workflow definitions live in `openspec/` (schema-driven specify / implement / complete flows).
- **Hooksmith** YAML rules live in `src/hooksmith/` → `~/.config/hooksmith/`.

## Dual source of truth (Claude vs Cursor)

| Audience | Primary instructions |
|----------|----------------------|
| Claude Code | `src/claude/CLAUDE.md` → `~/.claude/CLAUDE.md` |
| Cursor | This file + `RULES.md` + `SOUL.md` + `.cursor/rules/*.mdc` |

They are **maintained separately** on purpose. Align them when policies should match; it is OK for Claude-only detail to exist only in `CLAUDE.md`.

## Development standards (portable)

1. **Spec-first** when changing OpenSpec artifacts or features driven by `~/.config/openspec/changes/$REPO_NAME/`.
2. **Minimal tasks and minimal diffs** — smallest change that satisfies the request.
3. **Reviews and quality** — treat phase/review gates seriously where the OpenSpec step files define them; use evidence (tests, typecheck, file contents) when claiming completion.
4. **Git discipline** — feature worktrees live under `~/code/feature_worktrees/[FEATURE-ID]` with branches `feature/[FEATURE-ID]` when using this repo’s workflow commands in Claude; merge with `--no-ff` when that workflow applies.
5. **Evidence-based** — run `git status`, read files, run `make doctor` or project checks instead of guessing.

## Workflow Skills (portable)

All workflow entry points are **skills** (`src/claude/skills/*/SKILL.md`) — portable markdown + YAML frontmatter readable by any AI runtime:

| Skill | Purpose |
|-------|---------|
| `develop` | Full feature lifecycle: discovery → design → specify → implement → complete |
| `specify` | Create OpenSpec change + worktree (Discoverer + Architect agents) |
| `implement` | Per-task implementation loop (Implementer → Reviewer → Verifier) |
| `complete-feature` | Archive + merge to main + cleanup |
| `autopilot` | Autonomous product loop: ideate → develop → learn → repeat |
| `ideate` | Generate ideas and manage product backlog |
| `learn` | Evaluate workflow compliance, update CLAUDE.md with learned rules |

Each SKILL.md has YAML frontmatter with `name`, `description`, `args`, and optional `orchestrator` metadata (phases, state file, resume support). In Claude Code, invoke via `/skill-name`. In Cursor or Codex, read the SKILL.md and follow its phases directly.

## Linear (if relevant)

- **Team:** Home Labs  
- **Ticket prefix:** HL  

## Lessons learned (keep in sync with CLAUDE.md when practical)

- Re-read `package.json` after `pnpm add` before editing — disk may have changed.
- Use `CI=true` with non-interactive `pnpm install`/`add` where appropriate.
- At session start, check `git status` and state whether work is committed or dirty.
- Verify component APIs from source before using props suggested from summaries.
- Prefer `pnpm <script>` from the nearest `package.json` over duplicating tool flags in hooks.

## Setup commands

```bash
make setup    # full install (platform script + stow + Claude + optional Cursor skills)
make deploy   # backup conflicts + stow
make doctor   # health check
```

After changing Hooksmith rules: `hooksmith build` (if you use the Hooksmith plugin).
