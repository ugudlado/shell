# Tasks — Spec Accuracy Feedback Loop

## Phase 1: Step Contract, Schema Integration, and Skill Update

- [x] T-1: Create compute-prediction-accuracy.yaml step contract
  Files: src/spec/steps/compute-prediction-accuracy.yaml
  Verify: File exists, has id/version/intent/inputs/rules/instruction/verify/outputs fields, rules include non-blocking error handling

- [x] T-2: Add compute-prediction-accuracy to feature, bugfix, and chore schemas between final-signoff and run-learn-cycle
  Files: src/spec/schemas/feature.yaml, src/spec/schemas/bugfix.yaml, src/spec/schemas/chore.yaml
  Verify: Each schema's complete phase steps array has compute-prediction-accuracy after final-signoff and before run-learn-cycle, YAML is valid
  depends: T-1

- [x] T-3: Add compute-prediction-accuracy to develop skill mechanical steps dispatch table
  Files: src/claude/skills/develop/SKILL.md
  Verify: Mechanical steps section includes compute-prediction-accuracy entry with haiku-agent dispatch and non-blocking note

- [x] T-4: Update archive-completed-change to export prediction_accuracy in feature-metrics.jsonl
  Files: src/spec/steps/archive-completed-change.yaml
  Verify: workflow_quality block in feature-metrics.jsonl JSON template includes prediction_accuracy field
