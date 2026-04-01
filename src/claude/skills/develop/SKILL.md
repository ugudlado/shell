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
  - name: --no-tdd
    description: Skip test-first enforcement (feature only)
    type: flag
  - name: --ff
    description: Fill-forward — skip discovery, jump to artifacts (feature only)
    type: flag
  - name: --no-linear
    description: Skip Linear ticket creation
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
- `--bugfix` flag → schema = `bugfix`
- Words like "fix", "bug", "broken", "regression", "crash" → suggest `bugfix`
- Otherwise → schema = `feature`

**Load schema:** `$SPEC_HOME/schemas/$SCHEMA.yaml`

**Resolve flags:**
1. Start with schema `defaults:`
2. Apply each CLI flag per schema's `flags:` block (e.g. `--no-tdd` sets `tdd_required: false`)
3. Precedence: CLI > defaults

**Create state:**
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

   **c. Load step contract:** `$SPEC_HOME/steps/<step-id>.yaml`

   **d. Merge rules:** step's own `rules:` + phase rules + object-form rules:
   - `rules_when:` → match flag key; `not <flag>` matches when flag is falsy
   - `extra_rules:` → always appended

   **e. Execute** the step's `instruction:` field, following all merged rules.

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
       skip_reason: "<if skipped>"
   ```

   **g. Continue** to next step. If step was last in phase → advance to next phase.

4. When all phases complete → set `status: completed` in state.yaml. Report summary.

### Step Looping

Some steps need to repeat. The schema declares this with `repeat until`:

```yaml
- execute-next-task repeat until all_tasks_completed
```

The agent keeps re-executing that step until the condition is met, then advances. The step's instruction tells the agent how to check the condition (e.g., "all tasks in tasks.md are marked [x]").

### Step Entry Formats

```yaml
# Simple — always runs
- resolve-change

# Conditional — inline
- explore-or-diagnose if not fill_forward
- create-linear-ticket if linear

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
