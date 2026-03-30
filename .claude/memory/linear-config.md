---
name: Linear Config
description: Linear label IDs for automatic ticket tagging — read by create-ticket.yaml during /specify
type: reference
---

## Linear Labels for Shell

When creating Linear tickets via `/specify` or `/develop`, attach these labels:

```
label_ids:
  - a1948a92-9028-4671-8f70-ae7b8a7120a1  # shell (product label)
```

These are passed as `labelIds` to `mcp__plugin_linear_linear__save_issue`.

To add more labels (e.g., type labels like "feature", "bug"), add their UUIDs to the list above.
