#!/usr/bin/env bash
# UserPromptSubmit hook: remind Claude to have an active task before coding
# Outputs plain context string — hooksmith _emit_decision wraps the JSON.
set -euo pipefail

# Consume stdin (not needed for this hook)
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

[[ -z "$FEATURE_ID" ]] && exit 0

echo "TASK GATE: Before writing or editing code, run TaskList to verify you have an in_progress task. If not, use TaskUpdate to mark a pending task as in_progress first. Mark tasks completed when done. Trivial fixes and research are exempt."
