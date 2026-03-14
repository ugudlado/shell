---
description: Load feature context and resume implementation (redirects to /implement)
argument-hint: "[feature-id] — optional feature ID (auto-detected from worktree/branch if omitted)"
---

# Continue Feature Development

This command is now handled by `/implement`, which auto-detects whether to start fresh or resume.

**Run `/implement $ARGUMENTS`** — it will:
1. Auto-detect the feature from worktree/branch if no ID provided
2. Load all OpenSpec context (spec, design, tasks)
3. Check for resume state (uncommitted changes, in-progress tasks)
4. Continue the Implementer→Reviewer→Verifier loop from where it left off
