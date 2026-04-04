# Design: Learned Rule Scoping

## Context
Learned rules in shared step contracts apply globally. Need repo scoping for portability.

## Selected Approach
Metadata-based scoping via `repo:` field. S complexity. 2 files.

## High-Level Design

### Extended Metadata
`<!-- learned: 2026-04-05, source: HL-203, cycle: 6, hits: 3, misses: 0, repo: shell -->`

### Merge Algorithm Change (CONVENTIONS.md § Rule Merge Contract)

In step 3c of the merge algorithm (collect step contract rules):
```
For each plain rule in step_contract.rules[]:
  If rule has <!-- learned: ... repo: X --> metadata:
    If X == current $REPO_NAME or X == "*": INCLUDE
    Else: SKIP (rule is for a different repo)
  If rule has no metadata (permanent rule): INCLUDE
  If rule has metadata but no repo: field: INCLUDE (backward compat — treated as universal)
```

### /learn Routing Change
When workflow-fixer writes a rule, metadata includes `repo: $REPO_NAME` by default.
Evaluator can override to `repo: *` for universal workflow rules.

## Open Questions
- None.

<!-- Format contract: CONVENTIONS.md § Design Format Contract -->
