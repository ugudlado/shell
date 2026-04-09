# Tasks — Auto-Learn on Complete

## Phase 1: Step Contract and Schema Integration

- [x] T-1: Create run-learn-cycle.yaml step contract
  Files: ~/.config/spec/steps/run-learn-cycle.yaml
  Verify: File exists, has id/version/intent/inputs/rules/instruction/verify/outputs fields, instruction references active dir, rules include non-blocking error handling

- [x] T-2: Add run-learn-cycle to feature, bugfix, and chore schemas before archive-completed-change
  Files: ~/.config/spec/schemas/feature.yaml, ~/.config/spec/schemas/bugfix.yaml, ~/.config/spec/schemas/chore.yaml
  Verify: Each schema's complete phase steps array has run-learn-cycle before archive-completed-change, YAML is valid
  depends: T-1

- [x] T-3: Remove redundant /learn call from autopilot skill step 4d
  Files: ~/.claude/skills/autopilot/SKILL.md
  Verify: No explicit /learn invocation in step 4d section, step 4d replaced with note that learning happens inside /develop's complete phase

- [x] T-4: Add run-learn-cycle to develop skill mechanical steps dispatch table
  Files: ~/.claude/skills/develop/SKILL.md
  Verify: Mechanical steps section includes run-learn-cycle entry with haiku-agent dispatch instruction
