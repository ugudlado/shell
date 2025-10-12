#!/bin/bash

# Git Validation Hook for Bash Commands
# Prevents destructive git operations

set -euo pipefail

# Read tool input from stdin
INPUT=$(cat)

# Extract command from tool input
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)

if [[ -z "$COMMAND" ]]; then
  exit 0
fi

# Check if it's a git command
if [[ ! "$COMMAND" =~ ^git[[:space:]] ]]; then
  exit 0
fi

# Dangerous git operations that should be blocked
DANGEROUS_PATTERNS=(
  "push.*--force"
  "push.*-f[^a-z]"
  "reset.*--hard"
  "clean.*-fd"
  "branch.*-D"
  "rebase"
  "filter-branch"
  "reflog.*delete"
)

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if [[ "$COMMAND" =~ $pattern ]]; then
    echo "⚠️  APPROVAL REQUIRED: Potentially destructive git command detected: $COMMAND" >&2
    echo "This command may rewrite history or cause data loss." >&2
    echo "Do you want to proceed?" >&2
    exit 1  # Exit code 1 requests user approval
  fi
done

# Warn about potentially risky operations
WARNING_PATTERNS=(
  "commit.*--amend"
  "cherry-pick"
)

for pattern in "${WARNING_PATTERNS[@]}"; do
  if [[ "$COMMAND" =~ $pattern ]]; then
    echo "⚠️  Warning: This git operation may rewrite history: $COMMAND" >&2
    echo "Make sure you understand the implications." >&2
    # Don't block, just warn
    break
  fi
done

exit 0
