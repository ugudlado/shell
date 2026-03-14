---
name: block-reset-hard
enabled: true
event: bash
pattern: git\s+reset\s+--hard
action: block
---

**Blocked: git reset --hard**

This command destructively discards commits and changes. Do not use it.

If you need to undo a merge, ask the user for guidance.
