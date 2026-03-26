---
description: Autonomous developer — orchestrate specify, implement, iterate, and complete using OpenSpec substeps
---

## Feature Description

$ARGUMENTS

## Overview

`/develop` orchestrates the full feature lifecycle by executing the steps of existing commands (`/specify`, `/implement`, `/complete-feature`) sequentially, with workflow state tracking and hook enforcement between phases.

It does NOT call those commands as subcommands — it executes their steps inline in this session, with two added capabilities:
1. **Workflow state** persisted to `~/.claude/workflows/` for cross-session resumption
2. **Phase transitions** with status updates between each command's steps

Iteration (evaluate → improve → re-evaluate) is embedded inside `/implement` at steps 4b and 6b — there is no separate iterate phase.

Human approvals at spec sign-off and implementation signoff are essential gates — they stay.

## Process

### 1. Parse Arguments & Detect Schema

Check for flags in `$ARGUMENTS`:
- `--tdd`: use `feature-tdd` schema
- `--rapid`: use `feature-rapid` schema
- `--bugfix`: use `bugfix` schema
- `--no-linear`: skip Linear ticket

If no schema flag, auto-detect from description:
- Words like "fix", "bug", "broken", "regression", "crash", "error" → `bugfix`
- Words like "prototype", "spike", "experiment", "quick", "poc", "tooling", "dashboard", "cli", "tool", "utility", "show", "list", "display", "monitor", "status", "visualization" → `feature-rapid`
- Otherwise → `feature-tdd` (default to production quality)

Mark schema choice with `[ASSUMPTION]` if auto-detected. Extract the feature description (everything except flags).

### 2. Check for Resume

```bash
STATE_DIR="$HOME/.claude/workflows"
```

Check `~/.claude/workflows/` for existing state files matching the description slug. Note: `FEATURE_ID` is not yet available (generated in /specify step 4) — match by description slug only.

If a matching state file exists with `"status": "active"`:
1. Read the state file to determine current phase
2. Read `openspec status --change "$FEATURE_ID" --json` for artifact/task progress
3. Check `git status` and `TaskList` for in-progress work
4. **Jump directly to the current phase below** (skip completed phases)

If no active workflow, proceed to step 3.

### 3. Initialize Workflow State

```bash
FEATURE_SLUG=$(echo "$DESCRIPTION" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | head -c 50)
STATE_DIR="$HOME/.claude/workflows"
mkdir -p "$STATE_DIR"
STATE_FILE="$STATE_DIR/$FEATURE_SLUG.json"
```

Write initial state using the **Bash tool** for `mkdir -p` and the **Write tool** to create the JSON file:
```json
{
  "feature_id": null,
  "phase": "specify",
  "schema": "<detected-schema>",
  "description": "<feature-description>",
  "started_at": "<ISO timestamp>",
  "flags": {
    "no_linear": false
  },
  "quality_scores": [],
  "phases": [],
  "status": "active"
}
```

---

### 4. PHASE: Specify

**Execute the steps of `/specify` now** — follow its full process (steps 1 through 13) with these inputs:
- Feature description from step 1
- Schema flags from step 1
- Pass `--tdd`, `--rapid`, or `--bugfix` based on detected schema. **This flag overrides /specify's own auto-detection** — /specify MUST use the passed flag and not re-detect independently.

This means executing (in order):
1. Parse arguments (step 1 of `/specify`)
2. Search memory (step 2)
3. Create specification team — Architect + Researcher (step 3)
4. Generate identifier (step 4)
5. Create worktree (step 5)
6. Generate OpenSpec artifacts via Architect team (step 6) — artifact order follows schema:
   - `feature-tdd`/`feature-rapid`: spec.md → design.md → tasks.md
   - `bugfix`: diagnosis.md → fix-plan.md → tasks.md
7. Generate diagrams (step 7)
8. Agent reviews with confidence scores — fix critical findings autonomously (step 8)
9. **User approves spec** (step 9) — ESSENTIAL GATE, present with review confidence + evidence
10. Store decisions in memory (step 10)
11. Commit specs (step 11)
12. Create Linear ticket unless --no-linear (step 12)
13. Report (step 13)

**After spec approval — transition to implement:**
- Update workflow state: `"phase": "implement"`, record `"feature_id"` from step 4
- Rename state file if feature ID includes Linear ID

**Status update (brief, not a question):**
```
[develop] Spec approved for FEATURE-ID
  Schema: <schema> | Artifacts: [schema-appropriate: spec+design+tasks or diagnosis+fix-plan+tasks]
  OpenSpec phases: N phases, M tasks
  Proceeding to implementation...
```

**Continue directly to step 5 — do NOT stop or wait.**

---

### 5. PHASE: Implement

**Execute the steps of `/implement` now** — follow its full process (steps 1 through 12) with:
- Feature ID from step 4

This means executing (in order):
1. Load context — OpenSpec metadata, Linear ticket, memory, artifact files (step 1)
2. Check for resume state — auto-continue if clean (step 1b)
3. Understand task graph — create tasks via TaskCreate if first run (step 2)
4. Execute per-task loop following OpenSpec schema rules (step 3):
   - **feature-tdd**: RED (write tests, must fail) → GREEN (implement, tests pass) → REFACTOR
   - **feature-rapid**: implement → verify (type-check + build)
   - **bugfix**: investigate → regression test (must fail) → fix (test passes) → harden
   - Per task: Implementer → Reviewer → Verifier loop
5. Phase review at boundaries — `phase-gate.sh` hook enforces ≥ 9/10 (step 4)
6. **Phase evaluation & iteration** — score quality dimensions, improve if < 8.5 or any dim < 7 (step 4b)
7. Commit phase with evaluation scores (step 5)
8. Export tasks.md snapshot (step 5b)
9. Final validation — all tasks completed (step 6)
10. **Feature-level evaluation** — full iterate assessment on entire diff, improve if needed (step 6b)
11. Architect + Verifier signoff with evaluation scores (step 7)
12. **User approves signoff** — ESSENTIAL GATE, present with quality evidence (step 7)
13. Simplify code (step 8)
14. Final comprehensive review (step 9)
15. Store learnings (step 10)
16. Update Linear (step 11)
17. Report (step 12)

**After signoff approval — transition to complete:**
- Update workflow state: `"phase": "complete"`, record phase review scores and evaluation scores

**Status update:**
```
[develop] Implementation approved for FEATURE-ID
  Tasks: M/M done | Phase reviews: all ≥ 9/10
  Evaluation: code=X ux=Y perf=Z overall=W
  Signoff: architect ✓ verifier ✓
  Proceeding to completion...
```

**Continue directly to step 6 — do NOT stop or wait.**

**Note**: Iteration (evaluate → improve → re-evaluate) is embedded inside `/implement` at steps 4b (per-phase) and 6b (feature-level). There is no separate iterate phase — `/implement` handles quality improvement internally before signoff.

---

### 6. PHASE: Complete

**Execute the steps of `/complete-feature` now** — follow its full process:

1. Verify completion — all tasks done, tests pass, build passes
2. Advisory Codex review via PAL MCP (present findings, don't block)
3. Sync with main: `git fetch origin && git merge origin/main`
4. Archive OpenSpec change: `openspec archive "$FEATURE_ID"`
5. Merge to main (--no-ff), cleanup worktree
6. Close Linear ticket
7. Store final learnings in memory
8. Run `/reflect` on flagged sessions

**Final report:**
```
[develop] Feature complete: FEATURE-ID
  Lifecycle: specify → implement (with evaluate-improve) → complete
  Schema: <schema> | Tasks: M completed
  Quality: X/10 [per-dimension scores for applicable dimensions]
  Branch merged to main, worktree cleaned up
  Learnings stored, Linear closed
```

Update workflow state: `"status": "completed"`

---

## Session Resumption

The `auto-continue.sh` Stop hook saves workflow state with phase-specific context. The `workflow-state.sh` SessionStart hook injects resume context via additionalContext.

On resume, run `/develop` (no args needed) — step 2 reads the active workflow and jumps to the current phase:

| Interrupted Phase | Resume Behavior |
|-------------------|----------------|
| specify | Check `openspec status` — resume artifact generation or re-present for approval |
| implement | Check `TaskList` for in_progress tasks — resume from last active task; evaluation state preserved in workflow state |
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
