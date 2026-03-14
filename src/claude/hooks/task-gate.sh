#!/usr/bin/env bash
# UserPromptSubmit hook: remind Claude to check for active task before coding
# Uses additionalContext for discrete injection (not shown in transcript)
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

# Only enforce when inside a feature with tasks
if [[ -z "$FEATURE_ID" || -z "$TASKS_FILE" || ! -f "$TASKS_FILE" ]]; then
  exit 0
fi

python3 -c "
import json
print(json.dumps({
  'hookSpecificOutput': {
    'hookEventName': 'UserPromptSubmit',
    'additionalContext': 'TASK GATE: Before writing or editing any code, verify tasks.md has a task marked [→] (in-progress). If not, mark an existing task [→] or create one first. Mark tasks [x] when done. Trivial fixes and research are exempt.'
  }
}))
"
