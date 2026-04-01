# CLAUDE.md

Dotfiles repo — manages shell config, Claude Code setup, and dev tools across macOS/Linux.

## Architecture

Two strategies for managing config:

| Strategy | Source | Target | Managed by |
|----------|--------|--------|------------|
| GNU Stow | `src/home/` | `$HOME` | `stow_dotfiles_common()` |
| Direct symlinks | `src/claude/` | `~/.claude/` | `configure_claude_code()` |
| Direct symlinks | `src/hooksmith/` | `~/.config/hooksmith/` | `configure_claude_code()` |
| Direct symlinks | `src/linear/config.yaml` | `~/.config/linear/config.yaml` | `configure_claude_code()` |
| GitAgent + Cursor | Repo root (`AGENTS.md`, `RULES.md`, …) + `.cursor/rules/` | (versioned in repo) | Cursor reads in-repo; `configure_cursor()` links skills to `~/.cursor/skills-cursor/` |

Stow handles standard dotfiles (`.zshrc`, `.bashrc`, `.gitconfig`, `.config/ccstatusline/`). Claude Code config uses direct symlinks because `~/.claude/` mixes tracked config with runtime data. **Cursor** uses root `AGENTS.md` and `.cursor/rules/`; global Claude instructions remain in `src/claude/CLAUDE.md` (not merged automatically).

## Key Commands

```bash
make setup       # Full install (Homebrew, stow, Claude Code, etc.)
make deploy      # Backup conflicts + stow
make stow        # Apply stow symlinks only
make doctor      # Check system health
make dry-run     # Preview stow changes
```

## Project Structure

```
src/home/        # Stow package — maps 1:1 to $HOME
src/claude/      # Claude Code config — symlinked into ~/.claude/
  settings.json  # Hooks, plugins, permissions, statusline
  hooks/         # Event hooks (bash scripts)
  agents/        # Subagent definitions (autonomous-developer, architect, discoverer, implementer, reviewer, verifier + opus/sonnet/haiku)
  skills/        # All workflow skills — orchestrators (develop, specify, implement, etc.) and utilities (TDD, debugging, critique, etc.)
  templates/     # Spec/task templates
src/hooksmith/   # Hooksmith config — symlinked into ~/.config/hooksmith/
  rules/         # YAML rule files (compiled to hooks.json by hooksmith plugin)
  scripts/       # Bash hook scripts referenced by rules
scripts/         # Setup scripts (setup-common.sh, setup-macos.sh, setup-linux.sh)
openspec/        # OpenSpec schemas and workflow definitions
  schemas/
    feature-tdd/   # Production features — tests first, coverage >= 90%
      schema.yaml  # Artifact graph + apply rules + workflow index
      templates/   # Artifact templates (discovery, spec, design, tasks)
      workflow/    # Execution logic as YAML step files
        specify/   # Steps 01-12: discovery → spec → commit
        implement/ # Steps 01-12: tasks → execute → review → signoff
        complete/  # Steps 01-08: verify → merge → archive → reflect
    feature-rapid/ # Prototypes, tooling — no test requirements (same structure)
    quickfix/      # Small changes — no discovery, lightweight spec, short cycle
      schema.yaml  # Artifact graph (spec only) + apply rules + workflow index
      templates/   # Artifact templates (spec, tasks)
      workflow/
        specify/   # Steps 01-07: parse → spec → commit (no discovery/diagrams)
        implement/ # Steps 01-16: tasks → execute → simplify → review → signoff
        complete/  # Reuses feature-tdd/workflow/complete/
    bugfix/        # Bug fixes — diagnosis → regression test → fix
      workflow/
        diagnose/  # Steps 01-09: investigate → diagnosis → fix-plan
        implement/ # Steps 01-12 (bugfix-adapted)
        complete/  # Steps 01-08
```

## Setup Functions (scripts/setup-common.sh)

- `install_claude_code()` — verifies binary, creates `~/.local/bin/claude` symlink
- `configure_claude_code()` — symlinks `src/claude/` into `~/.claude/` and `src/hooksmith/rules/` into `~/.config/hooksmith/rules/`, pre-caches ccstatusline
- `stow_dotfiles_common()` — runs `stow -t $HOME -d src -R home`

## Worktree Lifecycle (hook-driven)

Feature worktrees are managed via `EnterWorktree`/`ExitWorktree` tools + hook automation:

| Event | Hook | What it does |
|-------|------|-------------|
| `WorktreeCreate` | `worktree-create.sh` | Creates worktree at `~/code/feature_worktrees/<NAME>`, branch `feature/<NAME>`, symlinks `.env*`, installs deps |
| `WorktreeRemove` | `worktree-remove.sh` | Runs `git worktree remove`, prunes, deletes feature branch |

Skills use these tools: `/specify` calls `EnterWorktree({ name: FEATURE_ID })`, `/complete-feature` calls `ExitWorktree({ action: "remove" })`.

## Schema-Driven Workflow

Workflow execution logic lives in **schema step files** (YAML with structured config + `instruction:` prose), not in skills directly. Skills are orchestrators that detect state and read one step file at a time.

**Composition**: step → phase → workflow. Each step file is self-contained with agents, thresholds, skills, and execution instructions.

**State tracking**: `openspec/changes/$FEATURE_ID/state.yaml` (gitignored) is the **single source of truth** for workflow state. It records the current phase, step, `next_step` resume token, quality scores, phase history, session snapshots, and flags. All skills (`/develop`, `/specify`, `/implement`, `/complete-feature`) and hooks (`workflow-state.sh`, `auto-continue.sh`, `iteration-gate.sh`) read and write this file.

**Lifecycle**: state.yaml is created under a slug name in `openspec/changes/$SLUG/` when `/develop` starts (before FEATURE_ID exists). When the identifier is generated, the directory is renamed to `openspec/changes/$FEATURE_ID/`. When the worktree is created, the openspec change directory moves into the worktree.

**Resume token**: The `next_step` block in state.yaml tells any skill exactly where to resume — which skill, phase, step_id, and a human-readable instruction. Hooks read this to inject resume context on session start.

**Progressive loading**: Only the current step's YAML is in context — not the entire workflow. This survives context compaction because the step files persist on disk and state.yaml tells which one to load.

**Step file format** (mirrors OpenSpec's artifact pattern):
```yaml
id: step-name
phase: implement
order: 5
description: One-line description
agents: [...]        # Structured config
skills: [...]
thresholds: {...}
instruction: |       # Prose execution logic
  Detailed steps...
```

## Gotchas

- Editing `~/.claude/settings.json` edits `src/claude/settings.json` directly (symlink) — changes show in `git diff`
- Editing `~/.config/hooksmith/rules/*.yaml` edits `src/hooksmith/rules/` directly (symlink) — run `hooksmith build` after changes
- `src/home/` is stow's domain — don't put Claude Code config there
- Stow creates per-file symlinks; `configure_claude_code` symlinks entire directories (agents/, hooks/, etc.)
- ccstatusline widget config lives in `src/home/.config/ccstatusline/settings.json` (stowed), but Claude Code's statusLine command is in `src/claude/settings.json`

## Code Rules

### State Management
- After completing each workflow phase, update `state.yaml` to reflect the current phase, step, and completed step count -- stale state breaks resume and metrics <!-- learned: cycle 1, 2026-04-01 -->

### Migration Completeness
- When renaming a concept across the codebase (e.g., commands -> skills), grep ALL files for the old term and update agent docs, not just the files directly being renamed <!-- learned: cycle 1, 2026-04-01 -->

### Artifact Discipline
- Every openspec change MUST have spec.md committed to the change directory before implementation starts -- spec artifacts created only in worktree ephemeral state do not survive cleanup <!-- learned: cycle 1, 2026-04-01 -->
