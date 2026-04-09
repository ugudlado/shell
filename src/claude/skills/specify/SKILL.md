---
name: specify
description: "Create feature specification. Alias for /develop that runs only the specify (or diagnose) phase. Use when the user says 'specify', 'create spec', 'write specification'."
user-invocable: true
args:
  - name: description
    description: Feature description or feature ID to resume
    required: false
  - name: --bugfix
    description: Use bugfix schema (runs diagnose phase instead)
    type: flag
  - name: --no-tdd
    description: Skip test-first enforcement
    type: flag
  - name: --no-linear
    description: Skip Linear ticket creation
    type: flag
---

## Execution

This is a thin wrapper around `/develop`. It runs only the first phase (specify for feature, diagnose for bugfix).

1. Follow `/develop` steps 1-3 (resolve schema, check resume, init state).
2. Execute only the **first phase** from the schema's `phases:` array.
3. When that phase completes, stop and report. Do NOT advance to implement.
4. Set `next_step` to hand off:
   ```yaml
   next_step:
     phase: implement
     step_id: <first step of implement phase>
     instruction: "Specify complete — run /develop or /implement to continue"
   ```
