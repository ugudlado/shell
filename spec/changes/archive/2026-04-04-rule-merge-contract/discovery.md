---
feature-id: rule-merge-contract
linear-ticket: TBD
---

# Discovery Brief: Rule Merge Contract

## Feature Summary

The rule cascade algorithm that produces the merged rule set for each step is described in prose across load-project-context.yaml instruction and the /develop skill, but has no formal contract. Five distinct rule sources (project, schema, phase, step contract, step entry injections) feed into the merge, with three different rule formats (named with id, plain string, flag-conditional). Without a formal algorithm, two models can compute different active rule sets from the same inputs, causing every downstream step to diverge.

## Personas & Actors

UC-1's primary actor: load-project-context step (computes the merge).
UC-2's primary actor: /develop skill orchestrator (passes merged rules to agent prompts).
UC-3's primary actor: workflow-evaluator (audits rule compliance — needs to know what rules were active).

## Use Cases

### Happy Path

UC-1: Deterministic rule merge — The load-project-context step wants to compute an identical merged rule set given the same project.yaml, schema, phase, step contract, and flags, regardless of which model executes the step.

UC-2: Agent prompt construction — The /develop orchestrator wants to construct agent prompts with a predictable "Rules (ALL must be followed)" section, where the rules are in a stable, deterministic order.

UC-3: Rule audit trail — The workflow-evaluator wants to verify that the correct rules were active during a step's execution by replaying the merge algorithm against the same inputs.

### Error & Edge Cases

UC-E1: ID collision across sources — A project rule and schema rule share the same id. The merge algorithm must apply the precedence order without ambiguity.

UC-E2: Conflicting when conditions — A rules_when block has both `tdd_required:` and `not tdd_required:` entries, and the flag is truthy. The positive match must take precedence per existing CONVENTIONS.md § Rules-When Evaluation.

## Scope

### In Scope

- Formal Rule Merge Contract in CONVENTIONS.md with deterministic algorithm
- Rule source taxonomy (5 sources, 3 formats)
- Merge precedence order with explicit override semantics
- Deduplication rules for named (id) rules
- Output format specification (what the merged rule list looks like)
- Update load-project-context.yaml to reference the contract
- Update /develop SKILL.md agent prompt construction to reference the contract

### Out of Scope

- Changing the existing rule formats (no schema migration)
- Adding machine validation of rule merges (prose-enforced)
- Modifying project.yaml or schema rule definitions
- Changes to rules_when evaluation (already formalized in CONVENTIONS.md)

## UI Direction

N/A — no UI components.

## Key Decisions

## Open Questions

- OQ-1: Should the merged rule list in agent prompts preserve source attribution (e.g., "[project] Evidence-based: ...")? This aids debugging but adds noise.
