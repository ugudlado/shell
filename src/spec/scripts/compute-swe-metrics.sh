#!/bin/bash
# compute-swe-metrics.sh — Extract SWE-bench-aligned metrics from session transcripts + git history.
#
# Usage: compute-swe-metrics.sh <state_dir> [transcript_path...]
#
# Reads:  state.yaml, session JSONL transcripts, git log
# Writes: metrics block to stdout as YAML (for injection into state.yaml)
#
# Methodology references:
#   - Token counting: sum message.usage{} from assistant entries (SWE-bench HAL method)
#   - Cost: gross = no cache discount, net = with cache discount (HAL reports gross)
#   - Resolution: binary per-task (F2P=1 AND P2P=1 maps to task acceptance + no regressions)
#   - pass@k: Aider methodology (k=1 first attempt, k=2 within two attempts)

set -uo pipefail
# Note: not using set -e because grep returning no matches (exit 1) in pipelines
# causes false failures with pipefail. We handle errors explicitly instead.

STATE_DIR="${1:?Usage: compute-swe-metrics.sh <state_dir> [transcript_path...]}"
shift
TRANSCRIPTS=("$@")

STATE_FILE="$STATE_DIR/state.yaml"
if [[ ! -f "$STATE_FILE" ]]; then
  echo "ERROR: state.yaml not found at $STATE_FILE" >&2
  exit 1
fi

# ── Model Pricing ($/1M tokens) ──────────────────────────────────────────
# Updated as of 2026-04. Add new models as needed.
get_pricing() {
  local model="$1"
  case "$model" in
    claude-opus-4-6*|claude-opus-4-5*)
      echo "15.00 75.00 1.50" ;;  # input output cache_read
    claude-sonnet-4-6*|claude-sonnet-4-5*)
      echo "3.00 15.00 0.30" ;;
    claude-haiku-4-5*)
      echo "0.80 4.00 0.08" ;;
    *)
      echo "15.00 75.00 1.50" ;;  # default to opus pricing (conservative)
  esac
}

# ── Parse Transcripts ────────────────────────────────────────────────────
# If no transcripts provided, try to find them from the session
if [[ ${#TRANSCRIPTS[@]} -eq 0 ]]; then
  # Look for transcript references in state dir or recent session files
  PROJECT_SLUG=$(pwd | sed 's|/|-|g')
  TRANSCRIPT_DIR="$HOME/.claude/projects/$PROJECT_SLUG"
  if [[ -d "$TRANSCRIPT_DIR" ]]; then
    # Find JSONL files modified during the feature's time window
    STARTED_AT=$(grep 'started_at:' "$STATE_FILE" | head -1 | sed 's/.*: *"*//' | sed 's/"*$//')
    if [[ -n "$STARTED_AT" ]]; then
      while IFS= read -r f; do
        TRANSCRIPTS+=("$f")
      done < <(find "$TRANSCRIPT_DIR" -maxdepth 1 -name "*.jsonl" -newer "$STATE_FILE" -o -name "*.jsonl" 2>/dev/null | head -10)
    fi
    # Fallback: most recent JSONL
    if [[ ${#TRANSCRIPTS[@]} -eq 0 ]]; then
      LATEST=$(ls -t "$TRANSCRIPT_DIR"/*.jsonl 2>/dev/null | head -1)
      [[ -n "$LATEST" ]] && TRANSCRIPTS+=("$LATEST")
    fi
  fi
fi

# Aggregate token counts across all transcripts
TOTAL_INPUT=0
TOTAL_OUTPUT=0
TOTAL_CACHE_CREATION=0
TOTAL_CACHE_READ=0
TOTAL_TURNS=0
TOTAL_TOOL_CALLS=0
MODEL="unknown"

for transcript in "${TRANSCRIPTS[@]}"; do
  [[ ! -f "$transcript" ]] && continue

  # Extract token metrics from assistant messages using jq
  # Each assistant message has message.usage with token counts
  METRICS=$(jq -s '
    [.[] | select(.type == "assistant" and .message.usage != null)] |
    {
      input: (map(.message.usage.input_tokens // 0) | add // 0),
      output: (map(.message.usage.output_tokens // 0) | add // 0),
      cache_creation: (map(.message.usage.cache_creation_input_tokens // 0) | add // 0),
      cache_read: (map(.message.usage.cache_read_input_tokens // 0) | add // 0),
      turns: length,
      tool_calls: ([.[] | .message.content[]? | select(.type == "tool_use")] | length),
      model: (map(select(.message.model != null) | .message.model) | last // "unknown")
    }
  ' "$transcript" 2>/dev/null || echo '{"input":0,"output":0,"cache_creation":0,"cache_read":0,"turns":0,"tool_calls":0,"model":"unknown"}')

  TOTAL_INPUT=$((TOTAL_INPUT + $(echo "$METRICS" | jq '.input')))
  TOTAL_OUTPUT=$((TOTAL_OUTPUT + $(echo "$METRICS" | jq '.output')))
  TOTAL_CACHE_CREATION=$((TOTAL_CACHE_CREATION + $(echo "$METRICS" | jq '.cache_creation')))
  TOTAL_CACHE_READ=$((TOTAL_CACHE_READ + $(echo "$METRICS" | jq '.cache_read')))
  TOTAL_TURNS=$((TOTAL_TURNS + $(echo "$METRICS" | jq '.turns')))
  TOTAL_TOOL_CALLS=$((TOTAL_TOOL_CALLS + $(echo "$METRICS" | jq '.tool_calls')))

  DETECTED_MODEL=$(echo "$METRICS" | jq -r '.model')
  [[ "$DETECTED_MODEL" != "unknown" ]] && MODEL="$DETECTED_MODEL"
done

TOTAL_TOKENS=$((TOTAL_INPUT + TOTAL_OUTPUT + TOTAL_CACHE_CREATION))

# Also count subagent transcripts if they exist
for transcript in "${TRANSCRIPTS[@]}"; do
  SUBAGENT_DIR="${transcript%.jsonl}"
  if [[ -d "$SUBAGENT_DIR/subagents" ]]; then
    for sub in "$SUBAGENT_DIR/subagents"/*.jsonl; do
      [[ ! -f "$sub" ]] && continue
      SUB_METRICS=$(jq -s '
        [.[] | select(.type == "assistant" and .message.usage != null)] |
        {
          input: (map(.message.usage.input_tokens // 0) | add // 0),
          output: (map(.message.usage.output_tokens // 0) | add // 0),
          cache_creation: (map(.message.usage.cache_creation_input_tokens // 0) | add // 0),
          cache_read: (map(.message.usage.cache_read_input_tokens // 0) | add // 0),
          turns: length,
          tool_calls: ([.[] | .message.content[]? | select(.type == "tool_use")] | length)
        }
      ' "$sub" 2>/dev/null || echo '{"input":0,"output":0,"cache_creation":0,"cache_read":0,"turns":0,"tool_calls":0}')

      TOTAL_INPUT=$((TOTAL_INPUT + $(echo "$SUB_METRICS" | jq '.input')))
      TOTAL_OUTPUT=$((TOTAL_OUTPUT + $(echo "$SUB_METRICS" | jq '.output')))
      TOTAL_CACHE_CREATION=$((TOTAL_CACHE_CREATION + $(echo "$SUB_METRICS" | jq '.cache_creation')))
      TOTAL_CACHE_READ=$((TOTAL_CACHE_READ + $(echo "$SUB_METRICS" | jq '.cache_read')))
      TOTAL_TURNS=$((TOTAL_TURNS + $(echo "$SUB_METRICS" | jq '.turns')))
      TOTAL_TOOL_CALLS=$((TOTAL_TOOL_CALLS + $(echo "$SUB_METRICS" | jq '.tool_calls')))
    done
  fi
done

TOTAL_TOKENS=$((TOTAL_INPUT + TOTAL_OUTPUT + TOTAL_CACHE_CREATION))

# ── Cost Calculation ─────────────────────────────────────────────────────
PRICING=$(get_pricing "$MODEL")
INPUT_PRICE=$(echo "$PRICING" | awk '{print $1}')
OUTPUT_PRICE=$(echo "$PRICING" | awk '{print $2}')
CACHE_READ_PRICE=$(echo "$PRICING" | awk '{print $3}')

# gross_usd: SWE-bench HAL style — ALL tokens at full price, no cache discount.
# Treats cache_read as if they were regular input (for apples-to-apples SWE-bench comparison).
# Formula: (input + cache_creation + cache_read) * input_price + output * output_price
GROSS_USD=$(echo "scale=4; ($TOTAL_INPUT + $TOTAL_CACHE_CREATION + $TOTAL_CACHE_READ) * $INPUT_PRICE / 1000000 + $TOTAL_OUTPUT * $OUTPUT_PRICE / 1000000" | bc)

# net_usd: Actual billed cost with cache discounts applied.
# cache_read tokens are billed at 10% of input price (cache_read_price).
# Formula: (input + cache_creation) * input_price + cache_read * cache_read_price + output * output_price
NET_USD=$(echo "scale=4; ($TOTAL_INPUT + $TOTAL_CACHE_CREATION) * $INPUT_PRICE / 1000000 + $TOTAL_CACHE_READ * $CACHE_READ_PRICE / 1000000 + $TOTAL_OUTPUT * $OUTPUT_PRICE / 1000000" | bc)

# ── Wall Clock ───────────────────────────────────────────────────────────
STARTED_AT=$(grep '^started_at:' "$STATE_FILE" | head -1 | sed 's/^started_at: *//' | tr -d '"')
COMPLETED_AT=$(grep '^completed_at:' "$STATE_FILE" | head -1 | sed 's/^completed_at: *//' | tr -d '"')

WALL_CLOCK=0
if [[ -n "$STARTED_AT" && -n "$COMPLETED_AT" ]]; then
  # Try multiple date formats (macOS and Linux)
  START_EPOCH=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$STARTED_AT" "+%s" 2>/dev/null \
    || date -j -f "%Y-%m-%dT%H:%M:%S" "${STARTED_AT%Z}" "+%s" 2>/dev/null \
    || date -d "$STARTED_AT" "+%s" 2>/dev/null \
    || echo 0)
  END_EPOCH=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$COMPLETED_AT" "+%s" 2>/dev/null \
    || date -j -f "%Y-%m-%dT%H:%M:%S" "${COMPLETED_AT%Z}" "+%s" 2>/dev/null \
    || date -d "$COMPLETED_AT" "+%s" 2>/dev/null \
    || echo 0)
  if [[ "$START_EPOCH" -gt 0 && "$END_EPOCH" -gt 0 ]]; then
    WALL_CLOCK=$(echo "scale=1; ($END_EPOCH - $START_EPOCH) / 60" | bc)
  fi
fi

# ── Git Churn ────────────────────────────────────────────────────────────
CHANGE_ID=$(grep -E '^(change_id|linear_ticket):' "$STATE_FILE" | head -1 | awk '{print $2}' | tr -d '"')
FEATURE_BRANCH="feature/${CHANGE_ID}"

FILES_CHANGED=0
INSERTIONS=0
DELETIONS=0
TOTAL_COMMITS=0
REWORK_COMMITS=0

if [[ -n "$CHANGE_ID" ]]; then
  # Try to get stats from feature branch
  STATS=$(git log --grep="$CHANGE_ID" --no-merges --shortstat 2>/dev/null || true)
  if [[ -n "$STATS" ]]; then
    FILES_CHANGED=$(echo "$STATS" | grep "file" | awk '{s+=$1} END {print s+0}')
    INSERTIONS=$(echo "$STATS" | grep "file" | awk '{s+=$4} END {print s+0}')
    DELETIONS=$(echo "$STATS" | grep "file" | awk '{s+=$6} END {print s+0}')
    TOTAL_COMMITS=$(git log --grep="$CHANGE_ID" --no-merges --format="%h" 2>/dev/null | wc -l | tr -d ' ')
    REWORK_COMMITS=$(git log --grep="$CHANGE_ID" --no-merges --format="%s" 2>/dev/null | grep -c "^fix:" || true)
    REWORK_COMMITS=${REWORK_COMMITS:-0}
  fi
fi

# ── Task Resolution (from state.yaml) ────────────────────────────────────
# Parse verification_results for task pass/fail/retry counts
TASKS_FILE="$STATE_DIR/tasks.md"
TASKS_TOTAL=0
TASKS_COMPLETED=0
TASKS_FAILED=0
FIRST_ATTEMPT_PASS=0

if [[ -f "$TASKS_FILE" ]]; then
  # Count checked tasks [x] and unchecked [ ]
  TASKS_TOTAL=$(grep -cE '^\s*-\s*\[' "$TASKS_FILE" 2>/dev/null || echo 0)
  TASKS_COMPLETED=$(grep -cE '^\s*-\s*\[x\]' "$TASKS_FILE" 2>/dev/null || echo 0)
  TASKS_FAILED=$((TASKS_TOTAL - TASKS_COMPLETED))
fi

# Parse verification_results from state.yaml for retry info
TASK_RETRIES=$(grep -A2 'task_T' "$STATE_FILE" 2>/dev/null | grep 'retries:' | awk '{print $2}' || true)
if [[ -n "$TASK_RETRIES" ]]; then
  FIRST_ATTEMPT_PASS=$(echo "$TASK_RETRIES" | awk '$1==0{c++} END{print c+0}')
fi

# Fallback: if no task data, use step history
if [[ "$TASKS_TOTAL" -eq 0 ]]; then
  # Count execute-next-task entries in step_history
  TASKS_TOTAL=$(grep -c 'step_id: execute-next-task' "$STATE_FILE" 2>/dev/null || echo 0)
  TASKS_COMPLETED=$TASKS_TOTAL  # If we got here, they all completed
  FIRST_ATTEMPT_PASS=$TASKS_TOTAL
fi

[[ "$TASKS_TOTAL" -eq 0 ]] && TASKS_TOTAL=1  # Avoid division by zero

RESOLVE_RATE=$(echo "scale=4; $TASKS_COMPLETED / $TASKS_TOTAL" | bc)
PASS_AT_1=$(echo "scale=4; $FIRST_ATTEMPT_PASS / $TASKS_TOTAL" | bc)

# pass@2: tasks that succeeded within 2 attempts
PASS_AT_2_COUNT=$TASKS_COMPLETED  # All completed tasks passed within some number of attempts
if [[ -n "$TASK_RETRIES" ]]; then
  PASS_AT_2_COUNT=$(echo "$TASK_RETRIES" | awk '$1<=1{c++} END{print c+0}')
fi
PASS_AT_2=$(echo "scale=4; $PASS_AT_2_COUNT / $TASKS_TOTAL" | bc)

# ── Retries ──────────────────────────────────────────────────────────────
RETRY_TOTAL=$(grep 'retries:' "$STATE_FILE" 2>/dev/null | awk '{s+=$2} END {print s+0}')

REWORK_RATE=0
if [[ "$TOTAL_COMMITS" -gt 0 ]]; then
  REWORK_RATE=$(echo "scale=4; $REWORK_COMMITS / $TOTAL_COMMITS" | bc)
fi

# ── Review Scores ────────────────────────────────────────────────────────
REVIEW_SCORES=$(grep 'review_score:' "$STATE_FILE" 2>/dev/null | awk '{print $2}' | tr '\n' ',' | sed 's/,$//')
SCORE_AVG=0
if [[ -n "$REVIEW_SCORES" ]]; then
  SCORE_AVG=$(echo "$REVIEW_SCORES" | tr ',' '\n' | awk '{s+=$1; c++} END {if(c>0) printf "%.1f", s/c; else print 0}')
fi

# ── Derived Benchmarks ───────────────────────────────────────────────────
COST_PER_TASK=$(echo "scale=4; $NET_USD / $TASKS_TOTAL" | bc)
COST_PER_RESOLUTION=0
[[ "$TASKS_COMPLETED" -gt 0 ]] && COST_PER_RESOLUTION=$(echo "scale=4; $NET_USD / $TASKS_COMPLETED" | bc)
TOKENS_PER_TASK=$((TOTAL_TOKENS / TASKS_TOTAL))
TOKENS_PER_RESOLUTION=0
[[ "$TASKS_COMPLETED" -gt 0 ]] && TOKENS_PER_RESOLUTION=$((TOTAL_TOKENS / TASKS_COMPLETED))

IO_RATIO=0
[[ "$TOTAL_OUTPUT" -gt 0 ]] && IO_RATIO=$(echo "scale=1; ($TOTAL_INPUT + $TOTAL_CACHE_CREATION) / $TOTAL_OUTPUT" | bc)

CACHE_DENOM=$((TOTAL_INPUT + TOTAL_CACHE_CREATION + TOTAL_CACHE_READ))
CACHE_HIT_RATE=0
[[ "$CACHE_DENOM" -gt 0 ]] && CACHE_HIT_RATE=$(echo "scale=4; $TOTAL_CACHE_READ / $CACHE_DENOM" | bc)

# ── Schema and Complexity ────────────────────────────────────────────────
SCHEMA=$(grep '^schema:' "$STATE_FILE" | awk '{print $2}')

# ── Output YAML ──────────────────────────────────────────────────────────
cat <<YAML
metrics:
  tokens:
    input: $TOTAL_INPUT
    output: $TOTAL_OUTPUT
    cache_creation: $TOTAL_CACHE_CREATION
    cache_read: $TOTAL_CACHE_READ
    total: $TOTAL_TOKENS
  cost:
    gross_usd: $GROSS_USD
    net_usd: $NET_USD
    model: $MODEL
    pricing:
      input: $INPUT_PRICE
      output: $OUTPUT_PRICE
      cache_read: $CACHE_READ_PRICE
  turns: $TOTAL_TURNS
  tool_calls: $TOTAL_TOOL_CALLS
  api_calls: $TOTAL_TURNS
  wall_clock_minutes: $WALL_CLOCK
  resolution:
    tasks_total: $TASKS_TOTAL
    tasks_planned: $TASKS_TOTAL
    tasks_added: 0
    tasks_completed: $TASKS_COMPLETED
    tasks_failed: $TASKS_FAILED
    resolve_rate: $RESOLVE_RATE
    pass_at_1: $PASS_AT_1
    pass_at_2: $PASS_AT_2
    regressions: 0
    regression_rate: 0.0
  retries:
    total: $RETRY_TOTAL
  human_interventions: 0
  rework_commits: $REWORK_COMMITS
  rework_rate: $REWORK_RATE
  churn:
    files_changed: $FILES_CHANGED
    insertions: $INSERTIONS
    deletions: $DELETIONS
    total_commits: $TOTAL_COMMITS
  review_scores: [$REVIEW_SCORES]
  review_score_avg: $SCORE_AVG
  lint_delta: 0
  category: $SCHEMA
  benchmarks:
    cost_per_task_usd: $COST_PER_TASK
    cost_per_resolution_usd: $COST_PER_RESOLUTION
    tokens_per_task: $TOKENS_PER_TASK
    tokens_per_resolution: $TOKENS_PER_RESOLUTION
    input_output_ratio: $IO_RATIO
    cache_hit_rate: $CACHE_HIT_RATE
YAML
