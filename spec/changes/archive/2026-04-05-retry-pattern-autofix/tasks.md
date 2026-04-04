# Tasks: retry-pattern-autofix

## T-1: Add Cross-Feature Retry Analysis section to /learn SKILL.md [x]
Why: The learn skill only analyzes one feature at a time. Cross-feature aggregation requires a new step between "Gather Inputs" and "Spawn Workflow Evaluator".
Files: src/claude/skills/learn/SKILL.md
Verify: Section "2b. Cross-Feature Retry Analysis" exists between steps 2 and 3; contains archive scan, aggregation, threshold check, and evaluator passthrough instructions.

## T-2: Add retries block to archive-completed-change.yaml feature-metrics.jsonl format [x]
Why: Cross-feature analysis needs structured retry data in the metrics log. The existing feature-metrics.jsonl format lacks retry fields.
Files: src/spec/steps/archive-completed-change.yaml
Verify: feature-metrics.jsonl format includes "retries" block with total_retries, retry_by_step, retry_reasons; version bumped to 4.
