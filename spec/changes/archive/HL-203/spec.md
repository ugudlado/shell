---
feature-id: agent-resilience-monitor
linear-ticket: HL-203
---

# Specification: Agent Resilience Monitor

## Motivation

When `/autopilot` runs `/develop --ff --auto --agents`, agent failures (internal errors, empty output, missing STATUS) cause the workflow to silently hang or leave stale state. The orchestrator has no structured way to record failures, detect stuck agents, or resume from the last successful step. This is the #1 source of autopilot runs requiring manual intervention.

## What Changes

1. **Pre-spawn `next_step` write** — Write resume token before spawning each agent (not after completion), so spawn failures always have a valid resume point.
2. **`error_events` in state.yaml** — Structured failure records per agent invocation with step_id, phase, agent, attempt, stop_reason, detail, timestamp.
3. **"Missing STATUS = blocked" rule** — Agent output lacking a STATUS field is treated as `STATUS: blocked`, triggering the Agent Blocked Protocol.
4. **`max_iterations` guard** — Ceiling of 15 for `repeat_until` steps to prevent infinite agent spawn loops.
5. **Structured subagent-gate output** — Hook emits machine-readable context (not just human-readable text) so orchestrator can parse agent failure details reliably.

## Requirements

### Functional

1. **FR-1**: When an agent is spawned, `next_step` in state.yaml must point to the current step *before* the spawn occurs.
2. **FR-2**: When an agent fails (STATUS: blocked, empty output, spawn failure, or missing STATUS), a structured `error_events` entry is written to state.yaml.
3. **FR-3**: Agent output without a STATUS field is treated as `STATUS: blocked` and the Agent Blocked Protocol is followed (re-spawn once with context).
4. **FR-4**: `repeat_until` steps have a configurable max_iterations ceiling (default: 15). When reached, the orchestrator pauses and writes to state.yaml.
5. **FR-5**: subagent-gate.sh emits structured context including step_id, agent role, stop_reason, and tool_call_count in a parseable format.

### Non-Functional

1. **NFR-1**: All changes are backward-compatible — existing state.yaml files without `error_events` remain valid.
2. **NFR-2**: No new processes, daemons, or sidecar files introduced.
3. **NFR-3**: Hook does not write to state.yaml directly (race condition prevention — orchestrator owns disk writes).

## Architecture

| File | Change Type | Description |
|------|-------------|-------------|
| `src/claude/skills/develop/SKILL.md` | Modify | Agent Mode: pre-spawn next_step, error recording, max_iterations guard, missing STATUS rule |
| `~/.config/spec/steps/CONVENTIONS.md` | Modify | Error Recovery Contract: error_events schema, missing STATUS = blocked definition |
| `src/hooksmith/scripts/subagent-gate.sh` | Modify | Emit structured context instead of plain text warnings |

## Test Strategy

### Test File Paths

N/A — config_docs change. All files are YAML/markdown/bash with no test framework.

### Coverage Targets

N/A — verification is via manual walkthrough and scenario replay.

### Key Test Scenarios

1. Verify pre-spawn next_step by reading state.yaml after a step begins execution
2. Verify error_events populated after simulating agent STATUS: blocked
3. Verify missing STATUS triggers blocked protocol (not silent success)
4. Verify max_iterations ceiling stops repeat_until at 15
5. Verify subagent-gate.sh output is parseable (structured format)

## Acceptance Criteria

- AC-1: Given an agent step is about to spawn, when the orchestrator writes state.yaml, then `next_step` references the current step (not the previous one). [traces: UC-2, UC-E2]
- AC-2: Given an agent returns STATUS: blocked, when the orchestrator processes the result, then an `error_events` entry is written to state.yaml with step_id, phase, agent, attempt, stop_reason, detail, and timestamp. [traces: UC-1]
- AC-3: Given an agent returns output without a STATUS field, when the orchestrator processes the result, then it treats this as `STATUS: blocked` and follows the Agent Blocked Protocol. [traces: UC-E1]
- AC-4: Given a `repeat_until` step has run 15 iterations without completion, when the orchestrator checks the iteration count, then it pauses execution and writes current state to state.yaml. [traces: UC-E4]
- AC-5: Given subagent-gate.sh fires on SubagentStop with stop_reason: error, when the hook emits context, then the output includes structured fields (step_id, agent, stop_reason, tool_call_count) in a parseable format. [traces: UC-E1, UC-1]
- AC-6: Given a state.yaml from a prior version without `error_events`, when the orchestrator reads it, then it operates normally (backward compatible). [traces: NFR-1]

## Alternatives Considered

**Alternative: Make subagent-gate a directive hook (Approach C)**
Rejected. Requires inventing a new sidecar contract and making hooksmith gates directive rather than advisory — a significant architecture change beyond the scope of this reliability improvement.

**Alternative: Full state.yaml schema extension (Approach A pure)**
Rejected as primary approach. Higher complexity (M vs S) without proportional benefit. Targeted elements (error_events field) are incorporated into the selected approach.

## Impact

No breaking changes. Existing state.yaml files remain valid. The changes are additive — new fields in state.yaml, strengthened prose in SKILL.md and CONVENTIONS.md, and improved hook output format.

## Decisions

- **Pre-spawn write order**: Write next_step before spawn, pointing to current step (retry semantics). Rationale: spawn failure or empty return still has valid resume point.
- **Hook writes context, orchestrator writes disk**: Prevents race conditions between hook process and orchestrator. Rationale: hook runs as separate process; concurrent state.yaml writes are unsafe.
- **Max iterations = 15**: Reasonable ceiling for repeat steps. Rationale: loop-detector fires at 200 tool calls but that's too late; 15 iterations catches runaway loops earlier.

<!-- Format contract: CONVENTIONS.md § Specification Format Contract -->
