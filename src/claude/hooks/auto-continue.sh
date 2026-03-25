#!/usr/bin/env bash
# Stop hook: Persist autonomous workflow state when a session ends mid-workflow.
# Writes current phase, progress, and resume instructions to the workflow state file
# so the next session can pick up where this one left off.
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

# Find active workflow state
STATE_DIR="$HOME/.claude/workflows"
STATE_FILE=""
if [[ -d "$STATE_DIR" ]]; then
  # Match by feature_id in any workflow state file
  for f in "$STATE_DIR"/*.json; do
    [[ -f "$f" ]] || continue
    if python3 -c "
import json, sys
with open('$f') as fh:
    data = json.load(fh)
if data.get('feature_id', '') and '$FEATURE_ID'.startswith(data['feature_id'].split('-', 2)[-1] if '-' in data.get('feature_id','') else data.get('feature_id','')):
    sys.exit(0)
if data.get('feature_id') == '$FEATURE_ID':
    sys.exit(0)
sys.exit(1)
" 2>/dev/null; then
      STATE_FILE="$f"
      break
    fi
  done
fi

# If no workflow state exists, check if there's one matching the feature slug
if [[ -z "$STATE_FILE" ]]; then
  SLUG=$(echo "$FEATURE_ID" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g')
  if [[ -f "$STATE_DIR/$SLUG.json" ]]; then
    STATE_FILE="$STATE_DIR/$SLUG.json"
  fi
fi

# No active workflow — nothing to persist
if [[ -z "$STATE_FILE" ]]; then
  exit 0
fi

# Check if workflow is still active
STATUS=$(python3 -c "
import json
with open('$STATE_FILE') as f:
    print(json.load(f).get('status', 'unknown'))
" 2>/dev/null || echo "unknown")

if [[ "$STATUS" != "active" ]]; then
  exit 0
fi

# Get current git state for resume context
GIT_STATUS=$(git status --porcelain 2>/dev/null | head -20 || echo "")
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
LAST_COMMIT=$(git log --oneline -1 2>/dev/null || echo "unknown")

# Update workflow state with session snapshot
python3 -c "
import json, datetime

with open('$STATE_FILE') as f:
    state = json.load(f)

state['last_session'] = {
    'ended_at': datetime.datetime.now().isoformat(),
    'git_branch': '$CURRENT_BRANCH',
    'last_commit': '''$LAST_COMMIT''',
    'uncommitted_changes': $(if [[ -n "$GIT_STATUS" ]]; then echo "True"; else echo "False"; fi),
    'working_directory': '$PWD'
}

with open('$STATE_FILE', 'w') as f:
    json.dump(state, f, indent=2)
" 2>/dev/null || true

# Inject resume context into the stop reason
PHASE=$(python3 -c "
import json
with open('$STATE_FILE') as f:
    print(json.load(f).get('phase', 'unknown'))
" 2>/dev/null || echo "unknown")

python3 -c "
import json
print(json.dumps({
  'stopReason': 'AUTONOMOUS WORKFLOW ACTIVE: Feature $FEATURE_ID is in phase [$PHASE]. Session state saved to $STATE_FILE. Next session will auto-resume. Run /develop to continue.'
}))
"
