---
name: complete-feature
description: "Complete feature — verify, signoff, archive. Alias for /develop that runs only the complete phase. Use when the user says 'complete feature', 'finish feature', 'merge to main'."
user-invocable: true
args:
  - name: feature-id
    description: Feature ID (e.g., HL-170). Auto-detected from worktree/branch if omitted.
    required: false
---

## Execution

This is a thin wrapper around `/develop`. It runs only the complete phase.

1. Follow `/develop` steps 1-2 (resolve schema from existing state, check resume).
2. Verify the implement phase is already completed in state.yaml.
   If not → inform user: "Run /develop or /implement first."
3. Execute only the **complete phase** from the schema's `phases:` array.
4. When done, set `status: completed` in state.yaml and report.
