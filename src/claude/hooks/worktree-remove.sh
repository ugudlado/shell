#!/bin/bash
# WorktreeRemove: Clean up a feature worktree following our conventions
#
# Cleanup:
#   1. git worktree remove
#   2. git branch -d (only the feature branch)
#
# Input:  { "worktree_path": "/Users/.../feature_worktrees/HL-80-add-auth", ... }
# Output: none required

set -euo pipefail

INPUT=$(cat)
WORKTREE_PATH=$(echo "$INPUT" | jq -r '.worktree_path // empty')

if [[ -z "$WORKTREE_PATH" ]]; then
  echo "ERROR: No worktree_path provided" >&2
  exit 1
fi

# Only handle our feature worktrees
if [[ "$WORKTREE_PATH" != */code/feature_worktrees/* ]]; then
  echo "Not a feature worktree, skipping: $WORKTREE_PATH" >&2
  exit 0
fi

# Extract feature ID from the path
FEATURE_ID=$(basename "$WORKTREE_PATH")
BRANCH_NAME="feature/$FEATURE_ID"

# Find main repo
MAIN_REPO=$(git worktree list 2>/dev/null | head -1 | awk '{print $1}')
if [[ -z "$MAIN_REPO" ]]; then
  echo "ERROR: Cannot find main repo" >&2
  exit 1
fi

cd "$MAIN_REPO"

# Remove the worktree
if [[ -d "$WORKTREE_PATH" ]]; then
  git worktree remove "$WORKTREE_PATH" --force 2>&1 || true
  echo "Removed worktree: $WORKTREE_PATH" >&2
fi

# Prune stale worktree references
git worktree prune 2>/dev/null || true

# Delete the feature branch (only if merged or user explicitly removing)
if git branch --list "$BRANCH_NAME" | grep -q "$BRANCH_NAME"; then
  git branch -d "$BRANCH_NAME" 2>&1 || {
    echo "Branch $BRANCH_NAME not fully merged — use 'git branch -D $BRANCH_NAME' to force delete" >&2
  }
fi

exit 0
