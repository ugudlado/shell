#!/bin/bash

# SessionStart Git Status Hook
# Injects compact git status summary into Claude's context at session start.
# Output: additionalContext with branch, changes, ahead/behind info.

set -euo pipefail

# Consume stdin (hook protocol)
cat > /dev/null

# Exit silently if not in a git repo
if ! git rev-parse --is-inside-work-tree &>/dev/null; then
  exit 0
fi

# Gather git data
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

STAGED=$(git diff --cached --numstat 2>/dev/null | wc -l | tr -d ' ')
UNSTAGED=$(git diff --numstat 2>/dev/null | wc -l | tr -d ' ')
UNTRACKED=$(git ls-files --others --exclude-standard 2>/dev/null | wc -l | tr -d ' ')

# Ahead/behind upstream
AHEAD_BEHIND=$(git rev-list --left-right --count @{upstream}...HEAD 2>/dev/null || echo "")
if [[ -n "$AHEAD_BEHIND" ]]; then
  BEHIND=$(echo "$AHEAD_BEHIND" | awk '{print $1}')
  AHEAD=$(echo "$AHEAD_BEHIND" | awk '{print $2}')
  SYNC_STATUS="ahead=$AHEAD behind=$BEHIND"
else
  SYNC_STATUS="no-upstream"
fi

# Format summary
TOTAL_CHANGES=$((STAGED + UNSTAGED + UNTRACKED))
if [[ "$TOTAL_CHANGES" -eq 0 ]]; then
  CHANGES_STATUS="clean"
else
  CHANGES_STATUS="staged=$STAGED unstaged=$UNSTAGED untracked=$UNTRACKED"
fi

SUMMARY="GIT STATUS: branch=$BRANCH | $CHANGES_STATUS | $SYNC_STATUS"

# Output as additionalContext JSON
echo "{\"hookSpecificOutput\":{\"additionalContext\":\"$SUMMARY\"}}"
