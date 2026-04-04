#!/bin/bash
# Stop: Force pause after excessive tool calls in a single burst
# Outputs plain reason string — hooksmith _emit_decision wraps the JSON.
set -euo pipefail

source "$HOOKLIB"
read_input

# CRITICAL: Prevent infinite loop — if stop hook already active, let Claude stop
[[ "$(get_field stop_hook_active)" == "true" ]] && exit 0

TRANSCRIPT_PATH=$(get_field transcript_path)
[[ -z "$TRANSCRIPT_PATH" || ! -f "$TRANSCRIPT_PATH" ]] && exit 0

# Marker file prevents re-triggering within the same session
MARKER_HASH=$(echo -n "$TRANSCRIPT_PATH" | md5 -q 2>/dev/null || echo "$TRANSCRIPT_PATH" | md5sum 2>/dev/null | cut -d' ' -f1 || echo "default")
MARKER_FILE="/tmp/claude-loop-detector-${MARKER_HASH}.triggered"
[[ -f "$MARKER_FILE" ]] && exit 0

TOOL_CALLS=$(grep -c '"tool_use"' "$TRANSCRIPT_PATH" 2>/dev/null || echo "0")

if [[ "$TOOL_CALLS" -gt 200 ]]; then
  touch "$MARKER_FILE"
  echo "Session has exceeded 200 tool calls (${TOOL_CALLS} total). Review progress before continuing."
fi
