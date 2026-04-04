# Design: Agent Resilience Monitor

## Context

The `/develop --agents` mode spawns subagents per step but has no structured failure detection, recording, or recovery. Failures are implied by in-context reasoning, not written to disk. Resume depends on `next_step` which is written after completion — too late if the spawn itself fails.

## Goals / Non-Goals

### Goals

- Every agent failure is recorded in state.yaml with structured data
- Resume always works after agent failure (valid next_step exists)
- Stuck agents (no STATUS, zero tool calls) are detected and handled
- Runaway repeat loops are bounded

### Non-Goals

- Real-time heartbeat polling of running agents (unsupported by Agent tool API)
- Making hooks directive (Approach C — future architecture decision)
- New monitoring processes or daemons
- Changes to autopilot/SKILL.md (error handling belongs in develop)

## Approaches Considered

### Approach A: Structured failure records in state.yaml (M complexity)

Extend state.yaml schema + strengthen subagent-gate to write failure details to disk.
- Pros: Closes observability gap fully at infrastructure level
- Cons: Hook writing to state.yaml creates race conditions; higher complexity

### Approach B: Strengthen orchestrator error recording (S complexity)

Update develop/SKILL.md and CONVENTIONS.md to require structured failure records from the orchestrator.
- Pros: Minimal surface area, zero new infrastructure, high leverage
- Cons: Relies on orchestrating model following prose correctly

### Approach C: Directive subagent-gate with retry injection (L complexity)

Upgrade hook from advisory to directive with sidecar protocol.
- Pros: Detection at infrastructure layer (deterministic)
- Cons: New protocol, architecture change, large testing surface

### Selected Approach

**Approach B + targeted A elements** (S complexity). Selected by deterministic heuristic: lowest complexity wins (S=2 < M=3 < L=4). B reuses 2 existing modules. Supplemented with error_events schema from A and structured hook output.

## High-Level Design

### Architecture Overview

```
Agent Step Execution (develop/SKILL.md)
  |
  1. Write next_step → state.yaml (current step, retry semantics)
  2. Spawn Agent({ subagent_type, model, prompt })
  3. SubagentStop hook fires → subagent-gate.sh emits structured context
  4. Orchestrator receives: agent output + hook context
  5. Parse STATUS from output:
     - STATUS: completed → update step_history, advance
     - STATUS: blocked → write error_events, follow Agent Blocked Protocol
     - No STATUS found → treat as blocked (FR-3)
     - Spawn failure → write error_events, retry once, escalate
  6. Update next_step → state.yaml (next step)
```

### Key Abstractions

- **error_events**: Array in state.yaml recording every agent failure with structured fields
- **Pre-spawn resume token**: next_step written before spawn ensures recovery from any failure mode
- **Missing STATUS = blocked**: Explicit contract turning ambiguous output into actionable failure

## Low-Level Design

### Components

**1. develop/SKILL.md Agent Mode — Pre-spawn write**

Before spawning each agent, write to state.yaml:
```yaml
next_step:
  skill: develop
  phase: <current>
  step_id: <current step>  # Points to THIS step, not the next
  instruction: "Retry: <step intent>"
```

After successful completion, overwrite with the actual next step.

**2. develop/SKILL.md Agent Mode — Error recording**

After agent returns, parse STATUS. On any failure mode:
```yaml
error_events:
  - step_id: <step>
    phase: <phase>
    agent: <agent role>
    attempt: <1-based>
    stop_reason: <error|missing_status|empty_output|spawn_failed>
    detail: "<agent output or error message>"
    timestamp: "<ISO>"
```

**3. develop/SKILL.md — max_iterations guard**

For `repeat_until` steps, track iteration count. At 15:
- Write state.yaml with `status: paused`
- Write error_events entry with stop_reason: `max_iterations_exceeded`
- In `--auto` mode: create Linear ticket with details
- In interactive mode: present to user

**4. CONVENTIONS.md — error_events schema**

Add to Error Recovery Contract section:
- `error_events` field definition with required/optional fields
- `stop_reason` enum: `error`, `missing_status`, `empty_output`, `spawn_failed`, `max_iterations_exceeded`
- "Missing STATUS = blocked" formal definition

**5. subagent-gate.sh — Structured output**

Replace plain-text warnings with tagged structured output:
```
[AGENT_ERROR] step_id=<id> agent=<role> stop_reason=<reason> tool_calls=<count>
```

### Data Flow

1. Orchestrator → state.yaml (pre-spawn next_step)
2. Orchestrator → Agent tool (spawn)
3. Agent tool → SubagentStop hook → subagent-gate.sh → structured context to orchestrator
4. Orchestrator parses agent output + hook context
5. Orchestrator → state.yaml (error_events on failure, next_step on success)

### State Management

- **state.yaml** is the single source of truth (no change to ownership)
- **New field**: `error_events` (array, optional, backward compatible)
- **Modified write timing**: `next_step` written twice per step — before spawn (retry point) and after success (advance point)
- **New field in step_history entries**: `retry_count` (integer, optional)

### Error Handling

| Failure Mode | Detection | Action |
|---|---|---|
| STATUS: blocked | Parse agent output | Write error_events, Agent Blocked Protocol (re-spawn once) |
| Missing STATUS | Parse agent output — no STATUS field found | Treat as blocked, same protocol |
| Empty output (0 tool calls) | subagent-gate context + output parsing | Treat as blocked |
| Spawn failure | Agent tool returns error | Write error_events, retry once, escalate |
| Max iterations (15) | Iteration counter in orchestrator | Pause, write state, ticket/escalate |
| Retry exhausted (2 attempts) | Attempt counter | Escalation Protocol (ticket if --auto) |

## Constraints

- subagent-gate.sh cannot write to state.yaml (race condition with orchestrator)
- Agent tool does not expose real-time progress (no heartbeat possible)
- All changes must be backward compatible with existing state.yaml files
- Changes are config_docs (YAML/markdown/bash) — no compiled code

## Trade-offs

- **Advisory vs directive hooks**: Keeping hooks advisory means detection still depends on the orchestrating model parsing output correctly. Accepted because directive hooks (Approach C) would require a broader architecture change.
- **15 iteration ceiling**: May be too low for very large task lists. Accepted because it can be made configurable later via project.yaml.

## Decisions

- Pre-spawn next_step → retry semantics (point to current step, not next)
- Hook emits to stdout → orchestrator writes to disk (no race conditions)
- max_iterations = 15 (hardcoded now, configurable later)
- error_events is an array (supports multiple failures per run, ordered by timestamp)

## Open Questions

- None remaining — all resolved in discovery Key Decisions (D1-D3).

<!-- Format contract: CONVENTIONS.md § Design Format Contract -->
