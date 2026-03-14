---
name: block-push-main
enabled: true
event: bash
pattern: git\s+push\s+origin\s+main
action: block
---

**Blocked: git push origin main**

Do not push to main. The user will push manually when ready.
