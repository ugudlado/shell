---
name: specify
description: Create feature specification with worktree. Runs discovery (Discoverer agent) and architecture (Architect agent) to produce Spec artifacts. Use when starting a new feature, or when the user says "specify", "create spec", "write specification", "start feature". Triggered by /develop's specify phase.
user-invocable: true
args:
  - name: description
    description: Feature description, or feature ID to resume an in-progress specification
    required: false
  - name: --tdd
    description: Use feature schema (production quality, tests required)
    type: flag
  - name: --rapid
    description: Use feature schema (prototype, no test requirements)
    type: flag
  - name: --bugfix
    description: Use bugfix schema (diagnosis → regression test → fix)
    type: flag
  - name: --no-linear
    description: Skip Linear ticket creation
    type: flag
orchestrator:
  state_file: $SPEC_CHANGES_DIR/$FEATURE_ID/state.yaml
  phases: [discovery, specify-architect]
  resume: true
---

## Variables

REPO_NAME=$(basename "$(git rev-parse --show-toplevel)")
SPEC_CHANGES_DIR=~/.config/spec/changes/$REPO_NAME

## Feature Description

$ARGUMENTS

## Execution

### 1. Detect Schema

Parse arguments for flags:
- `--tdd` → `feature` schema
- `--rapid` → `feature` schema
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
cat $SPEC_CHANGES_DIR/$FEATURE_ID/state.yaml 2>/dev/null
```

- `phase: specify` → resume from recorded step number
- `phase: implement` or `phase: complete` → inform user: "Already past specify phase. Use /implement or /complete-feature."
- File missing → fresh start from step 1

### 3. Load and Execute Workflow Steps

**Follow the Step Execution Protocol** (defined in `/develop`): READ state → LOAD step → EXECUTE → CAPTURE learnings → WRITE state → NUDGE to next step.

Determine the current step from state.yaml's `next_step.step_id` (or step 1 if fresh).

List the step files for the specify phase:
```bash
ls $HOME/.claude/spec/schemas/$SCHEMA/workflow/specify/
```

For each step:

1. **READ** — Read `$SPEC_CHANGES_DIR/$FEATURE_ID/state.yaml`, extract `next_step`
2. **LOAD** — Read the step file: `cat $HOME/.claude/spec/schemas/$SCHEMA/workflow/specify/<step_id>.yaml`
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
     skill: specify
     phase: specify
     step_id: <next-step-name>
     instruction: "<what the next step does>"
   ```
6. **NUDGE** — Output "Step complete. Reading state.yaml for next step." Then read state.yaml and continue.

When all specify steps are complete, set `next_step` to hand off:
```yaml
next_step:
  skill: implement
  phase: implement
  step_id: null
  instruction: "Specify phase complete — run /implement to begin implementation"
```
