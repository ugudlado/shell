# Discovery Brief — Agent Resilience Monitor

**Feature**: Add agent health monitoring with structured error capture, heartbeat detection for
stuck agents, and automatic resume-from-last-step when agents fail. Make --agents mode reliable
enough for unattended autopilot runs.

---

## What I Understand

The underlying goal is **autopilot reliability**. `/autopilot` runs `/develop --ff --auto --agents`
for fully unattended execution. When an agent fails — either by returning `STATUS: blocked`,
hitting an internal error, or silently stalling with no output — the current system has no
mechanism to detect or recover automatically. The orchestrator either proceeds incorrectly or
the session ends mid-workflow with no recovery path beyond manual resume.

The stated features (health monitoring, heartbeat detection, structured error capture, resume-
from-last-step) are the solution levers, not the goal itself. The goal is: **zero manual
intervention needed when an agent fails during an autopilot run**.

---

## What Already Exists

### Codebase

**Error Recovery Contract** (`/Users/spidey/.config/spec/steps/CONVENTIONS.md`, line 844):
A state-transition table defines the intended behavior for every failure mode — agent blocked,
spawn failed, retry exhausted. The contract is fully specified in prose. The gap is that the
*orchestrator* (develop/SKILL.md) describes following this contract, but nothing enforces it
or makes failures observable.

**Agent Blocked Protocol** (CONVENTIONS.md, line 874):
Protocol exists: re-spawn once with blocker context appended, then record failure and escalate.
Max attempts: 2. This is already in spec. It is not independently verified during autopilot.

**Escalation Protocol** (CONVENTIONS.md, line 893):
Two modes: `escalate` (set status: paused, present to user) and `ticket` (create Linear ticket,
set status: paused). The `ticket` action is the intended path for `--auto` mode. This is
specified but relies on the orchestrating model reading and following the prose.

**subagent-gate hook** (`/Users/spidey/code/shell/src/hooksmith/rules/subagent-gate.yaml`):
Fires on `SubagentStop`. The script
(`/Users/spidey/.config/hooksmith/scripts/subagent-gate.sh`) checks two things:
- If `stop_reason == "error"`, emits a warning string to the parent agent
- If transcript exists and has zero tool calls, emits a warning about empty output

This is a soft gate — it emits context but does NOT block or cause the orchestrator to retry.
The parent agent receives the warning as context but there is no enforcement that it acts on it.

**subagent-task-context hook** (`subagent-task-context.sh`):
On `SubagentStart`, injects the feature ID, task list reference, and discovery.md path. This
is health-adjacent (tells the subagent what it's working on) but is not monitoring.

**loop-detector hook** (`/Users/spidey/code/shell/src/hooksmith/rules/loop-detector.yaml`):
Fires on `Stop`. Blocks after 200 tool calls in one session burst. This detects *excessive*
activity but not the absence of activity (stuck agent doing nothing) or a mid-execution stall.

**Resume mechanism** (`/Users/spidey/code/shell/src/claude/hooks/workflow-state.sh` +
`auto-continue.sh`):
On `SessionStart`, scans state.yaml files and injects resume context. On session end
(`Stop` hook via `auto-continue.sh`), persists git state snapshot. Resume works across
session boundaries *but only when state.yaml has a valid `next_step` block*. If an agent
fails before updating `next_step`, resume has no meaningful recovery point.

**state.yaml tracking** (`/Users/spidey/.config/spec/changes/shell/HL-189/state.yaml`):
Current schema records `step_history` with status, agent name, and phase. The CONVENTIONS.md
Error Recovery Contract extends this with failure status, blocker field, and retry counters.
But there is no `agent_health`, `last_heartbeat`, `error_events`, or `structured_error` field.
All failure information lives in the orchestrator's in-context reasoning, not in state.yaml.

**develop/SKILL.md Agent Mode** (`/Users/spidey/code/shell/src/claude/skills/develop/SKILL.md`,
line 335):
The orchestrator is instructed to follow the Error Recovery Contract but it is advisory prose,
not a machine-readable contract. An orchestrating agent that hits context pressure may
drop the recovery behavior silently.

**Repeating steps in agent mode** (SKILL.md, line 324):
For `repeat_until: all_tasks_completed`, the orchestrator spawns one iteration, checks the
condition, and re-spawns. There is no timeout or max-total-iterations guard at the repeat level.

### External

No external libraries searched. The feature is entirely internal to this codebase — it touches
the spec workflow infrastructure (step contracts, state.yaml schema, hooksmith hooks, agent
definitions). Web search not warranted.

---

## Build or Reuse?

**Build**, but minimal extension of what exists.

The Error Recovery Contract is already fully specified in CONVENTIONS.md. The resume mechanism
works at session boundaries. The gap is:

1. **No structured machine-readable failure record in state.yaml** — failures are implied by
   the orchestrator's in-context state, not written to disk where hooks and next sessions can read them
2. **subagent-gate is advisory, not actionable** — it warns but does not cause retry or re-spawn
3. **No stuck-agent detection** — loop-detector catches excess activity; nothing catches
   zero activity (agent stalls, times out, or returns empty output silently)
4. **No resume-from-last-step guarantee** — resume only works if `next_step` in state.yaml
   is accurate; mid-step failures leave it stale

The right approach is to extend existing contracts (state.yaml schema, subagent-gate, CONVENTIONS.md
error sections) rather than build a parallel monitoring system. A separate "health monitor"
process would be out of scope and technically unsupported by Claude Code's agent execution model,
which does not expose real-time agent progress during a run.

---

## Approaches Considered

### Approach A — Structured failure records in state.yaml (what was asked for, tightly scoped)

Extend state.yaml schema to record structured error events per agent invocation. Strengthen
the subagent-gate hook to write failure details to state.yaml when stop_reason is "error" or
tool_calls is zero. Add a stuck-agent detection: if the gate observes zero tool calls and
the step had not previously updated `next_step`, mark the step as blocked in state.yaml and
trigger the existing Blocked Protocol from CONVENTIONS.md.

"Heartbeat detection" in the context of Claude Code agents is better understood as "completion
signal detection" — the agent either returns STATUS: completed or it does not. A true heartbeat
(polling a running agent mid-execution) is not supported by the Agent tool API.

- Build vs reuse: extend existing state.yaml schema + strengthen existing subagent-gate script
- Pros: closes the observability gap; failures become recoverable artifacts; autopilot can
  read state.yaml after `/develop` returns and diagnose exactly what failed and where
- Cons: subagent-gate cannot write to state.yaml today without knowing the feature context
  at hook execution time (requires feature ID resolution from branch/cwd)
- Effort: medium (3-4 step contracts to update + state.yaml schema extension + hook changes)

### Approach B — Strengthen the develop orchestrator's error recording (simpler)

Update the `instruction:` in develop/SKILL.md's Agent Mode section to require structured
failure records be written to state.yaml at every agent invocation. No new hooks, no schema
changes beyond adding an `error_events` field to the state.yaml format contract in CONVENTIONS.md.
The orchestrator already knows the feature context and can write to state.yaml directly.

"Stuck agent" handling becomes: if `Agent()` returns without STATUS in the output, treat as
blocked (same as STATUS: blocked) and follow existing Agent Blocked Protocol.

"Resume-from-last-step" becomes: guarantee `next_step` is written to state.yaml *before*
spawning each agent (not after completion), so a spawn failure or empty return still has a
valid resume point.

- Build vs reuse: update two files (develop/SKILL.md and CONVENTIONS.md), no new hooks
- Pros: extremely minimal surface area; zero new infrastructure; high leverage since the
  orchestrator already has all context needed; directly improves the prose that agents follow
- Cons: still relies on the orchestrating model following the prose correctly; does not add
  observability at the hook layer
- Effort: small (2 files, targeted edits)

### Approach C — Make subagent-gate actionable with retry injection

Upgrade subagent-gate from passive observer to active retry injector. When a subagent ends
with `stop_reason: error` or zero tool calls, the gate hook writes a retry directive to a
sidecar file that the orchestrator checks between spawns. The orchestrator reads the sidecar
and retries per the Agent Blocked Protocol without requiring the orchestrator model to have
detected the failure itself.

- Build vs reuse: new sidecar protocol, new hook behavior, orchestrator change to check sidecar
- Pros: moves detection to infrastructure layer (hooks fire deterministically regardless of model)
- Cons: requires inventing a new sidecar contract; hooksmith gates are currently advisory
  (they emit context, not directives); this is a significant architecture change with broader
  testing requirements
- Effort: large (new protocol, multiple files, complex testing surface)

---

## Recommendation

**Approach B first, with targeted elements from Approach A.**

The core issue is that failure recovery is underspecified at the *recording* level. Approach B
addresses this with minimum risk: write `next_step` before spawning (not after), and add a
structured `error_events` section to state.yaml. This gives autopilot a reliable recovery path
without new infrastructure.

Supplement with one targeted element from Approach A: strengthen the subagent-gate hook to
emit structured context that the orchestrator can act on (even if the gate itself doesn't write
to disk — the orchestrator receives the warning and can write it). This closes the stuck-agent
detection loop without inventing a new sidecar protocol.

Approach C is out of scope for this change — it's a broader architectural decision about making
hooks directive rather than advisory.

---

## Personas

- **Mahesh (sole user)** — runs `/autopilot 3` unattended; needs confidence that failures are
  captured in state.yaml and the run continues to the next iteration rather than silently
  hanging or leaving stale state
- **Future operators** (anyone reading state.yaml post-run) — needs to diagnose why a
  specific agent step failed without replaying the session transcript

---

## Use Cases

### Happy Path

**UC-1: Agent returns STATUS: blocked** — Orchestrator receives blocked result from agent,
writes structured blocker entry to state.yaml `error_events`, re-spawns once with blocker
context per Agent Blocked Protocol, marks step failed if still blocked after second attempt,
advances to escalate/ticket action based on `auto` flag.

**UC-2: Agent completes successfully after prior failure** — Orchestrator has written `next_step`
before the spawn. Agent succeeds on first or second attempt. `next_step` is updated to the
next step. step_history records the retry count alongside the success.

**UC-3: Autopilot reads state.yaml after failed develop run** — state.yaml has `status: paused`,
`error_events` with step ID, agent role, stop reason, and timestamp. Autopilot creates a Linear
ticket with this structured data (per Escalation Protocol `ticket` action) and continues to
the next iteration.

### Error / Edge Cases

**UC-E1: Agent returns empty output (zero tool calls, no STATUS)** — subagent-gate emits
warning to orchestrator context. Orchestrator treats missing STATUS as implicit `STATUS: blocked`
and follows Agent Blocked Protocol. No silent success assumed.

**UC-E2: Agent spawn fails** — Orchestrator records spawn failure in state.yaml
`error_events`, retries once, then escalates per existing Escalation Protocol. The `next_step`
written before spawn ensures resume is possible even if the spawn itself threw an error.

**UC-E3: Resume after interrupted autopilot run** — workflow-state.sh on SessionStart finds
state.yaml with `status: paused` and a valid `next_step`. User or next autopilot iteration
invokes `/develop`; it resumes from `next_step` without re-running completed steps.

**UC-E4: Repeated failures exhaust retry limit** — `retries.<step_id>` reaches `max_retries`.
`on_max_retries` action fires. In `--auto` mode: Linear ticket created with failure summary,
status set to paused. In interactive mode: user presented with failure summary and asked for
direction.

---

## Scope

### In-Scope

- Extend state.yaml format contract (CONVENTIONS.md) to include `error_events` section with
  structured failure records per agent invocation
- Update develop/SKILL.md Agent Mode section to write `next_step` before each agent spawn
  (not only after completion) and to write structured error records on failure
- Update CONVENTIONS.md Error Recovery Contract to specify the `error_events` schema
- Strengthen subagent-gate.sh to extract and emit structured failure context (step ID, agent
  role, stop_reason, tool call count) so orchestrator receives machine-readable signal, not
  just a human-readable warning string
- Update Agent Blocked Protocol in CONVENTIONS.md to define "missing STATUS in output" as
  equivalent to STATUS: blocked
- Add `max_iterations` guard to the repeat_until logic in develop/SKILL.md to prevent
  infinite agent spawning loops

### Out-of-Scope

- Real-time heartbeat polling of running agents (not supported by the Agent tool API)
- Making subagent-gate a directive hook that bypasses the orchestrator (Approach C)
- New monitoring infrastructure, daemons, or sidecar processes
- Changes to autopilot/SKILL.md (the error handling belongs in develop, not in the
  meta-loop)
- Linear integration changes (escalation to ticket already specified in CONVENTIONS.md)
- Any changes to the feature schema phases or step contracts other than CONVENTIONS.md and
  develop/SKILL.md

---

## UI Direction

N/A — no UI involved. All changes are to skill prose, CONVENTIONS.md contracts, a bash hook
script, and the state.yaml format specification.

---

## Technical Context

### Files Directly Affected

- `/Users/spidey/code/shell/src/claude/skills/develop/SKILL.md` — Agent Mode section: add
  pre-spawn `next_step` write, structured error recording, max_iterations guard for repeat steps,
  "missing STATUS = blocked" rule
- `/Users/spidey/.config/spec/steps/CONVENTIONS.md` — Error Recovery Contract section: add
  `error_events` schema, define "missing STATUS = blocked", formalize the structured error record
  format
- `/Users/spidey/code/shell/src/hooksmith/scripts/subagent-gate.sh` (symlink to
  `~/.config/hooksmith/scripts/subagent-gate.sh`) — emit structured JSON-tagged context
  rather than plain human-readable warning; include `step_id` if detectable from FEATURE_ID
  context

### Files Consulted but Not Changed

- `/Users/spidey/.config/spec/steps/execute-next-task.yaml` — repeat_until condition defined
  here; the max_iterations guard belongs in the orchestrator (develop/SKILL.md), not the step
  contract
- `/Users/spidey/.config/spec/steps/run-phase-review.yaml` — retry logic exists here; no change
- `/Users/spidey/.config/spec/schemas/feature.yaml` — agent field annotations reviewed; no change
- `/Users/spidey/code/shell/src/claude/agents/developer.md`, `sonnet-agent.md` — agent
  escalation prose reviewed; no change needed (escalation is the orchestrator's responsibility)
- `workflow-state.sh`, `auto-continue.sh` — session boundary resume reviewed; works correctly
  once state.yaml `next_step` is written before spawn

### State.yaml Schema Extension (proposed format)

```yaml
# New top-level field
error_events:
  - step_id: execute-next-task
    phase: implement
    agent: developer
    attempt: 1
    stop_reason: error          # "error" | "missing_status" | "empty_output" | "spawn_failed"
    detail: "STATUS: blocked — cannot find config file"
    timestamp: "2026-04-05T04:12:00Z"
  - step_id: execute-next-task
    phase: implement
    agent: developer
    attempt: 2
    stop_reason: missing_status
    detail: "Agent returned without STATUS field in output (0 tool calls)"
    timestamp: "2026-04-05T04:15:00Z"
```

### Claude Code Agent Tool Behavior (verified from codebase research)

- `Agent()` tool spawns a subagent and returns its output as a string
- `SubagentStop` hook fires when the subagent ends; receives `stop_reason` and `transcript_path`
- `stop_reason: "error"` indicates internal agent failure (not a STATUS: blocked return)
- Zero tool calls in transcript = agent ran but did nothing (context issue, vague prompt, or stall)
- The orchestrating agent receives the subagent's output string and the subagent-gate's context
  injection; it is responsible for parsing `STATUS:` from the output

### Key Constraint

subagent-gate.sh runs as a hook independent of the orchestrator's execution context. It cannot
write to state.yaml without first resolving the feature ID and change dir. The script already
does this resolution (via `$PWD` pattern match or branch name). The constraint is that the hook
runs as the child process author (the spawning Claude session's hook), so the feature_id from
the parent context is accessible via the same `$PWD` / git branch detection the script already
uses.

---

## Open Questions

1. **Does the Agent tool expose `stop_reason` and `transcript_path` to the hook in all failure
   modes?** The subagent-gate script reads these fields, but if an agent is forcibly terminated
   (timeout by Claude Code runtime) the hook behavior is unspecified. [ASSUMPTION: runtime
   terminations also trigger SubagentStop with stop_reason: error]

2. **What does `stop_reason: error` mean concretely?** The current subagent-gate.sh checks for
   it but does not document what triggers it. Could be: model refusal, safety intervention,
   context window exceeded, runtime timeout, or tool permission error. The structured error
   format should capture this distinction if the hook can surface it.

3. **Max iterations for repeat steps**: What is the right ceiling for `execute-next-task`
   repeat iterations before the orchestrator should pause? The current loop-detector triggers
   at 200 tool calls per session, but a task-heavy feature could legitimately need many
   iterations. [ASSUMPTION: 15 iterations is a reasonable ceiling for a single repeat step
   before forcing a pause and writing to state.yaml]

4. **Pre-spawn `next_step` write behavior when step is the first in a phase**: If the step
   fails before any `next_step` has been written (e.g., the very first step after phase
   transition), what should `next_step` reference? [ASSUMPTION: it should reference the
   current step, not the next one — "retry this step" is the correct resume instruction]

5. **Can subagent-gate.sh write to state.yaml reliably?** The hook is a bash script that runs
   as a separate process. Writing to state.yaml from the hook while the orchestrator may
   simultaneously be updating it creates a race condition. Writing structured context to stdout
   (which the hook already does) and letting the orchestrator write to disk may be safer.
   This is a key decision for the architect.

---

## Key Decisions

### D1: Approach B + targeted A — Strengthen orchestrator recording (selected)

**Selection criteria**: Deterministic — lowest complexity wins. B=S(2) < A=M(3) < C=L(4).
Reuse count: B reuses 2 existing modules (CONVENTIONS.md Error Recovery Contract, develop/SKILL.md Agent Mode).

**What this means**:
1. **Pre-spawn `next_step` write**: Write `next_step` pointing to the *current* step before spawning the agent (not after completion). This ensures resume always works, even on spawn failure.
2. **`error_events` in state.yaml**: Add a structured array recording every agent failure with step_id, phase, agent, attempt, stop_reason, detail, timestamp.
3. **"Missing STATUS = blocked" rule**: If agent output lacks a STATUS field, treat as `STATUS: blocked` and follow Agent Blocked Protocol (re-spawn once with context).
4. **`max_iterations` guard**: Add a ceiling (15) for `repeat_until` steps to prevent infinite agent spawn loops.
5. **Strengthen subagent-gate.sh output**: Emit structured context (not just human-readable text) so the orchestrator can parse it reliably. Hook does NOT write to state.yaml (race condition risk — Decision D2).

### D2: Hook writes context to stdout, orchestrator writes to disk

**Rationale**: subagent-gate.sh runs as a separate process. Writing to state.yaml from the hook while the orchestrator may simultaneously update it creates a race condition. The hook emits structured context to stdout; the orchestrator (which owns state.yaml) writes it to disk. This is safer and consistent with the existing advisory hook model.

### D3: Open questions resolved

- **Q1 (stop_reason coverage)**: Assume runtime terminations trigger SubagentStop. Document this assumption; if violated, the fallback is the "missing STATUS = blocked" rule.
- **Q3 (max iterations)**: 15 iterations ceiling for repeat steps. Configurable via project.yaml in future.
- **Q4 (pre-spawn next_step for first step)**: Write `next_step` pointing to current step (retry semantics, not skip semantics).
- **Q5 (hook writes)**: Resolved by D2 — hook emits, orchestrator writes.
