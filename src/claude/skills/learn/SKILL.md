---
name: learn
description: "Evaluate last feature's workflow compliance and route learned rules to step contracts and project.yaml learnings. Use after completing a feature, or when the user says \"learn\", \"evaluate workflow\", \"what did we learn\", \"update rules\"."
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

`/learn` runs the evaluation + self-improvement loop after a feature is completed. It spawns the workflow-evaluator to assess compliance, route learned rules to step contracts in `$SPEC_HOME/steps/` and project-specific learnings to `spec/project.yaml` `learnings:` section. Rules go into step contracts (deterministic, enforced at execution time). Project-specific learnings go into project.yaml (agent-agnostic, persists across sessions).

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
- **Project root**: path to spec/project.yaml (for learnings and vision context)

### 2b. Cross-Feature Retry Analysis

Before spawning the evaluator, scan archived state.yaml files across recent features to detect systemic retry patterns.

1. **Collect archive data**: Find the last 10 completed features by listing `spec/changes/archive/*/state.yaml` sorted by modification time (most recent first, limit 10). For each, read the file and extract:
   - `feature_id`
   - `step_history[].retries` (retry count per step entry)
   - `step_history[].retry_reasons[]` (list of reason strings per retry)
   - `metrics.retry_reasons{}` (aggregate retry reason map, if present)

2. **Aggregate by step + reason**: Build a map:
   ```
   patterns[step_id][reason_category] = {
     feature_count: N,   // how many features had this step+reason combo
     total_retries: M,   // total retries across all features
     feature_ids: [...]  // which features
   }
   ```
   Normalize reason text by lowercasing and collapsing whitespace before grouping.

3. **Flag systemic patterns**: A pattern is systemic if:
   - `feature_count >= 3` (same step+reason appears in 3 or more features), AND
   - Retry rate for that step > 30% across those features (total_retries / total step executions > 0.30)

4. **Prepare pattern report**: For each systemic pattern, record:
   ```yaml
   systemic_retry_patterns:
     - step_id: <step_id>
       reason: <normalized reason>
       feature_count: N
       total_retries: M
       feature_ids: [...]
       suggested_target: <path to $SPEC_HOME/steps/<step_id>.yaml>
   ```

5. **Pass to evaluator**: Include `systemic_retry_patterns` in the evaluator prompt (step 3). If no systemic patterns are found, omit the section. When patterns exist, instruct the evaluator to:
   - Treat each pattern as a workflow design issue requiring a preventive rule or pre-check
   - For each: propose a concrete rule addition to the target step contract that would prevent the root cause
   - Route the fix to `workflow-fixer` (same as other workflow issues)

### 3. Spawn Workflow Evaluator

Launch the `workflow-evaluator` agent with:
- The step_history audit trail (not a reconstructed report — the raw data)
- Per-step learnings aggregated by type (mistakes, insights, retries, decisions, skips)
- Aggregate metrics for pattern detection
- **Systemic retry patterns** from step 2b (if any) — include the full `systemic_retry_patterns` list with step IDs, reasons, counts, and suggested target contracts
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

**Routing targets:**
- **Workflow rules** → step contracts in `$SPEC_HOME/steps/` (deterministic, enforced at execution time, shared across repos)
- **Project-specific learnings** → `spec/project.yaml` `learnings:` section (agent-agnostic, persists across sessions, repo-scoped)
- **Never write to CLAUDE.md** — it's a pointer file only.

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
- **IMPORTANT — Rule metadata**: When the workflow-fixer writes a learned rule, it MUST append the metadata comment inline on the same line as the rule text:
  `<!-- learned: YYYY-MM-DD, source: FEATURE-ID, cycle: N, repo: REPO_NAME -->`
  Where: `YYYY-MM-DD` = today's date, `FEATURE-ID` = the feature being evaluated, `N` = current cycle count (from feature-metrics.jsonl line count), `REPO_NAME` = `basename $(git rev-parse --show-toplevel)` (the repo that generated this rule).
  **Repo scoping**: Default to `repo: $REPO_NAME` (repo-scoped). Only use `repo: *` (universal) when the rule is about workflow mechanics itself (e.g., "always write next_step before spawn") and NOT about tech-stack, domain, or repo-specific patterns.
  This is required by `$SPEC_HOME/steps/CONVENTIONS.md` § Rule Lifecycle Convention.
  Permanent (hand-written) rules already in the step contract MUST NOT receive a metadata comment.

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

### 5b. Rule Effectiveness Update (every invocation)

This sub-step runs on every `/learn` invocation. It updates hit/miss counters on
learned rules based on the just-completed feature's step retry data.

**Update counters**:
1. Read the just-completed feature's `step_history[]` from state.yaml.
2. Build a map: `step_retries[step_id] = total retry count for that step`.
   A step with no retries has count 0.
3. List all `$SPEC_HOME/steps/*.yaml` files.
4. For each file, grep for lines matching `<!-- learned:`. For each learned rule:
   - Parse the metadata fields: `learned`, `source`, `cycle`, `hits` (default 0), `misses` (default 0).
   - Determine the step_id from the filename (e.g., `execute-next-task.yaml` → `execute-next-task`).
   - If `step_retries[step_id] == 0`: increment `hits` by 1.
   - If `step_retries[step_id] > 0`: increment `misses` by 1.
   - If `step_id` was not executed in this feature (not in step_history): skip — do not update counters.
5. Rewrite the metadata comment inline with updated counters.
6. Log: `[learn] Rule effectiveness: updated N rules across M step contracts`

### 5b-decay. Rule Decay Evaluation (every 5th invocation)

This sub-step runs only when the current cycle count is a multiple of 5. It scans all
step contracts for ineffective learned rules and routes flagged rules to workflow-fixer.

**Trigger check**:
1. Count lines in `~/.claude/logs/feature-metrics.jsonl` as cycle count K.
2. If `K % 5 != 0`: skip this sub-step entirely. Log: `[learn] Rule decay: skipped (cycle K, next at cycle M)`.
3. If `K % 5 == 0`: proceed.

**Scan**:
1. List all `$SPEC_HOME/steps/*.yaml` files.
2. For each file, grep for lines matching `<!-- learned:` to collect all learned rules.
3. For each learned rule found, parse the metadata:
   - `date` from `learned: YYYY-MM-DD`
   - `source` from `source: FEATURE-ID`
   - `cycle` from `cycle: N`
   - `hits` from `hits: N` (default 0 if missing)
   - `misses` from `misses: N` (default 0 if missing)

**Flag for removal** (ineffective rule) when ANY of:
- `hits == 0 AND (K - cycle) > 5` — rule has never demonstrably helped after 5+ features
- `(hits + misses) > 0 AND misses / (hits + misses) > 0.7 AND (K - cycle) > 10` — rule is mostly ineffective (>70% miss rate) over sufficient sample
- `hits == 0` AND the rule's `source:` feature-id does NOT appear in any `retry_reasons` or evaluator findings from the last 10 archived state.yaml files

**Flag for retention** (effective rule — do NOT remove even if old):
- `hits > 0 AND (hits + misses) > 0 AND misses / (hits + misses) <= 0.7` — rule is demonstrably working

**Flag for resolution** (contradictory rule) when:
- Two learned rules in the same step contract's `rules:` section offer directly opposing advice on the same topic (e.g., "always X" vs "never X").
- The newer rule (higher `cycle:` value) is preferred; the older one is flagged for removal.

**Prune**:
1. Collect all flagged rules (removal + resolution candidates) with their file paths and line context.
2. If no rules are flagged: log `[learn] Rule decay: scanned N rules, nothing flagged` and stop.
3. Spawn the `workflow-fixer` agent with:
   - The list of flagged rules (file path, rule text, metadata, reason for flagging)
   - Include hit/miss data so the fixer understands why the rule was flagged
   - Instruction to remove or resolve each flagged rule from the step contract
   - Reminder to read CONVENTIONS.md § Rule Lifecycle Convention before editing
   - Constraint: ONLY remove rules with `<!-- learned:` metadata — never touch permanent rules
4. Log: `[learn] Rule decay: scanned N rules, flagged M for removal, K for resolution`

### 5c. Adaptive Quality Bar (every invocation)

This sub-step runs after §5b on every `/learn` invocation. It reads recent performance metrics and adjusts `quality_bar.scoring.green_base` in `spec/project.yaml` when trends warrant it.

**Read metrics**:
1. Read `~/.claude/logs/feature-metrics.jsonl` — take the last 5 lines (most recent features).
2. For each entry, extract review score and retry rate using this field priority:
   - **Review score**: `workflow_quality.review_score_avg` → fallback to `quality.overall` → fallback to omit entry
   - **Retry rate**: `retries.total_retries / tasks.total` if `retries` block exists → fallback to `tasks.reviewFixes / tasks.total` if `tasks.total > 0` → fallback to `0`
3. Compute aggregates from entries that yielded a valid score:
   - `avg_review_score` = mean of all extracted review scores
   - `avg_retry_rate` = mean of all extracted retry rates

If fewer than 2 valid entries exist: skip this sub-step entirely and log `[learn] Quality bar: insufficient data (N entries), skipping`.

**Read current bar**:
4. Read `spec/project.yaml` — extract `quality_bar.scoring.green_base` (current value).

**Apply adjustment rules**:
5. Evaluate conditions in order:
   - **Tighten**: if `avg_review_score >= 9.5` AND `avg_retry_rate < 0.10`:
     - `new_base = min(current_base + 0.25, 9.5)`
   - **Loosen**: if `avg_review_score < 8.0` OR `avg_retry_rate > 0.40`:
     - `new_base = max(current_base - 0.25, 7.0)`
   - **Stable**: otherwise → `new_base = current_base`

**Apply changes** (only if `new_base != current_base`):
6. Update `spec/project.yaml` — replace the `green_base:` line with:
   ```
   green_base: <new_base>  # auto-adjusted YYYY-MM-DD from X.X (avg: Y.Y, retry: Z%)
   ```
   Where YYYY-MM-DD is today's date, X.X is the old value, Y.Y is avg_review_score (1 decimal), Z% is avg_retry_rate as a percentage (0 decimals).
   Remove any previous `# auto-adjusted` comment that was on the `green_base:` line before replacing.
7. If the adjustment was a **loosen** (new_base < current_base):
   - Create a Linear ticket:
     - Title: `Quality bar lowered: investigate review score / retry rate trend`
     - Description: `avg_review_score=Y.Y, avg_retry_rate=Z%, green_base adjusted from X.X to new_base. Last N features analyzed.`
     - Team: "Home Labs", Labels: ["shell", "Improvement", "S"], Priority: 4
8. Log the result:
   - If adjusted: `[learn] Quality bar adjusted: green_base X.X → Y.Y (avg score: Z.Z, retry rate: W%)`
   - If stable: `[learn] Quality bar stable at X.X (avg score: Y.Y, retry rate: Z%)`
