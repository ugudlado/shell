# Tasks: Unified Dev Workflow -- Linear + Flux + OpenSpec

## Phase 1: Setup and Documentation

### T-1: Add Flux setup instructions to CLAUDE.md
- **Status**: todo
- **Why**: Developers need to know how to install Flux and initialize it per-repo before the workflow integration works.
- **Files**:
  - `src/claude/CLAUDE.md` -- add "Flux Integration" subsection with install/init/project-create commands
- **Verify**: `src/claude/CLAUDE.md` contains `flux init --git` and `flux project create` instructions

### T-2: Remove backlog.json references
- **Status**: todo
- **Why**: `backlog.json` is retired. Stale references create confusion about where ideas are tracked.
- **Files**:
  - `src/claude/CLAUDE.md` -- line 13: replace `maintain \`backlog.json\`` with updated wording
  - `src/claude/templates/product-claude-md.md` -- line 61: replace `backlog.json` reference
- **Verify**: `grep -r 'backlog\.json' src/claude/` returns no results

## Phase 2: Worktree Creation (Flux Task Create)

### T-3: Add Flux task creation to feature-tdd and feature-rapid generate-id-worktree
- **Status**: todo
- **Why**: These two schemas share identical worktree-creation logic. Adding Flux task creation here ensures every feature gets a Flux task at birth.
- **Files**:
  - `openspec/schemas/feature-tdd/workflow/specify/generate-id-worktree.yaml` -- add "Create Flux Task" instruction section
  - `openspec/schemas/feature-rapid/workflow/specify/generate-id-worktree.yaml` -- same addition
- **Verify**: Both files contain `flux task create` instruction, `flux-task-id` storage in `.openspec.yaml`, idempotency check, and graceful degradation guard

### T-4: Add Flux task creation to bugfix and quickfix generate-id-worktree
- **Status**: todo
- **Why**: Bugfix uses `diagnose/` instead of `specify/`; quickfix uses `quickfix/` branch prefix. Both need the same Flux integration with schema-appropriate paths.
- **Files**:
  - `openspec/schemas/bugfix/workflow/diagnose/generate-id-worktree.yaml` -- add "Create Flux Task" instruction section
  - `openspec/schemas/quickfix/workflow/specify/generate-id-worktree.yaml` -- same addition
- **Verify**: Both files contain `flux task create` instruction with graceful degradation. Bugfix references `diagnose` phase correctly.

## Phase 3: Phase Gate (Flux Status Update)

### T-5: Add Flux status update to all commit-phase.yaml files
- **Status**: todo
- **Why**: Phase commits are the natural sync point -- each one represents a verified unit of progress. Updating Flux here keeps the board current without adding overhead.
- **Files**:
  - `openspec/schemas/feature-tdd/workflow/implement/commit-phase.yaml` -- add "Update Flux Task" instruction section after commit
  - `openspec/schemas/feature-rapid/workflow/implement/commit-phase.yaml` -- same
  - `openspec/schemas/bugfix/workflow/implement/commit-phase.yaml` -- same
  - `openspec/schemas/quickfix/workflow/implement/commit-phase.yaml` -- same
- **Verify**: All 4 files contain `flux task update` with `--status in_progress` and phase note. All contain graceful degradation guard.

## Phase 4: Completion (Flux Done + Archive Note)

### T-6: Add Flux task done to all close-out.yaml files
- **Status**: todo
- **Why**: Close-out is where a feature transitions to "done." The Flux task should mirror this.
- **Files**:
  - `openspec/schemas/feature-tdd/workflow/complete/close-out.yaml` -- add "Mark Flux Task Done" section
  - `openspec/schemas/feature-rapid/workflow/complete/close-out.yaml` -- same
  - `openspec/schemas/bugfix/workflow/complete/close-out.yaml` -- same
- **Verify**: All 3 files contain `flux task done` with merge hash note and graceful degradation guard. Quickfix is intentionally excluded (no complete phase).

### T-7: Add Flux archive note to all archive.yaml files
- **Status**: todo
- **Why**: Archive is the final step. A note on the Flux task completes the audit trail.
- **Files**:
  - `openspec/schemas/feature-tdd/workflow/complete/archive.yaml` -- add "Note Flux Task Archived" section
  - `openspec/schemas/feature-rapid/workflow/complete/archive.yaml` -- same
  - `openspec/schemas/bugfix/workflow/complete/archive.yaml` -- same
- **Verify**: All 3 files contain `flux task update` with archive note and graceful degradation guard. Quickfix is intentionally excluded.
