#!/bin/bash
# SubagentStop: Basic quality gate — check subagent didn't error out
# Outputs plain reason string — hooksmith _emit_decision wraps the JSON.
set -euo pipefail

source "$HOOKLIB"
read_input

STOP_REASON=$(get_field stop_reason)
TRANSCRIPT_PATH=$(get_field transcript_path)

if [[ "$STOP_REASON" == "error" ]]; then
  echo "Subagent ended with an error. Review output before proceeding."
  exit 0
fi

if [[ -n "$TRANSCRIPT_PATH" && -f "$TRANSCRIPT_PATH" ]]; then
  TOOL_CALLS=$(grep -c '"tool_use"' "$TRANSCRIPT_PATH" 2>/dev/null || echo "0")
  if [[ "$TOOL_CALLS" -eq 0 ]]; then
    echo "Subagent completed without making any tool calls. Output may be empty — verify results."
  fi
fi
