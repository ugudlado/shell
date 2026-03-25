#!/usr/bin/env bash
# SessionStart hook: Detect active autonomous workflows and inject resume context.
# If the user starts a session in a feature worktree with an active workflow,
# this hook provides the context needed to resume automatically.
set -euo pipefail

# Consume stdin
cat > /dev/null

STATE_DIR="$HOME/.claude/workflows"

# Exit early if no workflow state directory exists
if [[ ! -d "$STATE_DIR" ]]; then
  exit 0
fi

# Detect feature context from working directory or git branch
FEATURE_ID=""
if [[ "$PWD" =~ feature_worktrees/([^/]+) ]]; then
  FEATURE_ID="${BASH_REMATCH[1]}"
elif command -v git &>/dev/null; then
  BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
  if [[ "$BRANCH" =~ ^feature/(.+)$ ]]; then
    FEATURE_ID="${BASH_REMATCH[1]}"
  fi
fi

# Also check for any active workflows regardless of directory
ACTIVE_WORKFLOWS=()
for f in "$STATE_DIR"/*.json; do
  [[ -f "$f" ]] || continue
  STATUS=$(python3 -c "
import json
with open('$f') as fh:
    data = json.load(fh)
print(data.get('status', 'unknown'))
" 2>/dev/null || echo "unknown")

  if [[ "$STATUS" == "active" ]]; then
    ACTIVE_WORKFLOWS+=("$f")
  fi
done

# No active workflows
if [[ ${#ACTIVE_WORKFLOWS[@]} -eq 0 ]]; then
  exit 0
fi

# Build resume context
RESUME_INFO=""
for wf in "${ACTIVE_WORKFLOWS[@]}"; do
  INFO=$(python3 -c "
import json
with open('$wf') as f:
    data = json.load(f)
fid = data.get('feature_id', 'unknown')
phase = data.get('phase', 'unknown')
schema = data.get('schema', 'unknown')
iteration = data.get('iteration_count', 0)
last = data.get('last_session', {})
ended = last.get('ended_at', 'unknown')
uncommitted = last.get('uncommitted_changes', False)
wdir = last.get('working_directory', 'unknown')

parts = [f'Feature: {fid} | Phase: {phase} | Schema: {schema}']
if iteration > 0:
    parts.append(f'Iterations: {iteration}')
if uncommitted:
    parts.append('WARNING: Uncommitted changes from previous session')
parts.append(f'Worktree: {wdir}')
parts.append(f'State file: $wf')
print(' | '.join(parts))
" 2>/dev/null || echo "Active workflow in $wf")

  RESUME_INFO="${RESUME_INFO}${INFO}\n"
done

# If we're in a feature worktree, highlight that workflow
if [[ -n "$FEATURE_ID" ]]; then
  echo "AUTONOMOUS WORKFLOW DETECTED: Active workflow for feature context '$FEATURE_ID'."
  echo "Run /develop to resume the workflow, or /iterate to run improvement cycles."
  echo ""
  echo "Active workflows:"
  echo -e "$RESUME_INFO"
else
  echo "ACTIVE AUTONOMOUS WORKFLOWS FOUND:"
  echo -e "$RESUME_INFO"
  echo "Navigate to a feature worktree and run /develop to resume."
fi
