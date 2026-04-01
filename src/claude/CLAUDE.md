# Global Development Guidelines

Spec-first workflow with Spec, worktrees, and phase-based implementation.

## Core Workflow

### Semi-Automated Mode (preferred for features with UI)

| Skill | Purpose |
|-------|---------|
| `/develop [description]` | **Collaborative lifecycle**: discovery → design exploration → specify → implement → complete. User shapes design, agents handle code. |
| `/ideate [topic]` | Brainstorm ideas, explore designs via playground/frontend-design, build prioritized backlog |
| `/learn [FEATURE-ID]` | Evaluate workflow compliance, auto-update CLAUDE.md with learned rules |

`/develop` involves the user in **design decisions** — after discovery, it generates 3 design options via playground, polishes the chosen direction with frontend-design, and validates with critique. Implementation is automated. Use `--no-design` to skip design exploration for non-UI features.

### Manual Mode (granular control)

| Skill | Purpose |
|-------|---------|
| `/specify [description]` | Create Spec change + worktree (Discoverer+Architect) |
| `/implement [FEATURE-ID]` | Per-task implementation loop (Developer→Reviewer) |
| `/complete-feature [FEATURE-ID]` | Archive + merge to main + cleanup |
| `/diagram`, `/commit-group`, `/reflect`, `/diagnose`, `/telemetry` | Utilities |

All workflow entry points are **skills** (`src/claude/skills/*/SKILL.md`) — portable across AI runtimes. Loaded on invocation by Claude Code; readable by Cursor, Codex, and other tools.

## Critical Standards

1. **Spec-first**: Artifacts before implementation
2. **Minimal tasks**: `/implement` generates the smallest set of tasks needed to deliver the spec — prefer simple, elegant solutions over complex ones
3. **Review gate**: `phase-review` at phase boundaries — score >= 9/10
4. **UI review**: `/critique` for any phase touching UI
5. **Verification bugs**: Become new tasks — never skip phases
6. **Auto-commit phases**: Commit after each phase passes review
7. **Git**: Worktrees at `~/code/feature_worktrees/[FEATURE-ID]`, branches `feature/[FEATURE-ID]`, merge `--no-ff`
8. **Architect mindset**: Leave every system better than you found it — challenge assumptions, surface gaps proactively, question the status quo before building on top of it. Applies especially during `/specify` and design phases, but also during implementation.
9. **Evidence-based claims**: Never assert something works, exists, or is correct without verifying first. Run the command, read the file, check the output. If unsure, investigate before stating. Present evidence (test output, type-check result, file contents) when claiming completion — not just "it should work."

## Memory

Search `claude-mem` at workflow start: `/mem-search [feature-id or topic]` to load prior decisions.

## Linear Issue Tracking

**Centralized config**: `~/.config/linear/config.yaml` — single source of truth for team settings and per-repo labels. Schema step files (`create-ticket.yaml`) read this at runtime.

- Repo detection: `basename $(git rev-parse --show-toplevel)` → lookup in `repos:` map
- **If repo not in config**: Linear is disabled (`--no-linear`). Add via `/bootstrap`.

### Label Convention (required on every new ticket)

| Field | Values | Where |
|-------|--------|-------|
| **Product** | repo name (e.g. `shell`) | Issue label — UUID in `~/.config/linear/config.yaml` under `repos.<name>.label_ids` |
| **Type** | `Feature`, `Bug`, `Improvement`, `Chore`, `Research` | Issue label |
| **Complexity** | `XS`, `S`, `M`, `L` | Issue label |

## Lessons Learned

- **pnpm add invalidates cached reads**: Re-read `package.json` after any `pnpm add` before editing it — the file is modified on disk and Edit will fail with "file modified since read."
- **CI=true for non-interactive pnpm**: Prefix `pnpm install/add` with `CI=true` in sandbox/non-interactive environments to avoid store path conflicts and TTY errors.
- **Session start: check git status**: Always run `git status` at session start and explicitly note whether prior session's changes are committed vs working-tree-only to avoid false "revert" confusion.
- **Verify component props before use**: Don't use props suggested by session summaries without reading the component interface first — summaries may describe non-existent props.
- **Use pnpm scripts over raw tool invocations in hooks**: Walk up to the nearest `package.json` with the script (e.g. `type-check`) and call `pnpm <script>` — avoids duplicating tsconfig paths and stays in sync with project config.


@RTK.md
