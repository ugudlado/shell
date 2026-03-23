# Global Development Guidelines

Spec-first workflow with OpenSpec, worktrees, and phase-based implementation.

## Core Workflow

| Command | Purpose |
|---|---|
| `/specify [description]` | Create OpenSpec change + worktree (Discoverer+Architect) |
| `/implement [FEATURE-ID]` | Per-task implementation loop (Implementer→Reviewer→Verifier) |
| `/complete-feature [FEATURE-ID]` | Archive + merge to main + cleanup |
| `/continue-feature [FEATURE-ID]` | Resume implementation (redirects to `/implement`) |
| `/opsx:propose`, `/opsx:apply`, `/opsx:archive` | OpenSpec commands |
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
