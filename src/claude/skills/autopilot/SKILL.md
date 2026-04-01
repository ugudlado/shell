---
name: autopilot
description: "Self-improving product development loop — ideate, build, learn, repeat. Fully autonomous, no design exploration. Picks features from backlog, builds via develop --no-design, learns from each cycle. Use when the user says \"autopilot\", \"autonomous mode\", \"auto build\", \"build from backlog\"."
user-invocable: true
args:
  - name: --cycles
    description: Number of build cycles to run (default unlimited)
    type: flag
  - name: --next
    description: Skip ideation, pick next from existing backlog
    type: flag
orchestrator:
  state_file: $OPENSPEC_CHANGES_DIR/$FEATURE_ID/state.yaml
  phases: [ideate, develop, learn]
  resume: true
---

## Variables

REPO_NAME=$(basename "$(git rev-parse --show-toplevel)")
OPENSPEC_CHANGES_DIR=~/.config/openspec/changes/$REPO_NAME

## Autonomous Product Development

$ARGUMENTS

## Overview

`/autopilot` orchestrates the self-improving product development loop:

```
IDEATE → BUILD → LEARN → repeat
```

Each cycle is **Linear-first**: source unblocked **`todo`** tasks for this repo up front, then drive **specify + implement** from the selected task. Ideation/backlog generation runs only when there is no actionable Linear work (or when explicitly requested). The evaluator auto-updates CLAUDE.md with learned patterns. Each cycle makes the next one better.

**CLAUDE.md is the product's brain** — it accumulates code rules, patterns, and conventions that improve quality over time.

**OpenSpec changes are the backlog** — each idea becomes an `$OPENSPEC_CHANGES_DIR/[ID]/` with `.openspec.yaml` and a lightweight `spec.md`. The same system used to specify and build features.

## Flags

Parse `$ARGUMENTS` for:
- `--cycles N`: number of ideate→build→learn cycles (default: 1)
- `--skip-ideate`: skip ideation, use existing highest-priority pending change
- `--skip-learn`: skip evaluator/CLAUDE.md update after build
- `--auto-approve`: remove human gates in /develop (only after 5+ consecutive CLEANs)
- `--project <path>`: project root (default: auto-detect from cwd)

## Process

### Step 1: Initialize

1. Find project root (nearest directory with CLAUDE.md)
2. Read project CLAUDE.md for product vision and quality gates
3. Scan `$OPENSPEC_CHANGES_DIR/` for existing proposed/in-progress changes
4. Read `.claude/metrics.jsonl` for cycle count and quality trends (if exists)
5. **Link project memory** — if `.claude/memory/` exists in the project root, ensure the Claude system memory path is symlinked to it:
   ```bash
   REPO=<project_root>
   SLUG="${REPO//\//-}"
   TARGET="$HOME/.claude/projects/$SLUG/memory"
   # Only act if symlink is missing or points elsewhere
   if [ ! -L "$TARGET" ] || [ "$(readlink "$TARGET")" != "$REPO/.claude/memory" ]; then
     rm -rf "$TARGET" && ln -s "$REPO/.claude/memory" "$TARGET"
   fi
   ```
   This is a no-op if already linked. Ensures memory is repo-versioned on any machine.

**Status update:**
```
[autopilot] Starting cycle N for [product]
  Pending changes: M | Quality trend: [improving/stable/declining]
```

### Step 2: Source Work Item (Linear first)

Query Linear first and select the cycle driver before ideation or build.

1. List **`todo`** (unstarted) issues for this repo's project in Linear, drop **blocked**, sort by **priority** then title.
2. If the list is **non-empty:** take the **first** issue. That issue is the cycle driver:
   - Treat it as the canonical work item for **specify + implement**.
   - If an `$OPENSPEC_CHANGES_DIR/<FEATURE_ID>/` directory already matches the issue (id or title), use that change directly; otherwise create/derive a feature slug from the Linear issue and run `/develop` against it.
3. If the list is **empty:** continue to Step 3 (ideation/backlog).

### Step 3: IDEATE / Backlog Fallback (only when no Linear `todo`)

Run ideation only when Linear has no actionable `todo` issue and `--skip-ideate` is not set.

Spawn the `ideator` agent with project context:
- Project CLAUDE.md path
- Path to `$OPENSPEC_CHANGES_DIR/` for existing backlog
- Instruction: full cycle (analyze code + research + generate + create OpenSpec changes)

The ideator creates new `$OPENSPEC_CHANGES_DIR/[ID]/` directories with `.openspec.yaml` (status: proposed) and lightweight `spec.md`.

Then pick fallback OpenSpec work:

1. Scan `$OPENSPEC_CHANGES_DIR/*/.openspec.yaml` for `status: proposed`
2. Sort by `priority` field descending
3. If none: report "No Linear todo issues and no proposed OpenSpec changes" and stop
4. Use the selected change's `spec.md` Summary as the description; read `schema` from `.openspec.yaml`

### Step 4: BUILD (specify first, then implement)

Execute `/develop [description-or-feature-id] --[schema] [--no-linear]` inline.
- For Linear-driven cycles, `/develop` must use the selected Linear work item as the source of truth for specification and implementation.
- Omit `--no-linear` when the product flow should create/update Linear tickets.
- With `--no-linear`, skip Linear for that cycle only.

`/develop` must run in this strict order:
1. **Specify phase (mandatory, no code edits):**
   - Discoverer + architect produce/refresh `spec.md`, `discovery.md`, `design.md`, `tasks.md`.
   - Validate acceptance criteria are testable and mapped to tasks.
2. **Spec approval gate (mandatory):**
   - Human approval unless `--auto-approve` policy is satisfied.
   - If not approved, stop cycle before implementation.
3. **Implementation phase (only after approved spec):**
   - Implementer → reviewer → verifier per task.
   - No direct implementation is allowed before Step 4.1 and 4.2 complete.

`/develop` will then:
- Phase reviews ≥9/10
- Signoff gate (human unless --auto-approve)
- Complete (merge, archive)

All existing agents, hooks, and gates work as-is. `/autopilot` does not modify `/develop`.

**On completion**, the OpenSpec change is archived to `openspec/changes/archive/`.

**If this cycle was driven by a Linear `todo` issue:** the `close-out.yaml` schema step in `/develop`'s complete phase automatically closes the Linear ticket. No manual cleanup needed.

### Step 5: LEARN (unless --skip-learn)

Execute `/learn [feature-id]` inline:
1. Spawn workflow-evaluator with feature context
2. Evaluator runs compliance checklist + quality gap analysis
3. Evaluator auto-appends learned code rules to project CLAUDE.md (max 3, deduplicated)
4. Evaluator writes cycle metrics to `.claude/metrics.jsonl`
5. If workflow rules suggested: spawn workflow-fixer

**Status update:**
```
[autopilot] Learn complete for [feature-id]
  Verdict: [CLEAN/PASS/FAIL] | Rules: +N applied
  CLAUDE.md: [sections updated]
```

### Step 5b: CONDITIONAL: Reflect + Diagnose (state-driven)

After each LEARN step, check state files to decide whether to run reflect and/or diagnose — same logic as `/develop` step 7a/7b:

**Reflect** — run if: ≥3 `needs-review` entries in `auto-lessons.md` OR 2+ of last 3 verdicts are non-CLEAN.

**Diagnose** — run if: `cycle_count % 5 == 0` OR 2+ consecutive FAIL verdicts in `metrics.jsonl`.

Both run inline, silently skipped if conditions not met. In multi-cycle runs (`--cycles N`), these checks happen after each cycle's LEARN — not just the final one.

### Step 6: Loop or Report

If `--cycles N` and current cycle < N:
- Go back to Step 2 (Linear sourcing)
- The next cycle benefits from rules learned in this cycle

Otherwise, print final report:

```
[autopilot] Complete — N cycles finished
  Changes built: [list with quality scores]
  Rules learned: +M total (N applied, K deduplicated)
  Quality trend: [first score] → [last score]
  Consecutive clean: X
  Remaining pending changes: Y
```

## Auto-Approve Mode

With `--auto-approve`, the two human gates in `/develop` are replaced:

**Spec approval** → architect review score ≥ 9/10, no critical findings
**Signoff approval** → all phase reviews ≥ 9/10, evaluator PASS, all quality gates green

Only use after 5+ consecutive CLEAN passes on manually-approved features.

## Autopilot Execution Authority

When running in autopilot mode, execution may continue without interactive user approvals by using agent-based gates:

1. **Spec gate without user pause**
   - Run architect review on spec artifacts (`spec.md`, `discovery.md`, `design.md`, `tasks.md`).
   - If architect feedback includes critical issues, revise and re-run architect until cleared.
   - Once cleared, proceed automatically to implementation.

2. **Implementation quality gate without user pause**
   - Run reviewer/verifier agents on each implementation slice.
   - If review findings are actionable, fix and re-run review until no critical blockers remain.
   - Continue cycle progression automatically after gates pass.

3. **Escalation rule**
   - Invoke architect agent whenever design-level uncertainty, structural trade-offs, or repeated review failures appear.
   - Apply architect recommendations, then re-run reviewer/verifier checks.

This keeps autopilot non-interactive while preserving a strict review-and-fix loop.

## User-Injected Ideas

Users can add ideas directly by creating an OpenSpec change:

```bash
mkdir -p $OPENSPEC_CHANGES_DIR/my-idea
```

Write `.openspec.yaml`:
```yaml
schema: feature-tdd
feature-id: my-idea
status: proposed
category: new-feature
priority: 9.0
source: user-request
created: 2026-03-28
```

Write `spec.md` with a Summary and Acceptance Criteria. `/autopilot` will pick it up in the next cycle based on priority.

## Error Handling

If `/develop` fails:
1. Log the failure in metrics.jsonl
2. Keep the OpenSpec change with a note in .openspec.yaml
3. If `--cycles N`: continue to next change
4. Report the failure in final summary

## Context Management

Each major phase runs as a subagent spawn to manage context:
- Ideator: scoped to CLAUDE.md + existing code + web search
- /develop: runs inline (has its own context management)
- Evaluator: scoped to workflow state + diff + CLAUDE.md
