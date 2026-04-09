---
name: humanizer
description: "Remove AI writing patterns from text. Spawns the humanizer agent for staff-level editing. Use when editing text to sound more natural and human-written."
user-invocable: true
args:
  - name: target
    description: Text to humanize, file path, or "clipboard" (optional — reads from context)
    required: false
  - name: --voice
    description: File path to a writing sample for voice matching
    type: option
---

## Orchestration

1. Parse `$ARGUMENTS` for target text or file path
2. If `--voice` provided, include the writing sample for voice calibration
3. Spawn `humanizer` agent with the target text
4. Present the agent's scored output to the user
