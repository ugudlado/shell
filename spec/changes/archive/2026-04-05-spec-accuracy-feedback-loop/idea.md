# Spec Accuracy Feedback Loop

## Idea
After a feature completes, automatically compare what the spec predicted (task count, files to change, estimated complexity) against what actually happened (actual task count, actual files changed, retries, rework). Write a "prediction accuracy" score to state.yaml and feed systematic drift patterns back into `generate-or-refresh-tasks.yaml` as calibration rules. If the system consistently underestimates task counts for certain types of work, it should learn to generate more tasks upfront.

## Why Now
The archive step already computes SWE metrics (files changed, insertions, deletions, commits). The spec artifacts already record predicted scope. The data to compare exists on both sides -- it just never gets connected. This is the difference between a system that tracks metrics and a system that uses them.

## How It Closes the Loop
**Currently open**: `generate-or-refresh-tasks` produces tasks based on the spec. After implementation, we know how many tasks were actually needed, how many retries occurred, and whether the scope was accurate. But this data never flows back to improve future task generation.

**After this change**: Each completed feature produces a prediction-vs-reality delta. Over multiple features, patterns emerge: "UI features consistently need 1.5x the predicted tasks", "bugfixes in step contracts always touch more files than estimated". These patterns become calibration rules in the task generation step.

## Implementation Sketch
- During `archive-completed-change`, compute:
  - Predicted task count (from tasks.md initial version) vs actual (including added fix tasks)
  - Predicted files (from spec Files/Scope) vs actual (from git diff)
  - Rework rate (fix tasks / total tasks)
- Write `prediction_accuracy` block to state.yaml
- After N features (e.g., 5), run a calibration analysis that scans archived state.yaml files for systematic bias
- If bias detected, add a calibration rule to `generate-or-refresh-tasks.yaml`

## Priority
- User value: 7/10 -- better specs mean less rework, but effect is indirect
- Strategic fit: 9/10 -- core to "learns from results and improves itself"
- Technical leverage: 7/10 -- improves the quality of every future spec
- Effort: medium
- **Score: 7.0**
