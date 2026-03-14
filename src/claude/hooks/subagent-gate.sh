#!/bin/bash
# SubagentStop: Basic quality gate — check subagent didn't error out
set -euo pipefail
INPUT=$(cat)

# Check if subagent ended with an error
STOP_REASON=$(echo "$INPUT" | jq -r '.stop_reason // "unknown"')
TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // empty')

# If subagent errored out, flag it
if [[ "$STOP_REASON" == "error" ]]; then
  echo "Subagent ended with an error. Review output before proceeding." >&2
  exit 2
fi

# Check if the subagent made zero tool calls (likely failed silently)
if [[ -n "$TRANSCRIPT_PATH" ]] && [[ -f "$TRANSCRIPT_PATH" ]]; then
  TOOL_CALLS=$(grep -c '"tool_use"' "$TRANSCRIPT_PATH" 2>/dev/null || echo "0")
  if [[ "$TOOL_CALLS" -eq 0 ]]; then
    echo "Subagent completed without making any tool calls. Output may be empty." >&2
  fi
fi

exit 0
