# Spec: Adaptive Quality Bar

## Feature ID
adaptive-quality-bar

## Summary
Extend `/learn` to compute a rolling average of review scores and retry rates from `feature-metrics.jsonl`, then auto-adjust `project.yaml`'s `quality_bar.scoring.green_base` when performance trends warrant it.

## Problem
The `quality_bar` in `project.yaml` is static. As the workflow accumulates learned rules, review scores consistently improve — but the bar never moves. A system that always scores 10/10 has a bar that is too easy; it has stopped driving quality improvement. Conversely, if retry rates spike, the bar may be set too high for current capability, causing thrashing without useful learning.

## Solution
After every `/learn` cycle, add a sub-step (§5c) that:
1. Reads the last 5 entries from `~/.claude/logs/feature-metrics.jsonl`
2. Computes `avg_review_score` and `avg_retry_rate`
3. Applies adjustment rules to `quality_bar.scoring.green_base` in `spec/project.yaml`
4. Creates a Linear ticket when the bar is lowered (signals a degradation to investigate)

## Adjustment Rules
| Condition | Action |
|-----------|--------|
| avg_review_score >= 9.5 AND avg_retry_rate < 10% | Raise green_base by 0.25 (cap 9.5) |
| avg_review_score < 8.0 OR avg_retry_rate > 40% | Lower green_base by 0.25 (floor 7.0), create Linear ticket |
| Otherwise | No change, log stable |

## Metrics Field Mapping
The `feature-metrics.jsonl` schema has evolved. The logic must handle both shapes:
- New shape: `workflow_quality.review_score_avg` for score, `retries.total_retries` / total tasks for retry rate
- Legacy shape: `quality.overall` for score, `tasks.reviewFixes` / `tasks.total` as retry proxy

## Out of Scope
- Adjustment history sidecar file (idea.md mentions it; deprioritized — the inline comment in project.yaml is sufficient)
- Adjusting `min_phase_review_score` (only `green_base` changes — the review gate is a separate concern)

## Files Changed
- `src/claude/skills/learn/SKILL.md` — add §5c after §5b
