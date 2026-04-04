---
name: learn
description: "Evaluate last feature's workflow compliance and route learned rules to step contracts (not CLAUDE.md). Use after completing a feature, or when the user says \"learn\", \"evaluate workflow\", \"what did we learn\", \"update rules\"."
user-invocable: true
args:
  - name: feature-id
    description: Feature ID to evaluate (defaults to most recently completed feature)
    required: false
---

## Variables

REPO_NAME=$(basename "$(git rev-parse --show-toplevel)")
SPEC_HOME=${SPEC_HOME:-$HOME/.config/spec}
SPEC_CHANGES_DIR=$SPEC_HOME/changes/$REPO_NAME

## Learn from Last Feature

$ARGUMENTS

## Overview

`/learn` runs the evaluation + self-improvement loop after a feature is completed. It spawns the workflow-evaluator to assess compliance, route learned rules to the appropriate step contracts in `$SPEC_HOME/steps/`, write cycle metrics, and route workflow fixes to the workflow-fixer agent. Rules go into step contracts (deterministic, enforced at execution time) — NOT into CLAUDE.md (advisory, per-repo, requires model to remember).

## Process

### 1. Find Context

Locate the most recent completed feature:
- Scan `$SPEC_CHANGES_DIR/*/state.yaml` for the most recent file with `status: completed` or `phase: complete`
- Also check `$SPEC_CHANGES_DIR/*/state.yaml` (state files are no longer in worktree-relative paths)
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
- The step contracts directory path: `$SPEC_HOME/steps/`
- The step contract conventions: `$SPEC_HOME/steps/CONVENTIONS.md` (must read before suggesting changes)
- Instruction to run all 5 parts: compliance → step analysis → pattern detection → step contract updates → metrics write

**Step analysis**: The evaluator examines:
- **Skipped steps**: Were they justified? Do skip_reasons indicate a workflow design issue (step should be conditional)?
- **Retried steps**: Are retry_reasons systemic? Should a step contract rule prevent the root cause?
- **Mistakes**: Which ones are repeats of known issues? Which are new?
- **Insights**: Which should become rules in the appropriate step contract?
- **Duration outliers**: Steps taking >2x average may need decomposition
- **Drift events**: `skip_reason: "model drift"` entries indicate the workflow lost the model — tighten instructions
- **SRP violations**: Flag step contracts where the intent has multiple unrelated verbs, or where instruction contains rule-like paragraphs that belong in `rules:`. See `$SPEC_HOME/steps/CONVENTIONS.md`.

### 4. Route Findings

Classify each finding and route it to the right handler.

**IMPORTANT: Never write learned rules to CLAUDE.md.** CLAUDE.md is advisory (model may forget),
per-repo (doesn't transfer), and clutters context. All rules go to step contracts in
`$SPEC_HOME/steps/` which are deterministic (enforced at execution time) and shared across repos.

**Routing decision tree:**

**Workflow issues** (schema gaps, step contract bugs, agent instructions, hook problems):
- Spawn the `workflow-fixer` agent with those suggestions + `$SPEC_HOME/steps/CONVENTIONS.md`
- The fixer MUST read CONVENTIONS.md before editing any step contract
- Fix is applied immediately to disk — improves the next workflow execution

**Code/functionality issues** (bugs discovered, missing features, tech debt, test gaps):
- Create a Linear ticket with description, evidence, and suggested approach
- Do NOT fix inline — let the ideator prioritize it and `/develop` execute it properly
- This ensures code changes go through full spec-first discipline

**Learned rules** (patterns to remember, gotchas discovered, quality checks):
- Determine WHEN the rule should be enforced (which step in the workflow)
- Route to the appropriate step contract in `$SPEC_HOME/steps/`:

  | When to enforce | Target step contract | Where in the file |
  |---|---|---|
  | During diagnosis/investigation | `diagnose.yaml` | `instruction:` section |
  | During implementation | `execute-next-task.yaml` | `rules:` list |
  | During review | `run-phase-review.yaml` | `rules:` or `instruction:` |
  | During final verification | `run-feature-verification.yaml` | `instruction:` section |
  | At phase boundaries | `phase-signoff.yaml` | `instruction:` pre-conditions |
  | During artifact creation | `create-or-refresh-artifacts.yaml` | `rules:` list |
  | During task generation | `generate-or-refresh-tasks.yaml` | `rules:` list |

- Spawn the `workflow-fixer` agent with the rule text and target step contract
- The workflow-fixer appends the rule to the right section of the step contract

**Tooling rules** (eslint, knip config, build settings):
- Log as manual TODO — these need human oversight

### 5. Report

```
[learn] Evaluation complete for [feature-id]
  Verdict: [CLEAN/PASS/FAIL]
  Step contracts: +N rules added to M step contracts
  Workflow fixes: [applied/none needed]
  Metrics: cycle K written to .claude/metrics.jsonl
  Consecutive clean: N/3
```
