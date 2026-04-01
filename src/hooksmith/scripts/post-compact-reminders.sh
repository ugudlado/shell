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
  REPO_NAME=$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || echo "")
  SPEC_CHANGES_DIR="$HOME/.config/spec/changes/$REPO_NAME"

  # Check if discovery.md exists for this feature
  DISCOVERY_FILE="$SPEC_CHANGES_DIR/$FEATURE_ID/discovery.md"
  SPEC_YAML="$SPEC_CHANGES_DIR/$FEATURE_ID/.spec.yaml"

  if [[ -f "$SPEC_YAML" ]]; then
    SCHEMA=$(grep '^schema:' "$SPEC_YAML" 2>/dev/null | awk '{print $2}' || echo "")

    # Only relevant for feature schemas (not bugfix)
    if [[ "$SCHEMA" == "feature" || "$SCHEMA" == "feature" ]]; then
      if [[ ! -f "$DISCOVERY_FILE" ]]; then
        REMINDERS="$REMINDERS | DISCOVERY GATE: discovery.md not found for $FEATURE_ID. The Discovery Brief must be written before spec/design artifacts. Check if Phase 0 Discovery was completed."
      fi
    fi
  fi
fi

echo "{\"hookSpecificOutput\":{\"additionalContext\":\"$REMINDERS\"}}"
