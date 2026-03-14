# Global Development Guidelines

Spec-first workflow with OpenSpec, worktrees, and phase-based implementation.

## Core Workflow

| Command | Purpose |
|---------|---------|
| `/specify [description]` | Create OpenSpec change + worktree + Linear ticket |
| `/implement [FEATURE-ID]` | Execute tasks with auto-commit per phase |
| `/complete-feature [FEATURE-ID]` | Archive + merge to main + cleanup |
| `/continue-feature [FEATURE-ID]` | Load OpenSpec context |
| `/opsx:propose`, `/opsx:apply`, `/opsx:archive`, `/opsx:explore` | OpenSpec commands |
| `/diagram`, `/commit-group`, `/release-prep`, `/reflect`, `/diagnose` | Utilities |

## OpenSpec Schemas

Three schemas, selected via `/specify --tdd|--rapid|--bugfix` or auto-detected from intent:

| Schema | Artifacts | Tests | Coverage | Use For |
|--------|-----------|-------|----------|---------|
| `feature-tdd` | spec → design → tasks | Before impl | >= 90% | Production features, APIs, libraries |
| `feature-rapid` | spec → design → tasks | Optional | N/A | Prototypes, spikes, tooling, DX |
| `bugfix` | diagnosis → fix-plan → tasks | Regression test | N/A | Bugs, regressions, incidents |

### Artifact Structure

```
~/code/feature_worktrees/[FEATURE-ID]/openspec/changes/[FEATURE-ID]/
├── .openspec.yaml      # schema, linear ticket, worktree config
├── spec.md             # Motivation + requirements + architecture (feature-tdd, feature-rapid)
├── diagnosis.md        # Symptoms + root cause (bugfix)
├── fix-plan.md         # Fix strategy + risk (bugfix)
├── design.md           # Technical design (feature-tdd, feature-rapid)
├── tasks.md            # Phased tasks with Why, Files, Verify per task
└── diagrams/           # Mermaid diagrams
```

Feature ID: `2026-03-02-slug` (date + slug) or `HL-80-slug` (with Linear)

### Task Structure

Every task includes:
- **Why**: Which requirement/bug this satisfies
- **Files**: Files to create or modify
- **Verify**: Concrete verification steps (not "should work")
- **depends**: Dependencies on other tasks

Verification bugs get added as new tasks in the current phase (e.g., T-6b) — never skip to next phase with known issues.

## Critical Standards

1. **Spec-first**: Artifacts before implementation (schema determines which artifacts)
2. **Review gate**: `phase-review` skill at phase boundaries — score >= 9/10 required
3. **UI review**: `/critique` for any phase that touches UI components
4. **Verification bugs**: Issues found during verification become new tasks — never skip phases
5. **Auto-commit phases**: Commit after each phase passes review (no approval needed)
6. **Git**: Worktrees at `~/code/feature_worktrees/[FEATURE-ID]`, branches `feature/[FEATURE-ID]`, merge with `--no-ff`

## Memory

Search `claude-mem` at workflow start: `/mem-search [feature-id or topic]` to load prior decisions.

## Active Hooks (~/.claude/hooks/)

| Event | Hook | Purpose |
|-------|------|---------|
| PostToolUse (Write\|Edit) | `auto-format.sh` | Prettier formatting (type-check via typescript-lsp plugin) |
| PreToolUse (Bash) | `bash-safety-guard.sh`, `spec-adherence-check.sh`, `rtk-rewrite.sh` | Safety + spec adherence + RTK token savings |
| PreToolUse (Write\|Edit) | `worktree-boundary.sh`, `protected-files.sh` | Prevent cross-worktree writes + guard lock files |
| Stop | `loop-detector.sh`, `task-complete-check.sh` | Loop detection + block if tasks still [→] |
| SubagentStart | `subagent-task-context.sh` | Inject feature/task context into subagents |
| SubagentStop | `subagent-gate.sh`, `task-complete-check.sh` | Subagent quality gate + task sync |
| SessionEnd | `session-reflect.sh` | Log sessions with errors for `/reflect` |
| Notification | `smart-notify.sh` | macOS notifications with distinct sounds |
| UserPromptSubmit | `task-gate.sh` | Remind to mark task [→] before coding |

## Lessons Learned

- **pnpm add invalidates cached reads**: Re-read `package.json` after any `pnpm add` before editing it — the file is modified on disk and Edit will fail with "file modified since read."
- **CI=true for non-interactive pnpm**: Prefix `pnpm install/add` with `CI=true` in sandbox/non-interactive environments to avoid store path conflicts and TTY errors.
- **curl pipe to Python fails on non-JSON**: `curl ... | python3 -c "json.load(sys.stdin)"` fails silently if the server returns empty or HTML. Save to file first, verify content, then parse.
- **Session start: check git status**: Always run `git status` at session start and explicitly note whether prior session's changes are committed vs working-tree-only to avoid false "revert" confusion.
- **Verify component props before use**: Don't use props suggested by session summaries without reading the component interface first — summaries may describe non-existent props.
- **Use pnpm scripts over raw tool invocations in hooks**: Walk up to the nearest `package.json` with the script (e.g. `type-check`) and call `pnpm <script>` — avoids duplicating tsconfig paths and stays in sync with project config.

@RTK.md
