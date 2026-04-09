---
name: commit-group
description: "Create commits in logical groups. Use when there are multiple unstaged changes that should be organized into atomic commits."
user-invocable: true
args: []
---

## Orchestration

1. Spawn `developer` agent to analyze unstaged changes, group them logically, and commit each group
2. Present the commit summary to the user
