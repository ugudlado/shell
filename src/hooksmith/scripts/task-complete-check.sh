#!/usr/bin/env bash
# Stop / SubagentStop hook: remind Claude to check for in-progress tasks before stopping
# Uses stopReason to inject context — Claude sees the message but is not blocked
set -euo pipefail

INPUT=$(cat)

# CRITICAL: Prevent infinite loop — if stop hook already active, let Claude stop
STOP_HOOK_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false' 2>/dev/null)
if [[ "$STOP_HOOK_ACTIVE" == "true" ]]; then
  exit 0
fi

# Only enforce when inside a feature worktree or on a feature branch
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
import json
print(json.dumps({
  'stopReason': 'TASK CHECK: Run TaskList before stopping. If any task is in_progress, mark it completed or explain why not.'
}))
"
