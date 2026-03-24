#!/bin/bash
# PostToolUse (Write|Edit): Run Prettier on changed files
# TypeScript type-checking is handled by the typescript-lsp plugin
set -euo pipefail
INPUT=$(cat)

FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
[[ -z "$FILE_PATH" ]] && exit 0

case "$FILE_PATH" in
  *.ts|*.tsx|*.js|*.jsx|*.json|*.css|*.md)
    DIR=$(dirname "$FILE_PATH")
    PROJECT_ROOT=""
    while [[ "$DIR" != "/" ]]; do
      if [[ -f "$DIR/.prettierrc" ]] || [[ -f "$DIR/prettier.config.js" ]] || [[ -f "$DIR/.prettierrc.json" ]]; then
        PROJECT_ROOT="$DIR"
        break
      fi
      DIR=$(dirname "$DIR")
    done
    if [[ -n "$PROJECT_ROOT" ]]; then
      cd "$PROJECT_ROOT"
      npx prettier --write "$FILE_PATH" 2>/dev/null || true
    fi
    ;;
esac

exit 0
