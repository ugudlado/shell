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

- Follow **`~/.claude/skills/linear/SKILL.md`** whenever a specify step creates or updates Linear issues (MCP, `linear-config.md`).

### 2. Check State (resume detection)

If a feature ID is already known (from args or worktree path):

```bash
cat openspec/changes/$FEATURE_ID/state.yaml 2>/dev/null
```

- `phase: specify` → resume from recorded step number
- `phase: implement` or `phase: complete` → inform user: "Already past specify phase. Use /implement or /complete-feature."
- File missing → fresh start from step 1

### 3. Load and Execute Workflow Steps

Determine the current step (1 if fresh, or from state.yaml).

List the step files for the specify phase:
```bash
ls $HOME/.claude/openspec/schemas/$SCHEMA/workflow/specify/
```

Read the current step file:
```bash
cat $HOME/.claude/openspec/schemas/$SCHEMA/workflow/specify/step-name.yaml
```

Execute the step's `instruction:` field, using the structured config (agents, thresholds, skills, tools) to guide execution.

After completing each step, update state.yaml:
```yaml
phase: specify
step: N
step_id: step-name
updated_at: "ISO timestamp"
```

Then load and execute the next step file in sequence until all specify steps are complete.
