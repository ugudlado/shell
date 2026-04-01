---
name: implement
description: Execute implementation tasks from feature spec and task list. Runs per-task Implementer→Reviewer→Verifier loop with phase reviews. Also handles /continue-feature. Use when ready to implement a specified feature, or when the user says "implement", "start building", "continue feature", "resume implementation".
user-invocable: true
args:
  - name: feature-id
    description: Feature ID (e.g., HL-170). Auto-detected from worktree/branch if omitted.
    required: false
orchestrator:
  state_file: $SPEC_CHANGES_DIR/$FEATURE_ID/state.yaml
  phases: [implement]
  resume: true
---

## Variables

REPO_NAME=$(basename "$(git rev-parse --show-toplevel)")
SPEC_HOME=${SPEC_HOME:-$HOME/.config/spec}
SPEC_CHANGES_DIR=$SPEC_HOME/changes/$REPO_NAME

## Feature ID

$ARGUMENTS

## Linear

Before loading Spec implement steps:

1. Read **`~/.claude/skills/linear/SKILL.md`** when the change uses Linear (`.spec.yaml` has `linear-ticket` or workflow steps reference MCP).

## Execution

### 1. Detect Feature ID

If `$ARGUMENTS` is empty or partial:
1. Auto-detect from worktree name (`~/code/feature_worktrees/[FEATURE-ID]`) or git branch (`feature/[FEATURE-ID]`)
2. If partial: glob match against worktree directories

```bash
WORKTREE=$(ls -d "$HOME/code/feature_worktrees/${FEATURE_ID}"* 2>/dev/null | head -1)
cd "$WORKTREE"
```

### 2. Load Change Metadata

```bash
cat $SPEC_CHANGES_DIR/$FEATURE_ID/.spec.yaml
```

Extract `schema` field (feature, feature, bugfix).

### 3. Check State (resume detection)

```bash
cat $SPEC_CHANGES_DIR/$FEATURE_ID/state.yaml 2>/dev/null
```

Also run `TaskList` and `git status` for additional state signals.

- state.yaml exists with `phase: implement` → resume from recorded step
- state.yaml missing but tasks exist → infer state from task statuses
- No tasks, artifacts exist → start from step 1

### 4. Load and Execute Workflow Steps

**Follow the Step Execution Protocol** (defined in `/develop`): READ state → LOAD step → EXECUTE → CAPTURE learnings → WRITE state → NUDGE to next step.

Determine the current step from state.yaml's `next_step.step_id` (or step 1 if fresh).

For each step:

1. **READ** — Read `$SPEC_CHANGES_DIR/$FEATURE_ID/state.yaml`, extract `next_step`
2. **LOAD** — Read the step file: `cat $HOME/.claude/spec/schemas/$SCHEMA/workflow/implement/<step_id>.yaml`
3. **EXECUTE** — Run the step's `instruction:` field, using the structured config (agents, thresholds, reviews, resume rules)
4. **CAPTURE** — If anything was learned (retry, mistake, surprise), append to `learnings[]` in state.yaml:
   ```yaml
   learnings:
     - step_id: <step-name>
       phase: implement
       type: mistake | insight | retry | decision
       detail: "What happened"
       timestamp: "<ISO>"
   ```
5. **WRITE** — Update state.yaml with completed step and next_step:
   ```yaml
   phase: implement
   step: N
   step_id: <completed-step>
   updated_at: "<ISO>"
   next_step:
     skill: implement
     phase: implement
     step_id: <next-step-name>
     instruction: "<what the next step does>"
   ```
6. **NUDGE** — Output "Step complete. Reading state.yaml for next step." Then read state.yaml and continue.

When all implement steps are complete, set `next_step` to hand off:
```yaml
next_step:
  skill: complete-feature
  phase: complete
  step_id: null
  instruction: "Implementation complete — run /complete-feature to merge and clean up"
```

### Note on Auto-Resume

Step 02-auto-resume.yaml contains resume rules that may jump to a later step (e.g., skip to step 8 if all tasks are done). After loading step 02, follow its resume rules to determine the actual next step.
