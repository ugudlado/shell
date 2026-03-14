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

# Extract corrections: look for patterns where the user corrected Claude
# Patterns: "no,", "wrong", "that's not", "actually", "instead", "don't", "stop"
CORRECTIONS=$(grep -c '"user"' "$TRANSCRIPT_PATH" 2>/dev/null || echo "0")

# Count errors: type errors, lint failures, test failures from tool output
ERRORS=$(grep -cE '(error TS|ESLint|FAIL|TypeError|SyntaxError|Cannot find|not assignable)' "$TRANSCRIPT_PATH" 2>/dev/null || echo "0")

# Only log if there were corrections or errors
if [[ "$ERRORS" -gt 3 || "$CORRECTIONS" -gt 10 ]]; then
  mkdir -p "$(dirname "$LESSONS_FILE")"

  # Append session summary marker
  {
    echo ""
    echo "## Session $TIMESTAMP (${TOOL_CALLS} tool calls, ${ERRORS} errors)"
    echo "- Transcript: $TRANSCRIPT_PATH"
    echo "- Status: needs-review (run /reflect to extract learnings)"
  } >> "$LESSONS_FILE"
fi

exit 0
