---
description: Self-improving workflow loop — run tests, evaluate, fix, re-test until quality converges
---

## Arguments

$ARGUMENTS

## Overview

`/workflow-improve` applies the iterate pattern to the **workflow infrastructure itself**. It runs the test suite, spawns an evaluator agent to analyze results and discover new scenarios, spawns a coder agent to implement fixes, then re-tests — repeating until quality converges.

## Process

### 1. Run Test Suite

```bash
cd "$(git rev-parse --show-toplevel)"
make test 2>&1
```

Capture the full output (BATS results + validation).

Also run the structural validation:
```bash
bash tests/validate-commands.sh 2>&1
```

### 2. Spawn Evaluator

**Spawn the `workflow-evaluator` agent** (Opus) with:
- Full test output from step 1
- Instruction to: parse results, categorize failures, discover new scenarios, score dimensions, produce ranked improvement plan

**Wait for evaluator to complete.** Read its assessment.

### 3. Check Termination

If the evaluator reports:
- **All tests pass AND no new scenarios discovered** → stop, report success
- **Score delta < 0.5 from previous round** → stop, diminishing returns
- **Round ≥ 3** → stop, max rounds reached
- Otherwise → continue to step 4

### 4. Spawn Coder

**Spawn the `workflow-coder` agent** (Sonnet) with:
- The evaluator's ranked improvement plan
- Instruction to: fix failing hooks, add edge case handling, write new test cases, verify no regressions

**Wait for coder to complete.** Read its report.

### 5. Re-run Tests

```bash
make test 2>&1
```

### 6. Loop

Go back to step 2 with the new test results.

### 7. Final Report

```
[workflow-improve] Complete
  Rounds: N
  Tests: X passed / Y total
  Score: A.B → C.D → E.F
  Fixes applied: [list]
  New tests added: [count]
  Termination: [reason]
```

## When to Use

- After creating or modifying hooks
- After changing workflow state schema
- Before merging workflow changes to main
- Periodically to catch regressions and discover new edge cases

## Integration with /develop

This command validates the **infrastructure** that `/develop` depends on. Run it before using `/develop` on a real feature to ensure all hooks and state management work correctly.
