---
name: workflow-improve
description: "Validate and improve workflow infrastructure. Spawns the workflow-improver agent. Use after modifying hooks, step contracts, or schemas, or when user says \"improve workflow\", \"validate hooks\"."
user-invocable: true
args:
  - name: target
    description: Specific schema, step, or hook to validate (optional — defaults to all)
    required: false
---

## Orchestration

1. Parse `$ARGUMENTS` for specific target or default to full validation
2. Spawn `workflow-improver` agent to analyze metrics and identify improvements
3. Present findings and applied changes to user
