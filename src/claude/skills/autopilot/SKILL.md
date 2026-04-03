---
name: autopilot
description: "Autonomous self-improving development loop. Picks work from backlog, executes full /develop cycles via agents, learns and improves workflow. Use when user says \"autopilot\", \"autonomous\", \"run N iterations\", \"self-improve\"."
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
AUTOPILOT_DIR=$REPO_ROOT/.autopilot
```

## Autonomous Development Loop

$ARGUMENTS

## Overview

`/autopilot` is a **thin orchestrator** that runs N iterations of the development loop. Each iteration spawns role-based agents that use existing skills. The main thread stays minimal — just loop control, agent spawning, and iteration logging.

**Model**: Agents are executors, skills are instruction sets. Autopilot spawns agents by role — never invokes skills directly.

## Architecture

```
/autopilot N [--focus "focus"]
  │
  │  for iteration in 1..N:
  │    SPAWN ideator agent → picks most valuable ticket
  │    SPAWN develop runner → follows /develop --ff (auto-approve all)
  │    SPAWN evaluator agent → follows /learn, routes fixes
  │    Main thread: write iteration log
  │
  │  Write summary, report results
```

## Process

### 1. Parse Arguments

- Extract iteration count from `$ARGUMENTS` (default: 1)
- Extract `--focus` hint if provided
- Validate: iteration count must be a positive integer

### 2. Initialize

```bash
mkdir -p $AUTOPILOT_DIR/iterations
```

- Count existing iteration logs to determine starting iteration number
- Read `$REPO_ROOT/CLAUDE.md` Product Vision section for context

### 3. Iteration Loop

For each iteration (1..N):

#### 3a. Pick Work — Spawn Ideator Agent

Spawn the **ideator** agent with:

> You are running in autopilot mode. Run /ideate --next to pick the most valuable ticket from the backlog.
>
> Read the Product Vision from CLAUDE.md. Evaluate candidates against the vision.
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

**If TICKET is EMPTY**: Log "backlog empty" to iteration log, stop the loop.

#### 3b. Execute — Spawn Develop Runner Agent

Spawn a **general-purpose agent** (opus) with:

> You are running in autopilot mode for ticket [TICKET_ID].
>
> Run /develop [TICKET_ID] --ff
>
> CRITICAL AUTOPILOT RULES:
> - Auto-approve ALL signoffs including final-signoff — do not wait for user input
> - If any phase fails after max retries, create a Linear ticket describing the failure with:
>   - Which phase/step failed
>   - Error evidence (test output, review findings)
>   - Suggested fix approach
>   Then return with status: failed.
>
> Return a structured summary:
> ```
> STATUS: <completed|failed>
> TICKET: [TICKET_ID]
> SCHEMA: <schema used>
> PHASES_COMPLETED: <list>
> FILES_CHANGED: <count>
> COMMITS: <list of short hashes>
> REVIEW_SCORE: <final score>
> FAILURE_TICKET: <ID if failed, else N/A>
> ```

**Parse the result**: Extract status, commits, score. If failed, note the failure ticket.

#### 3c. Learn — Spawn Evaluator Agent

Spawn the **workflow-evaluator** agent with:

> You are running in autopilot mode for ticket [TICKET_ID].
>
> Run /learn [TICKET_ID]
>
> Route ALL findings:
> - Code rules → auto-update CLAUDE.md (as /learn already does)
> - Workflow issues → spawn workflow-fixer agent to fix step contracts/schemas/agent definitions
> - Code issues that need new work → create Linear tickets
>
> Return a structured summary:
> ```
> VERDICT: <CLEAN|PASS|FAIL>
> CODE_RULES_ADDED: <list or "none">
> WORKFLOW_FIXES: <list of {file, change} or "none">
> TICKETS_CREATED: <list of IDs or "none">
> CONSECUTIVE_CLEAN: <count>
> ```

#### 3d. Log Iteration

Write `$AUTOPILOT_DIR/iterations/NNN.yaml` (zero-padded iteration number):

```yaml
iteration: <N>
total: <total requested>
started_at: "<ISO>"
completed_at: "<ISO>"
status: <completed|failed|skipped>

ticket:
  id: <TICKET_ID>
  title: "<ticket title>"
  schema: <schema>
  reason: "<ideator's reasoning>"

outcome:
  type: <feature|bugfix|chore|spike>
  status: <completed|failed>
  phases_completed: [<list>]
  commits: [<list>]
  files_changed: <count>
  failure_ticket: <ID or null>

quality:
  review_score: <score>
  verdict: <CLEAN|PASS|FAIL>

learnings:
  code_rules_added: [<list>]
  workflow_fixes: [<list>]
  tickets_created: [<list>]
  consecutive_clean: <count>
```

#### 3e. Continue Loop

Advance to next iteration. The workflow fixes from 3c are already applied to disk — the next iteration's `/develop` will use the improved schemas/steps/agents.

### 4. Write Summary

After all iterations complete, write `$AUTOPILOT_DIR/summary.yaml`:

```yaml
run_started_at: "<ISO>"
run_completed_at: "<ISO>"
iterations_requested: <N>
iterations_completed: <count>
iterations_failed: <count>
iterations_skipped: <count>

tickets_worked: [<list of IDs>]
total_commits: <count>
total_files_changed: <count>

quality:
  average_review_score: <avg>
  verdicts: { CLEAN: <n>, PASS: <n>, FAIL: <n> }
  consecutive_clean: <final count>

improvements:
  code_rules_added: <total count>
  workflow_fixes_applied: <total count>
  tickets_created: [<all IDs>]

vision: "<vision hint if provided>"
```

### 5. Report

Output a human-readable summary:

```
[autopilot] Run complete
  Iterations: N completed, M failed, K skipped
  Tickets: [list]
  Quality: avg score X.X, N clean cycles
  Improvements: N code rules, M workflow fixes, K new tickets
  Vision: "<hint or 'from CLAUDE.md'>"
```

## Error Handling

| Failure | Action |
|---------|--------|
| Backlog empty | Log, stop loop cleanly |
| Develop agent fails | Parse failure, note failure ticket, continue |
| Learn agent fails | Log warning, skip learning, continue |
| Agent spawn fails | Log error, continue to next iteration |

## What This Skill Does NOT Do

- Does not invoke skills directly — spawns agents that use skills
- Does not duplicate /develop orchestration — delegates to develop runner
- Does not modify schemas/steps itself — delegates to workflow-fixer via /learn
- Does not make architecture decisions — delegates to agents
