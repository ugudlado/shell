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
  - name: --ff
    description: Auto-approve phase signoffs (reviews still enforced — final-signoff still requires user unless --auto)
    type: flag
  - name: --no-design
    description: Skip design exploration steps (feature only)
    type: flag
  - name: --no-linear
    description: Skip Linear ticket creation
    type: flag
  - name: --auto
    description: Auto-approve final-signoff (fully unattended — use with --ff for complete autonomy)
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

3. **Walk steps** in `phases[].steps` array (in order):

   For each step entry:

   **a. Parse step entry** — extract step ID and conditions:
   - `step-name` → always run
   - `step-name if flag` → run only if flag is truthy
   - `step-name if not flag` → run only if flag is falsy
   - `{id: step-name, ...}` → object form with rules

   **b. Evaluate condition** — if condition is false, record as skipped in state.yaml and continue to next step.

   Special condition for `final-signoff`: if `auto` flag is true, auto-approve and skip user interaction (log auto-approval to state.yaml).

   **c. Load step contract:** `$SPEC_HOME/steps/<step-id>.yaml`

   **d. Merge rules:** step's own `rules:` + phase rules + object-form rules:
   - `rules_when:` → match flag key; `not <flag>` matches when flag is falsy
   - `extra_rules:` → always appended

   **e. Execute step** — behavior depends on the `agents` flag:

   **Default mode (`agents: false`):** Execute the step's `instruction:` field inline, following all merged rules. This is the original behavior — the main thread handles everything in-context.

   **Agent mode (`agents: true`):** Spawn a specialized agent per step. See [Agent Mode](#agent-mode) below.

   **f. Update state.yaml:**
   ```yaml
   phase: <current>
   step_id: <completed step>
   updated_at: <ISO>
   next_step:
     phase: <current or next>
     step_id: <next step ID>
     instruction: "<from next step's intent field>"
   step_history:
     - step_id: <step>
       phase: <phase>
       status: completed  # or skipped
       agent: <agent name if agents mode, else "inline">
       skip_reason: "<if skipped>"
   ```

   **g. Check step verify:** — if step has `verify:`, confirm each assertion is true before advancing. If any fails, the step is not done.

   **h. Continue** to next step. If step was last in phase → run phase verification.

4. **Phase verification** (after all steps in a phase complete):
   - Run `verify.commands` from the phase definition (all must exit 0)
   - Check `verify.assertions` (all must be true)
   - Check `verify.metrics` against thresholds (e.g., review_score >= 9, test_coverage >= 90)
   - If any fail: generate fix tasks, increment retry counter
   - If retries >= `verify.max_retries`: execute `on_max_retries` (default: escalate to user). If `auto` flag is true, create a Linear ticket describing the failure instead of escalating.
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
- phase-signoff if not auto_approve_phases

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

When the `agents` flag is true (`--agents`), each step with an `agent:` field in the schema is dispatched to a specialized subagent instead of executing in-context. Steps without an `agent:` field are still executed inline by the main thread.

#### Agent Model Mapping

The schema's `agent:` value determines which subagent type and model to use:

| Schema `agent:` | subagent_type | model | Rationale |
|---|---|---|---|
| `discoverer` | discoverer | sonnet | Research and exploration — breadth over depth |
| `architect` | architect | opus | Design decisions and spec writing need reasoning depth |
| `developer` | sonnet-agent | sonnet | High-volume implementation — speed matters |
| `reviewer` | reviewer | sonnet | Systematic verification and pattern matching |
| `ideator` | ideator | opus | Creative exploration requires deep reasoning |

#### Agent Prompt Construction

For each agent step, construct the prompt from the step contract and context:

```
You are the [AGENT_ROLE] agent working on change [SLUG].

## Context
- Schema: [SCHEMA]
- Phase: [PHASE_NAME] — [PHASE_GOAL]
- Step: [STEP_ID] — [STEP_INTENT]
- Change dir: $SPEC_CHANGES_DIR/[SLUG]
- Worktree: ~/code/feature_worktrees/[SLUG]

## Rules (ALL must be followed)
[MERGED_RULES — one per line, bulleted]

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

Spawn the agent: `Agent({ subagent_type, model, prompt })`.

#### Mechanical Steps (no agent)

Steps without an `agent:` field are executed inline regardless of mode:

- **`load-project-context`**: Read project.yaml + schema YAML, build context bundle, update state.yaml.
- **`phase-signoff`**: If `auto_approve_phases` is true, auto-approve. Otherwise present summary and ask user.
- **`final-signoff`**: If `auto` flag is true, auto-approve. Otherwise require explicit user approval.
- **`create-linear-ticket`**: Spawn a **haiku-agent** with the step contract instruction + Linear config context.
- **`archive-completed-change`**: Spawn a **haiku-agent** with the step contract instruction.

#### Repeating Steps in Agent Mode

For steps with `repeat_until: <condition>` (e.g., `execute-next-task`):

1. Spawn the agent for one iteration of the step.
2. When the agent returns, check the repeat condition (e.g., read tasks.md for unchecked items).
3. If condition not met, re-spawn the agent for the next iteration.
4. If condition met, advance to the next step.

Update state.yaml between each repeat iteration.

#### Error Handling in Agent Mode

- If an agent returns `STATUS: blocked`, re-spawn once with the blocker context appended. If still blocked, mark the step as failed.
- If an agent spawn fails entirely, mark the step as failed and log the error.
- Failed steps in `auto` mode create a Linear ticket instead of escalating to the user.
- All other error handling (phase retries, max_retries, verification) works identically to default mode.
