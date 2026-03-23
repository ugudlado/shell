---
description: Execute implementation tasks from feature spec and task list (also handles /continue-feature)
---

## Feature ID

$ARGUMENTS

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
cat openspec/changes/$FEATURE_ID/.openspec.yaml
```

Extract `schema` field (feature-tdd, feature-rapid, bugfix).

### 3. Check State (resume detection)

```bash
cat openspec/changes/$FEATURE_ID/state.yaml 2>/dev/null
```

Also run `TaskList` and `git status` for additional state signals.

- state.yaml exists with `phase: implement` → resume from recorded step
- state.yaml missing but tasks exist → infer state from task statuses
- No tasks, artifacts exist → start from step 1

### 4. Load and Execute Workflow Steps

Determine the current step from state.yaml (or step 1 if fresh).

Read the current step file:
```bash
cat openspec/schemas/$SCHEMA/workflow/implement/NN-step-name.yaml
```

Execute the step's `instruction:` field, using the structured config (agents, thresholds, reviews, resume rules) to guide execution.

After completing each step, update state.yaml:
```yaml
phase: implement
step: N
step_id: step-name
updated_at: "ISO timestamp"
```

Then load and execute the next step in sequence.

### Note on Auto-Resume

Step 02-auto-resume.yaml contains resume rules that may jump to a later step (e.g., skip to step 8 if all tasks are done). After loading step 02, follow its resume rules to determine the actual next step.
