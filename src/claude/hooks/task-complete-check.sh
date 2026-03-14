#!/usr/bin/env bash
# Stop / SubagentStop hook: block stopping if tasks are still in-progress
# Uses decision: "block" with stop_hook_active guard to prevent infinite loops
set -euo pipefail

# Read input from stdin (all command hooks receive JSON on stdin)
INPUT=$(cat)

# Check stop_hook_active to prevent infinite loops
STOP_HOOK_ACTIVE=$(printf '%s' "$INPUT" | python3 -c "import json,sys; print(json.load(sys.stdin).get('stop_hook_active', False))" 2>/dev/null || echo "False")
if [[ "$STOP_HOOK_ACTIVE" == "True" ]]; then
  exit 0  # Already in forced continuation — let it stop
fi

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

# Count in-progress tasks
IN_PROGRESS=$(grep -c '\[→\]' "$TASKS_FILE" 2>/dev/null || echo "0")

if [[ "$IN_PROGRESS" -gt 0 ]]; then
  TASKS=$(grep '\[→\]' "$TASKS_FILE" 2>/dev/null || echo "")
  python3 -c "
import json, sys
n = sys.argv[1]
tasks = sys.argv[2]
print(json.dumps({
  'decision': 'block',
  'reason': f'{n} task(s) still marked [→] in tasks.md. Mark them [x] before finishing:\n{tasks}'
}))
" "$IN_PROGRESS" "$TASKS"
fi
