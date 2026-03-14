#!/usr/bin/env bash
# Stop / SubagentStop hook: remind Claude to check for in-progress tasks before stopping
# Prompt-based — Claude calls TaskList itself, no file reads needed
set -euo pipefail

# Consume stdin
cat > /dev/null

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
  'hookSpecificOutput': {
    'additionalContext': 'TASK CHECK: Before stopping, run TaskList. If any task is in_progress, either mark it completed (TaskUpdate with status completed) or explain why it cannot be completed yet. Do not stop with in_progress tasks unless explicitly told to by the user.'
  }
}))
"
