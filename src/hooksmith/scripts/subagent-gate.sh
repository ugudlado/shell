#!/bin/bash
# SubagentStop: Quality gate — detect agent failures and emit structured context.
# Outputs structured [AGENT_ERROR] lines for orchestrator parsing, plus human-readable text.
# Hook does NOT write to state.yaml (race condition risk — orchestrator owns disk writes).
set -euo pipefail

source "$HOOKLIB"
read_input

STOP_REASON=$(get_field stop_reason)
TRANSCRIPT_PATH=$(get_field transcript_path)

# Detect feature context from working directory or git branch
FEATURE_ID=""
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
if [[ "$BRANCH" == feature/* ]]; then
  FEATURE_ID="${BRANCH#feature/}"
fi

if [[ "$STOP_REASON" == "error" ]]; then
  echo "[AGENT_ERROR] stop_reason=error feature_id=$FEATURE_ID tool_calls=unknown"
  echo "Subagent ended with an error. Review output before proceeding."
  exit 0
fi

if [[ -n "$TRANSCRIPT_PATH" && -f "$TRANSCRIPT_PATH" ]]; then
  TOOL_CALLS=$(grep -c '"tool_use"' "$TRANSCRIPT_PATH" 2>/dev/null || echo "0")
  if [[ "$TOOL_CALLS" -eq 0 ]]; then
    echo "[AGENT_ERROR] stop_reason=empty_output feature_id=$FEATURE_ID tool_calls=0"
    echo "Subagent completed without making any tool calls. Output may be empty — verify results."
  fi
fi
