---
name: develop
description: "Spec-first feature development — walks schema phases and steps to completion. Use when the user wants to build a feature or fix a bug end-to-end. The primary workflow entry point. Also handles resume."
user-invocable: true
args:
  - name: description
    description: Feature description, Linear ticket ID (e.g. HL-170), or feature ID to resume
    required: false
  - name: --bugfix
    description: Use bugfix schema
    type: flag
  - name: --chore
    description: Use chore schema (lightweight changes)
    type: flag
  - name: --spike
    description: Use spike schema (exploration/prototype)
    type: flag
  - name: --bootstrap
    description: Use bootstrap schema (project setup — tooling, configs, quality gates)
    type: flag
  - name: --no-tdd
    description: Skip test-first enforcement (feature only)
    type: flag
  - name: --no-design
    description: Skip design exploration steps (feature only)
    type: flag
  - name: --no-ux
    description: Skip UX prototyping steps (feature only)
    type: flag
  - name: --no-linear
    description: Skip Linear ticket creation
    type: flag
  - name: --auto
    description: Skip final signoff after implementation — fully unattended execution
    type: flag
  - name: --agents
    description: Spawn per-step agents instead of executing in-context (right model per step)
    type: flag
---

## Variables

```
REPO_NAME=$(basename "$(git rev-parse --show-toplevel)")
REPO_ROOT=$(git rev-parse --show-toplevel)
SPEC_HOME=${SPEC_HOME:-$HOME/.config/spec}
SPEC_CHANGES_DIR=$SPEC_HOME/changes/$REPO_NAME
```

## Input

$ARGUMENTS

## Execution

### 1. Check for Resume

Scan `$SPEC_CHANGES_DIR/*/state.yaml` for active workflow matching description or feature ID.

If found with `status: active`:
1. Read state.yaml → extract `schema`, `phase`, `step_id`, `flags`
2. Load schema: `$SPEC_HOME/schemas/$SCHEMA.yaml`
3. Jump directly to that phase and step (skip to step 3)

If no active workflow → proceed to step 2.

### 2. Initialize (new workflow only)

**Detect schema** from `$ARGUMENTS`:

Explicit flags (skip confirmation):
- `--bugfix` flag → schema = `bugfix`
- `--chore` flag → schema = `chore`
- `--spike` flag → schema = `spike`
- `--bootstrap` flag → schema = `bootstrap` (skip resume check, worktree, and Linear — runs in-place)

Keyword suggestion (confirm with user):
- Words: "fix", "bug", "broken", "regression", "crash" → suggest `bugfix`
- Words: "config", "bump", "dependency", "rename", "typo", "chore", "cleanup", "update deps" → suggest `chore`
- Words: "spike", "prototype", "explore", "experiment", "try", "POC", "proof of concept" → suggest `spike`
- Words: "bootstrap", "setup tooling", "install dev tools", "quality gates" → suggest `bootstrap`
- Otherwise → schema = `feature`

When a keyword match suggests a schema, confirm with the user before proceeding.
When an explicit flag is provided, use it directly without confirmation.

**Load schema:** `$SPEC_HOME/schemas/$SCHEMA.yaml`

**Bootstrap shortcut:** If schema = `bootstrap`, skip state creation, worktree, and Linear.
Load the schema and jump directly to step 3 (Walk Phases and Steps). Bootstrap runs
in-place in the current directory — no worktree, no state.yaml, no change directory.
Its idempotency is tracked via `.tooling-state.json` at project root (handled by the
`check-bootstrap-state` step).

**Resolve flags:**
1. Start with schema `defaults:`
2. Apply each CLI flag per schema's `flags:` block (e.g. `--no-tdd` sets `tdd_required: false`)
3. Precedence: CLI > defaults

**Create state** (skip for bootstrap):
```bash
SLUG=$(echo "$DESCRIPTION" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | head -c 50)
mkdir -p "$SPEC_CHANGES_DIR/$SLUG"
```

Write `$SPEC_CHANGES_DIR/$SLUG/state.yaml`:
```yaml
schema: <detected>
status: active
description: "<user description>"
phase: <first phase name from schema>
step_id: <first step of first phase>
flags: <resolved flags>
started_at: <ISO timestamp>
updated_at: <ISO timestamp>
step_history: []
```

### 3. Walk Phases and Steps

Read the schema file: `$SPEC_HOME/schemas/$SCHEMA.yaml`
Read project config: `$REPO_ROOT/spec/project.yaml`

For each phase in `phases:` (in order):

1. **Check requires:** — if phase has `requires: <other_phase>`, verify that phase is recorded as completed in state.yaml. If not, error.

2. **Collect rules for this phase:**
   - Project rules from `project.yaml` `rules:` (evaluate `when:` conditions against flags)
   - Schema-level `rules:` (evaluate `when:` conditions against flags)
   - Phase-level `rules:`

3. **Pre-filter steps** — resolve the active step list once per phase, before execution:

   Parse all step entries in `phases[].steps` and evaluate conditions against resolved flags:
   - `step-name` → include
   - `step-name if flag` → include only if flag is truthy
   - `step-name if not flag` → include only if flag is falsy
   - `{id: step-name, if: flag, ...}` → include only if flag is truthy

   Log the filter result once to state.yaml under the phase entry:
   ```yaml
   phase_plan:
     active: [load-project-context, explore, create-or-refresh-artifacts, ...]
     filtered: [{step: design-exploration, reason: "design=false"}, ...]
   ```

   Special handling for `final-signoff`: if `auto` flag is true, keep the step in the active list
   but mark it for auto-approval (the step's SKIP CONDITIONS handles the behavior).

   **Walk only active steps** (in order):

   For each active step:

   **a. Load step contract:** `$SPEC_HOME/steps/<step-id>.yaml`

   **b. Merge rules** per CONVENTIONS.md § Rule Merge Contract:
   Collect from all 5 sources, deduplicate named rules by id, filter by
   when-conditions, assemble in precedence order (injected → step → phase → named).

   **c. Execute step** — behavior depends on the `agents` flag:

   **Default mode (`agents: false`):** Execute the step's `instruction:` field inline, following all merged rules. This is the original behavior — the main thread handles everything in-context.

   **Agent mode (`agents: true`):** Spawn a specialized agent per step. See [Agent Mode](#agent-mode) below.

   **d. Pre-spawn resume token** (agent mode only):
   Before spawning an agent, write `next_step` to state.yaml pointing to the **current** step
   (retry semantics). This ensures a valid resume point exists even if the spawn fails:
   ```yaml
   next_step:
     skill: develop
     phase: <current>
     step_id: <current step ID>  # THIS step, not the next — retry if spawn fails
     instruction: "Retry: <step intent>"
   ```

   **e. Update state.yaml** (after step completes successfully):
   ```yaml
   phase: <current>
   step_id: <completed step>
   updated_at: <ISO>
   next_step:  # per CONVENTIONS.md § Resume Token Format Contract
     skill: develop
     phase: <current or next>
     step_id: <next step ID>
     instruction: "<from next step's intent field>"
   step_history:
     - step_id: <step>
       phase: <phase>
       status: completed
       agent: <agent name if agents mode, else "inline">
       artifacts: [<files created or modified>]  # optional
   ```

   **f. Check step verify:** — if step has `verify:`, confirm each assertion is true before advancing. If any fails, the step is not done.

   **g. Continue** to next step. If step was last in phase → run phase verification.

4. **Phase verification** (after all steps in a phase complete):
   - Run `verify.commands` from the phase definition (all must exit 0)
   - Check `verify.assertions` (all must be true)
   - Check `verify.metrics` against thresholds (e.g., review_score >= 9, test_coverage >= 90)
   - If any fail: handle per CONVENTIONS.md § Error Recovery Contract (Fix Task Protocol + retry counter)
   - If retries >= `verify.max_retries`: execute `on_max_retries` per § Escalation Protocol
   - If all pass: record phase as completed in state.yaml, advance to next phase

5. When all phases complete → set `status: completed` in state.yaml. Report summary.

### Step Looping

Some steps need to repeat. The schema declares this with `repeat until`:

```yaml
- execute-next-task repeat until all_tasks_completed
```

The agent keeps re-executing that step until the condition is met, then advances. The step's instruction tells the agent how to check the condition (e.g., "all tasks in tasks.md are marked [x]").

### Step Entry Formats

```yaml
# Simple — always runs
- explore

# Conditional — inline
- design-exploration if design
- create-linear-ticket if linear
- phase-signoff                          # always — spec approval gate
- final-signoff if not auto              # after implement — approval before archive

# Looping — repeats until condition
- execute-next-task repeat until all_tasks_completed

# Object — when attaching conditional rules
- id: generate-or-refresh-tasks
  rules_when:
    tdd_required:
      - Every impl task has a preceding test task.
    not tdd_required:
      - Tests are optional.

# Object with extra rules (always applied)
- id: execute-next-task
  repeat_until: all_tasks_completed
  extra_rules:
    - Fix root cause, not symptoms.
```

### Phase Outputs

The specify/diagnose phase declares `outputs:` — artifacts to produce.
Each output has `file`, `template` (relative to schema's `uses.templates`), and optional `requires` (dependency on other outputs).

The `create-or-refresh-artifacts` step reads phase `outputs:` and generates non-task artifacts in dependency order using templates as structural guides.
The `generate-or-refresh-tasks` step generates `tasks.md` specifically.

### Pause and Resume

State.yaml records exactly where to resume via `next_step`. On next `/develop` invocation, step 1 finds active state and resumes.

### Agent Mode

When the `agents` flag is true (`--agents`), each step with an `agent:` field in its step contract is dispatched to a specialized subagent running in the background. The main thread is purely an orchestrator — it loads step contracts, spawns agents, and tracks state. Steps without an `agent:` field (e.g., create-worktree, load-project-context, phase-signoff) are executed inline by the orchestrator.

**All agent steps run in background** (`run_in_background: true`). The orchestrator is notified when each completes — do NOT poll or sleep.

**Change type adaptation**: After `generate-or-refresh-tasks` completes, detect the change type per CONVENTIONS.md § Change Type Detection. If `change_type = "config_docs"`, steps with `agent: developer` or `agent: reviewer` MAY execute inline instead of spawning agents. Log `agent: inline (config_docs)` in state.yaml step_history. This is not a flag override — the `agents` flag remains true, but the orchestrator optimizes execution for non-code changes.

#### Agent Model Mapping

The step contract's `agent:` value determines which subagent type and model to use:

| Step `agent:` | subagent_type | model | Rationale |
|---|---|---|---|
| `discoverer` | discoverer | sonnet | Research and exploration — breadth over depth |
| `architect` | architect | opus | Design decisions and spec writing need reasoning depth |
| `developer` | developer | sonnet | High-volume implementation — speed matters |
| `reviewer` | reviewer | sonnet | Systematic verification and pattern matching |
| `ideator` | ideator | opus | Creative exploration requires deep reasoning |
| `ux-reviewer` | ux-reviewer | sonnet | Staff-level design critique and UX evaluation |
| `debugger` | debugger | sonnet | Systematic debugging — root cause investigation |
| `workflow-improver` | workflow-improver | sonnet | Workflow evaluation, metrics analysis, step contract improvements |

#### Agent Prompt Construction

For each agent step, construct the prompt from the step contract and context:

```
You are the [AGENT_ROLE] agent working on change [SLUG].

## Project Context (from spec/project.yaml)
- Vision: [vision.purpose — one line]
- Architecture: [architecture.overview — one line]
- Learnings: [learnings[] — list each rule, one per line]
- Gotchas: [gotchas[] — list each, one per line]

## Workflow Context
- Schema: [SCHEMA]
- Phase: [PHASE_NAME] — [PHASE_GOAL]
- Step: [STEP_ID] — [STEP_INTENT]
- Change dir: $SPEC_CHANGES_DIR/[SLUG]
- Worktree: ~/code/feature_worktrees/[SLUG]

## Rules (ALL must be followed)
[MERGED_RULES — computed per CONVENTIONS.md § Rule Merge Contract, one per line, bulleted]

## Step Instruction
[STEP_CONTRACT instruction: field verbatim]

## Step Verification
[STEP_CONTRACT verify: field verbatim]

## Autonomy Rules
- Work autonomously. Do NOT ask for user input — make reasonable decisions.
- Mark assumptions with [ASSUMPTION].
- If truly blocked after 3 attempts, return STATUS: blocked with evidence.

Return a structured result:
STATUS: <completed|blocked>
ARTIFACTS: <list of files created/modified>
EVIDENCE: <verification output or key findings>
[If blocked]: BLOCKER: <what's blocking and what was tried>
```

Spawn the agent in the background so the main thread stays responsive:
`Agent({ subagent_type, model, prompt, run_in_background: true })`.

The main thread is automatically notified when the agent completes — do NOT poll or sleep.

#### Pre-work During Background Execution

While an agent runs in the background, the orchestrator **MAY**:
- Pre-read the next step contract from `$SPEC_HOME/steps/<next-step-id>.yaml`
- Validate state.yaml integrity (schema field present, flags consistent, step_history well-formed)
- Log spawn metadata (agent role, step_id, spawn timestamp) to state.yaml

The orchestrator **MUST NOT**:
- Spawn another agent step (steps are sequential — wait for notification)
- Modify files the background agent is working on
- Advance the step counter before the notification arrives
- Write `next_step` to the next step before the current one completes

When the notification arrives, parse the agent's output for `STATUS:` and follow the
error handling rules below (identical to synchronous mode).

#### Mechanical Steps (no agent)

Steps without an `agent:` field are executed inline regardless of mode:

- **`load-project-context`**: Read project.yaml + schema YAML, build context bundle, update state.yaml.
- **`phase-signoff`**: Always runs after specify/diagnose. Presents summary and asks user to approve spec before implementation.
- **`final-signoff`**: Runs after implement phase (if `auto` flag is false). User approves implementation before archive/merge.
- **`create-linear-ticket`**: Spawn a **haiku-agent** with the step contract instruction + Linear config context.
- **`compute-prediction-accuracy`**: Spawn a **haiku-agent** with the step contract instruction. Non-blocking — if computation fails, log warning and continue to run-learn-cycle.
- **`run-learn-cycle`**: Spawn a **haiku-agent** with the step contract instruction. Non-blocking — if learning fails, log warning and continue to archive.
- **`archive-completed-change`**: Spawn a **haiku-agent** with the step contract instruction.

#### Repeating Steps in Agent Mode

For steps with `repeat_until: <condition>` (e.g., `execute-next-task`):

1. Spawn the agent for one iteration of the step (with `run_in_background: true`).
2. When the notification arrives, check the repeat condition (e.g., read tasks.md for unchecked items).
3. If condition not met, re-spawn the agent for the next iteration.
4. If condition met, advance to the next step.

Update state.yaml between each repeat iteration.

**Max iterations guard**: Track the iteration count for each `repeat_until` step. If the
count reaches **15** without the condition being met:
1. Write an `error_events` entry with `stop_reason: max_iterations_exceeded`.
2. Set `status: paused` in state.yaml.
3. If `auto` flag is true: create a Linear ticket with the iteration count, step details,
   and remaining unchecked items from the repeat condition.
4. If `auto` flag is false: present the situation to the user for direction.

This prevents infinite agent spawn loops that would otherwise only be caught by the
session-level loop-detector at 200 tool calls.

#### Error Handling in Agent Mode

All error handling follows CONVENTIONS.md § Error Recovery Contract.

**After every agent invocation**, parse the agent's output for a `STATUS:` field:

1. **`STATUS: completed`** → success. Update step_history with `status: completed`.
2. **`STATUS: blocked`** → handle per § Agent Blocked Protocol (re-spawn once with context, then fail).
3. **No `STATUS:` field found** → treat as `STATUS: blocked` per § Missing STATUS Rule. The agent returned ambiguous output — do NOT assume success.
4. **Agent spawn failure** (Agent tool returns error) → record in error_events with `stop_reason: spawn_failed`, retry once, then escalate.

**On any failure** (cases 2-4), write a structured entry to `error_events` in state.yaml per § Structured Error Events:
```yaml
error_events:
  - step_id: <step>
    phase: <phase>
    agent: <agent role>
    attempt: <1-based>
    stop_reason: <error|missing_status|empty_output|spawn_failed>
    detail: "<agent output excerpt or error message>"
    timestamp: "<ISO>"
```

**Summary of error flows:**
- Agent `STATUS: blocked` → write error_events, follow § Agent Blocked Protocol (re-spawn once with context, then fail)
- Agent missing STATUS → write error_events (stop_reason: missing_status), follow § Agent Blocked Protocol
- Agent spawn failure → write error_events (stop_reason: spawn_failed), retry once, then escalate per § Escalation Protocol
- Phase verification failure → handle per § Fix Task Protocol (generate fix tasks, retry)
- Retry exhaustion → execute `on_max_retries` per § Escalation Protocol (`escalate` if interactive, `ticket` if `auto`)
