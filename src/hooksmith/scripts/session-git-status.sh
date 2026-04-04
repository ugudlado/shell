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

# Set CLAUDE_CODE_TASK_LIST_ID for feature worktrees (persistent task tracking)
FEATURE_ID=""
if [[ "$PWD" =~ feature_worktrees/([^/]+) ]]; then
  FEATURE_ID="${BASH_REMATCH[1]}"
elif [[ "$BRANCH" =~ ^feature/(.+)$ ]]; then
  FEATURE_ID="${BASH_REMATCH[1]}"
fi

REPO_NAME=$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || echo "")
SPEC_CHANGES_DIR="$HOME/.config/spec/changes/$REPO_NAME"

if [[ -n "$FEATURE_ID" && -n "${CLAUDE_ENV_FILE:-}" ]]; then
  echo "export CLAUDE_CODE_TASK_LIST_ID=$FEATURE_ID" >> "$CLAUDE_ENV_FILE"
  SUMMARY="$SUMMARY | tasks=$FEATURE_ID"

  # Check discovery state for feature worktrees
  DISCOVERY_FILE="$SPEC_CHANGES_DIR/$FEATURE_ID/discovery.md"
  SPEC_YAML="$SPEC_CHANGES_DIR/$FEATURE_ID/.spec.yaml"
  if [[ -f "$SPEC_YAML" ]]; then
    SCHEMA=$(grep '^schema:' "$SPEC_YAML" 2>/dev/null | awk '{print $2}' || echo "")
    if [[ "$SCHEMA" == "feature" || "$SCHEMA" == "feature" ]]; then
      if [[ -f "$DISCOVERY_FILE" ]]; then
        SUMMARY="$SUMMARY | discovery=done"
      else
        SUMMARY="$SUMMARY | discovery=missing"
      fi
    fi
  fi
fi

# Build additionalContext with git status + reminders
REMINDERS="REMINDER: Use AskUserQuestion tool for user input, confirmations, and decisions — not plain text questions."

# Output plain context string — hooksmith wraps the JSON
echo "$SUMMARY | $REMINDERS"
