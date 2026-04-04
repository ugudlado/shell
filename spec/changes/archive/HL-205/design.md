# Design: Step Contract Effectiveness

## Context

Decay evaluation uses age-based heuristics. Needs effectiveness data to prune intelligently.

## Goals / Non-Goals

### Goals
- Per-rule hit/miss counters in metadata comments
- Effectiveness-based decay criteria replacing pure age-based
- Automatic counter updates during /learn

### Non-Goals
- Causal analysis
- Dashboards
- New file formats

## Selected Approach

Approach A — inline metadata counters. S complexity. 2 files.

## High-Level Design

### Metadata Format Extension

Current: `<!-- learned: 2026-04-05, source: HL-203, cycle: 6 -->`
New: `<!-- learned: 2026-04-05, source: HL-203, cycle: 6, hits: 3, misses: 1 -->`

### Counter Update (in /learn § 5b)

For each step contract with learned rules:
1. Read step_history from the just-completed feature's state.yaml
2. Find the step_id matching the step contract filename
3. If step had zero retries → increment `hits` for all learned rules in that contract
4. If step had retries → increment `misses` for all learned rules in that contract
5. Update the metadata comment inline

### Effectiveness Decay Criteria

Replace age-only decay with:

| Condition | Action |
|---|---|
| `hits == 0 AND (current_cycle - rule_cycle) > 5` | Flag for removal — rule never helped |
| `misses / (hits + misses) > 0.7 AND (current_cycle - rule_cycle) > 10` | Flag for removal — mostly ineffective |
| `hits > 0 AND misses / (hits + misses) <= 0.7` | Keep — rule is working |
| Missing hits/misses fields | Default to `hits: 0, misses: 0` |

## Open Questions
- None.

<!-- Format contract: CONVENTIONS.md § Design Format Contract -->
