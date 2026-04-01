---
name: implement
description: "Execute implementation tasks. Alias for /develop that runs only the implement phase. Use when the user says 'implement', 'start building', 'continue feature'."
user-invocable: true
args:
  - name: feature-id
    description: Feature ID (e.g., HL-170). Auto-detected from worktree/branch if omitted.
    required: false
---

## Execution

This is a thin wrapper around `/develop`. It runs only the implement phase.

1. Follow `/develop` steps 1-2 (resolve schema from existing state, check resume).
2. Verify the first phase (specify/diagnose) is already completed in state.yaml.
   If not → inform user: "Run /develop or /specify first."
3. Execute only the **implement phase** from the schema's `phases:` array.
4. When that phase completes, stop and report. Do NOT advance to complete.
5. Set `next_step` to hand off:
   ```yaml
   next_step:
     phase: complete
     step_id: <first step of complete phase>
     instruction: "Implementation complete — run /develop or /complete-feature to finish"
   ```
