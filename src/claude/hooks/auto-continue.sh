#!/usr/bin/env bash
# Stop hook: Persist autonomous workflow state when a session ends mid-workflow.
# Saves current phase, OpenSpec progress, and git state to the workflow state file.
# Injects phase-specific resume instructions via stopReason.
set -euo pipefail

INPUT=$(cat)

# Only act when inside a feature worktree or on a feature branch
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

# Find matching workflow state file
STATE_DIR="$HOME/.claude/workflows"
STATE_FILE=""

if [[ -d "$STATE_DIR" ]]; then
  for f in "$STATE_DIR"/*.json; do
    [[ -f "$f" ]] || continue
    MATCH=$(python3 -c "
import json, sys
with open('$f') as fh:
    data = json.load(fh)
fid = data.get('feature_id', '')
if fid and '$FEATURE_ID'.endswith(fid.split('-', 2)[-1] if '-' in fid else fid):
    print('yes')
elif fid == '$FEATURE_ID':
    print('yes')
else:
    print('no')
" 2>/dev/null || echo "no")
    if [[ "$MATCH" == "yes" ]]; then
      STATE_FILE="$f"
      break
    fi
  done
fi

# No active workflow — nothing to persist
if [[ -z "$STATE_FILE" ]] || [[ ! -f "$STATE_FILE" ]]; then
  exit 0
fi

# Check if workflow is active
STATUS=$(python3 -c "
import json
with open('$STATE_FILE') as f:
    print(json.load(f).get('status', 'unknown'))
" 2>/dev/null || echo "unknown")

if [[ "$STATUS" != "active" ]]; then
  exit 0
fi

# Gather git state for resume context
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
LAST_COMMIT=$(git log --oneline -1 2>/dev/null || echo "unknown")
HAS_UNCOMMITTED="false"
if [[ -n "$(git status --porcelain 2>/dev/null | head -5)" ]]; then
  HAS_UNCOMMITTED="true"
fi

# Get OpenSpec status if available
OPENSPEC_STATUS=""
if command -v openspec &>/dev/null; then
  OPENSPEC_STATUS=$(openspec status --change "$FEATURE_ID" --json 2>/dev/null | head -c 500 || echo "")
fi

# Update workflow state with session snapshot
python3 -c "
import json, datetime

with open('$STATE_FILE') as f:
    state = json.load(f)

state['last_session'] = {
    'ended_at': datetime.datetime.now().isoformat(),
    'git_branch': '$GIT_BRANCH',
    'last_commit': '''$LAST_COMMIT''',
    'uncommitted_changes': $HAS_UNCOMMITTED,
    'working_directory': '$PWD',
    'openspec_status': '''$OPENSPEC_STATUS'''
}

with open('$STATE_FILE', 'w') as f:
    json.dump(state, f, indent=2)
" 2>/dev/null || true

# Read phase for resume instructions
PHASE=$(python3 -c "
import json
with open('$STATE_FILE') as f:
    print(json.load(f).get('phase', 'unknown'))
" 2>/dev/null || echo "unknown")

# Phase-specific resume instructions
case "$PHASE" in
  specify)
    RESUME_MSG="AUTONOMOUS WORKFLOW: Feature $FEATURE_ID is in SPECIFY phase. OpenSpec artifacts may be partially generated. Run /develop to resume — it will check openspec status and continue artifact generation or re-present for approval."
    ;;
  implement)
    RESUME_MSG="AUTONOMOUS WORKFLOW: Feature $FEATURE_ID is in IMPLEMENT phase. Check TaskList for in_progress tasks. Run /develop to resume — it will pick up from the last active task and continue the Implementer→Reviewer→Verifier loop."
    ;;
  iterate)
    RESUME_MSG="AUTONOMOUS WORKFLOW: Feature $FEATURE_ID is in ITERATE phase. Quality improvement in progress. Run /develop to resume — it will check iteration count and scores, then continue or terminate the improvement loop."
    ;;
  complete)
    RESUME_MSG="AUTONOMOUS WORKFLOW: Feature $FEATURE_ID is in COMPLETE phase. Merge/cleanup in progress. Run /develop to resume — it will check git status and continue the completion steps."
    ;;
  *)
    RESUME_MSG="AUTONOMOUS WORKFLOW: Feature $FEATURE_ID has an active workflow (phase: $PHASE). Run /develop to resume."
    ;;
esac

python3 -c "
import json
print(json.dumps({
  'stopReason': '''$RESUME_MSG'''
}))
"
