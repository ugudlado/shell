#!/usr/bin/env bash
# SessionStart hook: Detect active autonomous workflows and inject resume context
# via additionalContext JSON so Claude properly receives it in its next response.
set -euo pipefail

# Consume stdin
cat > /dev/null

STATE_DIR="$HOME/.claude/workflows"

# Exit early if no workflow state directory exists
if [[ ! -d "$STATE_DIR" ]]; then
  exit 0
fi

# Find active workflows
ACTIVE_INFO=""
ACTIVE_COUNT=0
for f in "$STATE_DIR"/*.json; do
  [[ -f "$f" ]] || continue

  INFO=$(python3 -c "
import json, sys

with open('$f') as fh:
    data = json.load(fh)

if data.get('status') != 'active':
    sys.exit(1)

fid = data.get('feature_id', 'unknown')
phase = data.get('phase', 'unknown')
schema = data.get('schema', 'unknown')
desc = data.get('description', '')
iteration = data.get('iteration_count', 0)
scores = data.get('quality_scores', [])
last = data.get('last_session', {})
uncommitted = last.get('uncommitted_changes', False)
wdir = last.get('working_directory', '')

parts = []
parts.append(f'Feature: {fid} | Phase: {phase} | Schema: {schema}')
if desc:
    parts.append(f'Description: {desc}')
if iteration > 0:
    parts.append(f'Iterations: {iteration}')
if scores:
    parts.append(f'Last score: {scores[-1]}/10')
if uncommitted:
    parts.append('WARNING: Uncommitted changes from previous session')
if wdir:
    parts.append(f'Worktree: {wdir}')
parts.append(f'State: $f')
print(' | '.join(parts))
" 2>/dev/null) || continue

  ACTIVE_INFO="${ACTIVE_INFO}${INFO}\n"
  ACTIVE_COUNT=$((ACTIVE_COUNT + 1))
done

# No active workflows
if [[ $ACTIVE_COUNT -eq 0 ]]; then
  exit 0
fi

# Build context message
CONTEXT="ACTIVE AUTONOMOUS WORKFLOW(S) DETECTED ($ACTIVE_COUNT):\n${ACTIVE_INFO}\nRun /develop to resume the workflow. The command will auto-detect the active workflow and skip to the current phase."

# Output via additionalContext JSON so Claude properly receives it
python3 -c "
import json
print(json.dumps({
  'hookSpecificOutput': {
    'hookEventName': 'SessionStart',
    'additionalContext': '''$(echo -e "$CONTEXT")'''
  }
}))
"
