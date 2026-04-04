#!/usr/bin/env bash
# SubagentStart hook: inject task + discovery awareness into subagents
# Outputs plain context string — hooksmith _emit_decision wraps the JSON.
set -euo pipefail

# Consume stdin (not needed for this hook)
cat > /dev/null

# Only inject when inside a feature worktree or on a feature branch
FEATURE_ID=""
if [[ "$PWD" =~ feature_worktrees/([^/]+) ]]; then
  FEATURE_ID="${BASH_REMATCH[1]}"
elif command -v git &>/dev/null; then
  BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
  if [[ "$BRANCH" =~ ^feature/(.+)$ ]]; then
    FEATURE_ID="${BASH_REMATCH[1]}"
  fi
fi

[[ -z "$FEATURE_ID" ]] && exit 0

REPO_NAME=$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || echo "")
SPEC_CHANGES_DIR="$HOME/.config/spec/changes/$REPO_NAME"

CONTEXT="Feature: $FEATURE_ID. Run TaskList to see your assigned tasks. Work only on tasks assigned to you or marked in_progress. Use TaskUpdate to mark tasks completed when done."

DISCOVERY_FILE="$SPEC_CHANGES_DIR/$FEATURE_ID/discovery.md"
if [[ -f "$DISCOVERY_FILE" ]]; then
  CONTEXT="$CONTEXT | DISCOVERY BRIEF exists at $SPEC_CHANGES_DIR/$FEATURE_ID/discovery.md — read it for use cases and scope. Acceptance criteria in spec.md must trace to discovery use cases via [traces: UC-N]."
fi

echo "$CONTEXT"
