#!/bin/bash
# PreToolUse (Write|Edit): Require approval for protected files
# Outputs plain reason string — hooksmith _emit_decision wraps the JSON.
set -euo pipefail

source "$HOOKLIB"
read_input

FILE_PATH=$(get_field file_path)
[[ -z "$FILE_PATH" ]] && exit 0

BASENAME=$(basename "$FILE_PATH")

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
    echo "Protected file: $BASENAME. Manual approval required."
    exit 0
  fi
done
