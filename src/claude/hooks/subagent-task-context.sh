#!/usr/bin/env bash
# SubagentStart hook: inject task gate and feature context into subagents
# Uses additionalContext to give subagents awareness of active tasks
set -euo pipefail

# Consume stdin (all command hooks receive JSON input)
cat > /dev/null

FEATURE_ID=""
TASKS_FILE=""

# Detect from worktree path first, then git branch
if [[ "$PWD" =~ feature_worktrees/([^/]+) ]]; then
  FEATURE_ID="${BASH_REMATCH[1]}"
elif command -v git &>/dev/null; then
  BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
  if [[ "$BRANCH" =~ ^feature/(.+)$ ]]; then
    FEATURE_ID="${BASH_REMATCH[1]}"
  fi
fi

if [[ -n "$FEATURE_ID" ]]; then
  for path in \
    "openspec/changes/$FEATURE_ID/tasks.md" \
    "../openspec/changes/$FEATURE_ID/tasks.md" \
    "specs/active/$FEATURE_ID/tasks.md" \
    "../specs/active/$FEATURE_ID/tasks.md"; do
    if [[ -f "$path" ]]; then
      TASKS_FILE="$path"
      break
    fi
  done
fi

if [[ -z "$FEATURE_ID" || -z "$TASKS_FILE" || ! -f "$TASKS_FILE" ]]; then
  exit 0
fi

# Find current in-progress tasks
IN_PROGRESS=$(grep '\[→\]' "$TASKS_FILE" 2>/dev/null || echo "")

CONTEXT="Feature: $FEATURE_ID"$'\n'
CONTEXT+="Tasks file: $TASKS_FILE"$'\n'
if [[ -n "$IN_PROGRESS" ]]; then
  CONTEXT+="Active tasks:"$'\n'"$IN_PROGRESS"$'\n'
fi
CONTEXT+="Mark tasks [x] when complete. If you start new work, mark the task [→] first."

python3 -c "
import json, sys
print(json.dumps({
  'hookSpecificOutput': {
    'hookEventName': 'SubagentStart',
    'additionalContext': sys.argv[1]
  }
}))
" "$CONTEXT"
