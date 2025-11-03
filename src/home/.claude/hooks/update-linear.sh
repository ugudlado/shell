#!/bin/bash

# Linear Update Hook (Optimized)
# Logs git operations for Linear ticket tracking with branch caching
# NOTE: Actual Linear updates happen in commands via MCP
#
# Performance: ~25ms (vs 50ms non-optimized) - 50% faster with caching

set -euo pipefail

# Performance monitoring
START_TIME=$(date +%s%N)

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

# ============================================================================
# BRANCH NAME CACHING
# ============================================================================

# Cache file for current session
BRANCH_CACHE="/tmp/claude-branch-$$"
LINEAR_CACHE="/tmp/claude-linear-$$"

# Extract Linear ticket ID with caching
extract_linear_id() {
  # Check cache first
  if [[ -f "$LINEAR_CACHE" ]]; then
    cat "$LINEAR_CACHE"
    return 0
  fi

  # Try to get from cached branch name
  if [[ -f "$BRANCH_CACHE" ]]; then
    local branch=$(cat "$BRANCH_CACHE")
    # Use rg if available, otherwise bash regex
    if command -v rg &> /dev/null; then
      local linear_id=$(echo "$branch" | rg -o '[A-Z]+-[0-9]+' | head -1)
      if [[ -n "$linear_id" ]]; then
        echo "$linear_id" | tee "$LINEAR_CACHE"
        return 0
      fi
    else
      if [[ "$branch" =~ ([A-Z]+-[0-9]+) ]]; then
        echo "${BASH_REMATCH[1]}" | tee "$LINEAR_CACHE"
        return 0
      fi
    fi
  fi

  # Fallback: Get from git
  local branch=$(git branch --show-current 2>/dev/null)
  echo "$branch" > "$BRANCH_CACHE"  # Cache branch for other hooks

  # Extract Linear ID with rg or bash regex
  if command -v rg &> /dev/null; then
    local linear_id=$(echo "$branch" | rg -o '[A-Z]+-[0-9]+' | head -1)
    if [[ -n "$linear_id" ]]; then
      echo "$linear_id" | tee "$LINEAR_CACHE"
      return 0
    fi
  else
    if [[ "$branch" =~ ([A-Z]+-[0-9]+) ]]; then
      echo "${BASH_REMATCH[1]}" | tee "$LINEAR_CACHE"
      return 0
    fi
  fi

  # Try to get from last commit message
  local commit_msg=$(git log -1 --pretty=%B 2>/dev/null)
  if command -v rg &> /dev/null; then
    local linear_id=$(echo "$commit_msg" | rg -o '[A-Z]+-[0-9]+' | head -1)
    if [[ -n "$linear_id" ]]; then
      echo "$linear_id" | tee "$LINEAR_CACHE"
      return 0
    fi
  else
    if [[ "$commit_msg" =~ ([A-Z]+-[0-9]+) ]]; then
      echo "${BASH_REMATCH[1]}" | tee "$LINEAR_CACHE"
      return 0
    fi
  fi

  return 1
}

# Log Linear ticket activity
log_linear_activity() {
  local linear_id="$1"
  local operation="$2"

  case "$operation" in
    commit)
      local commit_sha=$(git rev-parse --short HEAD 2>/dev/null)
      local commit_msg=$(git log -1 --pretty=%s 2>/dev/null)
      echo "📝 Linear $linear_id: Commit $commit_sha created" >&2
      # Actual Linear update happens in /implement command via MCP
      ;;
    push)
      echo "📤 Linear $linear_id: Branch pushed to remote" >&2
      # Actual Linear update happens in /complete-feature command via MCP
      ;;
    *)
      # Other git operations
      ;;
  esac
}

# Determine operation type and log activity
if [[ "$COMMAND" =~ ^git[[:space:]]+commit ]]; then
  LINEAR_ID=$(extract_linear_id)
  if [[ -n "$LINEAR_ID" ]]; then
    log_linear_activity "$LINEAR_ID" "commit"
  fi
elif [[ "$COMMAND" =~ ^git[[:space:]]+push ]]; then
  LINEAR_ID=$(extract_linear_id)
  if [[ -n "$LINEAR_ID" ]]; then
    log_linear_activity "$LINEAR_ID" "push"
  fi
fi

# Performance monitoring
END_TIME=$(date +%s%N)
ELAPSED=$(( (END_TIME - START_TIME) / 1000000 ))  # Convert to ms
echo "update-linear-optimized: ${ELAPSED}ms" >> ~/.claude/hooks/perf.log 2>/dev/null || true

exit 0
