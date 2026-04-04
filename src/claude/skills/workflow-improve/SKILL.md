---
name: workflow-improve
description: Self-improving workflow loop — validate schemas, run tests, evaluate, fix, re-test until quality converges. Use after creating or modifying hooks, step contracts, or schemas, before merging workflow changes, or when the user says "improve workflow", "workflow tests", "validate hooks".
user-invocable: true
args:
  - name: target
    description: What to improve — "schemas", "hooks", "all" (default), or a specific schema name
    required: false
---

## Arguments

$ARGUMENTS

## Overview

`/workflow-improve` applies the iterate pattern to the **workflow infrastructure itself**. It validates schema structure, runs tests, spawns evaluator and coder agents to analyze and fix issues, then re-tests — repeating until quality converges.

## Process

### 1. Schema Structural Validation

Validate all schemas in `$SPEC_HOME/schemas/`:

```
For each schema YAML file:
  1. Parse schema — valid YAML with required fields (name, version, uses, defaults, phases)
  2. Step resolution — every step ID in phases[].steps resolves to a file in steps/
  3. Flag consistency — every flag in "if <flag>" / "if not <flag>" conditions exists in schema defaults or flags
  4. Phase dependencies — every "requires: <phase>" references a phase defined earlier in the schema
  5. Template existence — every outputs[].template file exists in templates/<schema>/
  6. No stale references — zero matches for deprecated names (fill_forward, explore-or-diagnose, etc.)
  7. Signoff policy — every phase name has an entry in project.yaml signoff_policy
```

Report structural issues before proceeding. If blocking issues found, fix them first.

### 2. Run Test Suite

```bash
cd "$(git rev-parse --show-toplevel)"
make test 2>&1
```

Capture the full output.

### 3. Spawn Evaluator

**Spawn the `workflow-evaluator` agent** (Opus) with:
- Schema validation results from step 1
- Full test output from step 2
- List of all schemas and their flags/phases
- Instruction to: parse results, categorize failures, discover new scenarios, score dimensions, produce ranked improvement plan

**Wait for evaluator to complete.** Read its assessment.

### 4. Check Termination

If the evaluator reports:
- **All validations pass AND all tests pass AND no new scenarios discovered** → stop, report success
- **Score delta < 0.5 from previous round** → stop, diminishing returns
- **Round >= 3** → stop, max rounds reached
- Otherwise → continue to step 5

### 5. Spawn Fixer and/or Coder

Route fixes based on type:

**Schema/step contract issues** → spawn `workflow-fixer` agent (Sonnet) with:
- The evaluator's ranked improvement plan (schema/step items only)
- Instruction to: fix step contracts, update schemas, update skills

**Hook/test issues** → spawn `workflow-fixer` agent with:
- The evaluator's ranked improvement plan (hook/test items only)
- Instruction to: fix hooks, add edge case handling, write tests
- Must read `$SPEC_HOME/steps/CONVENTIONS.md` before editing step contracts

**Wait for agents to complete.** Read their reports.

### 6. Re-validate and Re-test

Re-run schema validation (step 1) and test suite (step 2).

### 7. Loop

Go back to step 3 with the new results.

### 8. Final Report

```
[workflow-improve] Complete
  Rounds: N
  Schemas validated: [feature, bugfix, chore, spike]
  Schema issues: X found → Y fixed
  Tests: X passed / Y total
  Score: A.B → C.D → E.F
  Fixes applied: [list]
  New tests added: [count]
  Termination: [reason]
```

## When to Use

- After creating or modifying step contracts or schemas
- After creating or modifying hooks
- Before merging workflow changes to main
- Periodically to catch regressions and discover new edge cases
- After running `/develop` on a real project to validate the workflow behaved correctly

## Integration with /develop

This skill validates the **infrastructure** that `/develop` depends on. Run it before using `/develop` on a real feature to ensure schemas, step contracts, hooks, and state management all work correctly together.
