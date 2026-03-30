# Design: Unified Dev Workflow -- Linear + Flux + OpenSpec

## Approach

Add Flux CLI calls to existing workflow YAML files at four integration points:
worktree creation, phase commit, close-out, and archive. No new files, hooks, or
agents. Each integration point wraps Flux calls in an availability check so the
workflow degrades gracefully.

## Flux Data Model

```
Flux Project (per repo)
  e.g., "shell", "algoviz"
  |
  +-- Task (per feature)
        title: "<LINEAR_ID>: <feature title>"
        status: todo -> in_progress -> done
        notes: phase completion messages, merge hash
```

One-time setup per repo (documented, not automated by this change):
```bash
npm install -g flux-tasks
flux init --git
flux project create <repo-name>
```

## Flux Task ID Flow

```
generate-id-worktree.yaml
  |  flux task create <project> "<title>" -P 1
  |  -> captures flux-task-id
  |  -> writes to .openspec.yaml
  v
commit-phase.yaml (reads flux-task-id from .openspec.yaml)
  |  flux task update <flux-id> --status in_progress --note "Phase N complete"
  v
close-out.yaml (reads flux-task-id from .openspec.yaml)
  |  flux task done <flux-id> --note "Merged: <hash>"
  v
archive.yaml (reads flux-task-id from .openspec.yaml)
     flux task update <flux-id> --note "Archived: <date>"
```

## `.openspec.yaml` Schema Update

Add `flux-task-id` as an optional field. Existing files without it are valid (backward
compatible). The field is written by `generate-id-worktree` and read by all subsequent
steps.

```yaml
schema: feature-tdd
feature-id: HL-80-add-auth-flow
linear-ticket: HL-80
flux-task-id: 42          # NEW -- Flux task ID, set at worktree creation
worktree: ~/code/feature_worktrees/HL-80-add-auth-flow
branch: feature/HL-80-add-auth-flow
```

## Graceful Degradation Pattern

Every Flux CLI call is wrapped in the same guard pattern within the workflow YAML
instruction blocks:

```
Check if `flux` is available:
  command -v flux >/dev/null 2>&1

If available:
  Run the flux command
  If the command fails: log warning, continue

If not available:
  Log: "flux not installed -- skipping Flux integration"
  Continue without Flux
```

This pattern is described in the instruction text of each YAML file. The agent reads
the instruction and executes conditionally. No shell wrapper script is needed because
the agent can evaluate the condition inline.

## Idempotency

- **Task creation**: Before creating a new Flux task, check if `.openspec.yaml` already
  has a `flux-task-id`. If it does, skip creation. This prevents duplicates when
  `generate-id-worktree` is re-run (e.g., after a failed worktree setup).

- **Status updates**: `flux task update` with the same status is a no-op in Flux.
  Adding duplicate notes is acceptable (they serve as an audit log).

## Per-Repo Project Naming

The Flux project name is the repo directory name (e.g., `shell`, `algoviz`). This is
derived at runtime:

```bash
basename "$(git rev-parse --show-toplevel)"
```

This avoids hardcoding project names in workflow YAML and works across repos that use
the same workflow schemas.

## Schema-Specific Integration Points

| Workflow File | feature-tdd | feature-rapid | bugfix | quickfix |
|---|---|---|---|---|
| `specify/generate-id-worktree.yaml` | Yes | Yes | N/A | Yes |
| `diagnose/generate-id-worktree.yaml` | N/A | N/A | Yes | N/A |
| `implement/commit-phase.yaml` | Yes | Yes | Yes | Yes |
| `complete/close-out.yaml` | Yes | Yes | Yes | N/A |
| `complete/archive.yaml` | Yes | Yes | Yes | N/A |

Quickfix has no `complete` phase, so close-out and archive do not apply.

## Changes by File

### Workflow YAML modifications (instruction text additions)

1. **`openspec/schemas/feature-tdd/workflow/specify/generate-id-worktree.yaml`**
   Add a "Create Flux Task" section after the "Verify" section.

2. **`openspec/schemas/feature-rapid/workflow/specify/generate-id-worktree.yaml`**
   Same addition as feature-tdd.

3. **`openspec/schemas/bugfix/workflow/diagnose/generate-id-worktree.yaml`**
   Same addition, adapted for diagnose phase context.

4. **`openspec/schemas/quickfix/workflow/specify/generate-id-worktree.yaml`**
   Same addition as feature-tdd.

5. **`openspec/schemas/feature-tdd/workflow/implement/commit-phase.yaml`**
   Add a "Update Flux Task" section after the commit step.

6. **`openspec/schemas/feature-rapid/workflow/implement/commit-phase.yaml`**
   Same addition.

7. **`openspec/schemas/bugfix/workflow/implement/commit-phase.yaml`**
   Same addition.

8. **`openspec/schemas/quickfix/workflow/implement/commit-phase.yaml`**
   Same addition.

9. **`openspec/schemas/feature-tdd/workflow/complete/close-out.yaml`**
   Add "Mark Flux Task Done" section.

10. **`openspec/schemas/feature-rapid/workflow/complete/close-out.yaml`**
    Same addition.

11. **`openspec/schemas/bugfix/workflow/complete/close-out.yaml`**
    Same addition.

12. **`openspec/schemas/feature-tdd/workflow/complete/archive.yaml`**
    Add "Note Flux Task Archived" section.

13. **`openspec/schemas/feature-rapid/workflow/complete/archive.yaml`**
    Same addition.

14. **`openspec/schemas/bugfix/workflow/complete/archive.yaml`**
    Same addition.

### Documentation cleanup

15. **`src/claude/CLAUDE.md`** -- Replace `backlog.json` reference in `/ideate` row
    with updated description (e.g., "Research market, generate ideas, manage OpenSpec
    backlog").

16. **`src/claude/templates/product-claude-md.md`** -- Replace `backlog.json` reference
    with updated ideation guidance.

### Documentation additions

17. **`src/claude/CLAUDE.md`** -- Add Flux setup instructions (install, init, project
    create) to a new "Flux Integration" subsection under an appropriate heading.

## Why Not MCP Yet

Flux offers an MCP server that provides richer integration (real-time task sync,
structured queries). However, it requires Docker and adds operational complexity.
Phase 1 validates the core concept -- mirroring OpenSpec phases to Flux tasks -- using
only the CLI. If the CLI integration proves valuable, Phase 2 adds the MCP server for
features like `flux board` in the terminal and automated task queries from agents.
