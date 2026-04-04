# Tasks: Agent Resilience Monitor

## Phase 1: Core resilience contracts

- [x] **Task 1**: Add `error_events` schema to CONVENTIONS.md Error Recovery Contract — define the structured error record format, stop_reason enum, and "missing STATUS = blocked" rule [AC-2, AC-3, AC-6]
- [x] **Task 2**: Update develop/SKILL.md Agent Mode to write `next_step` before each agent spawn (pre-spawn resume token with retry semantics) [AC-1]
- [x] **Task 3**: Update develop/SKILL.md Agent Mode error handling to write structured `error_events` to state.yaml on any agent failure and treat missing STATUS as blocked [AC-2, AC-3]
- [x] **Task 4**: Add `max_iterations` guard (15) for `repeat_until` steps in develop/SKILL.md [AC-4]
- [x] **Task 5**: Update subagent-gate.sh to emit structured `[AGENT_ERROR]` context instead of plain-text warnings [AC-5]

## Verification

- [x] **Task 6**: Walkthrough all 6 acceptance criteria against the implemented changes — verify each with evidence from the modified files
