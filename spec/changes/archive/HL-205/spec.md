---
feature-id: step-contract-effectiveness
linear-ticket: HL-205
---

# Specification: Step Contract Effectiveness

## Motivation

The decay evaluation prunes learned rules using age-based heuristics only. This means effective rules get removed because they're old, and ineffective rules survive because they're new. Adding hit/miss counters to rule metadata enables evidence-based pruning — keep rules that reduce retries, remove rules that don't.

## What Changes

1. **Extended metadata format** — Add `hits` and `misses` counters to learned rule comments.
2. **Effectiveness-based decay criteria** — Replace pure age-based decay with effectiveness thresholds.
3. **Counter update logic** — `/learn` updates counters by correlating rules to step retry rates.

## Requirements

### Functional

1. **FR-1**: Learned rule metadata comments include `hits` and `misses` fields (default: 0).
2. **FR-2**: During `/learn`, counters are updated: hit when the rule's step had zero retries, miss when the step had retries.
3. **FR-3**: Decay evaluation uses effectiveness criteria: eligible for removal when `hits == 0 AND age > 5` OR `miss_rate > 0.7 AND age > 10`.
4. **FR-4**: Existing learned rules without hits/misses are treated as `hits: 0, misses: 0` (backward compatible).

### Non-Functional

1. **NFR-1**: Metadata format change is backward compatible (old rules remain valid).

## Architecture

| File | Change Type | Description |
|------|-------------|-------------|
| `~/.config/spec/steps/CONVENTIONS.md` | Modify | Rule Lifecycle Convention: new metadata fields, effectiveness decay |
| `src/claude/skills/learn/SKILL.md` | Modify | Rule Decay Evaluation (5b): counter updates, effectiveness criteria |

## Test Strategy

N/A — config_docs change. Verification via walkthrough.

## Acceptance Criteria

- AC-1: Given a learned rule metadata comment, it supports `hits: N, misses: M` fields. [traces: FR-1]
- AC-2: Given a completed feature where a step had zero retries, when /learn runs, then all learned rules in that step contract get their `hits` counter incremented. [traces: FR-2]
- AC-3: Given decay evaluation, when a rule has `hits == 0 AND age > 5`, then it is flagged for removal. [traces: FR-3]
- AC-4: Given an existing rule without hits/misses, when decay evaluation reads it, then it defaults to `hits: 0, misses: 0`. [traces: FR-4, NFR-1]

## Alternatives Considered

**Alternative: Separate rule-effectiveness.jsonl log file (Approach B)**
Rejected. Higher complexity (M vs S). Requires rule IDs. New file to manage. Self-contained metadata is simpler.

## Impact

No breaking changes. Existing learned rules without counters remain valid — defaults apply.

## Decisions

- Hit/miss is correlation-based, not causal — sufficient for pruning decisions.
- Counters stored inline in metadata comment — no new files.
- Effectiveness threshold: `hits == 0 AND age > 5` OR `miss_rate > 0.7 AND age > 10`.

<!-- Format contract: CONVENTIONS.md § Specification Format Contract -->
