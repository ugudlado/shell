---
description: Complete feature development with merge to main and cleanup
---

## Feature ID

$ARGUMENTS

## Execution

### 1. Detect Feature ID

If `$ARGUMENTS` is empty or partial:
1. Auto-detect from worktree name or git branch
2. Glob match against `~/code/feature_worktrees/`

```bash
WORKTREE=$(ls -d "$HOME/code/feature_worktrees/${FEATURE_ID}"* 2>/dev/null | head -1)
cd "$WORKTREE"
```

### 2. Load Change Metadata

```bash
cat openspec/changes/$FEATURE_ID/.openspec.yaml
```

Extract `schema` field.

### 3. Check State

```bash
cat openspec/changes/$FEATURE_ID/state.yaml 2>/dev/null
```

Verify implementation is complete:
- `phase: implement` with signoff_done → ready for completion
- `phase: complete` → resume from recorded step
- Otherwise → inform user to run /implement first

### 4. Load and Execute Workflow Steps

Read the current step file:
```bash
cat $HOME/.claude/openspec/schemas/$SCHEMA/workflow/complete/NN-step-name.yaml
```

Execute the step's `instruction:`. Note that steps 01-05 are executed by a haiku-agent (check each step's `executor` config), while steps 06-08 are executed by the main session.

After completing each step, update state.yaml:
```yaml
phase: complete
step: N
step_id: step-name
updated_at: "ISO timestamp"
```
