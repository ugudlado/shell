---
name: learn
description: "Evaluate last feature's workflow compliance and auto-update CLAUDE.md with learned rules. Use after completing a feature, or when the user says \"learn\", \"evaluate workflow\", \"what did we learn\", \"update rules\"."
user-invocable: true
args:
  - name: feature-id
    description: Feature ID to evaluate (defaults to most recently completed feature)
    required: false
---

## Learn from Last Feature

$ARGUMENTS

## Overview

`/learn` runs the evaluation + self-improvement loop after a feature is completed. It spawns the workflow-evaluator to assess compliance, auto-update the project's CLAUDE.md with learned code rules, write cycle metrics, and route workflow fixes to the workflow-fixer agent.

## Process

### 1. Find Context

Locate the most recent completed feature:
- Scan `openspec/changes/*/state.yaml` for the most recent file with `status: completed` or `phase: complete`
- Also check worktree paths: `~/code/feature_worktrees/*/openspec/changes/*/state.yaml`
- Read the state.yaml for feature_id, schema, quality scores, phases
- Find the project root from the state.yaml path or cwd
- Read git log for the feature's commits and diff

If `$ARGUMENTS` contains a feature ID, use that instead of auto-detecting.

### 2. Gather Inputs

Collect the evaluator's inputs from state.yaml:
- **Step history**: read `step_history[]` — the full audit trail of every step (completed, skipped, failed, retried)
- **Per-step learnings**: extract all `learnings[]` entries from each step_history entry
- **Aggregate metrics**: read `metrics{}` — total steps, retries, skips, durations, token usage
- **Skip analysis**: read `metrics.skip_reasons{}` — why steps were skipped, how often
- **Retry analysis**: read `metrics.retry_reasons{}` — what caused retries, patterns
- **Quality report**: from `quality_scores[]` and step-level `metrics.review_score`
- **Project root**: path to the product's CLAUDE.md

### 3. Spawn Workflow Evaluator

Launch the `workflow-evaluator` agent with:
- The step_history audit trail (not a reconstructed report — the raw data)
- Per-step learnings aggregated by type (mistakes, insights, retries, decisions, skips)
- Aggregate metrics for pattern detection
- The project root path for CLAUDE.md updates
- Instruction to run all 5 parts: compliance → step analysis → pattern detection → CLAUDE.md update → metrics write

**Step analysis** (new): The evaluator examines:
- **Skipped steps**: Were they justified? Do skip_reasons indicate a workflow design issue (step should be conditional)?
- **Retried steps**: Are retry_reasons systemic? Should a CLAUDE.md rule prevent the root cause?
- **Mistakes**: Which ones are repeats of known issues? Which are new?
- **Insights**: Which should become best practices in CLAUDE.md?
- **Duration outliers**: Steps taking >2x average may need decomposition
- **Drift events**: `skip_reason: "model drift"` entries indicate the workflow lost the model — tighten instructions

### 4. Route Workflow Fixes

If the evaluator suggests **workflow rules** (for develop.md, implement.md):
- Spawn the `workflow-fixer` agent with those suggestions
- Report what was fixed

If the evaluator suggests **tooling rules** (eslint, knip config):
- Log as manual TODO — these need human oversight

### 5. Report

```
[learn] Evaluation complete for [feature-id]
  Verdict: [CLEAN/PASS/FAIL]
  CLAUDE.md: +N rules applied, M deduplicated
  Metrics: cycle K written to .claude/metrics.jsonl
  Consecutive clean: N/3
  Workflow fixes: [applied/none needed]
```
