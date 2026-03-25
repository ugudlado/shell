---
description: Run improvement iterations on an implemented feature — evaluate quality, identify improvements, execute them
---

## Feature ID

$ARGUMENTS

## Overview

Standalone iteration loop for improving an already-implemented feature. This is the same iteration engine used by `/develop` phase 5, but can be invoked independently on any feature that has passed implementation.

Use when:
- `/implement` is done but you want to polish before merging
- You want to improve UX, performance, or code quality of existing code
- You want a structured evaluation → improve → re-evaluate loop

## Process

### 1. Load Context

Auto-detect feature ID (same as `/implement`):
```bash
FEATURE_ID="${ARGUMENTS:-$(basename "$PWD" 2>/dev/null)}"
WORKTREE=$(ls -d "$HOME/code/feature_worktrees/${FEATURE_ID}"* 2>/dev/null | head -1)
cd "$WORKTREE"
```

Read:
- OpenSpec artifacts (spec.md, design.md, tasks.md)
- `.openspec.yaml` for schema type
- Memory search for prior decisions
- Workflow state (if exists): `~/.claude/workflows/*.json`

Determine max iterations:
- From workflow state `flags.max_iterations`, or
- From `--iterations N` argument, or
- Default: 3

### 2. Invoke Iterate Skill

Use the `iterate` skill which performs:

1. **Baseline evaluation** — score the current implementation
2. **Improvement identification** — find highest-impact opportunities
3. **Execution** — implement improvements through task loop
4. **Re-evaluation** — measure improvement
5. **Termination check** — stop when done or diminishing returns

### 3. Report

```
[iterate] Complete for FEATURE-ID
  Rounds: N | Score: X → Y → Z
  Improvements made:
  - [list with brief descriptions]
  Remaining opportunities (deferred):
  - [low-impact items not worth pursuing]
```

### 4. Update State

If workflow state exists, update:
- `iteration_count`
- `quality_scores` array
- `phase` → `"complete"` (if triggered from `/develop`)
