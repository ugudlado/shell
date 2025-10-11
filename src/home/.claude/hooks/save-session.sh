#!/bin/bash

# Save Session Hook
# Saves session context when Claude Code stops

set -euo pipefail

# Session logs directory
SESSION_DIR="$HOME/.claude/sessions"
mkdir -p "$SESSION_DIR"

# Generate session ID based on timestamp and working directory
SESSION_ID="$(date +%Y%m%d_%H%M%S)_$(basename "$(pwd)" | tr ' ' '_')"
SESSION_FILE="$SESSION_DIR/$SESSION_ID.log"

{
  echo "=== Claude Code Session Ended ==="
  echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"
  echo "Working Directory: $(pwd)"
  echo ""

  # Git context at session end
  if git rev-parse --git-dir > /dev/null 2>&1; then
    echo "=== Final Git Status ==="
    echo "Branch: $(git branch --show-current)"
    echo ""

    git status --short 2>/dev/null || echo "Clean working tree"
    echo ""

    # Check if any commits were made during session
    echo "=== Recent Activity ==="
    git log --oneline -3 2>/dev/null || echo "No recent commits"
    echo ""
  fi

  # Save any temporary context
  if [[ -f "/tmp/claude-session-context-$$.txt" ]]; then
    echo "=== Session Context ==="
    cat "/tmp/claude-session-context-$$.txt" 2>/dev/null || true
    rm -f "/tmp/claude-session-context-$$.txt" 2>/dev/null || true
  fi

  echo "=== Session Saved ==="
  echo "Session log: $SESSION_FILE"

} > "$SESSION_FILE" 2>&1

# Clean up old session logs (keep last 50)
find "$SESSION_DIR" -name "*.log" -type f | sort -r | tail -n +51 | xargs rm -f 2>/dev/null || true

echo "Session saved to: $SESSION_FILE" >&2
