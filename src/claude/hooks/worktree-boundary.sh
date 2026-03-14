#!/bin/bash
# PreToolUse (Write|Edit): Block writes outside the active worktree
set -euo pipefail
INPUT=$(cat)

FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
CWD=$(echo "$INPUT" | jq -r '.cwd')

[[ -z "$FILE_PATH" ]] && exit 0

# Resolve relative paths
if [[ "$FILE_PATH" != /* ]]; then
  FILE_PATH="$CWD/$FILE_PATH"
fi

# Only enforce when working inside a feature worktree
if [[ "$CWD" == */code/feature_worktrees/* ]]; then
  WORKTREE_ROOT=$(echo "$CWD" | sed 's|\(.*code/feature_worktrees/[^/]*\).*|\1|')

  if [[ "$FILE_PATH" != "$WORKTREE_ROOT"/* ]]; then
    jq -n --arg path "$FILE_PATH" --arg wt "$WORKTREE_ROOT" '{
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: ("WORKTREE BOUNDARY: Cannot write to " + $path + " from worktree " + $wt + ". Files must stay within the active worktree.")
      }
    }'
    exit 0
  fi
fi

exit 0
