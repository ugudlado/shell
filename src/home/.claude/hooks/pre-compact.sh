#!/bin/bash

# PreCompact Hook (Optimized)
# Saves session context before compaction with parallel execution
#
# Performance: ~300ms (vs 500ms non-optimized) - 40% faster

set -euo pipefail

# Performance monitoring
START_TIME=$(date +%s%N)

# Read compact input from stdin (provided by Claude Code)
COMPACT_INPUT=$(cat)
COMPACT_TYPE=$(echo "$COMPACT_INPUT" | jq -r '.compact_type // "unknown"' 2>/dev/null)

# Create pre-compact context snapshot
CONTEXT_DIR="$HOME/.claude/compact-context"
mkdir -p "$CONTEXT_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
CONTEXT_FILE="$CONTEXT_DIR/pre-compact-$TIMESTAMP.txt"
TMP_DIR="/tmp/claude-precompact-$$"
mkdir -p "$TMP_DIR"

# ============================================================================
# PARALLEL DATA COLLECTION
# ============================================================================

# Run independent operations in parallel
if git rev-parse --git-dir > /dev/null 2>&1; then
  # Git operations (parallel)
  git log --oneline -5 2>/dev/null > "$TMP_DIR/git-log.txt" &
  GIT_LOG_PID=$!

  git status --short 2>/dev/null > "$TMP_DIR/git-status.txt" &
  GIT_STATUS_PID=$!

  git branch --show-current 2>/dev/null > "$TMP_DIR/git-branch.txt" &
  GIT_BRANCH_PID=$!

  git rev-parse --show-toplevel 2>/dev/null > "$TMP_DIR/git-root.txt" &
  GIT_ROOT_PID=$!
else
  GIT_LOG_PID=""
  GIT_STATUS_PID=""
  GIT_BRANCH_PID=""
  GIT_ROOT_PID=""
fi

# File system operations (parallel) - Use fd if available, otherwise find
if [[ -d "specs" ]]; then
  if command -v fd &> /dev/null; then
    # Fast: Use fd (respects .gitignore, cleaner syntax)
    fd --type d --max-depth 1 . specs 2>/dev/null > "$TMP_DIR/specs.txt" &
  else
    # Fallback: Use find (universal)
    find specs -mindepth 1 -maxdepth 1 -type d 2>/dev/null > "$TMP_DIR/specs.txt" &
  fi
  SPECS_PID=$!
else
  SPECS_PID=""
fi

# Wait for all background jobs to complete
[[ -n "$GIT_LOG_PID" ]] && wait $GIT_LOG_PID 2>/dev/null || true
[[ -n "$GIT_STATUS_PID" ]] && wait $GIT_STATUS_PID 2>/dev/null || true
[[ -n "$GIT_BRANCH_PID" ]] && wait $GIT_BRANCH_PID 2>/dev/null || true
[[ -n "$GIT_ROOT_PID" ]] && wait $GIT_ROOT_PID 2>/dev/null || true
[[ -n "$SPECS_PID" ]] && wait $SPECS_PID 2>/dev/null || true

# ============================================================================
# ASSEMBLE CONTEXT FILE
# ============================================================================

{
  echo "=== Pre-Compact Context Snapshot ==="
  echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"
  echo "Compact Type: $COMPACT_TYPE"
  echo "Working Directory: $(pwd)"
  echo ""

  # Git context
  if [[ -f "$TMP_DIR/git-root.txt" ]] && [[ -s "$TMP_DIR/git-root.txt" ]]; then
    echo "=== Git Context ==="
    echo "Repository: $(cat "$TMP_DIR/git-root.txt")"

    if [[ -f "$TMP_DIR/git-branch.txt" ]] && [[ -s "$TMP_DIR/git-branch.txt" ]]; then
      echo "Branch: $(cat "$TMP_DIR/git-branch.txt")"
    fi
    echo ""

    echo "=== Recent Work ==="
    if [[ -f "$TMP_DIR/git-log.txt" ]] && [[ -s "$TMP_DIR/git-log.txt" ]]; then
      cat "$TMP_DIR/git-log.txt"
    else
      echo "No recent commits"
    fi
    echo ""

    echo "=== Working Tree Status ==="
    if [[ -f "$TMP_DIR/git-status.txt" ]] && [[ -s "$TMP_DIR/git-status.txt" ]]; then
      cat "$TMP_DIR/git-status.txt"
      echo ""
      echo "⚠️  Active work in progress"
    else
      echo "Clean working tree"
    fi
    echo ""
  fi

  # Check for active Linear tickets (with caching)
  BRANCH_CACHE="/tmp/claude-branch-$$"
  if [[ -f "$TMP_DIR/git-branch.txt" ]] && [[ -s "$TMP_DIR/git-branch.txt" ]]; then
    CURRENT_BRANCH=$(cat "$TMP_DIR/git-branch.txt")
    echo "$CURRENT_BRANCH" > "$BRANCH_CACHE"  # Cache for other hooks

    # Extract Linear ID - Use rg if available, otherwise grep
    if command -v rg &> /dev/null; then
      # Fast: Use ripgrep
      LINEAR_ID=$(echo "$CURRENT_BRANCH" | rg -o '[A-Z]+-[0-9]+' | head -1)
    else
      # Fallback: Use grep
      LINEAR_ID=$(echo "$CURRENT_BRANCH" | grep -oE '[A-Z]+-[0-9]+' | head -1)
    fi

    if [[ -n "$LINEAR_ID" ]]; then
      echo "=== Active Linear Ticket ==="
      echo "Ticket: $LINEAR_ID"

      # Check for specs
      if [[ -d "specs/$LINEAR_ID" ]]; then
        echo "Specs: specs/$LINEAR_ID/"
        [[ -f "specs/$LINEAR_ID/tasks.md" ]] && echo "Tasks: In progress"
        [[ -f "specs/$LINEAR_ID/memory.md" ]] && echo "Memory: Documented"
      fi
      echo ""
    fi
  fi

  # Check for specs directory
  if [[ -f "$TMP_DIR/specs.txt" ]] && [[ -s "$TMP_DIR/specs.txt" ]]; then
    ACTIVE_SPECS=$(wc -l < "$TMP_DIR/specs.txt" | tr -d ' ')
    if [[ "$ACTIVE_SPECS" -gt 0 ]]; then
      echo "=== Active Specifications ==="
      echo "Count: $ACTIVE_SPECS specs in progress"
      cat "$TMP_DIR/specs.txt" | xargs -I {} basename {} | head -5
      echo ""
    fi
  fi

  # MCP servers active
  if [[ -f ".mcp.json" ]]; then
    echo "=== MCP Configuration ==="
    if command -v jq &> /dev/null; then
      echo "Servers: $(jq -r '.mcpServers | keys | join(", ")' .mcp.json 2>/dev/null || echo 'Unknown')"
    else
      echo "✓ Project MCP servers configured"
    fi
    echo ""
  fi

  # Memory patterns (if available)
  if [[ -f "memory.json" ]] && command -v jq &> /dev/null; then
    ENTITY_COUNT=$(jq -r '.entities | length // 0' memory.json 2>/dev/null)
    if [[ -n "$ENTITY_COUNT" ]] && [[ "$ENTITY_COUNT" -gt 0 ]] 2>/dev/null; then
      echo "=== Memory Patterns ==="
      echo "Entities: $ENTITY_COUNT stored"
      echo ""
    fi
  fi

  echo "=== Context Saved ==="
  echo "Snapshot: $CONTEXT_FILE"

} > "$CONTEXT_FILE" 2>&1

# Cleanup temp directory
rm -rf "$TMP_DIR" 2>/dev/null || true

# Clean up old context snapshots (keep last 10)
find "$CONTEXT_DIR" -name "pre-compact-*.txt" -type f | sort -r | tail -n +11 | xargs rm -f 2>/dev/null || true

# ============================================================================
# APPEND INSTRUCTIONS TO CLAUDE CODE'S COMPACT SUMMARY
# ============================================================================

cat <<EOF

---

## Context Restoration Instructions

After this compaction, the following context should be restored:

**Working State:**
- Repository: $(cat "$TMP_DIR/git-root.txt" 2>/dev/null || pwd)
- Branch: $(cat "$TMP_DIR/git-branch.txt" 2>/dev/null || echo 'Not in git repo')
- Status: $(wc -l < "$TMP_DIR/git-status.txt" 2>/dev/null | tr -d ' ') uncommitted changes

$(if [[ -f "$BRANCH_CACHE" ]]; then
  CURRENT_BRANCH=$(cat "$BRANCH_CACHE")
  if echo "$CURRENT_BRANCH" | grep -qE '[A-Z]+-[0-9]+'; then
    LINEAR_ID=$(echo "$CURRENT_BRANCH" | grep -oE '[A-Z]+-[0-9]+')
    echo "**Active Work:**"
    echo "- Linear Ticket: $LINEAR_ID"
    if [[ -d "specs/$LINEAR_ID" ]]; then
      echo "- Specification: specs/$LINEAR_ID/"
      [[ -f "specs/$LINEAR_ID/tasks.md" ]] && echo "- Tasks: Available for implementation"
      [[ -f "specs/$LINEAR_ID/memory.md" ]] && echo "- Memory: Contains feature context"
    fi
  fi
fi)

$(if [[ -f ".mcp.json" ]] && command -v jq &> /dev/null; then
  echo "**MCP Servers:**"
  echo "- Configured: $(jq -r '.mcpServers | keys | join(", ")' .mcp.json 2>/dev/null)"
fi)

**Context Snapshot:** $CONTEXT_FILE

Use \`/load-session\` or \`cat $CONTEXT_FILE\` to restore full session context if needed.

---
EOF

# Performance monitoring
END_TIME=$(date +%s%N)
ELAPSED=$(( (END_TIME - START_TIME) / 1000000 ))  # Convert to ms
echo "pre-compact-optimized: ${ELAPSED}ms" >> ~/.claude/hooks/perf.log 2>/dev/null || true

# Output for debugging (goes to stderr)
echo "PreCompact: Context saved to $CONTEXT_FILE (${ELAPSED}ms)" >&2
echo "PreCompact: Compact type: $COMPACT_TYPE" >&2
