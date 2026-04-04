---
feature-id: error-recovery-contract
linear-ticket: TBD
---

# Chore: Error Recovery Contract

## What

Add an "Error Recovery Contract" section to CONVENTIONS.md defining deterministic state transitions for all failure scenarios: step failure, agent blocked, phase verification failure, retry exhaustion, and escalation.

Files to modify:
- src/spec/steps/CONVENTIONS.md — add Error Recovery Contract section
- src/claude/skills/develop/SKILL.md — replace inline error handling prose with contract reference

## Why

Error handling is currently described in 4 scattered locations (SKILL.md lines 195-196, 330-333, schema on_max_retries strings, and agent prompt template). The behavior is ad-hoc — "mark the step as failed" has no state transition definition, "generate fix tasks" has no protocol, and "escalate to user" is a free-form string. This makes failure recovery the least deterministic part of the workflow.

## Acceptance Criteria

- AC-1: CONVENTIONS.md contains an "Error Recovery Contract" section with a state transition table covering: step_completed, step_failed, step_blocked, phase_verification_failed, retry_exhausted
- AC-2: Each transition defines: trigger condition, state.yaml field updates, next action
- AC-3: on_max_retries is formalized as an enum: "escalate" (pause + user prompt) or "ticket" (create Linear ticket + continue)
- AC-4: Agent blocked handling defines exact re-spawn semantics (max 1 retry with context)
- AC-5: /develop SKILL.md error handling sections reference the contract instead of inline prose
