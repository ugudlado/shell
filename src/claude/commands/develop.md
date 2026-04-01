---
description: Semi-automated developer — orchestrate specify, design, implement, iterate, and complete with user collaboration on design decisions
---

## Feature Description

$ARGUMENTS

## Overview

`/develop` orchestrates the full feature lifecycle with **collaborative design** and **automated implementation**. It chains agents for each phase and involves the user in design/UX decisions — not just approval gates.

It executes the steps of existing commands (`/specify`, `/implement`, `/complete-feature`) inline, with:
1. **Design exploration phase** — playground options, frontend-design polish, critique review
2. **Workflow state** persisted to `openspec/changes/$FEATURE_ID/state.yaml` for cross-session resumption
3. **Phase transitions** with status updates between each command's steps

**Philosophy**: Design is collaborative (user shapes the UX), implementation is automated (agents handle code). For fully autonomous execution without user design input, use `/autopilot`.

## Linear

- **`~/.claude/skills/linear/SKILL.md`** — Linear MCP, centralized config (`~/.claude/skills/linear/config.md`), and how ids land in `.openspec.yaml`.

Human interaction points:
- **Design exploration** — user picks from design options, gives feedback
- **Spec approval** — user confirms the finalized spec
- **Implementation signoff** — user validates the built feature

## Process

### 1. Parse Arguments & Detect Schema

Check for flags in `$ARGUMENTS`:
- `--tdd`: use `feature-tdd` schema
- `--rapid`: use `feature-rapid` schema
- `--bugfix`: use `bugfix` schema
- `--no-linear`: skip Linear ticket
- `--no-design`: skip design exploration phase (for non-UI features)

If no schema flag, auto-detect from description:
- Words like "fix", "bug", "broken", "regression", "crash", "error" → `bugfix`
- Words like "prototype", "spike", "experiment", "quick", "poc", "tooling", "dashboard", "cli", "tool", "utility", "show", "list", "display", "monitor", "status", "visualization" → `feature-rapid`
- Otherwise → `feature-tdd` (default to production quality)

Mark schema choice with `[ASSUMPTION]` if auto-detected. Extract the feature description (everything except flags).

### 2. Check for Resume

Scan `openspec/changes/*/state.yaml` for an active workflow matching the description:

```bash
# Look for active state files — match by description or feature_id
for f in openspec/changes/*/state.yaml; do
  [ -f "$f" ] && cat "$f"
done
```

Match by: description substring, feature_id, or slug in the directory name.

If a matching state.yaml exists with `status: active`:
1. Read the state file — extract `next_step` block
2. Set `FEATURE_ID` from state file's `feature_id` field (may be null if still in slug phase)
3. Set `CHANGE_DIR` to the parent directory of the matched state.yaml
4. Read `openspec status --change "$FEATURE_ID" --json` for artifact/task progress (if feature_id set)
5. Check `git status` and `TaskList` for in-progress work
6. **Jump directly to `next_step.phase`** — the `next_step` block tells you exactly where to resume (command, phase, step_id, and instruction)

If in a worktree, also check `openspec/changes/*/state.yaml` relative to the worktree root.

If no active workflow, proceed to step 3.

### 3. Initialize Workflow State

Create the openspec change directory in the main repo with a slug name. The directory will be renamed when FEATURE_ID is generated (step 4b) and moved into the worktree after worktree creation.

```bash
FEATURE_SLUG=$(echo "$DESCRIPTION" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | head -c 50)
CHANGE_DIR="openspec/changes/$FEATURE_SLUG"
mkdir -p "$CHANGE_DIR"
STATE_FILE="$CHANGE_DIR/state.yaml"
```

Write initial state using the **Write tool**:
```yaml
feature_id: null
description: "<feature-description>"
schema: "<detected-schema>"
status: active
phase: specify
step: 1
step_id: init
next_step:
  command: develop        # which command owns the workflow
  phase: discovery        # next phase to execute
  step_id: null           # next step file within the phase (null = first step)
  instruction: "Run discovery — parse args, search memory, generate ID, create worktree, run discoverer agent"
started_at: "<ISO timestamp>"
updated_at: "<ISO timestamp>"
flags:
  no_linear: false
  no_design: false
quality_scores: []
phases: []
step_history: []          # audit trail — every step executed/skipped/retried
metrics:                  # workflow-level aggregates
  total_steps: 0
  completed_steps: 0
  skipped_steps: 0
  failed_steps: 0
  retried_steps: 0
  total_retries: 0
  total_duration_s: 0
  total_tokens: 0
  skip_reasons: {}
  retry_reasons: {}
```

---

## Step Execution Protocol

**state.yaml is the control loop, not just a log.** Every step in every command follows this protocol. state.yaml is both the cursor (what to do next) and the audit trail (what happened, what was learned, what was skipped and why).

### The Loop

```
1. READ    — Read state.yaml → extract next_step
2. LOAD    — Load the step file indicated by next_step.step_id (or the phase's first step)
3. EXECUTE — Run the step's instruction
4. RECORD  — Append to step_history[] with outcome, metrics, and any learnings
5. WRITE   — Update state.yaml: advance step/step_id, set next_step, update updated_at
6. NUDGE   — Output: "Step complete. Reading state.yaml for next step."
             Then IMMEDIATELY read state.yaml and execute next_step. Do NOT proceed from memory.
```

### Step History

Every step executed (or skipped) gets recorded in `step_history[]`. This is the audit trail — `/learn` reads it to analyze patterns.

```yaml
step_history:
  - step_id: generate-id-worktree
    phase: specify
    status: completed          # completed | skipped | failed | retried
    started_at: "2026-04-01T10:25:00Z"
    completed_at: "2026-04-01T10:30:00Z"
    duration_s: 300
    retries: 0
    skip_reason: null          # why this step was skipped (null if executed)
    metrics:                   # step-specific measurements
      tokens_used: 12400
      tools_called: 8
      files_changed: 3
    learnings: []              # observations from this step (see Learnings below)

  - step_id: design-exploration
    phase: design
    status: skipped
    started_at: null
    completed_at: "2026-04-01T10:30:05Z"
    duration_s: 0
    retries: 0
    skip_reason: "--no-design flag set; non-UI feature"
    metrics: {}
    learnings: []

  - step_id: implement-task-1
    phase: implement
    status: retried
    started_at: "2026-04-01T11:00:00Z"
    completed_at: "2026-04-01T11:45:00Z"
    duration_s: 2700
    retries: 2
    skip_reason: null
    metrics:
      tokens_used: 45000
      tools_called: 32
      files_changed: 7
      review_score: 9
    learnings:
      - type: retry
        detail: "First attempt used wrong import path — component moved in prior phase"
      - type: insight
        detail: "Grepping for all import sites before renaming caught 3 stale references"
```

### Learnings Types

Each learning entry in `step_history[].learnings[]`:

```yaml
- type: mistake    # something went wrong, caused a retry or fix
  detail: "What happened and why"
- type: insight    # non-obvious approach that worked, worth repeating
  detail: "What worked and why"
- type: retry      # step re-run needed, with root cause
  detail: "Why and what fixed it"
- type: decision   # judgment call, with rationale
  detail: "What was decided and why"
- type: skip       # why a step was intentionally skipped
  detail: "Reason for skipping and what was affected"
```

### Aggregate Metrics

The state.yaml also tracks workflow-level metrics that accumulate across steps:

```yaml
metrics:
  total_steps: 14
  completed_steps: 12
  skipped_steps: 1
  failed_steps: 0
  retried_steps: 1
  total_retries: 2
  total_duration_s: 7200
  total_tokens: 180000
  phases_completed: ["specify", "implement"]
  review_scores: [9, 10, 9]
  skip_reasons:                    # aggregated for pattern analysis
    "--no-design flag": 1
  retry_reasons:                   # aggregated for pattern analysis
    "stale import path": 1
    "frozen lockfile mismatch": 1
```

The `/learn` phase reads these to identify systemic issues:
- High retry count → something is fragile, needs a rule
- Repeated skip reasons → maybe the step should be conditional by default
- Low review scores → implementation quality needs attention
- Duration outliers → steps that take too long might need decomposition

### Drift Recovery

If the model drifts away from the workflow (starts doing unrelated work, skips steps, or loses track):
- The `auto-continue.sh` Stop hook writes the resume point to state.yaml
- The `workflow-state.sh` SessionStart hook injects "check state.yaml" context
- Any command can nudge with: "WORKFLOW ACTIVE — read `openspec/changes/$ID/state.yaml` and execute `next_step`"
- The `next_step.instruction` field tells the model exactly what to do — no guessing
- If a step is missed (not in step_history but should have run), record it as `status: skipped` with `skip_reason: "model drift — step not executed"` so the pattern is visible in retro

---

### 4. PHASE: Discovery

Run the **first half** of `/specify` — discovery and research, but stop before the architect finalizes artifacts.

1. Parse arguments (step 1 of `/specify`)
2. Search memory (step 2)
3. Generate identifier (step 4)
4. Create worktree (step 5)
5. Run **discoverer agent** — research intent, explore codebase, investigate external solutions, produce Discovery Brief

**After discovery — check if design exploration applies:**
- If `--no-design` flag is set → skip to step 4b (Architect)
- If `--bugfix` schema → skip to step 4b (no UI design needed for bugfixes)
- If feature involves UI (detected from description keywords: "page", "component", "dashboard", "form", "view", "layout", "widget", "panel", "UI", "interface", "visualization") → proceed to step 4a
- Otherwise → ask user: "This feature may have UI aspects. Run design exploration? (y/n)"

**Update state.yaml** — record discovery completion and set next_step:
```yaml
next_step:
  command: develop
  phase: design              # or "specify-architect" if skipping design
  step_id: null
  instruction: "Generate 3 design options via playground, or skip to architect if --no-design"
```

**Status update:**
```
[develop] Discovery complete for FEATURE-ID
  Brief: [1-line summary of what discoverer found]
  UI detected: yes/no
  Proceeding to design exploration...
```

---

### 4a. PHASE: Design Exploration (UI features only)

This is the **collaborative design phase** — the user shapes the UX before the architect formalizes it. Uses three skills in sequence: `playground` for rapid prototyping, `frontend-design` for production polish, and `critique` for UX validation.

#### Step 1: Generate 3 Design Options (Playground)

Invoke the `playground:playground` skill to create **3 distinct design approaches** as interactive HTML files. Each should:
- Reflect a different UX direction (e.g., minimal vs. data-dense vs. visual)
- Be self-contained single-file HTML with live preview
- Include controls the user can interact with
- Be grounded in the Discovery Brief's requirements and constraints

Present the 3 options to the user:
```
[develop] Design Exploration for FEATURE-ID

I've created 3 design directions based on the discovery brief:

1. **[Name]** — [1-line description of approach]
   File: [path to playground HTML]

2. **[Name]** — [1-line description of approach]
   File: [path to playground HTML]

3. **[Name]** — [1-line description of approach]
   File: [path to playground HTML]

Open them in your browser to interact. Which direction resonates?
You can also mix elements: "Layout from 1, color scheme from 3"
```

**Wait for user input.** The user picks a direction, gives feedback, or asks for modifications.

#### Step 2: Polish Chosen Direction (Frontend Design)

Take the user's chosen direction and invoke the `frontend-design` skill to:
- Elevate the chosen design to production-grade quality
- Apply distinctive typography, color, spacing, and interaction design
- Avoid generic AI aesthetics (the "AI slop" test from critique)
- Produce a polished HTML prototype

Present the polished design to the user for feedback. Allow iteration:
```
[develop] Polished design for FEATURE-ID
  Direction: [chosen option name]
  File: [path to polished HTML]

  Review the design. Any adjustments before I finalize the spec?
```

**Wait for user input.** User may request changes or approve.

#### Step 3: UX Critique

Invoke the `critique` skill on the polished design to evaluate:
- Visual hierarchy and information architecture
- AI slop detection (most critical check)
- Emotional resonance and design quality
- Accessibility and interaction patterns

Present critique findings to the user alongside the design:
```
[develop] Design Critique for FEATURE-ID

Critique Score: X/10
Key findings:
- [finding 1]
- [finding 2]

[Critical issues are auto-fixed. Minor issues noted for implementation.]
```

If critique finds critical issues (score < 7), fix them and re-run critique. Otherwise, proceed.

**After design exploration — transition to architect:**
- Update `$CHANGE_DIR/state.yaml`: `phase: specify-architect`, record chosen design direction
- The polished HTML prototype becomes a reference artifact for the architect
- Set `next_step`:
  ```yaml
  next_step:
    command: develop
    phase: specify-architect
    step_id: null
    instruction: "Architect formalizes design into spec artifacts using approved prototype as reference"
  ```

**Status update:**
```
[develop] Design approved for FEATURE-ID
  Direction: [chosen name] | Critique: X/10
  Proceeding to specification...
```

**Continue directly to step 4b.**

---

### 4b. PHASE: Specify (Architect)

The architect now formalizes the design into spec artifacts, using the polished design prototype as reference (if design exploration ran).

1. Create specification team — Architect (+ design prototype reference if available)
2. Generate OpenSpec artifacts via Architect — artifact order follows schema:
   - `feature-tdd`/`feature-rapid`: spec.md → design.md → tasks.md
   - `bugfix`: diagnosis.md → fix-plan.md → tasks.md
   - **If design exploration ran**: design.md MUST reference the approved prototype and capture the design decisions made during exploration
3. Generate diagrams (step 7)
4. Agent reviews with confidence scores — fix critical findings autonomously (step 8)
5. **User approves spec** (step 9) — ESSENTIAL GATE, present with review confidence + evidence
6. Store decisions in memory (step 10)
7. Commit specs (step 11)
8. Create Linear ticket unless --no-linear (step 12) — follow **`~/.claude/skills/linear/SKILL.md`** and the schema `create-ticket` / `store-commit-report` steps.
9. Report (step 13)

**After spec approval — transition to implement:**
- Update `$CHANGE_DIR/state.yaml`: `phase: implement`, `feature_id: $FEATURE_ID`
- If CHANGE_DIR still uses the slug name, rename: `mv openspec/changes/$SLUG openspec/changes/$FEATURE_ID` and update `CHANGE_DIR`
- Set `next_step`:
  ```yaml
  next_step:
    command: develop
    phase: setup-tooling
    step_id: null
    instruction: "Run /bootstrap to verify project tooling, then proceed to implement"
  ```

**Status update (brief, not a question):**
```
[develop] Spec approved for FEATURE-ID
  Schema: <schema> | Artifacts: [schema-appropriate: spec+design+tasks or diagnosis+fix-plan+tasks]
  Design: [approved prototype reference or "no design phase"]
  OpenSpec phases: N phases, M tasks
  Proceeding to implementation...
```

**Continue directly to step 4c — do NOT stop or wait.**

---

### 4c. PHASE: Setup Tooling (before first implementation)

Invoke the `/bootstrap` skill to verify and install project tooling. Bootstrap detects the project language (Node/TS, Python, Rust, Go), installs linter, formatter, type checker, dead code detection, pre-commit hooks, test framework, and standardized scripts. It also ensures CLAUDE.md quality gates are up to date and establishes a clean baseline.

Bootstrap is idempotent — it checks `.tooling-state.json` at the project root and skips if tooling is already verified. This step runs ONCE per project, not per feature.

```
/bootstrap
```

**Continue directly to step 5 — do NOT stop or wait.**

---

### 5. PHASE: Implement

**Execute the steps of `/implement` now** — follow its full process (steps 1 through 12) with:
- Feature ID from step 4
- Design prototype reference (if design exploration ran) — implementer should match the approved design

This means executing (in order):
1. Load context — OpenSpec metadata, Linear ticket (per **linear** skill + MCP), memory, artifact files (step 1)
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
14. **UX review via `/critique`** — MANDATORY for any feature touching UI. Invoke the `/critique` skill on the implemented feature. Compare against approved design prototype. Fix any critical UX findings before final review.
15. Final comprehensive review (step 9)
16. Store learnings (step 10)
17. Update Linear (step 11) — per **`~/.claude/skills/linear/SKILL.md`** and implement `wrap-up` / schema steps.
18. Report (step 12)

**After signoff approval — transition to complete:**
- Update `$CHANGE_DIR/state.yaml`: `phase: complete`, record phase review scores and evaluation scores
- Set `next_step`:
  ```yaml
  next_step:
    command: develop
    phase: complete
    step_id: null
    instruction: "Verify completion, Codex review, sync main, archive, merge, close Linear, store learnings"
  ```

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

---

### 7. PHASE: Learn

**Execute `/learn [FEATURE-ID]` inline** — same as `/autopilot`'s LEARN step:

1. Spawn `workflow-evaluator` with feature context (workflow state, quality scores, git diff, project CLAUDE.md path)
2. Evaluator runs: compliance checklist → quality gap analysis → CLAUDE.md update (≤3 rules, deduplicated) → metrics write to `.claude/metrics.jsonl`
3. If evaluator suggests workflow rule changes: spawn `workflow-fixer`
4. Record `learn_verdict` (CLEAN/PASS/FAIL) in `$CHANGE_DIR/state.yaml`

**Status update:**
```
[develop] Learn complete for FEATURE-ID
  Verdict: [CLEAN/PASS/FAIL] | Rules: +N applied
  CLAUDE.md: [sections updated]
  Metrics: cycle K written
```

---

### 7a. CONDITIONAL: Reflect (state-driven, not always)

Check two conditions using state files — run **both checks**, trigger reflect if either is true:

**Condition A — accumulated flagged sessions:**
```bash
LESSONS_FILE="$MEMORY_DIR/auto-lessons.md"
NEEDS_REVIEW=$(grep -c 'needs-review' "$LESSONS_FILE" 2>/dev/null || echo 0)
# Trigger if >= 3 unprocessed sessions
```

**Condition B — consecutive FAIL/PASS verdicts:**
```bash
# Read last 3 learn_verdict entries from metrics.jsonl
# Trigger if 2+ of last 3 are FAIL or PASS (not CLEAN)
```

If either condition is met: execute `/reflect` inline — process all `needs-review` sessions, extract learnings to MEMORY.md/CLAUDE.md, mark as reviewed.

Skip silently if neither condition is met.

---

### 7b. CONDITIONAL: Diagnose (state-driven, not always)

Check two conditions — trigger diagnose if either is true:

**Condition A — cycle milestone:**
```bash
CYCLE_COUNT=$(jq -s 'length' ~/.claude/metrics.jsonl 2>/dev/null || echo 0)
# Trigger if cycle_count % 5 == 0 (every 5th completed feature)
```

**Condition B — consecutive non-CLEAN verdicts:**
```bash
# Read last 3 learn_verdict entries from metrics.jsonl
# Trigger if 2+ consecutive FAIL verdicts (recurring pattern signal)
```

If either condition is met: execute `/diagnose` inline — analyze error-patterns.jsonl + feature-metrics.jsonl, present findings, apply approved recommendations to CLAUDE.md.

Skip silently if neither condition is met.

---

Update `$CHANGE_DIR/state.yaml`: `status: completed`

**Final report:**
```
[develop] Feature complete: FEATURE-ID
  Lifecycle: discovery → design → specify → implement → complete → learn[→ reflect][→ diagnose]
  Schema: <schema> | Tasks: M completed
  Design: [prototype reference or "no design phase"]
  Quality: X/10 [per-dimension scores for applicable dimensions]
  Learn: [CLEAN/PASS/FAIL] | Rules: +N applied
  Reflect: [ran: N sessions processed / skipped]
  Diagnose: [ran: N recommendations / skipped]
  Branch merged to main, worktree cleaned up
  Learnings stored, Linear closed
```

---

## Session Resumption

The `auto-continue.sh` Stop hook saves session snapshot to `state.yaml` with phase-specific context. The `workflow-state.sh` SessionStart hook scans `openspec/changes/*/state.yaml` and injects resume context via additionalContext.

On resume, run `/develop` (no args needed) — step 2 scans for active state.yaml files and jumps to the current phase:

| Interrupted Phase | Resume Behavior |
|-------------------|----------------|
| discovery | Check discoverer output — resume or re-run |
| design | Re-present design options or polished prototype for user input |
| specify | Check `openspec status` — resume artifact generation or re-present for approval |
| implement | Check `TaskList` for in_progress tasks — resume from last active task |
| complete | Check git status — resume merge/cleanup steps |
| learn | Re-spawn workflow-evaluator with feature context |

## Decision Framework

**PROCEED autonomously when:**
- Implementation details (naming, file structure, variable choices)
- Failures have clear fixes (type errors, test failures with obvious causes)
- Review feedback has obvious resolutions
- OpenSpec substep transitions are clean (all gates pass)
- Code changes that don't alter the user-facing design

**ASK the human when:**
- **Design choices** — layout, interaction patterns, visual hierarchy, UX trade-offs
- **Spec approval gate** (always — this defines the feature)
- **Signoff approval gate** (always — this validates the implementation)
- Requirements are genuinely ambiguous (contradictory interpretations)
- Architecture decision is irreversible (DB schema, public API shape)
- External dependency needs human action (API keys, service setup)
- 3 failed attempts on the same issue with no clear path
- Phase review < 9/10 after 3 fix iterations

## Completion Criteria (from evaluator learnings)

A feature is NOT complete until:

1. **All spec acceptance criteria verified** — check each one explicitly, not "looks good"
2. **Tests cover adversarial inputs** — empty, single, maximal, sorted, reverse, duplicates, degenerate
3. **Tested code IS runtime code** — if algorithm module has a function, UI must call it (no duplicated logic)
4. **Input bounds enforced** — every user input has validation with clear error messages
5. **All quality gates pass with real tools** — run the project's quality gate commands (from its CLAUDE.md), not just self-assessment. Use `pnpm` by default; adapt to what the project supports (some lack type-check or build).
6. **Project CLAUDE.md rules followed** — read project CLAUDE.md BEFORE implementing. Follow its code rules. The project CLAUDE.md is the authority on conventions, quality gates, and architecture.
7. **Exhaustive verification for ALL/EVERY criteria** — when an acceptance criterion uses ALL, EVERY, or EACH (e.g., "update nav in ALL .html files"), verify exhaustively by programmatically enumerating all targets and checking each one. Report count: "Verified N/N." Never spot-check a subset.
8. **Incremental commits** — commit after each phase, push regularly, include evaluation scores in commit message

9. **Fix-plan fully honored** (bugfix only): Every commitment in fix-plan.md has a corresponding completed task. If fix-plan says "clean up callers", callers are cleaned up. An incomplete fix-plan means the feature is NOT complete — no exceptions.
10. **Signature changes propagated**: When a function signature is modified (params added/removed/renamed), grep the entire codebase for all call sites and update them. Stale callers are a bug.

11. **Design fidelity** — If design exploration ran, the implementation MUST match the approved design prototype. Run `/critique` to compare and verify visual fidelity.
12. **HTML validity** — no malformed doctypes, no escaped characters in markup. Verify HTML renders without Quirks Mode warnings.

These rules apply regardless of schema. The coder should verify each one before requesting signoff.

## Escalation Protocol

When encountering something that can't be resolved autonomously:

1. **Log** the issue in `$CHANGE_DIR/state.yaml`
2. **Present** to human with: what happened, what was tried, 2-3 options with a recommendation
3. **Wait** for response
4. **Record** the decision in memory
5. **Continue** from where it left off
