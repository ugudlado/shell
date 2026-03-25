---
description: Autonomous developer — specify, implement, iterate, and complete a feature end-to-end
---

## Feature Description

$ARGUMENTS

## Overview

This is the **autonomous developer** workflow. It chains the full lifecycle — specify → implement → iterate → complete — into a single command that runs to completion with minimal human input.

## Decision Framework: Ask vs. Proceed

**PROCEED autonomously when:**
- Requirements are clear enough to make reasonable choices
- Trade-offs are minor (implementation details, naming, file organization)
- Multiple valid approaches exist — pick the simpler one, mark with [ASSUMPTION]
- Tests/build/lint failures have clear fixes
- Review feedback has obvious resolutions

**ASK the human only when:**
- Requirements are genuinely ambiguous (two contradictory interpretations)
- Architecture decision has irreversible consequences (database schema, public API shape)
- External dependency needs human action (API keys, third-party service setup)
- 3 failed attempts on the same issue with no clear path forward
- Feature scope seems wrong (too large, too small, missing context)

**Default bias: PROCEED.** It's faster to fix an assumption than to wait for confirmation.

## Plugins & Skills Composed

| Phase | Plugin/Skill | Purpose |
|-------|-------------|---------|
| Specify | `architect` + `researcher` agents | Spec design |
| Specify | `opsx:explore`, `opsx:propose` | OpenSpec artifacts |
| Specify | `frontend-design`, `critique` | UI review (if applicable) |
| Implement | `implementer` + `reviewer` + `verifier` agents | Per-task loop |
| Implement | `phase-review` | Phase gates |
| Implement | `test-driven-development` | TDD (if applicable) |
| Iterate | `iterate` skill | Quality evaluation + improvement |
| Iterate | `critique` | UX evaluation (if UI) |
| Complete | `/complete-feature` | Archive, merge, cleanup |
| All | `claude-mem` | Memory across phases |
| All | `context7` | Library docs |

## Process

### 1. Parse Arguments & Detect Schema

Check for flags:
- `--tdd`: use `feature-tdd` schema
- `--rapid`: use `feature-rapid` schema
- `--bugfix`: use `bugfix` schema
- `--no-linear`: skip Linear ticket
- `--no-iterate`: skip iteration phase (ship after implement)
- `--iterations N`: max iteration cycles (default: 3)

If no schema flag, auto-detect:
- Words like "fix", "bug", "broken", "regression" → `bugfix`
- Words like "prototype", "spike", "experiment", "quick" → `feature-rapid`
- Otherwise → `feature-tdd` (default to quality)

Extract the feature description (everything except flags).

### 2. Initialize Workflow State

Create a workflow state file that persists across sessions:

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
  "schema": "feature-tdd",
  "started_at": "2026-03-25T...",
  "flags": {"no_linear": false, "max_iterations": 3},
  "iteration_count": 0,
  "quality_scores": [],
  "decisions_log": [],
  "status": "active"
}
```

### 3. PHASE: Specify

Run the `/specify` workflow inline (do NOT invoke as a separate command — execute its steps directly):

1. Search memory for prior decisions
2. Spawn Architect + Researcher team
3. Generate OpenSpec artifacts (spec → design → tasks)
4. Generate diagrams
5. Run agent reviews (frontend-design if UI, architecture review, Codex artifact review)

**Autonomous modification**: Skip step 9 of `/specify` (user review). Instead:
- If agent reviews found 0 critical issues → **proceed directly** to implementation
- If agent reviews found critical issues → fix them autonomously (up to 2 rounds)
- If critical issues persist after 2 rounds → ask the human with specific questions

After spec is ready:
- Commit specs
- Create Linear ticket (unless --no-linear)
- Update workflow state: `"phase": "implement"`

**Present a brief summary** to the user (not a question — just FYI):
```
[develop] Spec complete for FEATURE-ID
  Schema: feature-tdd | Tasks: 8 across 3 phases
  Key decisions: [1-2 sentence summary]
  Proceeding to implementation...
```

### 4. PHASE: Implement

Run the `/implement` workflow inline:

1. Load context (OpenSpec, Linear, memory)
2. Create tasks via TaskCreate with dependencies
3. Execute per-task loop: Implementer → Reviewer → Verifier
4. Phase review at boundaries (≥ 9/10 required)
5. Auto-commit after each phase
6. Architect + Verifier signoff
7. Simplify code
8. Final comprehensive review

**Autonomous modifications**:
- Skip AskUserQuestion for signoff (step 7 of `/implement`) — if architect+verifier pass, proceed
- On signoff gaps: auto-generate fix tasks and execute them (up to 2 rounds)
- Only escalate to human if signoff fails after 2 rounds

After implementation passes:
- Update workflow state: `"phase": "iterate"`, record quality scores

**Brief status update**:
```
[develop] Implementation complete for FEATURE-ID
  Tasks: 8/8 done | Phase reviews: all ≥ 9/10
  Final review: clean | Proceeding to iteration...
```

### 5. PHASE: Iterate (Quality & UX Improvement Loop)

**This is what makes /develop different from /specify + /implement.**

Invoke the `iterate` skill with the feature context. The skill:

1. **Evaluates** the current implementation across dimensions:
   - Code quality (patterns, DRY, error handling, edge cases)
   - UX quality (if UI — invoke `/critique`)
   - Performance (obvious bottlenecks, unnecessary re-renders, N+1 queries)
   - Developer experience (API ergonomics, clear naming, good defaults)
   - Test quality (coverage gaps, missing edge cases, brittle tests)

2. **Scores** each dimension 1-10 and computes an overall score

3. **Identifies** the highest-impact improvement opportunities, ranked by:
   - User-facing impact (visible improvements > internal cleanup)
   - Effort-to-value ratio (quick wins first)
   - Diminishing returns detection (stop when improvements are marginal)

4. **Executes** improvements as new tasks:
   - Create tasks via TaskCreate
   - Run through Implementer → Reviewer → Verifier loop
   - Re-evaluate after each iteration cycle

5. **Decides when to stop**:
   - Overall score ≥ 9/10 across all dimensions → done
   - Score improvement < 0.5 between iterations → diminishing returns, done
   - Max iterations reached (default: 3) → done
   - All remaining improvements are "nice to have" with low impact → done

After iteration:
- Update workflow state: `"phase": "complete"`, record final scores
- Log iteration history (scores per round, improvements made)

**Brief status update**:
```
[develop] Iteration complete for FEATURE-ID
  Rounds: 2 | Score: 7.5 → 8.8 → 9.2
  Improvements: [list of key changes]
  Proceeding to completion...
```

### 6. PHASE: Complete

Run the `/complete-feature` workflow:

1. Verify all tasks done, tests pass, build passes
2. Advisory Codex review (present findings but don't block)
3. Sync with main
4. Archive OpenSpec change
5. Merge to main (--no-ff)
6. Cleanup worktree
7. Close Linear ticket
8. Store learnings in memory
9. Run `/reflect`

**Final report**:
```
[develop] Feature complete: FEATURE-ID
  Lifecycle: specify → implement → iterate (2 rounds) → complete
  Duration: ~N phases, M tasks completed
  Quality: 9.2/10 (code: 9, UX: 9.5, tests: 9, perf: 9.3)
  Branch merged to main, worktree cleaned up
  Linear ticket closed, learnings stored
```

Update workflow state: `"status": "completed"`

## Session Resumption

If a session ends mid-workflow (context limit, crash, user closes):

The `auto-continue.sh` Stop hook saves current phase and progress to the workflow state file. The `workflow-state.sh` SessionStart hook detects active workflows and injects context.

On resume, the user just types `/develop` (no args needed) — or even just starts a new session in the worktree — and the workflow picks up where it left off:

- **Interrupted during specify**: Resume artifact generation
- **Interrupted during implement**: Resume from last in_progress task
- **Interrupted during iterate**: Resume from current iteration round
- **Interrupted during complete**: Resume completion steps

## Escalation Protocol

When the autonomous developer encounters something it can't resolve:

1. **Log the issue** in workflow state with full context
2. **Present to human** with:
   - What happened
   - What was tried (with results)
   - 2-3 concrete options to choose from
   - A recommended option with rationale
3. **Wait for response**
4. **Record the decision** in memory for future reference
5. **Continue** from where it left off
