---
feature-id: rule-merge-contract
linear-ticket: TBD
---

# Specification: Rule Merge Contract

## Motivation

The rule cascade (project → schema → phase → step → injected) produces the merged rule set that every step receives. Today, the merge algorithm is described in prose across load-project-context.yaml (instruction step 4) and the /develop skill (section 3.b). The prose uses terms like "override same-id rules" and "higher-priority one wins" without defining the algorithm formally. Two models can interpret "higher priority" differently, compute different active rule sets, and cause every downstream step to diverge.

## What Changes

- CONVENTIONS.md gains a "Rule Merge Contract" section defining the formal algorithm
- load-project-context.yaml references the contract instead of inline prose
- The /develop skill's agent prompt section references the contract for merged rules

## Requirements

### Functional

1. **FR-1**: CONVENTIONS.md contains a "Rule Merge Contract" section after the existing Rules-When Evaluation section.
2. **FR-2**: The contract defines a Rule Source Taxonomy listing all 5 rule sources in precedence order (highest to lowest): step entry injections (rules_when + extra_rules), step contract rules, phase rules, schema rules, project rules.
3. **FR-3**: The contract defines three Rule Formats with their field structures: Named (id + rule + optional when), Plain (string only), and Injected (from rules_when/extra_rules, string only).
4. **FR-4**: The contract specifies a deterministic merge algorithm as numbered steps that any agent can follow to produce identical output from identical inputs.
5. **FR-5**: The algorithm specifies deduplication: named rules with the same `id` are resolved by precedence (highest source wins). Plain and injected rules are never deduplicated (they accumulate).
6. **FR-6**: The algorithm specifies `when:` evaluation: rules with `when: <flag>` are included only if flag is truthy in state.yaml.flags. Rules without `when:` are always included.
7. **FR-7**: The contract specifies the output format: an ordered list of rule strings, sorted by source precedence (highest first), then by original order within each source.
8. **FR-8**: load-project-context.yaml instruction step 4 is replaced with a reference to the Rule Merge Contract.
9. **FR-9**: The /develop skill agent prompt template references the contract for the merged rules section.

### Non-Functional

1. **NFR-1**: Contract is prose-enforced, not machine-validated. Matches existing pattern.
2. **NFR-2**: No changes to existing rule formats in project.yaml or schemas.
3. **NFR-3**: Backward-compatible — the algorithm formalizes what was already intended.

## Architecture

| File | Change |
|------|--------|
| src/spec/steps/CONVENTIONS.md | Add Rule Merge Contract section |
| src/spec/steps/load-project-context.yaml | Replace inline merge prose with contract reference |
| src/claude/skills/develop/SKILL.md | Add contract reference in agent prompt section |

## Test Strategy

N/A — YAML/markdown changes only.

## Acceptance Criteria

- AC-1: CONVENTIONS.md contains a "Rule Merge Contract" section with a Rule Source Taxonomy table listing 5 sources in precedence order. [traces: UC-1]
- AC-2: The contract contains a numbered merge algorithm that produces identical output from identical inputs. [traces: UC-1, UC-3]
- AC-3: The algorithm defines deduplication semantics: same-id named rules resolved by source precedence; plain/injected rules always accumulate. [traces: UC-E1]
- AC-4: The algorithm handles when-condition evaluation consistent with CONVENTIONS.md § Rules-When Evaluation. [traces: UC-E2]
- AC-5: The contract specifies the output format: ordered list sorted by source precedence then original order. [traces: UC-2]
- AC-6: load-project-context.yaml references "per CONVENTIONS.md § Rule Merge Contract" instead of inline merge algorithm prose. [traces: UC-1]
- AC-7: The /develop skill agent prompt construction section references the contract for merged rules. [traces: UC-2]

## Alternatives Considered

**Alternative 1: Machine-validated merge (code implementation)**
Rejected. No code in this repo — all YAML/markdown. Adding a merge validator would require new tooling. Prose-enforced matches existing contracts.

## Impact

No breaking changes. Formalizes existing behavior.

## Decisions

- OQ-1 resolved: No source attribution in merged rule list. Rules are already named (by id) or contextual (from step/phase). Adding "[project]" prefixes adds noise for marginal debugging benefit. [ASSUMPTION]
