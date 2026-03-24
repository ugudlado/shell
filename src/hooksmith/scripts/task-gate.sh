#!/usr/bin/env bash
# UserPromptSubmit hook: remind Claude to have an active task before coding
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
    'hookEventName': 'UserPromptSubmit',
    'additionalContext': 'TASK GATE: Before writing or editing code, run TaskList to verify you have an in_progress task. If not, use TaskUpdate to mark a pending task as in_progress first. Mark tasks completed when done. Trivial fixes and research are exempt.'
  }
}))
"
