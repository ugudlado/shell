---
description: Self-improving product development loop — ideate, build, learn, repeat
---

## Autonomous Product Development

$ARGUMENTS

## Overview

`/autopilot` orchestrates the self-improving product development loop:

```
IDEATE → BUILD → LEARN → repeat
```

Each cycle: the ideator researches and creates OpenSpec changes as the backlog, `/develop` builds the highest-priority one, and the evaluator auto-updates CLAUDE.md with learned patterns. Each cycle makes the next one better.

**CLAUDE.md is the product's brain** — it accumulates code rules, patterns, and conventions that improve quality over time.

**OpenSpec changes are the backlog** — each idea becomes an `openspec/changes/[ID]/` with `.openspec.yaml` and a lightweight `spec.md`. The same system used to specify and build features.

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
3. Scan `openspec/changes/` for existing proposed/in-progress changes
4. Read `.claude/metrics.jsonl` for cycle count and quality trends (if exists)

**Status update:**
```
[autopilot] Starting cycle N for [product]
  Pending changes: M | Quality trend: [improving/stable/declining]
```

### Step 2: IDEATE (unless --skip-ideate)

Spawn the `ideator` agent with project context:
- Project CLAUDE.md path
- Path to `openspec/changes/` for existing backlog
- Instruction: full cycle (analyze code + research + generate + create OpenSpec changes)

The ideator creates new `openspec/changes/[ID]/` directories with `.openspec.yaml` (status: proposed) and lightweight `spec.md`.

**Status update:**
```
[autopilot] Ideation complete: +N new changes proposed, M total pending
  Top priority: [change-id] (score: X.X)
```

### Step 3: Pick Next Change

1. Scan `openspec/changes/*/. openspec.yaml` for changes with `status: proposed`
2. Sort by `priority` field descending
3. If no pending changes: report "No pending changes" and stop
4. The selected change already has a spec.md — extract its Summary as the description
5. Read the schema from `.openspec.yaml`

### Step 4: BUILD (existing /develop — untouched)

Execute `/develop [description] --[schema] --no-linear` inline.

`/develop` will:
- Flesh out the full spec (discoverer → architect add discovery.md, design.md, tasks.md)
- Spec approval gate (human unless --auto-approve)
- Implementation (implementer → reviewer → verifier per task)
- Phase reviews ≥9/10
- Signoff gate (human unless --auto-approve)
- Complete (merge, archive)

All existing agents, hooks, and gates work as-is. `/autopilot` does not modify `/develop`.

**On completion**, the OpenSpec change is archived to `openspec/changes/archive/`.

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
- Go back to Step 2
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

## User-Injected Ideas

Users can add ideas directly by creating an OpenSpec change:

```bash
mkdir -p openspec/changes/my-idea
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
