#!/bin/bash

# PreCompact Hook
# Saves session context before compaction and appends restoration instructions

set -euo pipefail

# Read compact input from stdin (provided by Claude Code)
COMPACT_INPUT=$(cat)
COMPACT_TYPE=$(echo "$COMPACT_INPUT" | jq -r '.compact_type // "unknown"' 2>/dev/null)

# Create pre-compact context snapshot
CONTEXT_DIR="$HOME/.claude/compact-context"
mkdir -p "$CONTEXT_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
CONTEXT_FILE="$CONTEXT_DIR/pre-compact-$TIMESTAMP.txt"

{
  echo "=== Pre-Compact Context Snapshot ==="
  echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"
  echo "Compact Type: $COMPACT_TYPE"
  echo "Working Directory: $(pwd)"
  echo ""

  # Git context
  if git rev-parse --git-dir > /dev/null 2>&1; then
    echo "=== Git Context ==="
    echo "Repository: $(git rev-parse --show-toplevel)"
    echo "Branch: $(git branch --show-current)"
    echo ""

    echo "=== Recent Work ==="
    git log --oneline -5 2>/dev/null || echo "No recent commits"
    echo ""

    echo "=== Working Tree Status ==="
    git status --short 2>/dev/null || echo "Clean working tree"
    echo ""

    # Check for active work
    if [[ -n "$(git status --porcelain 2>/dev/null)" ]]; then
      echo "⚠️  Active work in progress"
      echo ""
    fi
  fi

  # Check for active Linear tickets
  if git branch --show-current 2>/dev/null | grep -qE '[A-Z]+-[0-9]+'; then
    LINEAR_ID=$(git branch --show-current | grep -oE '[A-Z]+-[0-9]+')
    echo "=== Active Linear Ticket ==="
    echo "Ticket: $LINEAR_ID"

    # Check for specs
    if [[ -d "specs/$LINEAR_ID" ]]; then
      echo "Specs: specs/$LINEAR_ID/"
      if [[ -f "specs/$LINEAR_ID/tasks.md" ]]; then
        echo "Tasks: In progress"
      fi
      if [[ -f "specs/$LINEAR_ID/memory.md" ]]; then
        echo "Memory: Documented"
      fi
    fi
    echo ""
  fi

  # Check for specs directory (worktree or main)
  if [[ -d "specs" ]]; then
    ACTIVE_SPECS=$(find specs -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l | tr -d ' ')
    if [[ "$ACTIVE_SPECS" -gt 0 ]]; then
      echo "=== Active Specifications ==="
      echo "Count: $ACTIVE_SPECS specs in progress"
      find specs -mindepth 1 -maxdepth 1 -type d -exec basename {} \; | head -5
      echo ""
    fi
  fi

  # MCP servers active
  if [[ -f ".mcp.json" ]]; then
    echo "=== MCP Configuration ==="
    if command -v jq &> /dev/null; then
      echo "Servers: $(jq -r '.mcpServers | keys | join(", ")' .mcp.json 2>/dev/null || echo 'Unknown')"
    else
      echo "✓ Project MCP servers configured"
    fi
    echo ""
  fi

  # Memory patterns
  if [[ -f "memory.json" ]] && command -v jq &> /dev/null; then
    ENTITY_COUNT=$(jq -r '.entities | length // 0' memory.json 2>/dev/null)
    if [[ -n "$ENTITY_COUNT" ]] && [[ "$ENTITY_COUNT" -gt 0 ]] 2>/dev/null; then
      echo "=== Memory Patterns ==="
      echo "Entities: $ENTITY_COUNT stored"
      echo ""
    fi
  fi

  echo "=== Context Saved ==="
  echo "Snapshot: $CONTEXT_FILE"

} > "$CONTEXT_FILE" 2>&1

# Clean up old context snapshots (keep last 10)
find "$CONTEXT_DIR" -name "pre-compact-*.txt" -type f | sort -r | tail -n +11 | xargs rm -f 2>/dev/null || true

# Append instructions to Claude Code's built-in compact summary
# This output goes directly to Claude after compaction
cat <<EOF

---

## Context Restoration Instructions

After this compaction, the following context should be restored:

**Working State:**
- Repository: $(git rev-parse --show-toplevel 2>/dev/null || pwd)
- Branch: $(git branch --show-current 2>/dev/null || echo 'Not in git repo')
- Status: $(git status --porcelain 2>/dev/null | wc -l | tr -d ' ') uncommitted changes

$(if git branch --show-current 2>/dev/null | grep -qE '[A-Z]+-[0-9]+'; then
  LINEAR_ID=$(git branch --show-current | grep -oE '[A-Z]+-[0-9]+')
  echo "**Active Work:**"
  echo "- Linear Ticket: $LINEAR_ID"
  if [[ -d "specs/$LINEAR_ID" ]]; then
    echo "- Specification: specs/$LINEAR_ID/"
    [[ -f "specs/$LINEAR_ID/tasks.md" ]] && echo "- Tasks: Available for implementation"
    [[ -f "specs/$LINEAR_ID/memory.md" ]] && echo "- Memory: Contains feature context"
  fi
fi)

$(if [[ -f ".mcp.json" ]] && command -v jq &> /dev/null; then
  echo "**MCP Servers:**"
  echo "- Configured: $(jq -r '.mcpServers | keys | join(", ")' .mcp.json 2>/dev/null)"
fi)

**Context Snapshot:** $CONTEXT_FILE

Use \`cat $CONTEXT_FILE\` to restore full session context if needed.

---
EOF

# Output for debugging (goes to stderr)
echo "PreCompact: Context saved to $CONTEXT_FILE" >&2
echo "PreCompact: Compact type: $COMPACT_TYPE" >&2
