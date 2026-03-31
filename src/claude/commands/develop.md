---
description: Semi-automated developer — orchestrate specify, design, implement, iterate, and complete with user collaboration on design decisions
---

## Feature Description

$ARGUMENTS

## Overview

`/develop` orchestrates the full feature lifecycle with **collaborative design** and **automated implementation**. It chains agents for each phase and involves the user in design/UX decisions — not just approval gates.

It executes the steps of existing commands (`/specify`, `/implement`, `/complete-feature`) inline, with:
1. **Design exploration phase** — playground options, frontend-design polish, critique review
2. **Workflow state** persisted to `~/.claude/workflows/` for cross-session resumption
3. **Phase transitions** with status updates between each command's steps

**Philosophy**: Design is collaborative (user shapes the UX), implementation is automated (agents handle code). For fully autonomous execution without user design input, use `/autopilot`.

## Linear

- **`~/.claude/skills/linear/SKILL.md`** — Linear MCP, `.claude/memory/linear-config.md`, and how ids land in `.openspec.yaml`.

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

Write initial state using the **Bash tool** for `mkdir -p` and the **Write tool** to create the JSON file.

**Fallback**: If `~/.claude/workflows/` is not writable (sandbox, permissions), store the state file alongside the OpenSpec artifacts at `openspec/changes/[FEATURE-ID]/workflow-state.json` instead. The hooks will check both locations.
```json
{
  "feature_id": null,
  "phase": "specify",
  "schema": "<detected-schema>",
  "description": "<feature-description>",
  "started_at": "<ISO timestamp>",
  "flags": {
    "no_linear": false,
    "no_design": false
  },
  "quality_scores": [],
  "phases": [],
  "status": "active"
}
```

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
- Update workflow state: `"phase": "specify-architect"`, record chosen design direction
- The polished HTML prototype becomes a reference artifact for the architect

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
- Update workflow state: `"phase": "implement"`, record `"feature_id"` from step 4
- Rename state file if feature ID includes Linear ID

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

---

### 7. PHASE: Learn

**Execute `/learn [FEATURE-ID]` inline** — same as `/autopilot`'s LEARN step:

1. Spawn `workflow-evaluator` with feature context (workflow state, quality scores, git diff, project CLAUDE.md path)
2. Evaluator runs: compliance checklist → quality gap analysis → CLAUDE.md update (≤3 rules, deduplicated) → metrics write to `.claude/metrics.jsonl`
3. If evaluator suggests workflow rule changes: spawn `workflow-fixer`
4. Record `learn_verdict` (CLEAN/PASS/FAIL) in workflow state

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

Update workflow state: `"status": "completed"`

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

The `auto-continue.sh` Stop hook saves workflow state with phase-specific context. The `workflow-state.sh` SessionStart hook injects resume context via additionalContext.

On resume, run `/develop` (no args needed) — step 2 reads the active workflow and jumps to the current phase:

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

1. **Log** the issue in workflow state
2. **Present** to human with: what happened, what was tried, 2-3 options with a recommendation
3. **Wait** for response
4. **Record** the decision in memory
5. **Continue** from where it left off
