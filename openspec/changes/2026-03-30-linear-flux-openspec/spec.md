# Spec: Unified Dev Workflow -- Linear + Flux + OpenSpec

## Motivation

The current workflow has two gaps:

1. **No persistent board view.** Linear tracks tickets and OpenSpec tracks specs, but
   neither provides a local, at-a-glance view of in-flight features and their current
   phase. Developers context-switch between sessions and lose track of where each
   feature stands.

2. **Stale backlog.json references.** `backlog.json` was retired in practice (replaced
   by Linear issues + `/ideate` writing OpenSpec changes directly), but two doc strings
   still reference it, creating confusion about the source of truth.

Flux solves gap 1 by maintaining a local task board that mirrors OpenSpec phase
transitions. Each feature gets a Flux task at creation time; that task is updated at
each phase gate and marked done at completion. This gives the developer a single
`flux` command to see all in-flight work across repos.

## Scope

**Phase 1 only** -- CLI integration. No Flux MCP server, no Docker, no autopilot
integration. Phase 1 validates that mirroring OpenSpec phases to Flux tasks is useful
before investing in deeper integration.

## Functional Requirements

### FR-1: Flux task creation at worktree setup
When any OpenSpec workflow creates a worktree (`generate-id-worktree` step), it must
also create a Flux task in the repo's Flux project. The task title follows the pattern
`<LINEAR_ID>: <feature title>` (or `<FEATURE_ID>: <feature title>` if no Linear
ticket). The Flux task ID is stored in `.openspec.yaml` as `flux-task-id`.

### FR-2: Flux status update at phase gates
When a phase commit succeeds (`commit-phase` step), the corresponding Flux task is
updated to `in_progress` with a note indicating which phase just completed (e.g.,
"Phase 1 complete").

### FR-3: Flux task completion at close-out
When a feature is closed out (`close-out` step), the Flux task is marked done with a
note containing the merge commit hash.

### FR-4: Flux merge note at archive
When a feature is archived (`archive` step), a note is appended to the Flux task
recording the archive timestamp and final commit hash.

### FR-5: Graceful degradation
If `flux` is not installed or `flux` commands fail, the workflow logs a warning and
continues without Flux. Flux is never a blocking dependency.

### FR-6: All schemas covered
Flux integration applies to all 4 schemas: `feature-tdd`, `feature-rapid`, `bugfix`,
and `quickfix`. Note: `quickfix` has no `complete` phase, so FR-3 and FR-4 do not
apply to it.

### FR-7: backlog.json cleanup
All remaining references to `backlog.json` are removed from:
- `src/claude/CLAUDE.md` (line 13: `/ideate` description)
- `src/claude/templates/product-claude-md.md` (line 61: ideation guidance)

## Non-Functional Requirements

### NFR-1: No workflow slowdown
Flux CLI calls are fire-and-forget from the workflow's perspective. A slow or failing
`flux` command must not add perceptible delay to the phase gate.

### NFR-2: Idempotent operations
Running the same workflow step twice (e.g., re-running `commit-phase` after a hook
failure) must not create duplicate Flux tasks or duplicate status updates.

### NFR-3: Minimal footprint
The integration adds instructions to existing YAML workflow files. No new workflow
files, no new hooks, no new agents.

## Acceptance Criteria

| ID | Criterion | Traces |
|----|-----------|--------|
| AC-1 | After `generate-id-worktree` runs, `.openspec.yaml` contains a `flux-task-id` field with a valid Flux task ID | [traces: UC-1] |
| AC-2 | The Flux task title matches the pattern `<LINEAR_ID or FEATURE_ID>: <title>` | [traces: UC-1] |
| AC-3 | After `commit-phase` succeeds, `flux task update` is called with `--status in_progress` and a phase note | [traces: UC-2] |
| AC-4 | After `close-out` runs, the Flux task status is `done` with a note containing the merge commit hash | [traces: UC-3] |
| AC-5 | After `archive` runs, a note is appended to the Flux task with archive metadata | [traces: UC-4] |
| AC-6 | If `flux` is not on PATH, each integration point logs a warning to stderr and the workflow completes successfully | [traces: UC-5] |
| AC-7 | `flux-task-id` field is present in `.openspec.yaml` schema alongside existing fields (`schema`, `feature-id`, `linear-ticket`, `worktree`, `branch`) | [traces: UC-1] |
| AC-8 | All 4 schemas (`feature-tdd`, `feature-rapid`, `bugfix`, `quickfix`) have Flux integration in their respective `generate-id-worktree.yaml` and `commit-phase.yaml` files | [traces: UC-6] |
| AC-9 | Only `feature-tdd`, `feature-rapid`, and `bugfix` have Flux integration in `close-out.yaml` and `archive.yaml` (quickfix has no complete phase) | [traces: UC-6] |
| AC-10 | `backlog.json` does not appear in `src/claude/CLAUDE.md` or `src/claude/templates/product-claude-md.md` | [traces: UC-7] |
| AC-11 | Re-running `generate-id-worktree` when `.openspec.yaml` already has a `flux-task-id` skips task creation (idempotent) | [traces: UC-5] |

## Use Cases

| ID | Use Case |
|----|----------|
| UC-1 | Developer runs `/develop` or `/specify` -- a Flux task is created and its ID stored in `.openspec.yaml` |
| UC-2 | Developer completes a phase -- Flux task is updated with phase status |
| UC-3 | Developer runs `/complete-feature` -- Flux task is marked done |
| UC-4 | Feature is archived -- Flux task gets archive note |
| UC-5 | Developer works on a machine without Flux installed -- workflow completes with warnings |
| UC-6 | Developer uses any schema (feature-tdd, feature-rapid, bugfix, quickfix) -- Flux integration is present |
| UC-7 | Developer reads CLAUDE.md -- no stale backlog.json references |

## Alternatives Considered

1. **Flux MCP server instead of CLI.** More powerful (real-time sync, richer queries)
   but requires Docker and adds operational complexity. Deferred to Phase 2 after CLI
   integration proves the concept.

2. **Store Flux task ID in a separate `.flux` file.** Rejected because `.openspec.yaml`
   already tracks per-feature metadata (Linear ticket, worktree path). Adding one more
   field is simpler than introducing a new file.

3. **Integrate Flux into hooks instead of workflow YAML.** Would couple Flux to git
   events rather than OpenSpec phases. The workflow YAML approach is more precise --
   it fires at semantic boundaries (phase complete, feature archived) rather than
   mechanical ones (git commit).
