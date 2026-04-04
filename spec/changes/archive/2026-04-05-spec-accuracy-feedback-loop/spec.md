---
feature-id: spec-accuracy-feedback-loop
linear-ticket: TBD
---

# Specification: Spec Accuracy Feedback Loop

## Motivation

The workflow system generates task lists and file scopes during the specify phase, but never compares these predictions against reality. After each feature completes, we know exactly how many tasks were needed vs predicted, which files were actually touched, and how much rework occurred — but this data sits in state.yaml unused.

Closing this loop means every completion produces accuracy data that `/learn` can consume to calibrate future task generation. If the system consistently underestimates task counts for UI features or overestimates file scope for config changes, calibration rules can correct for this bias.

## What Changes

A new step contract `compute-prediction-accuracy.yaml` is added to the `complete` phase of the feature, bugfix, and chore schemas. It runs after `final-signoff` and before `run-learn-cycle`, so the accuracy data is available when `/learn` runs. The step writes a `prediction_accuracy` block to state.yaml. The `archive-completed-change` step exports this block to `feature-metrics.jsonl`.

## Requirements

### Functional

1. **FR-1**: A `compute-prediction-accuracy` step contract exists at `$SPEC_HOME/steps/` that computes task and file accuracy.
2. **FR-2**: The step appears in the complete phase of feature, bugfix, and chore schemas between `final-signoff` and `run-learn-cycle`.
3. **FR-3**: The step reads tasks.md to count predicted vs actual tasks (fix tasks are identified by ID pattern).
4. **FR-4**: The step reads spec.md or fix-plan.md for predicted file scope, and `git diff --name-only main...HEAD` for actual files.
5. **FR-5**: The step writes a `prediction_accuracy` block to state.yaml with task accuracy, file accuracy, and rework rate.
6. **FR-6**: The `archive-completed-change` step exports `prediction_accuracy` to `feature-metrics.jsonl` under `workflow_quality`.
7. **FR-7**: The `/develop` skill's mechanical steps dispatch table includes an entry for `compute-prediction-accuracy`.

### Non-Functional

1. **NFR-1**: Computation failure is non-blocking — if the step fails, it logs a warning and returns success.
2. **NFR-2**: The step runs in seconds (reads existing files + git diff — no heavy computation).

## Architecture

### Components

| Component | Role | Change |
|-----------|------|--------|
| `compute-prediction-accuracy.yaml` | Step contract | New file |
| `feature.yaml` | Schema | Add step to complete phase |
| `bugfix.yaml` | Schema | Add step to complete phase |
| `chore.yaml` | Schema | Add step to complete phase |
| `archive-completed-change.yaml` | Step contract | Add prediction_accuracy to metrics export |
| `develop/SKILL.md` | Skill | Add mechanical step entry |

### Data Flow

```
final-signoff
  |-- approval recorded in state.yaml
  v
compute-prediction-accuracy
  |-- reads tasks.md → predicted vs actual task count, rework rate
  |-- reads spec.md/fix-plan.md → predicted file list
  |-- runs git diff → actual file list
  |-- writes prediction_accuracy block to state.yaml
  v
run-learn-cycle
  |-- /learn reads state.yaml (now includes prediction_accuracy)
  |-- can use accuracy data to calibrate generate-or-refresh-tasks rules
  v
archive-completed-change
  |-- exports prediction_accuracy to feature-metrics.jsonl
```

### state.yaml prediction_accuracy Block

```yaml
prediction_accuracy:
  computed_at: "2026-04-05T10:00:00+05:30"
  tasks:
    predicted: 4
    actual: 6
    delta: 2
    accuracy_pct: 66.7
    fix_task_count: 2
    rework_rate: 0.33
  files:
    predicted: 5
    actual: 7
    delta: 2
    overlap_pct: 71.4
    predicted_list: [src/spec/steps/foo.yaml, ...]
    actual_list: [src/spec/steps/foo.yaml, src/spec/steps/bar.yaml, ...]
```

## Test Strategy

N/A — this is a config_docs change (YAML + markdown). No executable code, no test files.

### Key Verification Scenarios

- Step contract follows the established pattern (id, version, intent, inputs, rules, instruction, verify, outputs).
- Schema YAML is valid after modification (steps array intact).
- `compute-prediction-accuracy` appears between `final-signoff` and `run-learn-cycle` in all three schemas.
- `archive-completed-change.yaml` includes `prediction_accuracy` in the `workflow_quality` block.

## Acceptance Criteria

- AC-1: Given `compute-prediction-accuracy.yaml`, when inspected, then it has all required step contract fields. [traces: FR-1]
- AC-2: Given each schema's complete phase steps, when listed, then `compute-prediction-accuracy` appears after `final-signoff` and before `run-learn-cycle`. [traces: FR-2]
- AC-3: Given `compute-prediction-accuracy` rules, when computation fails, then the step logs a warning and returns success (non-blocking). [traces: NFR-1]
- AC-4: Given `archive-completed-change.yaml` workflow_quality block, when inspected, then it includes a `prediction_accuracy` field. [traces: FR-6]
- AC-5: Given `/develop` SKILL.md mechanical steps section, when inspected, then `compute-prediction-accuracy` has an entry with haiku-agent dispatch and non-blocking note. [traces: FR-7]

## Impact

No breaking changes. The step is additive and non-blocking. Existing workflows gain prediction accuracy tracking; failure to compute does not affect archive or completion outcome.

<!-- Format contract: CONVENTIONS.md § Specification Format Contract -->
