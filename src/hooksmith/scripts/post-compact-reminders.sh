#!/bin/bash

# PostCompact Reminders Hook
# Re-injects session reminders after context compaction (/clear or auto-compact).
# These reminders would otherwise be lost when context is reset.

set -euo pipefail

# Consume stdin (hook protocol)
cat > /dev/null

REMINDERS="REMINDER: Use AskUserQuestion tool for user input, confirmations, and decisions — not plain text questions."

# Detect if inside a feature worktree and check discovery state
FEATURE_ID=""
if [[ "$PWD" =~ feature_worktrees/([^/]+) ]]; then
  FEATURE_ID="${BASH_REMATCH[1]}"
elif command -v git &>/dev/null; then
  BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
  if [[ "$BRANCH" =~ ^feature/(.+)$ ]]; then
    FEATURE_ID="${BASH_REMATCH[1]}"
  fi
fi

if [[ -n "$FEATURE_ID" ]]; then
  # Check if discovery.md exists for this feature
  DISCOVERY_FILE="$PWD/openspec/changes/$FEATURE_ID/discovery.md"
  OPENSPEC_YAML="$PWD/openspec/changes/$FEATURE_ID/.openspec.yaml"

  if [[ -f "$OPENSPEC_YAML" ]]; then
    SCHEMA=$(grep '^schema:' "$OPENSPEC_YAML" 2>/dev/null | awk '{print $2}' || echo "")

    # Only relevant for feature schemas (not bugfix)
    if [[ "$SCHEMA" == "feature-tdd" || "$SCHEMA" == "feature-rapid" ]]; then
      if [[ ! -f "$DISCOVERY_FILE" ]]; then
        REMINDERS="$REMINDERS | DISCOVERY GATE: discovery.md not found for $FEATURE_ID. The Discovery Brief must be written before spec/design artifacts. Check if Phase 0 Discovery was completed."
      fi
    fi
  fi
fi

echo "{\"hookSpecificOutput\":{\"additionalContext\":\"$REMINDERS\"}}"
