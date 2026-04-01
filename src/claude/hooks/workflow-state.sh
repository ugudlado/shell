#!/usr/bin/env bash
# SessionStart hook: Detect active workflows from $SPEC_HOME/changes/
# and inject resume context via additionalContext JSON.
set -euo pipefail

# Consume stdin
cat > /dev/null

# Determine repo name for per-repo spec directory
REPO_NAME=""
if command -v git &>/dev/null; then
  REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || true)
  if [[ -n "$REPO_ROOT" ]]; then
    REPO_NAME=$(basename "$REPO_ROOT")
  fi
fi

if [[ -z "$REPO_NAME" ]]; then
  exit 0
fi

# Scan for active state.yaml files in $SPEC_HOME/changes/$REPO_NAME/
SPEC_CHANGES_DIR="$HOME/.config/spec/changes/$REPO_NAME"

ACTIVE_INFO=""
ACTIVE_COUNT=0

for f in "$SPEC_CHANGES_DIR"/*/state.yaml; do
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
