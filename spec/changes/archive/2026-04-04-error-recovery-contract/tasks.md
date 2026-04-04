# Tasks — Error Recovery Contract

## Phase 1: Contract

- [ ] T-1: Add Error Recovery Contract section to CONVENTIONS.md
  Files: src/spec/steps/CONVENTIONS.md
  Verify: grep confirms "Error Recovery Contract" heading. Section contains state transition table. on_max_retries values are enumerated. Agent blocked re-spawn semantics defined.

- [ ] T-2: Update /develop SKILL.md error handling to reference contract
  Files: src/claude/skills/develop/SKILL.md
  Verify: Phase verification failure section references "per CONVENTIONS.md § Error Recovery Contract". Agent mode error handling section references the contract. Inline prose replaced with contract references.
  depends: T-1
