#!/usr/bin/env bash
# SubagentStart hook: inject task awareness into subagents
# Prompt-based — tells subagents to use TaskList/TaskGet, no file reads needed
set -euo pipefail

# Consume stdin
cat > /dev/null

# Only inject when inside a feature worktree or on a feature branch
FEATURE_ID=""
if [[ "$PWD" =~ feature_worktrees/([^/]+) ]]; then
  FEATURE_ID="${BASH_REMATCH[1]}"
elif command -v git &>/dev/null; then
  BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
  if [[ "$BRANCH" =~ ^feature/(.+)$ ]]; then
    FEATURE_ID="${BASH_REMATCH[1]}"
  fi
fi

if [[ -z "$FEATURE_ID" ]]; then
  exit 0
fi

python3 -c "
import json, sys
feature = sys.argv[1]
print(json.dumps({
  'hookSpecificOutput': {
    'hookEventName': 'SubagentStart',
    'additionalContext': f'Feature: {feature}. Run TaskList to see your assigned tasks. Work only on tasks assigned to you or marked in_progress. Use TaskUpdate to mark tasks completed when done.'
  }
}))
" "$FEATURE_ID"
