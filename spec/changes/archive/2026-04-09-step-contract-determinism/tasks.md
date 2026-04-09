# Tasks — Step Contract Determinism

## Phase 1: Foundations

- [ ] T-1: Add state.yaml update convention to CONVENTIONS.md
  Files: src/spec/steps/CONVENTIONS.md
  Verify: CONVENTIONS.md has a "State Updates" section with standardized step_history entry format

- [ ] T-2: Add tasks.md format contract to CONVENTIONS.md
  Files: src/spec/steps/CONVENTIONS.md
  Verify: CONVENTIONS.md has a "Task Format Contract" section with exact markdown format spec

## Phase 2: Critical fixes

- [ ] T-3: Fix scoring rubric in run-phase-review
  Files: src/spec/steps/run-phase-review.yaml
  Verify: Scoring instruction has explicit +1 criteria, fix-task generation is constrained
  depends: T-1

- [ ] T-4: Clarify explore vs design-exploration boundary
  Files: src/spec/steps/explore.yaml, src/spec/steps/design-exploration.yaml
  Verify: explore has no "approaches with trade-offs", design-exploration owns that responsibility
  depends: T-1

- [ ] T-5: Define staleness criteria in create-or-refresh-artifacts
  Files: src/spec/steps/create-or-refresh-artifacts.yaml
  Verify: "outdated" is explicitly defined with missing/stale/skip criteria, absent-discovery fallback exists
  depends: T-1

- [ ] T-6: Add auto-pick heuristic to design-exploration
  Files: src/spec/steps/design-exploration.yaml
  Verify: auto_approve_phases path has deterministic selection (lowest complexity, prefer reuse)
  depends: T-4

## Phase 3: High-priority fixes

- [ ] T-7: Add tasks.md format reference to generate-or-refresh-tasks and execute-next-task
  Files: src/spec/steps/generate-or-refresh-tasks.yaml, src/spec/steps/execute-next-task.yaml
  Verify: generate step outputs exact format, execute step inputs reference it
  depends: T-2

- [ ] T-8: Fix archive step — error handling, ordering, script fallback
  Files: src/spec/steps/archive-completed-change.yaml
  Verify: Script existence check present, state.yaml update before cleanup, error handling rules added

- [ ] T-9: Standardize state.yaml references across all steps
  Files: src/spec/steps/explore.yaml, src/spec/steps/design-exploration.yaml, src/spec/steps/create-or-refresh-artifacts.yaml, src/spec/steps/ux-design.yaml, src/spec/steps/generate-or-refresh-tasks.yaml, src/spec/steps/diagnose.yaml, src/spec/steps/run-feature-verification.yaml
  Verify: All 7 steps reference the CONVENTIONS.md state update format instead of vague "update state.yaml with X status"
  depends: T-1

## Phase 4: Medium fixes

- [ ] T-10: Clean up phase-signoff dead logic and ux-design skip comment
  Files: src/spec/steps/phase-signoff.yaml, src/spec/steps/ux-design.yaml
  Verify: phase-signoff has no "if signoff not required" branch, ux-design has no skip comment
