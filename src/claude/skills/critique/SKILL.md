---
name: critique
description: UX design critique. Spawns the ux-reviewer agent for staff-level evaluation. Use when reviewing UI, before shipping, or when user says "critique", "review this design".
user-invocable: true
args:
  - name: target
    description: File path, URL, or feature area to critique (optional — defaults to recent UI changes)
    required: false
---

## Orchestration

1. Identify target from `$ARGUMENTS` (file path, URL, or auto-detect recent UI files)
2. Spawn `ux-reviewer` agent with the target
3. Present the agent's report to the user
