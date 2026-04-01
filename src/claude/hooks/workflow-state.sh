#!/usr/bin/env bash
# SessionStart hook: Detect active workflows from openspec/changes/*/state.yaml
# and inject resume context via additionalContext JSON.
set -euo pipefail

# Consume stdin
cat > /dev/null

# Determine repo root — check worktree first, then main repo
REPO_ROOT=""
if command -v git &>/dev/null; then
  REPO_ROOT=$(git worktree list 2>/dev/null | head -1 | awk '{print $1}')
fi

if [[ -z "$REPO_ROOT" ]]; then
  exit 0
fi

# Scan for active state.yaml files in openspec/changes/
# Check both main repo and current worktree (if different)
SEARCH_DIRS=("$REPO_ROOT")
if [[ "$PWD" != "$REPO_ROOT" ]] && [[ -d "$PWD/openspec/changes" ]]; then
  SEARCH_DIRS+=("$PWD")
fi

ACTIVE_INFO=""
ACTIVE_COUNT=0

for search_dir in "${SEARCH_DIRS[@]}"; do
  for f in "$search_dir"/openspec/changes/*/state.yaml; do
    [[ -f "$f" ]] || continue

    INFO=$(python3 -c "
import yaml, sys, os

fname = sys.argv[1]
with open(fname) as fh:
    data = yaml.safe_load(fh) or {}

if data.get('status') != 'active':
    sys.exit(1)

fid = data.get('feature_id') or os.path.basename(os.path.dirname(fname))
phase = data.get('phase', 'unknown')
schema = data.get('schema', 'unknown')
desc = data.get('description', '')
ns = data.get('next_step', {})
next_cmd = ns.get('skill', ns.get('command', ''))
next_phase = ns.get('phase', '')
next_instruction = ns.get('instruction', '')
last = data.get('last_session', {})
uncommitted = last.get('uncommitted_changes', False)
wdir = last.get('working_directory', '')

parts = []
parts.append(f'Feature: {fid} | Phase: {phase} | Schema: {schema}')
if desc:
    parts.append(f'Description: {desc}')
if next_cmd and next_phase:
    parts.append(f'Next: /{next_cmd} → {next_phase}')
if next_instruction:
    parts.append(f'Resume: {next_instruction}')
if uncommitted:
    parts.append('WARNING: Uncommitted changes from previous session')
if wdir:
    parts.append(f'Worktree: {wdir}')
parts.append(f'State: {fname}')
print(' | '.join(parts))
" "$f" 2>/dev/null) || continue

    ACTIVE_INFO="${ACTIVE_INFO}${INFO}\n"
    ACTIVE_COUNT=$((ACTIVE_COUNT + 1))
  done
done

# No active workflows
if [[ $ACTIVE_COUNT -eq 0 ]]; then
  exit 0
fi

# Build context message
CONTEXT="ACTIVE WORKFLOW(S) DETECTED ($ACTIVE_COUNT):\n${ACTIVE_INFO}\nRun /develop to resume. The state.yaml next_step block tells exactly where to pick up."

# Output via additionalContext JSON so Claude properly receives it
printf '%b' "$CONTEXT" | python3 -c "
import json, sys
context = sys.stdin.read()
print(json.dumps({
  'hookSpecificOutput': {
    'hookEventName': 'SessionStart',
    'additionalContext': context
  }
}))
" || true
