---
name: autopilot
description: "Autonomous self-improving development loop. Picks work from backlog, runs /develop with full autonomy flags (--auto --agents), learns and improves workflow. Use when user says \"autopilot\", \"autonomous\", \"run N iterations\", \"self-improve\"."
user-invocable: true
args:
  - name: iterations
    description: Number of iterations to run (default: 1)
    required: false
  - name: --focus
    description: Steering hint for ideator prioritization (e.g., "focus on workflow reliability")
    type: option
---

## Variables

```
REPO_NAME=$(basename "$(git rev-parse --show-toplevel)")
REPO_ROOT=$(git rev-parse --show-toplevel)
SPEC_HOME=${SPEC_HOME:-$HOME/.config/spec}
SPEC_CHANGES_DIR=$SPEC_HOME/changes/$REPO_NAME
```

## Autonomous Development Loop

$ARGUMENTS

## Overview

`/autopilot` is a **thin orchestrator** that runs N iterations of the development loop. Each iteration picks work via the ideator, delegates execution to `/develop` with full autonomy flags, then runs the learning loop. All schema-walking, agent-spawning, and state management lives in `/develop` — autopilot only handles the meta-loop.

**Key principle**: `/develop` is the single source of truth for schema execution. Autopilot adds three things around it: work selection, full autonomy, and learning.

## Architecture

```
/autopilot N [--focus "focus"]
  |
  +- PRE-FLIGHT: git repo? clean tree? spec/project.yaml? schemas?
  |    If missing infra -> walk bootstrap schema (auto-remediate)
  |    If still failing -> ABORT with specifics
  |
  |  for iteration in 1..N:
  |    SPAWN ideator agent -> picks most valuable ticket
  |    Skill("develop", "[TICKET] --auto --agents")
  |    VALIDATE: state.yaml shows completion? commits exist?
  |    (learning runs inside /develop's complete phase via run-learn-cycle step)
  |    (learnings are on disk — next iteration picks them up automatically)
  |
  |  Report results from state.yaml history
```

## Process

### 1. Parse Arguments

- Extract iteration count from `$ARGUMENTS` (default: 1)
- Extract `--focus` hint if provided
- Validate: iteration count must be a positive integer

### 2. Pre-flight Checks

Run ALL checks before any iteration. If fixable, auto-remediate by walking the bootstrap schema. If not fixable, abort.

**Check sequence:**

```
1. Git repo?
   - git rev-parse --show-toplevel
   - If FAILS -> ABORT: "Not a git repository. Run 'git init && git add -A && git commit -m init' first."

2. Clean working tree?
   - [[ -z "$(git status --porcelain)" ]]
   - If FAILS -> ABORT: "Working tree has uncommitted changes. Commit or stash first."

3. Project bootstrapped?
   - Check: spec/project.yaml exists, spec/project.yaml has `vision:` section,
     $SPEC_HOME/schemas/*.yaml exist, $SPEC_CHANGES_DIR is writable
   - If ANY fail -> run: Skill({ skill: "develop", args: "--bootstrap" })
   - After bootstrap, RE-CHECK all conditions. If still failing -> ABORT with specifics.

4. project.yaml has vision?
   - Read spec/project.yaml and check `vision.purpose` is not a placeholder
   - If FAILS (even after bootstrap) -> ABORT: "spec/project.yaml has no vision section.
     Autopilot needs this to evaluate what work is valuable. Run /develop --bootstrap
     and fill in the vision section."
```

**All checks must pass before proceeding.** Do NOT skip checks or proceed optimistically.

### 3. Initialize

- Read `$REPO_ROOT/spec/project.yaml` vision section for context
- List existing state.yaml files in `$SPEC_CHANGES_DIR/` to understand prior work

### 4. Iteration Loop

For each iteration (1..N):

#### 4a. Pick Work — Spawn Ideator Agent

Spawn the **ideator** agent with:

> You are running in autopilot mode. Run /ideate --next to pick the most valuable ticket from the backlog.
>
> Read the vision section from spec/project.yaml. Evaluate candidates against the vision.
> [If --focus hint]: Additional focus: "[vision hint]"
>
> Return ONLY this structured output:
> ```
> TICKET: <ID or "EMPTY">
> SCHEMA: <feature|bugfix|chore|spike>
> REASON: <2-3 sentences>
> ```
>
> If the backlog is empty and Linear has no actionable tickets, return TICKET: EMPTY.

**If TICKET is EMPTY**: Stop the loop cleanly.

#### 4b. Execute — Invoke /develop with Full Autonomy

```
Skill({ skill: "develop", args: "[TICKET_ID] --auto --agents" })
```

**What the flags do:**
- `--auto` — skips both signoff gates (spec approval + final signoff) for fully autonomous execution
- `--agents` — spawns per-step agents with the right model instead of executing in-context

This is the ONLY way autopilot invokes /develop. No manual replication of schema walking.

#### 4c. Validate via state.yaml

After /develop returns, read `$SPEC_CHANGES_DIR/[TICKET_ID]/state.yaml` to verify:

```bash
# state.yaml is the single source of truth — read it directly
cat $SPEC_CHANGES_DIR/*/state.yaml
```

Check:
- `status:` field shows `completed` (not `in_progress` or `failed`)
- `step_history:` has entries for expected phases
- If status is not `completed`, note which phase/step failed from step_history

If failed, create a Linear ticket with failure details from state.yaml.

#### 4d. Continue Loop

Learning happens automatically inside `/develop`'s complete phase via the `run-learn-cycle` step (runs before archive). No explicit `/learn` call needed here — it would double-invoke.

Advance to next iteration. Self-improvement from the learn cycle is already on disk.

### 5. Report

After all iterations, read state.yaml files for completed tickets and output:

```
[autopilot] Run complete
  Iterations: N requested
  Tickets: [list of TICKET_IDs worked, with status from their state.yaml]
  Failed: [any that didn't reach completed status]
```

## Error Handling

| Failure | Action |
|---------|--------|
| Pre-flight: not a git repo | ABORT — cannot auto-fix |
| Pre-flight: dirty working tree | ABORT — user must commit or stash |
| Pre-flight: missing infra | Walk bootstrap schema, re-check, abort if still failing |
| Pre-flight: no vision | ABORT — user must fill vision in spec/project.yaml |
| Backlog empty | Stop loop cleanly |
| /develop fails | Read state.yaml for failure details, create Linear ticket, continue |
| state.yaml missing after /develop | Create Linear ticket noting state tracking failure, continue |
| Learning fails (inside /develop) | Non-blocking — run-learn-cycle logs warning and continues to archive |
| Agent spawn fails | Log error, continue to next iteration |

## What This Skill Does NOT Do

- Does not walk schemas — delegates to `/develop`
- Does not spawn per-step agents — `/develop --agents` handles that
- Does not manage state.yaml — `/develop` owns that
- Does not write iteration logs — state.yaml is the single source of truth
- Does not duplicate orchestration logic — uses `/develop` as the single execution engine
- Does not modify schemas/steps itself — delegates to workflow-fixer via /learn
