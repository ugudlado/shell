---
feature-id: learned-rule-scoping
linear-ticket: HL-206
---

# Specification: Learned Rule Scoping

## Motivation

All learned rules go to shared step contracts (`$SPEC_HOME/steps/`) with no repo scoping. A rule learned in repo A incorrectly constrains repo B. This blocks multi-repo workflow adoption.

## What Changes

1. **`repo:` field in metadata** — Each learned rule includes which repo it came from.
2. **Merge algorithm filtering** — Rule Merge Contract filters learned rules by current repo.
3. **Scope classification** — `/learn` classifies rules as universal or repo-scoped.

## Requirements

### Functional

1. **FR-1**: Learned rule metadata includes `repo:` field (repo name or `*` for universal).
2. **FR-2**: Rule Merge Contract filters learned rules: only apply when `repo:` matches current `$REPO_NAME` or `repo: *`.
3. **FR-3**: `/learn` defaults to `repo: $REPO_NAME` (repo-scoped) unless the evaluator classifies a rule as universal.
4. **FR-4**: Existing rules without `repo:` are treated as `repo: *` (backward compatible).

### Non-Functional

1. **NFR-1**: No structural changes to step contracts — scoping is metadata-only.

## Architecture

| File | Change Type | Description |
|------|-------------|-------------|
| `~/.config/spec/steps/CONVENTIONS.md` | Modify | Rule Lifecycle: add repo field. Rule Merge: add repo filtering. |
| `src/claude/skills/learn/SKILL.md` | Modify | Route rules with repo: field, default to repo-scoped |

## Acceptance Criteria

- AC-1: Given a learned rule metadata comment, it includes `repo: <name>` or `repo: *`. [traces: FR-1]
- AC-2: Given the merge algorithm, when computing rules for a step, learned rules with `repo:` not matching current `$REPO_NAME` and not `*` are excluded. [traces: FR-2]
- AC-3: Given `/learn` writing a rule, it defaults to `repo: $REPO_NAME`. [traces: FR-3]
- AC-4: Given an existing rule without `repo:`, the merge algorithm treats it as universal. [traces: FR-4]

## Alternatives Considered

**Alternative: Move learned rules to per-repo directories**
Rejected. Too disruptive — would require restructuring `$SPEC_HOME/steps/` and updating all consumers. Metadata-based scoping achieves the same result with minimal change.

## Impact

No breaking changes. Existing rules remain valid as universal.

<!-- Format contract: CONVENTIONS.md § Specification Format Contract -->
