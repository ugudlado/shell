# Step Contract Determinism Fixes

## Summary
Eliminate semantic non-determinism from step contracts. The dispatch layer (schemas, flags, eager filtering) is deterministic, but the execution layer — what each step produces — has variance from vague prose, missing criteria, and unstandardized state updates.

## Scope
10 step contract files + 1 conventions doc. No schema changes, no skill changes, no new files.

## Changes

### C1. Scoring rubric (run-phase-review)
- Replace "adjust based on quality of output" with explicit +1 criteria
- Constrain fix-task generation to minimal, evidence-based tasks

### C2. Explore vs design-exploration boundary
- Explore: problem-space survey (constraints, patterns, open questions) — remove "approaches with trade-offs"
- Design-exploration: solution-space options (approaches with trade-offs)

### C3. Staleness criteria (create-or-refresh-artifacts)
- Define "outdated": missing → generate, stale inputs → regenerate, else skip
- Add absent-discovery fallback for chore/spike schemas

### C4. Auto-pick heuristic (design-exploration)
- Explicit selection: lowest complexity that meets requirements, prefer codebase reuse on ties

### H1. tasks.md format contract
- Add explicit format spec to generate-or-refresh-tasks outputs
- Reference format in execute-next-task inputs

### H3. State.yaml update format standardization
- Add standard `step_history` entry format to CONVENTIONS.md
- Reference convention from all 7 steps that say "update state.yaml with X status"

### H4. Archive error handling
- Add script existence check and fallback
- Fix ordering: update state.yaml before cleanup
- Add error handling rules

### H5. Fix-task generation constraints (run-phase-review)
- One fix task per finding, minimal scope, no refactoring

### M5. Phase-signoff dead logic
- Remove internal "if signoff not required" branch — schema gating ensures it always requires signoff when running

### M9. UX-design skip comment
- Remove redundant "This step only runs when..." comment per CONVENTIONS.md

## Acceptance Criteria
1. All step contracts v2+ (version bumped)
2. No prose uses "consider", "may want to", "if appropriate" for decision points
3. Scoring rubric has explicit +1 criteria
4. Auto-pick has deterministic selection heuristic
5. State.yaml update format is standardized in CONVENTIONS.md and referenced by all steps
6. tasks.md format is contractually defined
7. Archive step has error handling and correct ordering
8. Explore and design-exploration have non-overlapping responsibilities
