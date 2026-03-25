---
description: Run improvement iterations on an implemented feature — evaluate quality, identify improvements, execute them
---

## Feature ID

$ARGUMENTS

## Overview

Standalone iteration loop for improving an already-implemented feature. This is the same iteration engine used by `/develop` phase 6, but can be invoked independently on any feature that has passed implementation.

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
- OpenSpec artifacts (spec.md, design.md, tasks.md — or diagnosis.md, fix-plan.md, tasks.md for bugfix)
- `.openspec.yaml` for schema type
- Memory search for prior decisions: `mcp__plugin_claude-mem_mcp-search__search`
- Workflow state (if exists): `~/.claude/workflows/*.json`

Determine max iterations:
- From workflow state `flags.max_iterations`, or
- From `--iterations N` argument, or
- Default: 3

### 2. Execute Iterate Skill

**Invoke the `iterate` skill now** — follow its full process:

#### Step 1: Baseline Evaluation

Score the current implementation across 5 dimensions (1-10 each):

| Dimension | Weight | What to Check |
|-----------|--------|--------------|
| Code Quality | 0.25 | Patterns, DRY, error handling, edge cases, readability |
| UX Quality | 0.25 (skip if no UI) | Visual hierarchy, states (empty/loading/error/success), accessibility |
| Performance | 0.15 | N+1 queries, re-renders, blocking ops, bundle size, caching |
| Test Quality | 0.20 | Critical path coverage, edge cases, independence, assertion quality |
| Developer XP | 0.15 | API ergonomics, naming clarity, sensible defaults |

For each dimension:
1. Read relevant code files
2. Run checks (tests, type-check, build)
3. Score with specific evidence
4. List concrete improvement opportunities

If UI components exist: invoke `/critique` skill for UX evaluation.

Compute **weighted overall score** (redistribute weights if UX skipped).

#### Step 2: Prioritize Improvements

Rank all improvement opportunities by:
1. User-facing impact (UX > performance > code quality > DX)
2. Effort-to-value ratio (quick wins first)
3. Risk (low-risk before risky refactors)
4. Estimated score delta

**Cut line**: Only pursue improvements with estimated score delta ≥ 0.3. Below that = diminishing returns.

#### Step 3: Execute Improvements

For each improvement above the cut line (in priority order):

1. **Create task** via `TaskCreate`:
   - Subject: `[iterate] <improvement description>`
   - Description: Why (dimension + gap), Files to modify, Verify criteria
   - Metadata: `{"phase": "Iteration N", "dimension": "<dimension>"}`

2. **Implement** using the Implementer → Reviewer → Verifier loop:
   - Spawn implementer agent with task context + spec
   - Reviewer validates against improvement criteria
   - Verifier confirms tests pass, build clean, improvement achieved

3. **Commit** after each improvement:
   ```
   refactor: [FEATURE-ID] iteration N — <improvement summary>
   ```

**Guardrails**:
- Don't refactor working code just for style — must improve a scored dimension
- Don't add features — iteration improves existing behavior, not scope
- Don't break passing tests — every improvement must leave the suite green

#### Step 4: Re-evaluate

Re-score all dimensions using the same criteria from Step 1. Record scores. Compute delta.

#### Step 5: Termination Check

**Stop when ANY of these are true:**
1. Overall score ≥ 9.0
2. Score delta < 0.5 from previous round
3. Max iterations reached
4. No improvements above cut line (all deltas < 0.3)
5. All dimensions ≥ 8

**If not terminated**: loop back to Step 2 with new scores.

### 3. Update State

If workflow state exists (`~/.claude/workflows/*.json`), update after each round:
- Increment `iteration_count`
- Append composite score to `quality_scores` array
- If called from `/develop` and terminated: set `"phase": "complete"`

The `iteration-gate.sh` Stop hook reads these values to enforce termination criteria.

### 4. Report

```
[iterate] Complete for FEATURE-ID
  Rounds: N | Score: X → Y → Z
  Termination: <reason>
  Improvements made:
  - [UX] Added loading/error states (+1.2 UX)
  - [Code] Extracted shared validation (+0.6 Code)
  - [Test] Added error path tests (+0.5 Test)
  Remaining opportunities (deferred):
  - [Code] Minor naming inconsistency (delta: 0.1)
```
