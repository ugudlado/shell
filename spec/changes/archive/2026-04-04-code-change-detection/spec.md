---
feature-id: code-change-detection
linear-ticket: TBD
---

# Chore: Change Type Detection for Agent Spawning and Flag Adaptation

## What

Add a "Change Type Detection" section to CONVENTIONS.md that defines how the orchestrator classifies a change as "code" vs "config/docs" based on task file extensions. Update the /develop skill to:
1. Detect change type from tasks.md Files: fields after task generation
2. When change type is "config/docs" and --agents is true: allow inline execution, log reason in state.yaml
3. When change type is "config/docs" and tdd_required is true: adapt by skipping TDD pattern in tasks, log flag adaptation
4. When change type is "config/docs" and --agents is true: run-phase-review can execute inline

## Why

Three non-determinism issues observed in HL-192:
- execute-next-task ran inline despite --agents flag (correct judgment, but no contract permits it)
- tdd_required was true but no tests written (correct for YAML, but no rule says when TDD doesn't apply)
- Phase review ran inline despite --agents (correct efficiency, but inconsistent with flag contract)

All three stem from missing change type detection. Adding it makes the orchestrator's adaptation explicit and deterministic.

## Acceptance Criteria

- AC-1: CONVENTIONS.md contains a "Change Type Detection" section defining code extensions vs config/docs extensions
- AC-2: The section defines a detection algorithm: scan tasks.md Files: fields, classify each extension, if ALL files are config/docs → change_type is "config_docs", otherwise "code"
- AC-3: The section defines flag adaptation rules: what tdd_required, agents, and review behavior mean for config_docs changes
- AC-4: /develop SKILL.md agent mode section references the contract and handles config_docs inline execution
- AC-5: State.yaml gains a `change_type` field in the State Field Registry (CONVENTIONS.md)
