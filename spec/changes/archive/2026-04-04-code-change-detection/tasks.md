# Tasks — Change Type Detection

## Phase 1: Contract and References

- [ ] T-1: Add Change Type Detection section to CONVENTIONS.md
  Files: src/spec/steps/CONVENTIONS.md
  Verify: grep confirms "Change Type Detection" heading. Section defines code extensions list, config/docs extensions list, detection algorithm, and flag adaptation rules.

- [ ] T-2: Add change_type to State Field Registry in CONVENTIONS.md
  Files: src/spec/steps/CONVENTIONS.md
  Verify: State Field Registry table includes change_type field with type string, written by load-project-context or generate-or-refresh-tasks.
  depends: T-1

- [ ] T-3: Update /develop SKILL.md agent mode to handle config_docs changes
  Files: src/claude/skills/develop/SKILL.md
  Verify: Agent Mode section references Change Type Detection contract. Contains logic for config_docs inline execution with state.yaml logging.
  depends: T-1
