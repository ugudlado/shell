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
  agents/        # Subagent definitions (developer, architect, discoverer, reviewer, ideator + opus/sonnet/haiku)
  skills/        # All workflow skills — orchestrators (develop, specify, implement, etc.) and utilities (TDD, debugging, critique, etc.)
  templates/     # Spec/task templates
src/hooksmith/   # Hooksmith config — symlinked into ~/.config/hooksmith/
  rules/         # YAML rule files (compiled to hooks.json by hooksmith plugin)
  scripts/       # Bash hook scripts referenced by rules
src/linear/      # Linear config — symlinked into ~/.config/linear/
  config.yaml    # Team settings, per-repo label IDs
scripts/         # Setup scripts (setup-common.sh, setup-macos.sh, setup-linux.sh)
src/spec/        # Shared workflow infra — symlinked into ~/.config/spec/
  schemas/         # feature.yaml, bugfix.yaml (phases, steps, rules, flags)
  steps/           # Shared step contracts (agent-agnostic, self-contained)
  templates/       # Artifact + project templates
spec/              # Per-project config (lives in repo)
  project.yaml     # This project's quality bar, rules, storage config
      templates/
  changes/archive/ # Completed change artifacts
```

## Setup Functions (scripts/setup-common.sh)

- `install_claude_code()` — verifies binary, creates `~/.local/bin/claude` symlink
- `configure_claude_code()` — symlinks `src/claude/` into `~/.claude/`, `src/hooksmith/` into `~/.config/hooksmith/`, `src/linear/config.yaml` into `~/.config/linear/`, creates `~/.config/spec/changes/`, pre-caches ccstatusline
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

**State tracking**: `~/.config/spec/changes/$REPO_NAME/$FEATURE_ID/state.yaml` is the **single source of truth** for workflow state. It records the current phase, step, `next_step` resume token, quality scores, phase history, session snapshots, and flags. All skills (`/develop`, `/specify`, `/implement`, `/complete-feature`) and hooks (`workflow-state.sh`, `auto-continue.sh`) read and write this file. The variable `SPEC_CHANGES_DIR=~/.config/spec/changes/$REPO_NAME` is defined in each skill.

**Lifecycle**: state.yaml is created under a slug name in `$SPEC_CHANGES_DIR/$SLUG/` when `/develop` starts (before FEATURE_ID exists). When the identifier is generated, the directory is renamed to `$SPEC_CHANGES_DIR/$FEATURE_ID/`. Artifacts live outside the repo during development and are copied to `spec/changes/archive/` on completion.

**Resume token**: The `next_step` block in state.yaml tells any skill exactly where to resume — which skill, phase, step_id, and a human-readable instruction. Hooks read this to inject resume context on session start.

**Progressive loading**: Only the current step's YAML is in context — not the entire workflow. This survives context compaction because the step files persist on disk and state.yaml tells which one to load.

**Step contract format** (agent-agnostic):
```yaml
id: step-name
version: 1
intent: One-line description of what this step does.
inputs: [...]
rules: [...]
instruction: |       # Self-contained execution logic
  1. Read X...
  2. Do Y...
  3. Write Z to state.yaml...
checks: [...]
outputs: [...]
```

**Rules cascade**: project.yaml → workflow.yaml → phases[].rules → steps/*.yaml rules. Agent collects all and enforces the union.

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
- Every spec change MUST have spec.md committed to the change directory before implementation starts -- spec artifacts created only in worktree ephemeral state do not survive cleanup <!-- learned: cycle 1, 2026-04-01 -->

### Branch Coordination
- Never delete/modify files on main that a feature branch is actively renaming or migrating -- causes rename/delete merge conflicts that require manual resolution <!-- learned: cycle 2, HL-174, 2026-04-02 -->

### Workflow Validation
- After creating or modifying workflow schemas, step contracts, or phase definitions, do a full walkthrough (read every step in execution order, verify references) before committing -- HL-174 found 11 issues via walkthrough that weren't caught during writing <!-- learned: cycle 2, HL-174, 2026-04-02 -->
