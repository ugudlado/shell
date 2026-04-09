---
name: diagnose
description: "Analyze error patterns and suggest improvements. Use when encountering recurring issues or when the user says \"diagnose\", \"analyze errors\", \"what's going wrong\"."
user-invocable: true
args:
  - name: topic
    description: Specific error or area to diagnose (optional)
    required: false
---

## Orchestration

1. Parse `$ARGUMENTS` for specific error or area focus
2. Spawn `reviewer` agent to analyze error patterns from logs and metrics
3. Present findings and recommended step contract improvements
