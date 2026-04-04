#!/bin/bash
# Notification: Type-filtered macOS alerts — click activates iTerm2
set -euo pipefail
INPUT=$(cat)

NOTIFICATION_TYPE=$(echo "$INPUT" | jq -r '.notification_type // "unknown"')

PROJECT=$(basename "$PWD")

notify() {
  local title="$1" body="$2"
  osascript -e "display notification \"${body}\" with title \"${title}\" subtitle \"${PROJECT}\"" 2>/dev/null || true
}

case "$NOTIFICATION_TYPE" in
  permission_prompt)
    notify "Claude Code — Action Required" "Claude needs your permission to proceed"
    ;;
  idle_prompt)
    notify "Claude Code — Waiting" "Claude is waiting for your input"
    ;;
  *)
    # Skip other types to avoid alert fatigue
    ;;
esac

exit 0
