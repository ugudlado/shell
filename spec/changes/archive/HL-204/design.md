# Design: Background Agent Orchestration

## Context

--agents mode blocks the main thread on each agent spawn. Background execution keeps the main thread responsive and works with HL-203 error infrastructure.

## Goals / Non-Goals

### Goals
- Agent steps spawn with run_in_background: true
- Main thread can do pre-work during background execution
- Error handling works identically to synchronous mode

### Non-Goals
- Parallel agent spawning
- Changes to error_events schema or subagent-gate
- Real-time agent monitoring (unsupported by Agent tool)

## Selected Approach

Approach A — background all agent steps. S complexity. Single file change.

## High-Level Design

```
For each agent step:
  1. Write pre-spawn next_step (HL-203)
  2. Spawn Agent({ ..., run_in_background: true })
  3. While waiting for notification:
     - Pre-read next step contract
     - Validate state.yaml integrity
  4. Notification arrives → parse STATUS
  5. Apply HL-203 error handling (error_events, Blocked Protocol)
  6. Update state.yaml with completion
```

## Low-Level Design

### Changes to develop/SKILL.md

**Agent Prompt Construction** section — add `run_in_background: true` to spawn call:
```
Agent({ subagent_type, model, prompt, run_in_background: true })
```

**New subsection: Pre-work During Background Execution**:
Define what the orchestrator MAY and MUST NOT do while waiting.

**Error Handling** section — note that all error handling applies identically; the only difference is that agent output arrives via notification rather than synchronous return.

## Constraints
- Steps must remain sequential
- Main thread must not modify files the agent is working on
- Pre-work is limited to read-only operations

## Trade-offs
- Background spawning adds slight complexity to the orchestration prose but significantly improves resilience against agent stalls.

## Open Questions
- None.

<!-- Format contract: CONVENTIONS.md § Design Format Contract -->
