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

### 1. Resolve Schema and Flags

Parse `$ARGUMENTS` for flags and description.

**Schema detection:**
- `--bugfix` → schema = `bugfix`
- Words like "fix", "bug", "broken", "regression", "crash" → suggest `bugfix`
- Otherwise → schema = `feature`

**Flag resolution:**
1. Read schema file: `$SPEC_HOME/schemas/$SCHEMA.yaml`
2. Start with `defaults:` from schema
3. Apply flag effects: each `--flag` in args sets values per schema's `flags:` block
4. Merge with existing `state.yaml` flags if resuming (CLI > state > defaults)
5. Store resolved flags in state.yaml

### 2. Check for Resume

Scan `$SPEC_CHANGES_DIR/*/state.yaml` for active workflow matching description or feature ID.

If found with `status: active`:
1. Read state.yaml → extract `phase`, `step_id`, `next_step`
2. Jump directly to that phase and step (skip to step 4)

If no active workflow → proceed to step 3.

### 3. Initialize State

```bash
SLUG=$(echo "$DESCRIPTION" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | head -c 50)
CHANGE_DIR="$SPEC_CHANGES_DIR/$SLUG"
mkdir -p "$CHANGE_DIR"
```

Write initial `$CHANGE_DIR/state.yaml`:
```yaml
schema: <detected>
status: active
phase: <first phase from schema>
step_id: <first step of first phase>
flags: <resolved flags>
started_at: <ISO timestamp>
updated_at: <ISO timestamp>
step_history: []
```

### 4. Walk Phases and Steps

Read the schema file once: `$SPEC_HOME/schemas/$SCHEMA.yaml`

For each phase in `phases:` (in order):

1. **Check requires:** — if phase has `requires: <other_phase>`, verify that phase completed in state.yaml. If not, error.

2. **Collect rules for this phase:**
   - Project rules from `$REPO_ROOT/spec/project.yaml`
   - Schema-level `rules:` (evaluate `when:` conditions against current flags)
   - Phase-level `rules:`
   - These are the rules the agent must follow during this phase

3. **Walk steps** in `phases[].steps` array (in order):

   For each step entry:

   **a. Evaluate conditions** (if step is an object, not a bare string):
   - `if: <flag>` → run only if flag is truthy (e.g., `if: linear`)
   - `unless: <flag>` → run unless flag is truthy (e.g., `unless: fill_forward`)
   - `rules_when:` → select additional rules based on flag values
   - `extra_rules:` → always-on additional rules for this step in this schema

   **b. Load step contract:** `$SPEC_HOME/steps/<step-id>.yaml`

   **c. Merge rules:** step's own `rules:` + phase rules + conditional rules from above

   **d. Execute** the step's `instruction:` field, following all merged rules

   **e. Update state.yaml:**
   ```yaml
   phase: <current>
   step_id: <completed step>
   updated_at: <ISO>
   next_step:
     phase: <current or next>
     step_id: <next step or first step of next phase>
     instruction: "<from next step's intent field>"
   step_history:
     - step_id: <step>
       phase: <phase>
       status: completed  # or skipped
       skip_reason: "<if skipped>"
   ```

   **f. Continue** to next step. If step was last in phase → advance to next phase.

4. When all phases complete → set `status: completed` in state.yaml.

### Step Entry Format

Steps in the `phases[].steps` array can be:

```yaml
# Simple — just a step ID, no conditions
steps:
  - resolve-change
  - load-project-context

# Conditional — step with flag-based behavior
steps:
  - id: explore-or-diagnose
    unless: fill_forward              # run unless fill_forward is true

  - id: create-linear-ticket
    if: linear                        # run only if linear is true

  - id: generate-or-refresh-tasks
    rules_when:                        # additional rules based on flags
      tdd_required:                    # when tdd_required is truthy
        - Every impl task has a preceding test task.
      not tdd_required:                # when tdd_required is falsy
        - Tests are optional.

  - id: execute-next-task
    extra_rules:                       # always applied (schema-specific)
      - Fix root cause, not symptoms.
```

### Phase Outputs

The specify/diagnose phase declares `outputs:` — artifacts to create during that phase.
Each output has a `file`, `template` (relative to schema's `uses.templates`), and optional `requires` (dependency on other outputs).

The `create-or-refresh-artifacts` step reads these outputs and generates them in dependency order using the templates as structural guides.

### Pause and Resume

The agent can pause at any point. State.yaml records exactly where to resume via `next_step`. On next invocation of `/develop` (with or without args), step 2 finds the active state and resumes.

Session hooks (`workflow-state.sh`, `auto-continue.sh`) also inject resume context automatically.

### Completion

After the last step of the last phase:
1. Set `status: completed` in state.yaml
2. Report summary: schema, phases completed, quality scores
