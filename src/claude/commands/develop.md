---
description: Autonomous developer — orchestrate specify, implement, iterate, and complete using OpenSpec substeps
---

## Feature Description

$ARGUMENTS

## Overview

`/develop` is a **thin orchestrator** that chains the existing commands (`/specify`, `/implement`, `/iterate`, `/complete-feature`) into a single autonomous lifecycle. It does NOT reimplement those commands — it calls them, tracks state between phases, and uses OpenSpec status as the source of truth for progress.

Human approvals at spec sign-off and implementation signoff are **kept** — they are essential quality gates.

## Plugins & Skills Composed

| Phase | Command/Skill | Purpose |
|-------|--------------|---------|
| Specify | `/specify` | Architect+Researcher team → OpenSpec artifacts (spec, design, tasks) |
| Implement | `/implement` | Implementer→Reviewer→Verifier loop → phase-review gates |
| Iterate | `/iterate` + `iterate` skill | Quality evaluation → improvement cycles |
| Complete | `/complete-feature` | Archive → merge → cleanup |
| Flow | `auto-continue.sh` hook | Persist state on session end |
| Flow | `workflow-state.sh` hook | Inject resume context on session start |
| Flow | `phase-gate.sh` hook | Enforce phase review ≥ 9/10 |
| Flow | `iteration-gate.sh` hook | Enforce iteration termination criteria |

## Process

### 1. Parse Arguments & Detect Schema

Check for flags in `$ARGUMENTS`:
- `--tdd`: use `feature-tdd` schema
- `--rapid`: use `feature-rapid` schema
- `--bugfix`: use `bugfix` schema
- `--no-linear`: skip Linear ticket
- `--no-iterate`: skip iteration phase (ship after implement)
- `--iterations N`: max iteration cycles (default: 3)

If no schema flag, auto-detect from description:
- Words like "fix", "bug", "broken", "regression", "crash", "error" → `bugfix`
- Words like "prototype", "spike", "experiment", "quick", "poc" → `feature-rapid`
- Otherwise → `feature-tdd` (default to production quality)

Mark schema choice with `[ASSUMPTION]` if auto-detected. Extract the feature description (everything except flags).

### 2. Check for Resume

Before starting fresh, check for an active workflow:

```bash
STATE_DIR="$HOME/.claude/workflows"
# Check for any active workflow matching description or feature ID
```

If a workflow state file exists with `"status": "active"`:
1. Read the state file to determine current phase
2. Read `openspec status --change "$FEATURE_ID" --json` for artifact/task progress
3. Check `git status` and `TaskList` for in-progress work
4. **Skip to the current phase** (don't re-run completed phases)

If no active workflow, proceed to step 3.

### 3. Initialize Workflow State

```bash
FEATURE_SLUG=$(echo "$DESCRIPTION" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | head -c 50)
STATE_DIR="$HOME/.claude/workflows"
mkdir -p "$STATE_DIR"
STATE_FILE="$STATE_DIR/$FEATURE_SLUG.json"
```

Write initial state:
```json
{
  "feature_id": null,
  "phase": "specify",
  "schema": "<detected-schema>",
  "description": "<feature-description>",
  "started_at": "<ISO timestamp>",
  "flags": {
    "no_linear": false,
    "no_iterate": false,
    "max_iterations": 3
  },
  "iteration_count": 0,
  "quality_scores": [],
  "status": "active"
}
```

### 4. PHASE: Specify

**Run `/specify` with the feature description and flags.**

Execute the full `/specify` process (steps 1-13) — this includes:
1. Architect + Researcher team generates OpenSpec artifacts
2. Artifact order follows the schema:
   - `feature-tdd`/`feature-rapid`: spec.md → design.md → tasks.md
   - `bugfix`: diagnosis.md → fix-plan.md → tasks.md
3. `openspec status` tracks artifact completion
4. Agent reviews (architecture, UX if applicable, Codex artifact review)
5. **User approves spec** (step 9 — essential gate, kept as-is)
6. Commit specs, create Linear ticket

**After spec approval:**
- Update workflow state: `"phase": "implement"`, record `"feature_id"`
- Rename state file if feature ID changed (e.g., Linear ID added)

**Status update:**
```
[develop] Spec approved for FEATURE-ID
  Schema: feature-tdd | Artifacts: spec ✓ design ✓ tasks ✓
  OpenSpec phases: N phases, M tasks
  Proceeding to implementation...
```

### 5. PHASE: Implement

**Run `/implement` with the feature ID.**

Execute the full `/implement` process (steps 1-12) — this includes:
1. Load OpenSpec context: `openspec instructions apply --change "$FEATURE_ID" --json`
2. Read context files (all artifacts for the schema)
3. Create native tasks from tasks.md via TaskCreate with dependencies
4. Execute per-task loop following OpenSpec schema rules:
   - **feature-tdd**: RED (write tests) → GREEN (implement) → REFACTOR per phase
   - **feature-rapid**: implement tasks with type-check + build gates
   - **bugfix**: investigate → regression test → fix → harden (optional)
5. Phase gates enforced by `phase-gate.sh` hook:
   - `feature-tdd`: type-check ✓ + test (coverage ≥ 90%) ✓ + build ✓ + phase-review ≥ 9/10
   - `feature-rapid`: type-check ✓ + build ✓ + phase-review ≥ 9/10
   - `bugfix`: type-check ✓ + test ✓ + build ✓ + phase-review ≥ 9/10
6. Auto-commit after each phase passes review
7. Architect + Verifier signoff
8. Simplify code, final comprehensive review
9. **User approves signoff** (step 7 — essential gate, kept as-is)

**After signoff approval:**
- Update workflow state: `"phase": "iterate"`
- Record phase review scores in state

**Status update:**
```
[develop] Implementation approved for FEATURE-ID
  Tasks: M/M done | Phase reviews: all ≥ 9/10
  Signoff: architect ✓ verifier ✓
  Proceeding to iteration...
```

### 6. PHASE: Iterate (unless --no-iterate)

**Run `/iterate` with the feature ID.**

Execute the iterate process using the `iterate` skill:
1. **Baseline evaluation** — score across dimensions (code, UX, performance, tests, DX)
2. **Identify improvements** — ranked by user-facing impact and effort-to-value ratio
3. **Execute improvements** as new tasks through the Implementer → Reviewer → Verifier loop
4. **Re-evaluate** — measure score delta
5. **Terminate** when:
   - Overall score ≥ 9.0 → quality threshold met
   - Score delta < 0.5 → diminishing returns
   - Max iterations reached (from flags)
   - Only advisory-level improvements remain

The `iteration-gate.sh` hook monitors termination criteria and injects continue/stop guidance.

**After iteration:**
- Update workflow state: `"phase": "complete"`, record final scores

**Status update:**
```
[develop] Iteration complete for FEATURE-ID
  Rounds: N | Score: X → Y → Z
  Key improvements: [list]
  Proceeding to completion...
```

### 7. PHASE: Complete

**Run `/complete-feature` with the feature ID.**

Execute the full `/complete-feature` process:
1. Verify: all tasks done, tests pass, build passes
2. Advisory Codex review (present but don't block)
3. Sync with main: `git fetch origin && git merge origin/main`
4. Archive OpenSpec change: `openspec archive "$FEATURE_ID"`
5. Merge to main (--no-ff), cleanup worktree
6. Close Linear ticket
7. Store learnings in memory
8. Run `/reflect` on flagged sessions

**Final report:**
```
[develop] Feature complete: FEATURE-ID
  Lifecycle: specify → implement → iterate (N rounds) → complete
  Schema: feature-tdd | Tasks: M completed
  Quality: X/10 (code: A, UX: B, tests: C, perf: D)
  Branch merged to main, worktree cleaned up
  Learnings stored, Linear closed
```

Update workflow state: `"status": "completed"`

## Session Resumption

The `auto-continue.sh` Stop hook saves workflow state on session end. The `workflow-state.sh` SessionStart hook detects active workflows and injects resume context.

On resume, run `/develop` (no args needed) — step 2 detects the active workflow and resumes:

| Interrupted Phase | Resume Behavior |
|-------------------|----------------|
| specify | Check `openspec status` — resume artifact generation or re-present for approval |
| implement | Check `TaskList` for in_progress tasks — resume from last active task |
| iterate | Check workflow state for iteration count — resume from current round |
| complete | Check git status — resume merge/cleanup steps |

## Decision Framework

**PROCEED autonomously when:**
- Trade-offs are minor (implementation details, naming, file structure)
- Multiple valid approaches — pick simpler, mark `[ASSUMPTION]`
- Failures have clear fixes (type errors, test failures with obvious causes)
- Review feedback has obvious resolutions
- OpenSpec substep transitions are clean (all gates pass)

**ASK the human when:**
- Spec approval gate (always — this defines the feature)
- Signoff approval gate (always — this validates the implementation)
- Requirements are genuinely ambiguous (contradictory interpretations)
- Architecture decision is irreversible (DB schema, public API shape)
- External dependency needs human action (API keys, service setup)
- 3 failed attempts on the same issue with no clear path
- Phase review < 9/10 after 3 fix iterations

## Escalation Protocol

When encountering something that can't be resolved autonomously:

1. **Log** the issue in workflow state
2. **Present** to human with: what happened, what was tried, 2-3 options with a recommendation
3. **Wait** for response
4. **Record** the decision in memory
5. **Continue** from where it left off
