# Global Development Guidelines

Spec-first workflow with OpenSpec, worktrees, and phase-based implementation.

## Core Workflow

### Semi-Automated Mode (preferred for features with UI)

| Command | Purpose |
|---------|---------|
| `/develop [description]` | **Collaborative lifecycle**: discovery → design exploration → specify → implement → complete. User shapes design, agents handle code. |
| `/autopilot [--cycles N]` | **Fully autonomous product loop**: ideate → /develop (no design phase) → learn → repeat. Backlog-driven. |
| `/ideate [--next]` | Research market, generate ideas, maintain `backlog.json` |
| `/learn [FEATURE-ID]` | Evaluate workflow compliance, auto-update CLAUDE.md with learned rules |
| `/iterate [FEATURE-ID]` | Standalone improvement loop (code quality, UX, performance) |

`/develop` involves the user in **design decisions** — after discovery, it generates 3 design options via playground, polishes the chosen direction with frontend-design, and validates with critique. Implementation is automated. Use `--no-design` to skip design exploration for non-UI features.

`/autopilot` is the outer loop — fully autonomous, no design exploration. Picks features from backlog, builds via `/develop --no-design`, learns from each cycle.

### Manual Mode (granular control)

| Command | Purpose |
|---|---|
| `/specify [description]` | Create OpenSpec change + worktree (Discoverer+Architect) |
| `/implement [FEATURE-ID]` | Per-task implementation loop (Implementer→Reviewer→Verifier) |
| `/complete-feature [FEATURE-ID]` | Archive + merge to main + cleanup |
| `/continue-feature [FEATURE-ID]` | Resume implementation (redirects to `/implement`) |
| `/diagram`, `/commit-group`, `/release-prep`, `/reflect`, `/diagnose` | Utilities |

Workflow details (schemas, artifacts, task structure, agents) live in the command/skill files — loaded on invocation.

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

- **Team Name:** Home Labs
- **Team ID:** 80452c36-1579-49d6-9e6e-59afbb82bce5
- **Ticket Prefix:** HL

## Lessons Learned

- **pnpm add invalidates cached reads**: Re-read `package.json` after any `pnpm add` before editing it — the file is modified on disk and Edit will fail with "file modified since read."
- **CI=true for non-interactive pnpm**: Prefix `pnpm install/add` with `CI=true` in sandbox/non-interactive environments to avoid store path conflicts and TTY errors.
- **Session start: check git status**: Always run `git status` at session start and explicitly note whether prior session's changes are committed vs working-tree-only to avoid false "revert" confusion.
- **Verify component props before use**: Don't use props suggested by session summaries without reading the component interface first — summaries may describe non-existent props.
- **Use pnpm scripts over raw tool invocations in hooks**: Walk up to the nearest `package.json` with the script (e.g. `type-check`) and call `pnpm <script>` — avoids duplicating tsconfig paths and stays in sync with project config.

@RTK.md
