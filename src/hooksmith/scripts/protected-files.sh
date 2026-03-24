#!/bin/bash
# PreToolUse (Write|Edit): Require approval for protected files
set -euo pipefail
INPUT=$(cat)

FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
[[ -z "$FILE_PATH" ]] && exit 0

BASENAME=$(basename "$FILE_PATH")

# Protected file patterns — require manual approval
PROTECTED_PATTERNS=(
  "pnpm-lock.yaml"
  "package-lock.json"
  "yarn.lock"
  "plugin.json"
  "marketplace.json"
  ".husky/"
)

for pattern in "${PROTECTED_PATTERNS[@]}"; do
  if [[ "$FILE_PATH" == *"$pattern"* ]]; then
    jq -n --arg file "$BASENAME" '{
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "ask",
        permissionDecisionReason: ("Protected file: " + $file + ". Manual approval required.")
      }
    }'
    exit 0
  fi
done

exit 0
