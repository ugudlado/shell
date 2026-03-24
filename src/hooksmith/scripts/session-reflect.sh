#!/bin/bash
# SessionEnd (command): Reflect on session and persist learnings
# Runs as a side-effect — no decision control needed
set -euo pipefail

INPUT=$(cat)

SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')
TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // empty')

if [[ -z "$TRANSCRIPT_PATH" ]] || [[ ! -f "$TRANSCRIPT_PATH" ]]; then
  exit 0
fi

# Only reflect on substantial sessions (>20 tool calls = real work happened)
TOOL_CALLS=$(grep -c '"tool_use"' "$TRANSCRIPT_PATH" 2>/dev/null || echo "0")
if [[ "$TOOL_CALLS" -lt 20 ]]; then
  exit 0
fi

# Detect project memory directory from CWD
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')
if [[ -z "$CWD" ]]; then
  exit 0
fi

# Find the project memory dir (claude uses slugified path)
SLUG=$(echo "$CWD" | sed 's|/|-|g')
MEMORY_DIR="$HOME/.claude/projects/$SLUG/memory"

if [[ ! -d "$MEMORY_DIR" ]]; then
  exit 0
fi

LESSONS_FILE="$MEMORY_DIR/auto-lessons.md"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M")

# Count errors: type errors, lint failures, test failures from tool output
ERRORS=$(grep -cE '(error TS|ESLint|FAIL|TypeError|SyntaxError|Cannot find|not assignable)' "$TRANSCRIPT_PATH" 2>/dev/null || echo "0")

# Count user corrections: look for actual correction patterns, not all user messages
CORRECTIONS=$(grep -cE '"(no,|wrong|that'\''s not|actually,|instead|don'\''t|stop |not that)"' "$TRANSCRIPT_PATH" 2>/dev/null || echo "0")

# Only log if there were meaningful corrections or many errors
if [[ "$ERRORS" -gt 3 || "$CORRECTIONS" -gt 3 ]]; then
  mkdir -p "$(dirname "$LESSONS_FILE")"

  # Append session summary marker
  {
    echo ""
    echo "## Session $TIMESTAMP (${TOOL_CALLS} tool calls, ${ERRORS} errors, ${CORRECTIONS} corrections)"
    echo "- Transcript: $TRANSCRIPT_PATH"
    echo "- Status: needs-review (run /reflect to extract learnings)"
  } >> "$LESSONS_FILE"
fi

# Always write structured error data for /diagnose (even if below the lesson threshold)
if [[ "$ERRORS" -gt 0 ]]; then
  ERRORS_FILE="$HOME/.claude/logs/error-patterns.jsonl"
  mkdir -p "$HOME/.claude/logs"

  # Extract error types from transcript
  TS_ERRORS=$(grep -c 'error TS' "$TRANSCRIPT_PATH" 2>/dev/null || echo "0")
  LINT_ERRORS=$(grep -c 'ESLint' "$TRANSCRIPT_PATH" 2>/dev/null || echo "0")
  TEST_FAILURES=$(grep -c 'FAIL' "$TRANSCRIPT_PATH" 2>/dev/null || echo "0")
  TYPE_ERRORS=$(grep -c 'TypeError\|not assignable\|Cannot find' "$TRANSCRIPT_PATH" 2>/dev/null || echo "0")

  # Extract most-edited files (files appearing in Edit/Write tool calls)
  HOTSPOT_FILES=$(grep -oE '"file_path":\s*"[^"]+"' "$TRANSCRIPT_PATH" 2>/dev/null | sort | uniq -c | sort -rn | head -5 | awk '{print $NF}' | tr '\n' ',' | sed 's/,$//')

  # Detect feature ID from CWD
  FEATURE_ID=""
  if [[ "$CWD" =~ feature_worktrees/([^/]+) ]]; then
    FEATURE_ID="${BASH_REMATCH[1]}"
  fi

  # Sanitize numeric values for --argjson (grep -c can produce empty/whitespace)
  TOOL_CALLS=$(( ${TOOL_CALLS:-0} + 0 ))
  ERRORS=$(( ${ERRORS:-0} + 0 ))
  TS_ERRORS=$(( ${TS_ERRORS:-0} + 0 ))
  LINT_ERRORS=$(( ${LINT_ERRORS:-0} + 0 ))
  TEST_FAILURES=$(( ${TEST_FAILURES:-0} + 0 ))
  TYPE_ERRORS=$(( ${TYPE_ERRORS:-0} + 0 ))

  # Append structured entry
  jq -n -c \
    --arg timestamp "$TIMESTAMP" \
    --arg sessionId "${SESSION_ID:-unknown}" \
    --arg featureId "${FEATURE_ID:-none}" \
    --argjson toolCalls "$TOOL_CALLS" \
    --argjson errTotal "$ERRORS" \
    --argjson errTs "$TS_ERRORS" \
    --argjson errLint "$LINT_ERRORS" \
    --argjson errTest "$TEST_FAILURES" \
    --argjson errType "$TYPE_ERRORS" \
    --arg hotspots "${HOTSPOT_FILES}" \
    --arg transcript "$TRANSCRIPT_PATH" \
    '{
      timestamp: $timestamp,
      sessionId: $sessionId,
      featureId: $featureId,
      toolCalls: $toolCalls,
      errors: { total: $errTotal, typescript: $errTs, lint: $errLint, test: $errTest, type: $errType },
      hotspotFiles: (if $hotspots == "" then [] else ($hotspots | split(",")) end),
      transcript: $transcript
    }' >> "$ERRORS_FILE"
fi

exit 0
