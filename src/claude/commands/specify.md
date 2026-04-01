---
description: Create feature specification with worktree
---

## Feature Description

$ARGUMENTS

## Execution

### 1. Detect Schema

Parse arguments for flags:
- `--tdd` → `feature-tdd` schema
- `--rapid` → `feature-rapid` schema
- `--bugfix` → `bugfix` schema
- `--no-linear` → skip Linear ticket creation

If no schema flag provided:
- Words like "fix", "bug", "broken", "regression", "crash", "error" → suggest `bugfix`
- Otherwise → ask user: "TDD (production) or rapid (prototype)?"

Extract the feature description (everything except flags) as `FEATURE_DESC`.

### 1b. Linear (while specifying)

- Follow **`~/.claude/skills/linear/SKILL.md`** whenever a specify step creates or updates Linear issues (MCP, centralized config).

### 2. Check State (resume detection)

If a feature ID is already known (from args or worktree path):

```bash
cat openspec/changes/$FEATURE_ID/state.yaml 2>/dev/null
```

- `phase: specify` → resume from recorded step number
- `phase: implement` or `phase: complete` → inform user: "Already past specify phase. Use /implement or /complete-feature."
- File missing → fresh start from step 1

### 3. Load and Execute Workflow Steps

**Follow the Step Execution Protocol** (defined in `/develop`): READ state → LOAD step → EXECUTE → CAPTURE learnings → WRITE state → NUDGE to next step.

Determine the current step from state.yaml's `next_step.step_id` (or step 1 if fresh).

List the step files for the specify phase:
```bash
ls $HOME/.claude/openspec/schemas/$SCHEMA/workflow/specify/
```

For each step:

1. **READ** — Read `openspec/changes/$FEATURE_ID/state.yaml`, extract `next_step`
2. **LOAD** — Read the step file: `cat $HOME/.claude/openspec/schemas/$SCHEMA/workflow/specify/<step_id>.yaml`
3. **EXECUTE** — Run the step's `instruction:` field, using the structured config (agents, thresholds, skills, tools)
4. **CAPTURE** — If anything was learned (retry, mistake, surprise), append to `learnings[]` in state.yaml:
   ```yaml
   learnings:
     - step_id: <step-name>
       phase: specify
       type: mistake | insight | retry | decision
       detail: "What happened"
       timestamp: "<ISO>"
   ```
5. **WRITE** — Update state.yaml with completed step and next_step:
   ```yaml
   phase: specify
   step: N
   step_id: <completed-step>
   updated_at: "<ISO>"
   next_step:
     command: specify
     phase: specify
     step_id: <next-step-name>
     instruction: "<what the next step does>"
   ```
6. **NUDGE** — Output "Step complete. Reading state.yaml for next step." Then read state.yaml and continue.

When all specify steps are complete, set `next_step` to hand off:
```yaml
next_step:
  command: implement
  phase: implement
  step_id: null
  instruction: "Specify phase complete — run /implement to begin implementation"
```
