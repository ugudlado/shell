#!/bin/bash

# Claude Code Session Initialization Hook
# Minimal initialization - use /load-session to restore context

set -euo pipefail

{
  echo "=== Claude Code Session Started ==="
  echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"
  echo "Directory: $(pwd)"
  echo ""

  # Check for available context snapshots
  COMPACT_COUNT=$(ls -1 ~/.claude/compact-context/pre-compact-*.txt 2>/dev/null | wc -l | tr -d ' ')
  SESSION_COUNT=$(ls -1 ~/.claude/sessions/*.log 2>/dev/null | wc -l | tr -d ' ')

  if [[ "$COMPACT_COUNT" -gt 0 ]] || [[ "$SESSION_COUNT" -gt 0 ]]; then
    echo "📂 Context snapshots available:"
    [[ "$COMPACT_COUNT" -gt 0 ]] && echo "  • $COMPACT_COUNT compact snapshots"
    [[ "$SESSION_COUNT" -gt 0 ]] && echo "  • $SESSION_COUNT session logs"
    echo ""
    echo "💡 Use /load-session to restore context"
    echo ""
  fi

  echo "✅ Session ready"

} >&2
