#!/bin/bash
# PreToolUse (Write|Edit): Block writes outside the active worktree
# Outputs plain reason string — hooksmith _emit_decision wraps the JSON.
set -euo pipefail

source "$HOOKLIB"
read_input

FILE_PATH=$(get_field file_path)
CWD=$(echo "$INPUT" | jq -r '.cwd')

[[ -z "$FILE_PATH" ]] && exit 0

# Resolve relative paths
[[ "$FILE_PATH" != /* ]] && FILE_PATH="$CWD/$FILE_PATH"

# Only enforce when working inside a feature worktree
if [[ "$CWD" == */code/feature_worktrees/* ]]; then
  WORKTREE_ROOT=$(echo "$CWD" | sed 's|\(.*code/feature_worktrees/[^/]*\).*|\1|')

  if [[ "$FILE_PATH" != "$WORKTREE_ROOT"/* ]]; then
    echo "WORKTREE BOUNDARY: Cannot write to $FILE_PATH from worktree $WORKTREE_ROOT. Files must stay within the active worktree."
  fi
fi
