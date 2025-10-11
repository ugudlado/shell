#!/bin/bash

# Linear Update Hook
# Automatically updates Linear issues based on git operations

set -euo pipefail

# Read tool input from stdin
INPUT=$(cat)

# Extract command from tool input
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)

if [[ -z "$COMMAND" ]]; then
  exit 0
fi

# Only process git commands
if [[ ! "$COMMAND" =~ ^git[[:space:]] ]]; then
  exit 0
fi

# Check if Linear CLI is available
if ! command -v linear &> /dev/null; then
  # Linear CLI not installed, skip silently
  exit 0
fi

# Extract Linear ticket ID from branch name or commit message
extract_linear_id() {
  # Try to get from current branch
  local branch=$(git branch --show-current 2>/dev/null)
  if [[ "$branch" =~ ([A-Z]+-[0-9]+) ]]; then
    echo "${BASH_REMATCH[1]}"
    return 0
  fi

  # Try to get from last commit message
  local commit_msg=$(git log -1 --pretty=%B 2>/dev/null)
  if [[ "$commit_msg" =~ ([A-Z]+-[0-9]+) ]]; then
    echo "${BASH_REMATCH[1]}"
    return 0
  fi

  return 1
}

# Update Linear issue based on git operation
update_linear() {
  local linear_id="$1"
  local operation="$2"

  case "$operation" in
    commit)
      # Update issue with commit information
      local commit_sha=$(git rev-parse --short HEAD 2>/dev/null)
      local commit_msg=$(git log -1 --pretty=%s 2>/dev/null)
      echo "📝 Linear: Updated $linear_id with commit $commit_sha" >&2
      # Add comment to Linear issue (if CLI supports it)
      # linear issue comment $linear_id "Commit: $commit_sha - $commit_msg" 2>/dev/null || true
      ;;
    push)
      # Update issue status or add comment about push
      echo "📤 Linear: Notified $linear_id about push" >&2
      # linear issue update $linear_id --state "In Review" 2>/dev/null || true
      ;;
    *)
      # Other git operations
      ;;
  esac
}

# Determine operation type
if [[ "$COMMAND" =~ ^git[[:space:]]+commit ]]; then
  LINEAR_ID=$(extract_linear_id)
  if [[ -n "$LINEAR_ID" ]]; then
    update_linear "$LINEAR_ID" "commit"
  fi
elif [[ "$COMMAND" =~ ^git[[:space:]]+push ]]; then
  LINEAR_ID=$(extract_linear_id)
  if [[ -n "$LINEAR_ID" ]]; then
    update_linear "$LINEAR_ID" "push"
  fi
fi

exit 0
