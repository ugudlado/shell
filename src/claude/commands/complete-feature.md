---
description: Complete feature development with merge to main and cleanup
---

## Feature ID

$ARGUMENTS

## Linear

While executing complete-phase steps, follow **`~/.claude/skills/linear/SKILL.md`** for closing/updating Linear.

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

**Follow the Step Execution Protocol** (defined in `/develop`): READ state → LOAD step → EXECUTE → CAPTURE learnings → WRITE state → NUDGE to next step.

Note that steps 01-05 are executed by a haiku-agent (check each step's `executor` config), while steps 06-08 are executed by the main session.

For each step:

1. **READ** — Read `openspec/changes/$FEATURE_ID/state.yaml`, extract `next_step`
2. **LOAD** — Read step file: `cat $HOME/.claude/openspec/schemas/$SCHEMA/workflow/complete/<step_id>.yaml`
3. **EXECUTE** — Run the step's `instruction:`
4. **CAPTURE** — Append any learnings to `learnings[]` in state.yaml
5. **WRITE** — Update state.yaml:
   ```yaml
   phase: complete
   step: N
   step_id: <completed-step>
   updated_at: "<ISO>"
   next_step:
     command: complete-feature
     phase: complete
     step_id: <next-step-name>
     instruction: "<what the next step does>"
   ```
6. **NUDGE** — Output "Step complete. Reading state.yaml for next step." Then read state.yaml and continue.

When all complete steps are done, set final state:
```yaml
status: completed
next_step:
  command: learn
  phase: learn
  step_id: null
  instruction: "Feature complete — run /learn to evaluate workflow and extract learnings"
```
