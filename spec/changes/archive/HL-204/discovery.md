# Discovery Brief — Background Agent Orchestration

**Feature**: Update --agents mode to spawn agents via run_in_background so the main thread can monitor completion and apply error_events proactively.

---

## What I Understand

The goal is to make the `--agents` orchestration less fragile by using background agent spawning. Currently, each agent step blocks the main thread entirely — if the agent stalls or errors, the main thread is frozen until the agent returns (or the session times out). Background execution lets the main thread remain responsive, able to do pre-work for upcoming steps, and receive structured completion notifications.

---

## What Already Exists

### Codebase

**Agent tool `run_in_background` parameter**: The Agent tool supports `run_in_background: true`. When used:
- The agent runs asynchronously — main thread is NOT blocked
- Main thread is automatically notified when the agent completes
- Main thread should NOT poll or sleep — just continue with other work
- Agent output is returned in the completion notification

**HL-203 error infrastructure** (just completed):
- Pre-spawn `next_step` write ensures resume point before any spawn
- `error_events` schema records structured failures in state.yaml
- Missing STATUS = blocked rule handles ambiguous agent output
- Structured `[AGENT_ERROR]` output from subagent-gate.sh

**develop/SKILL.md Agent Mode** (current): All agent spawns are synchronous — the main thread calls `Agent({ subagent_type, model, prompt })` and waits for the string result before proceeding.

### External

N/A — no external dependencies.

---

## Build or Reuse?

**Build** — extend the existing Agent Mode section in develop/SKILL.md. The infrastructure is already there (Agent tool supports background, error recording exists). The gap is purely in the orchestration prose.

---

## Approaches Considered

### Approach A — Background all agent steps (S complexity)

Update develop/SKILL.md to spawn all agent steps with `run_in_background: true`. After each spawn, the orchestrator can do lightweight pre-work (pre-read next step contract, validate state). When the notification arrives, parse the result and follow HL-203 error handling.

- Pros: Simple change — one parameter addition to all Agent() calls. Main thread stays responsive.
- Cons: Cannot truly "monitor" — just gets notified. Pre-work opportunities are limited since steps are sequential.
- Reuse: Extends HL-203 infrastructure directly.

### Approach B — Background with parallel pre-loading (M complexity)

Same as A, plus: while an agent runs in background, the orchestrator pre-loads the next step contract, pre-computes the next agent prompt, and pre-validates state.yaml integrity. This creates a pipeline effect where step transitions are faster.

- Pros: Faster step transitions. Validates state between steps (catches corruption).
- Cons: More complex orchestration logic. Pre-computed prompts may be stale if the agent modifies shared state.
- Reuse: Extends A with additional orchestrator work.

### Approach C — Parallel agent spawning for independent steps (L complexity)

Identify steps within a phase that are independent (no data dependency) and spawn them in parallel. For example, in the specify phase, `explore` and `load-project-context` could theoretically run concurrently.

- Pros: Significant speed improvement for phases with independent steps.
- Cons: Most steps have sequential dependencies. Identifying independence requires schema analysis. State.yaml concurrent writes are unsafe. Very high complexity for limited gain.
- Reuse: Would need a dependency graph in the schema — new infrastructure.

---

## Recommendation

**Approach A** — simplest, highest leverage. The main benefit is resilience (main thread not frozen), not parallelism. Background spawning + HL-203 error recording gives the orchestrator a reliable async execution model.

---

## Key Decisions

### D1: Approach A selected (S complexity)

Deterministic selection: A=S(2) < B=M(3) < C=L(4). A reuses 2 existing modules (Agent tool background support, HL-203 error_events).

### D2: Sequential execution preserved

Steps remain sequential even with background spawning. The main thread waits for the notification before advancing. The value is not parallelism — it's that the main thread can do pre-work and isn't completely frozen.

### D3: Pre-work during background execution

While an agent runs in background, the orchestrator MAY:
- Pre-read the next step contract from disk
- Validate state.yaml integrity (schema field present, flags consistent)
- Log the current step's spawn metadata to state.yaml

The orchestrator MUST NOT:
- Spawn another agent step (sequential execution)
- Modify files the background agent is working on
- Advance the step counter before notification arrives

---

## Personas

- **Mahesh** — runs /autopilot unattended; wants the main thread to be resilient to agent stalls
- **Orchestrator model** — follows the prose; needs clear instructions on when to use background

---

## Use Cases

### UC-1: Normal agent step with background spawning
Orchestrator writes pre-spawn next_step, spawns agent with run_in_background: true, pre-reads next step contract while waiting, receives notification, parses STATUS, updates state.yaml.

### UC-2: Agent error with background spawning
Agent errors in background. Notification arrives with error output. Orchestrator writes error_events, follows Agent Blocked Protocol (re-spawn once with context).

### UC-E1: Agent returns empty (background)
Notification arrives with no STATUS. Subagent-gate has emitted [AGENT_ERROR]. Orchestrator treats as blocked per Missing STATUS Rule.

---

## Scope

### In-Scope
- Update develop/SKILL.md Agent Mode to use `run_in_background: true` for agent steps
- Define what pre-work the main thread can do during background execution
- Ensure error handling from HL-203 works with background notification model

### Out-of-Scope
- Parallel agent spawning (Approach C)
- Changes to the Agent tool itself
- Changes to subagent-gate.sh (already emits structured output from HL-203)
- Changes to CONVENTIONS.md (error_events schema unchanged)

---

## Technical Context

### Files Directly Affected
- `src/claude/skills/develop/SKILL.md` — Agent Mode section: add run_in_background instructions, define pre-work, update agent spawn pattern

### Files Consulted but Not Changed
- `~/.config/spec/steps/CONVENTIONS.md` — error_events schema (unchanged, already supports background model)
- `src/hooksmith/scripts/subagent-gate.sh` — already emits structured [AGENT_ERROR] (unchanged)

---

## Open Questions

None — approach is straightforward. Background spawning is a supported Agent tool parameter.
