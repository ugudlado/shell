#!/bin/bash
# Stop: Force pause after excessive tool calls in a single burst
# Uses a marker file to avoid infinite loop - once triggered, stays silent until reset
set -euo pipefail
INPUT=$(cat)

# CRITICAL: Prevent infinite loop — if stop hook already active, let Claude stop
STOP_HOOK_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false' 2>/dev/null)
if [[ "$STOP_HOOK_ACTIVE" == "true" ]]; then
  exit 0
fi

TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // empty')

if [[ -z "$TRANSCRIPT_PATH" ]] || [[ ! -f "$TRANSCRIPT_PATH" ]]; then
  exit 0
fi

# Use a marker file based on transcript path to avoid re-triggering
MARKER_HASH=$(echo -n "$TRANSCRIPT_PATH" | md5 -q 2>/dev/null || echo "$TRANSCRIPT_PATH" | md5sum 2>/dev/null | cut -d' ' -f1 || echo "default")
MARKER_FILE="/tmp/claude-loop-detector-${MARKER_HASH}.triggered"

# If we already triggered for this session, stay silent
if [[ -f "$MARKER_FILE" ]]; then
  exit 0
fi

TOOL_CALLS=$(grep -c '"tool_use"' "$TRANSCRIPT_PATH" 2>/dev/null || echo "0")

if [[ "$TOOL_CALLS" -gt 200 ]]; then
  # Create marker so we don't trigger again
  touch "$MARKER_FILE"
  jq -n --argjson calls "$TOOL_CALLS" '{
    decision: "block",
    reason: ("Session has exceeded 200 tool calls (" + ($calls | tostring) + " total). Review progress before continuing.")
  }'
  exit 0
fi

exit 0
