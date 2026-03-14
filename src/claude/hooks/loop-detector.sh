#!/bin/bash
# Stop: Force pause after excessive tool calls in a single burst
# Uses a marker file to avoid infinite loop - once triggered, stays silent until reset
set -euo pipefail
INPUT=$(cat)

TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // empty')

if [[ -z "$TRANSCRIPT_PATH" ]] || [[ ! -f "$TRANSCRIPT_PATH" ]]; then
  exit 0
fi

# Use a marker file based on transcript path to avoid re-triggering
MARKER_FILE="/tmp/claude-loop-detector-$(echo "$TRANSCRIPT_PATH" | md5sum | cut -d' ' -f1 2>/dev/null || md5 -q -s "$TRANSCRIPT_PATH" 2>/dev/null || echo "default").triggered"

# If we already triggered for this session, stay silent
if [[ -f "$MARKER_FILE" ]]; then
  exit 0
fi

TOOL_CALLS=$(grep -c '"tool_use"' "$TRANSCRIPT_PATH" 2>/dev/null || echo "0")

if [[ "$TOOL_CALLS" -gt 200 ]]; then
  # Create marker so we don't trigger again
  touch "$MARKER_FILE"
  echo "Session has exceeded 200 tool calls ($TOOL_CALLS total). Review progress before continuing." >&2
  exit 2
fi

exit 0
