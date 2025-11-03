---
description: Load saved session context from the most recent snapshot
model: claude-sonnet-4-5
---

> **🤖 Model**: Using Sonnet 4.5 for fast context loading
> **📂 Source**: PreCompact snapshots or session logs
> **🔍 Mode**: Read-only - displays context without modifications

## Load Session Context

**Context Type**: ${ARGUMENTS:-latest}

---

## Step 1: Locate Context Files

Looking for saved context in:
- **Compact Context**: `~/.claude/compact-context/pre-compact-*.txt`
- **Session Logs**: `~/.claude/sessions/*.log`

Determining which source to use...

### Available Context Snapshots

**Compact Context (last 5)**:
```bash
ls -lt ~/.claude/compact-context/pre-compact-*.txt 2>/dev/null | head -5
```

**Session Logs (last 5)**:
```bash
ls -lt ~/.claude/sessions/*.log 2>/dev/null | head -5
```

### Selecting Source

Based on `${ARGUMENTS:-latest}`:
- `latest` → Most recent (compact or session)
- `compact` → Latest PreCompact snapshot
- `session` → Latest session log
- `[path]` → Specific file path

---

## Step 2: Load Context File

Reading the selected context file and extracting:

1. **Repository Information**
   - Working directory
   - Git repository path
   - Current branch

2. **Work in Progress**
   - Uncommitted changes
   - Recent commits
   - Linear ticket (if any)

3. **Project Context**
   - Active specifications
   - MCP servers configured
   - Memory patterns stored

4. **Session Metadata**
   - Timestamp
   - Context type
   - Snapshot location

---

## Step 3: Display Context

Show the complete context file contents, then provide:

### 📊 Context Summary

Extract and display:
- **Source**: Filename and type
- **Date**: When context was saved
- **Location**: Working directory
- **Branch**: Git branch
- **Status**: Uncommitted changes count
- **Ticket**: Linear ticket ID (if present)

### 🎯 Quick Navigation

If context shows active work, provide commands for:
- Viewing specifications (`specs/[TICKET]/`)
- Checking git status
- Reviewing recent commits
- Accessing task lists
- Reading feature memory

### ✅ Next Steps

Suggest appropriate actions based on the loaded context:
- Continue implementation if tasks incomplete
- Review changes if work in progress
- Check test coverage if code changes present
- Update Linear ticket if needed

---

## Example Output

```
📂 Loading context from: pre-compact-20251025_030146.txt

=== Pre-Compact Context Snapshot ===
Date: 2025-10-25 03:01:46
Working Directory: /Users/spidey/code/feature_worktrees/LIG-212

=== Git Context ===
Branch: feature/LIG-212
Status: 3 uncommitted changes

=== Active Linear Ticket ===
Ticket: LIG-212
Specs: specs/LIG-212/

📊 Context Summary:
  - Source: pre-compact-20251025_030146.txt (Compact Snapshot)
  - Date: 2025-10-25 03:01:46
  - Branch: feature/LIG-212
  - Status: 3 uncommitted changes
  - Active Work: LIG-212

🎯 Quick Navigation:
  - View spec: Read specs/LIG-212/spec.md
  - View tasks: Read specs/LIG-212/tasks.md
  - Check status: Run git status
  - Review changes: Run git diff

✅ Next Steps:
  - Continue implementation: /implement LIG-212
  - Review changes before committing
  - Update task progress
```

---

## Implementation Notes

This command:
1. **Locates** the appropriate context file
2. **Reads** the complete context
3. **Extracts** key information
4. **Provides** navigation commands
5. **Suggests** next steps

All operations are **read-only** - no files are modified, no git operations executed.

Use the provided commands to verify state and navigate to the relevant work.
