# Tasks — UX Design Artifact Handoff

## Phase 1: Implementation

- [x] T-1: Add § UX Artifact Contract to CONVENTIONS.md
  Files: src/spec/steps/CONVENTIONS.md
  Verify: Section exists with format (ux-artifacts.yaml + ux-prototype.html), field rules, and consumer list

- [x] T-2: Update ux-design.yaml to persist prototype and write manifest
  Files: src/spec/steps/ux-design.yaml
  Verify: Instruction includes steps to save ux-prototype.html and write ux-artifacts.yaml; verify section checks artifacts exist
  depends: T-1

- [x] T-3: Update generate-or-refresh-tasks.yaml to read UX artifacts
  Files: src/spec/steps/generate-or-refresh-tasks.yaml
  Verify: Instruction reads ux-artifacts.yaml when available; gracefully skips when absent
  depends: T-1

- [x] T-4: Add UX prototype reference rule to execute-next-task.yaml
  Files: src/spec/steps/execute-next-task.yaml
  Verify: Rules section includes UX prototype reference for UI tasks; gracefully skips when no UX artifacts
  depends: T-1
