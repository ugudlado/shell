---
feature-id: background-agent-orchestration
linear-ticket: HL-204
---

# Specification: Background Agent Orchestration

## Motivation

The `--agents` mode currently blocks the main thread on every agent spawn. If an agent stalls or errors internally, the main thread is frozen until the agent returns or the session times out. Background spawning via `run_in_background: true` keeps the main thread responsive, enables pre-work between steps, and works with HL-203's error_events infrastructure for proactive error handling.

## What Changes

1. **Background agent spawning** — All agent steps spawn with `run_in_background: true` instead of synchronous blocking.
2. **Pre-work during background execution** — Main thread pre-reads the next step contract and validates state.yaml while the agent runs.
3. **Notification-based result handling** — Parse agent output from the completion notification, apply HL-203 error handling.

## Requirements

### Functional

1. **FR-1**: Agent steps in --agents mode spawn with `run_in_background: true`.
2. **FR-2**: While an agent runs in background, the orchestrator pre-reads the next step contract and validates state.yaml integrity.
3. **FR-3**: Error handling from HL-203 (error_events, Missing STATUS Rule, Agent Blocked Protocol) applies identically to background agent results.

### Non-Functional

1. **NFR-1**: Steps remain sequential — no parallel agent execution.
2. **NFR-2**: No changes to CONVENTIONS.md or subagent-gate.sh required.

## Architecture

| File | Change Type | Description |
|------|-------------|-------------|
| `src/claude/skills/develop/SKILL.md` | Modify | Agent Mode: background spawning, pre-work definition, notification handling |

## Test Strategy

### Test File Paths
N/A — config_docs change.

### Key Test Scenarios
1. Verify Agent Mode section specifies `run_in_background: true`
2. Verify pre-work instructions are present
3. Verify error handling compatibility with background model

## Acceptance Criteria

- AC-1: Given an agent step in --agents mode, when the orchestrator spawns the agent, then `run_in_background: true` is specified in the Agent() call. [traces: UC-1]
- AC-2: Given an agent running in background, when the orchestrator waits for notification, then it pre-reads the next step contract and validates state.yaml. [traces: UC-1]
- AC-3: Given a background agent that returns STATUS: blocked, when the notification arrives, then error_events is written and Agent Blocked Protocol is followed identically to synchronous mode. [traces: UC-2, UC-E1]
- AC-4: Given background agent spawning, when steps execute, then they remain sequential (no parallel execution). [traces: NFR-1]

## Alternatives Considered

**Alternative: Parallel agent spawning (Approach C)**
Rejected. Most steps have sequential dependencies. State.yaml concurrent writes are unsafe. Very high complexity for limited gain.

## Impact

No breaking changes. The orchestrator behavior is the same from the agent's perspective — only the main thread's blocking behavior changes.

## Decisions

- Background all agent steps (not selective) — simplicity over optimization.
- Sequential execution preserved — background is for resilience, not parallelism.
- Pre-work is optional — orchestrator MAY pre-read next contract, not required.

<!-- Format contract: CONVENTIONS.md § Specification Format Contract -->
