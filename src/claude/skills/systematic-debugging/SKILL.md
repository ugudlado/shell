---
name: systematic-debugging
description: "Systematic debugging — reproduce, trace, hypothesize, verify. Spawns the debugger agent. Use for any bug, test failure, or unexpected behavior before proposing fixes."
user-invocable: true
args:
  - name: issue
    description: Description of the bug or failing test (optional)
    required: false
---

## Orchestration

1. Parse `$ARGUMENTS` for bug description or failing test
2. Spawn `debugger` agent with the issue context
3. Present root cause analysis and suggested fix to user
