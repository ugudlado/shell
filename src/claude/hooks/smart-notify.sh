#!/bin/bash
# Notification: Type-filtered macOS alerts with distinct sounds
set -euo pipefail
INPUT=$(cat)

NOTIFICATION_TYPE=$(echo "$INPUT" | jq -r '.type // "unknown"')

case "$NOTIFICATION_TYPE" in
  permission_prompt)
    osascript -e 'display notification "Claude needs permission to proceed" with title "Claude Code" sound name "Submarine"' 2>/dev/null || true
    ;;
  idle_prompt)
    osascript -e 'display notification "Claude is waiting for your input" with title "Claude Code" sound name "Glass"' 2>/dev/null || true
    ;;
  *)
    # Skip other notification types to avoid alert fatigue
    ;;
esac

exit 0
