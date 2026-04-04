# Tasks — Rule Merge Contract

## Phase 1: Contract

- [x] T-1: Add Rule Merge Contract section to CONVENTIONS.md
  Files: src/spec/steps/CONVENTIONS.md
  Verify: grep confirms "Rule Merge Contract" heading exists. Section contains Rule Source Taxonomy table (grep "| Source |"). Section contains numbered merge algorithm. Section defines deduplication (grep "dedup"). Section specifies output format. Section references Rules-When Evaluation for when-condition handling.

## Phase 2: References

- [x] T-2: Update load-project-context.yaml to reference contract [P]
  Files: src/spec/steps/load-project-context.yaml
  Verify: Instruction step 4 references "per CONVENTIONS.md § Rule Merge Contract". Inline merge algorithm prose replaced with contract reference.
  depends: T-1

- [x] T-3: Update /develop SKILL.md agent prompt section to reference contract [P]
  Files: src/claude/skills/develop/SKILL.md
  Verify: Agent prompt construction section references Rule Merge Contract for merged rules.
  depends: T-1
