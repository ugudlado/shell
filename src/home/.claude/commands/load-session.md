---
description: Load saved session context from the most recent snapshot
model: claude-sonnet-4-5
---

# Load Session Context

Restore session context from the most recent snapshot saved by PreCompact or Stop hooks.

## Context Sources

This command can load context from:
1. **Latest PreCompact snapshot** - Context saved before compaction
2. **Latest session log** - Context saved when session ended
3. **Specific snapshot** - If you provide a file path as $ARGUMENTS

## Usage

```bash
# Load most recent context (default)
/load-session

# Load specific snapshot
/load-session /path/to/snapshot.txt

# Load from compact context
/load-session compact

# Load from session log
/load-session session
```

## Load Process

### 1. Determine Source

```bash
SOURCE="${ARGUMENTS:-latest}"

case "$SOURCE" in
  compact)
    # Load from compact context
    CONTEXT_FILE=$(ls -t ~/.claude/compact-context/pre-compact-*.txt 2>/dev/null | head -1)
    ;;
  session)
    # Load from session logs
    CONTEXT_FILE=$(ls -t ~/.claude/sessions/*.log 2>/dev/null | head -1)
    ;;
  latest)
    # Load most recent (compact or session)
    COMPACT_FILE=$(ls -t ~/.claude/compact-context/pre-compact-*.txt 2>/dev/null | head -1)
    SESSION_FILE=$(ls -t ~/.claude/sessions/*.log 2>/dev/null | head -1)

    # Use whichever is newer
    if [[ -n "$COMPACT_FILE" ]] && [[ -n "$SESSION_FILE" ]]; then
      if [[ "$COMPACT_FILE" -nt "$SESSION_FILE" ]]; then
        CONTEXT_FILE="$COMPACT_FILE"
      else
        CONTEXT_FILE="$SESSION_FILE"
      fi
    elif [[ -n "$COMPACT_FILE" ]]; then
      CONTEXT_FILE="$COMPACT_FILE"
    elif [[ -n "$SESSION_FILE" ]]; then
      CONTEXT_FILE="$SESSION_FILE"
    fi
    ;;
  *)
    # Assume it's a file path
    CONTEXT_FILE="$SOURCE"
    ;;
esac
```

### 2. Validate Context File

```bash
if [[ ! -f "$CONTEXT_FILE" ]]; then
  echo "❌ No context file found"
  echo ""
  echo "Available sources:"
  echo "  - Compact: $(ls -1 ~/.claude/compact-context/*.txt 2>/dev/null | wc -l | tr -d ' ') snapshots"
  echo "  - Session: $(ls -1 ~/.claude/sessions/*.log 2>/dev/null | wc -l | tr -d ' ') logs"
  exit 1
fi
```

### 3. Load and Display Context

```bash
echo "📂 Loading context from: $(basename "$CONTEXT_FILE")"
echo ""
cat "$CONTEXT_FILE"
echo ""
```

### 4. Extract Key Information

Parse the context file and extract:

- **Repository Path** - Working directory
- **Current Branch** - Git branch
- **Uncommitted Changes** - Working tree status
- **Linear Ticket** - Active ticket ID (if any)
- **Specs Location** - Specification directory
- **MCP Servers** - Configured servers
- **Memory Entities** - Stored patterns count

### 5. Provide Navigation Commands

```bash
# If context shows active Linear ticket
if grep -q "Linear Ticket:" "$CONTEXT_FILE"; then
  LINEAR_ID=$(grep "Linear Ticket:" "$CONTEXT_FILE" | awk '{print $3}')
  echo "🎫 Active Linear Ticket: $LINEAR_ID"
  echo ""
  echo "Suggested commands:"
  echo "  - View spec: cat specs/$LINEAR_ID/spec.md"
  echo "  - View tasks: cat specs/$LINEAR_ID/tasks.md"
  echo "  - View memory: cat specs/$LINEAR_ID/memory.md"
  echo ""
fi

# If in worktree
if grep -q "worktree" "$CONTEXT_FILE"; then
  echo "📁 Working in feature worktree"
  echo ""
fi

# Show git commands to verify state
REPO_PATH=$(grep "Repository:" "$CONTEXT_FILE" | awk '{print $2}')
if [[ -n "$REPO_PATH" ]]; then
  echo "🔍 Verify current state:"
  echo "  - git status"
  echo "  - git log --oneline -5"
  echo "  - git diff"
  echo ""
fi

# Show MCP servers
if grep -q "MCP" "$CONTEXT_FILE"; then
  echo "🔧 MCP servers configured and available"
  echo ""
fi
```

### 6. Summary

```bash
echo "✅ Context loaded successfully"
echo ""
echo "📊 Context Summary:"
echo "  - Source: $(basename "$CONTEXT_FILE")"
echo "  - Date: $(grep "Date:" "$CONTEXT_FILE" | cut -d: -f2-)"
echo "  - Type: $(grep -q "Pre-Compact" "$CONTEXT_FILE" && echo "Compact Snapshot" || echo "Session Log")"
echo ""
echo "Ready to continue work!"
```

## Available Snapshots

List available context snapshots:

```bash
echo ""
echo "📋 Available Context Snapshots:"
echo ""

echo "Compact Context (last 5):"
ls -lt ~/.claude/compact-context/pre-compact-*.txt 2>/dev/null | head -5 | \
  awk '{print "  - " $9 " (" $6, $7, $8 ")"}'

echo ""
echo "Session Logs (last 5):"
ls -lt ~/.claude/sessions/*.log 2>/dev/null | head -5 | \
  awk '{print "  - " $9 " (" $6, $7, $8 ")"}'

echo ""
```

## Use Cases

### After Compaction
```bash
# Immediately after Claude compacts context
/load-session compact
```

### Starting New Session
```bash
# Pick up where you left off
/load-session latest
```

### Reviewing Past Work
```bash
# Load specific session
/load-session ~/.claude/sessions/20251011_120000_project.log
```

### Debugging
```bash
# See what context was saved
/load-session session
```

## Notes

- Context snapshots are automatically created by PreCompact and Stop hooks
- Old snapshots are auto-cleaned (keeps last 10 compact, 50 session logs)
- Loading context doesn't change your working directory
- This is a read-only operation - no files are modified
- Use the displayed commands to verify and navigate to the saved state

## Implementation Notes

- **Model**: Uses Sonnet 4.5 for fast context loading
- **No side effects**: Only displays information, doesn't execute commands
- **Smart defaults**: Automatically finds most recent context
- **Helpful output**: Provides navigation commands based on context
