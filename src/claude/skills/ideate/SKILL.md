---
name: ideate
description: "Brainstorm ideas, explore designs, and build a prioritized backlog. Use when the user wants new feature ideas, backlog management, or says \"ideate\", \"brainstorm\", \"what should we build\"."
user-invocable: true
args:
  - name: topic
    description: Focus area for ideation (optional)
    required: false
  - name: --next
    description: Pick the most valuable item from existing backlog
    type: flag
  - name: --refresh
    description: Re-prioritize existing backlog without creating new ideas
    type: flag
---

## Orchestration

1. Parse `$ARGUMENTS` for topic, --next, or --refresh flags
2. Spawn `ideator` agent with the target context
3. Present results to user
