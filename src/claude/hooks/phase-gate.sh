#!/usr/bin/env bash
# SubagentStop hook: Enforce phase review quality gate during /implement.
# Checks if a reviewer/verifier subagent completed with a phase review score.
# If score < 9/10, blocks the stop (exit 2) to force a fix cycle.
# This ensures the gate is enforced by the harness, not just by command instructions.
set -euo pipefail

INPUT=$(cat)

# Only enforce when inside a feature worktree
FEATURE_ID=""
if [[ "$PWD" =~ feature_worktrees/([^/]+) ]]; then
  FEATURE_ID="${BASH_REMATCH[1]}"
elif command -v git &>/dev/null; then
  BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
  if [[ "$BRANCH" =~ ^feature/(.+)$ ]]; then
    FEATURE_ID="${BASH_REMATCH[1]}"
  fi
fi

if [[ -z "$FEATURE_ID" ]]; then
  exit 0
fi

# Extract transcript path from input
TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // empty' 2>/dev/null || echo "")

if [[ -z "$TRANSCRIPT_PATH" ]] || [[ ! -f "$TRANSCRIPT_PATH" ]]; then
  exit 0
fi

# Look for phase review score patterns in the subagent transcript
# Common patterns: "Score: 8/10", "score: 7.5/10", "Review Score: 9/10", "Overall: 8.5/10"
SCORE=$(grep -oP '(?i)(?:score|overall|rating)[:\s]+(\d+\.?\d*)\s*/\s*10' "$TRANSCRIPT_PATH" 2>/dev/null | tail -1 | grep -oP '\d+\.?\d*(?=\s*/\s*10)' || echo "")

if [[ -z "$SCORE" ]]; then
  # No score found — this subagent isn't a reviewer, let it pass
  exit 0
fi

# Check if score meets the threshold (>= 9.0)
PASSES=$(python3 -c "print('yes' if float('$SCORE') >= 9.0 else 'no')" 2>/dev/null || echo "unknown")

if [[ "$PASSES" == "no" ]]; then
  echo "PHASE GATE: Review score $SCORE/10 is below the 9/10 threshold. Fix critical and important issues, then re-run phase review." >&2
  exit 2
fi

# Score >= 9/10 or couldn't parse — allow
exit 0
