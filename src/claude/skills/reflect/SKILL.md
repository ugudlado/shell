---
name: reflect
description: "Review session mistakes and extract permanent learnings. Use when the user says \"reflect\", \"review sessions\", \"extract learnings\"."
user-invocable: true
args:
  - name: session
    description: Specific session or feature to reflect on (optional — defaults to current session)
    required: false
---

## Orchestration

1. Identify target session from `$ARGUMENTS` or default to current
2. Spawn `reviewer` agent to analyze session logs and extract learnings
3. Present findings and route learnings to `spec/project.yaml` learnings section
