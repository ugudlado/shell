#!/usr/bin/env bash
# Stop hook: Persist session snapshot to openspec/changes/$FEATURE_ID/state.yaml
# when a session ends mid-workflow. Injects phase-specific resume instructions via stopReason.
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

# Find matching state.yaml — check worktree first, then main repo
STATE_FILE=""
for search_dir in "$PWD" "$(git worktree list 2>/dev/null | head -1 | awk '{print $1}')"; do
  [[ -n "$search_dir" ]] || continue
  candidate="$search_dir/openspec/changes/$FEATURE_ID/state.yaml"
  if [[ -f "$candidate" ]]; then
    STATE_FILE="$candidate"
    break
  fi
  # Also scan all change dirs for matching feature_id field
  for f in "$search_dir"/openspec/changes/*/state.yaml; do
    [[ -f "$f" ]] || continue
    MATCH=$(python3 -c "
import yaml, sys
with open(sys.argv[1]) as fh:
    data = yaml.safe_load(fh) or {}
fid = data.get('feature_id', '')
if fid == sys.argv[2]:
    print('yes')
else:
    print('no')
" "$f" "$FEATURE_ID" 2>/dev/null || echo "no")
    if [[ "$MATCH" == "yes" ]]; then
      STATE_FILE="$f"
      break 2
    fi
  done
done

# No active workflow — nothing to persist
if [[ -z "$STATE_FILE" ]] || [[ ! -f "$STATE_FILE" ]]; then
  exit 0
fi

# Check if workflow is active
STATUS=$(python3 -c "
import yaml, sys
with open(sys.argv[1]) as f:
    print((yaml.safe_load(f) or {}).get('status', 'unknown'))
" "$STATE_FILE" 2>/dev/null || echo "unknown")

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

# Update state.yaml with session snapshot
python3 -c "
import yaml, datetime, sys

state_file = sys.argv[1]
last_commit = sys.argv[2]
has_uncommitted = sys.argv[3] == 'true'
working_dir = sys.argv[4]
git_branch = sys.argv[5]

with open(state_file) as f:
    state = yaml.safe_load(f) or {}

state['last_session'] = {
    'ended_at': datetime.datetime.now().isoformat(),
    'git_branch': git_branch,
    'last_commit': last_commit,
    'uncommitted_changes': has_uncommitted,
    'working_directory': working_dir,
}
state['updated_at'] = datetime.datetime.now().isoformat()

with open(state_file, 'w') as f:
    yaml.dump(state, f, default_flow_style=False, sort_keys=False)
" "$STATE_FILE" "$LAST_COMMIT" "$HAS_UNCOMMITTED" "$PWD" "$GIT_BRANCH" 2>/dev/null || true

# Read next_step for resume instructions
RESUME_MSG=$(python3 -c "
import yaml, sys

with open(sys.argv[1]) as f:
    state = yaml.safe_load(f) or {}

fid = state.get('feature_id') or 'unknown'
phase = state.get('phase', 'unknown')
ns = state.get('next_step', {})
cmd = ns.get('command', 'develop')
instruction = ns.get('instruction', f'Resume {phase} phase')

print(f'WORKFLOW PAUSED: Feature {fid} in {phase} phase. Next: /{cmd} — {instruction}')
" "$STATE_FILE" 2>/dev/null || echo "WORKFLOW PAUSED: Run /develop to resume.")

python3 -c "
import json, sys
print(json.dumps({
  'stopReason': sys.argv[1]
}))
" "$RESUME_MSG" || true
