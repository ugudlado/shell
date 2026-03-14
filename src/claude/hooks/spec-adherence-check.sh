#!/bin/bash
# PreToolUse[Bash] (command): Verify staged changes align with active task
# Only fires on git commit commands — checks if changes match expected files
set -euo pipefail

INPUT=$(cat)

COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Only check git commit commands
if ! echo "$COMMAND" | grep -qE '^git commit'; then
  exit 0
fi

CWD=$(echo "$INPUT" | jq -r '.cwd // empty')
if [[ -z "$CWD" ]]; then
  exit 0
fi

# Detect feature ID
FEATURE_ID=""
if [[ "$CWD" =~ feature_worktrees/([^/]+) ]]; then
  FEATURE_ID="${BASH_REMATCH[1]}"
elif command -v git &>/dev/null; then
  BRANCH=$(cd "$CWD" && git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
  if [[ "$BRANCH" =~ ^feature/(.+)$ ]]; then
    FEATURE_ID="${BASH_REMATCH[1]}"
  fi
fi

if [[ -z "$FEATURE_ID" ]]; then
  exit 0  # Not on a feature branch — skip check
fi

# Find tasks file
TASKS_FILE=""
for path in \
  "$CWD/openspec/changes/$FEATURE_ID/tasks.md" \
  "$CWD/specs/active/$FEATURE_ID/tasks.md"; do
  if [[ -f "$path" ]]; then
    TASKS_FILE="$path"
    break
  fi
done

if [[ -z "$TASKS_FILE" ]]; then
  exit 0  # No tasks file — skip
fi

# Get current in-progress task
CURRENT_TASK=$(grep -A 5 '\[→\]' "$TASKS_FILE" 2>/dev/null | head -6 || echo "")
if [[ -z "$CURRENT_TASK" ]]; then
  exit 0  # No task in progress — skip
fi

# Get staged files
STAGED=$(cd "$CWD" && git diff --cached --name-only 2>/dev/null || echo "")
if [[ -z "$STAGED" ]]; then
  exit 0
fi

# Extract file hints from the current task (backtick-wrapped paths)
EXPECTED_FILES=$(echo "$CURRENT_TASK" | grep -oE '`[^`]+\.(ts|tsx|js|json|css|md)`' | tr -d '`' || echo "")

# If the task mentions specific files and none of the staged files match, warn
if [[ -n "$EXPECTED_FILES" ]]; then
  MATCH_FOUND=false
  while IFS= read -r expected; do
    if echo "$STAGED" | grep -q "$expected"; then
      MATCH_FOUND=true
      break
    fi
  done <<< "$EXPECTED_FILES"

  if [[ "$MATCH_FOUND" == "false" ]]; then
    echo "Spec adherence warning: Current task mentions files ($(echo "$EXPECTED_FILES" | tr '\n' ', ')) but none are staged. Staged: $(echo "$STAGED" | tr '\n' ', '). Verify this commit matches the active task." >&2
    # Don't block — just warn (exit 0 with stderr)
    exit 0
  fi
fi

exit 0
