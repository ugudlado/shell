---
name: telemetry
description: "Show workflow metrics dashboard. Use when user says \"telemetry\", \"show metrics\", \"workflow health\", \"dashboard\"."
user-invocable: true
args: []
---

## Orchestration

1. Spawn `workflow-improver` agent in telemetry dashboard mode to read feature-metrics.jsonl, state.yaml archives, and error-patterns.jsonl
2. Present formatted metrics dashboard with benchmark comparisons to user
