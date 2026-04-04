---
feature-id: retry-pattern-autofix
linear-ticket: HL-199
---

# Specification: Retry Pattern Autofix

## Summary

Extend `/learn` to perform cross-feature retry analysis. Instead of only analyzing the current feature's retries one-at-a-time, scan archived state.yaml files across the last 10 completed features to detect recurring failure patterns. When a step has a retry rate >30% for the same reason across 3+ features, auto-generate a targeted improvement (preventive rule or pre-check) for that step contract.

## Scope

Config/docs only (YAML + Markdown). No executable code. Two files modified:
- `src/claude/skills/learn/SKILL.md`
- `src/spec/steps/archive-completed-change.yaml`

## Requirements

### Functional

1. **FR-1**: `/learn` scans `spec/changes/archive/*/state.yaml` for the last 10 completed features, extracting retry data from `step_history` and `metrics.retry_reasons`.
2. **FR-2**: Retry data is aggregated by `step_id → reason_category → count` across all scanned features.
3. **FR-3**: A pattern is flagged as systemic when: `feature_count >= 3` AND retry rate > 30% for that step+reason pair.
4. **FR-4**: Systemic patterns are included in the workflow-evaluator prompt with the target step contract path.
5. **FR-5**: The evaluator routes systemic patterns to `workflow-fixer` as workflow design issues (preventive rules or pre-checks).
6. **FR-6**: `feature-metrics.jsonl` entries include a `retries` block with `total_retries`, `retry_by_step`, and `retry_reasons`.

### Non-Functional

1. **NFR-1**: Cross-feature analysis is additive — if archive is empty or has <3 features, the section is silently skipped.
2. **NFR-2**: The retries block in feature-metrics.jsonl is non-blocking — if retry data is absent, `{}` defaults apply.

## Architecture

### Components Changed

| Component | Change |
|-----------|--------|
| `src/claude/skills/learn/SKILL.md` | Add step 2b: Cross-Feature Retry Analysis |
| `src/spec/steps/archive-completed-change.yaml` | Add `retries` block to feature-metrics.jsonl format (v4) |

### Data Flow

```
/learn invoked
  |-- Step 2b: scan spec/changes/archive/*/state.yaml (last 10)
  |-- aggregate: step_id -> reason -> {feature_count, total_retries}
  |-- filter: feature_count >= 3 AND retry_rate > 30%
  |-- build: systemic_retry_patterns[]
  v
Step 3: spawn workflow-evaluator
  |-- include systemic_retry_patterns in prompt
  |-- evaluator proposes preventive rules for each pattern
  |-- routes to workflow-fixer -> step contract updated
```

## Acceptance Criteria

- AC-1: `/learn` SKILL.md contains a "Cross-Feature Retry Analysis" section between steps 2 and 3
- AC-2: Section describes scanning last 10 archived state.yaml files for retry data
- AC-3: Section specifies the aggregation structure (step_id → reason → count)
- AC-4: Section defines the systemic threshold: feature_count >= 3 AND retry_rate > 30%
- AC-5: Section describes passing systemic_retry_patterns to the evaluator prompt
- AC-6: archive-completed-change.yaml v4 includes a `retries` block in the feature-metrics.jsonl format
- AC-7: The retries block includes total_retries, retry_by_step, and retry_reasons fields

## Files Modified

| File | Change |
|------|--------|
| `src/claude/skills/learn/SKILL.md` | Added step 2b (41 lines) |
| `src/spec/steps/archive-completed-change.yaml` | Added retries block, bumped to v4 |

<!-- Format contract: CONVENTIONS.md § Specification Format Contract -->
