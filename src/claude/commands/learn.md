---
description: Evaluate last feature's workflow compliance and auto-update CLAUDE.md with learned rules
---

## Learn from Last Feature

$ARGUMENTS

## Overview

`/learn` runs the evaluation + self-improvement loop after a feature is completed. It spawns the workflow-evaluator to assess compliance, auto-update the project's CLAUDE.md with learned code rules, write cycle metrics, and route workflow fixes to the workflow-fixer agent.

## Process

### 1. Find Context

Locate the most recent completed feature:
- Check `~/.claude/workflows/` for the most recent file with `"status": "completed"` or `"phase": "complete"`
- Read the workflow state for feature_id, schema, quality scores
- Find the project root from the workflow state or cwd
- Read git log for the feature's commits and diff

If `$ARGUMENTS` contains a feature ID, use that instead of auto-detecting.

### 2. Gather Inputs

Collect the evaluator's inputs:
- **Workflow report**: reconstruct from workflow state (phases completed, scores, timestamps)
- **Quality report**: from the last verifier review output or phase review scores
- **Project root**: path to the product's CLAUDE.md

### 3. Spawn Workflow Evaluator

Launch the `workflow-evaluator` agent with:
- The coder's workflow report
- The reviewer's quality scores
- The project root path for CLAUDE.md updates
- Instruction to run all 4 parts: compliance → gap analysis → CLAUDE.md update → metrics write

### 4. Route Workflow Fixes

If the evaluator suggests **workflow rules** (for develop.md, implement.md):
- Spawn the `workflow-fixer` agent with those suggestions
- Report what was fixed

If the evaluator suggests **tooling rules** (eslint, knip config):
- Log as manual TODO — these need human oversight

### 5. Report

```
[learn] Evaluation complete for [feature-id]
  Verdict: [CLEAN/PASS/FAIL]
  CLAUDE.md: +N rules applied, M deduplicated
  Metrics: cycle K written to .claude/metrics.jsonl
  Consecutive clean: N/3
  Workflow fixes: [applied/none needed]
```
