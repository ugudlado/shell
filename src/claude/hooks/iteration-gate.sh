#!/usr/bin/env bash
# Stop hook: Enforce iteration termination criteria during iterate phase.
# Reads state.yaml from openspec/changes/ to check quality scores and iteration count.
# Injects stopReason guidance to continue or allow stop based on criteria:
#   - Score >= 9.0 → allow stop (quality threshold met)
#   - Score delta < 0.5 → allow stop (diminishing returns)
#   - Max iterations reached → allow stop (hard cap)
#   - Otherwise → inject "continue iterating" guidance
set -euo pipefail

# Consume stdin
cat > /dev/null

# Find active workflow in iterate phase — scan openspec/changes/*/state.yaml
ITERATE_STATE=""
for search_dir in "$PWD" "$(git worktree list 2>/dev/null | head -1 | awk '{print $1}' 2>/dev/null)"; do
  [[ -n "$search_dir" ]] || continue
  for f in "$search_dir"/openspec/changes/*/state.yaml; do
    [[ -f "$f" ]] || continue
    PHASE_STATUS=$(python3 -c "
import yaml, sys
with open(sys.argv[1]) as fh:
    data = yaml.safe_load(fh) or {}
status = data.get('status', '')
phase = data.get('phase', '')
if status == 'active' and phase == 'iterate':
    print('iterate')
else:
    print('other')
" "$f" 2>/dev/null || echo "other")

    if [[ "$PHASE_STATUS" == "iterate" ]]; then
      ITERATE_STATE="$f"
      break 2
    fi
  done
done

# Not in iterate phase — don't interfere
if [[ -z "$ITERATE_STATE" ]]; then
  exit 0
fi

# Read iteration metrics from state.yaml
METRICS=$(python3 -c "
import yaml, json, sys

with open(sys.argv[1]) as f:
    state = yaml.safe_load(f) or {}

scores = state.get('quality_scores', [])
# Filter to numeric scores only
scores = [s for s in scores if isinstance(s, (int, float))]
count = state.get('iteration_count', 0)
max_iter = state.get('flags', {}).get('max_iterations', 3)

# Latest score
latest = scores[-1] if scores else 0
# Previous score (for delta)
previous = scores[-2] if len(scores) >= 2 else 0
delta = latest - previous if len(scores) >= 2 else 999  # Large delta on first round

print(json.dumps({
    'latest_score': latest,
    'delta': round(delta, 2),
    'count': count,
    'max': max_iter,
    'should_stop': (
        latest >= 9.0 or          # Quality threshold
        (delta < 0.5 and count > 0) or  # Diminishing returns (not first round)
        count >= max_iter          # Hard cap
    ),
    'reason': (
        'quality threshold met (>= 9.0)' if latest >= 9.0
        else 'diminishing returns (delta < 0.5)' if (delta < 0.5 and count > 0)
        else 'max iterations reached' if count >= max_iter
        else 'continue iterating'
    )
}))
" "$ITERATE_STATE" 2>/dev/null || echo '{"should_stop": true, "reason": "could not read state"}')

SHOULD_STOP=$(echo "$METRICS" | jq -r '.should_stop' 2>/dev/null || echo "true")
REASON=$(echo "$METRICS" | jq -r '.reason' 2>/dev/null || echo "unknown")
LATEST=$(echo "$METRICS" | jq -r '.latest_score' 2>/dev/null || echo "?")
DELTA=$(echo "$METRICS" | jq -r '.delta' 2>/dev/null || echo "?")
COUNT=$(echo "$METRICS" | jq -r '.count' 2>/dev/null || echo "?")
MAX=$(echo "$METRICS" | jq -r '.max' 2>/dev/null || echo "3")

if [[ "$SHOULD_STOP" == "false" ]]; then
  # Inject guidance to continue iterating
  STOP_MSG="ITERATION GATE: Score ${LATEST}/10 (delta ${DELTA}), round ${COUNT}/${MAX}. Reason: ${REASON}. Run another improvement round — evaluate, identify highest-impact improvements, execute, re-score."
  python3 -c "
import json, sys
print(json.dumps({
  'stopReason': sys.argv[1]
}))
" "$STOP_MSG" || true
fi

# If should_stop is true, exit 0 — allow the stop naturally
exit 0
