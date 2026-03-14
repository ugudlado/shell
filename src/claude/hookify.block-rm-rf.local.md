---
name: block-rm-rf
enabled: true
event: bash
pattern: rm\s+-rf
action: block
---

**Blocked: rm -rf**

This command can irreversibly delete files. Use targeted `rm` on specific files instead, or ask the user to run this manually.
