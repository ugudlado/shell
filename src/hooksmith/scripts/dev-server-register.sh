#!/bin/bash

# Dev Server PID Registry Hook
# Runs on PostToolUse for Bash commands
# Registers PIDs of dev servers started by the agent
#
# Registry format (per file):
#   Line 1: PID
#   Line 2: Command
#   Line 3: Port (if detectable)

set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)

if [[ -z "$COMMAND" ]]; then
  exit 0
fi

# Only process dev server starts
is_dev_server=false
if [[ "$COMMAND" =~ (pnpm|npm|npx|yarn)[[:space:]]+(run[[:space:]]+)?(dev|dev:server|dev:ui|start|serve) ]]; then
  is_dev_server=true
fi
if [[ "$COMMAND" =~ (vite|tsx|node)[[:space:]] ]] && [[ "$COMMAND" =~ (watch|serve|dev|server) ]]; then
  is_dev_server=true
fi
if [[ "$is_dev_server" == "false" ]]; then
  exit 0
fi

REGISTRY_DIR="/tmp/claude-dev-servers"
mkdir -p "$REGISTRY_DIR"

# Derive context key from git worktree root + branch
get_context_key() {
  local worktree branch key
  worktree=$(git rev-parse --show-toplevel 2>/dev/null || echo "$PWD")
  branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
  key="${worktree}::${branch}"
  echo "$key" | shasum -a 256 | cut -c1-16
}

CONTEXT_HASH=$(get_context_key)
PID_FILE="$REGISTRY_DIR/${CONTEXT_HASH}.pid"

# Try to detect the port from the command
PORT=""
if [[ "$COMMAND" =~ PORT=([0-9]+) ]]; then
  PORT="${BASH_REMATCH[1]}"
elif [[ "$COMMAND" =~ --port[[:space:]]+([0-9]+) ]] || [[ "$COMMAND" =~ --port=([0-9]+) ]]; then
  PORT="${BASH_REMATCH[1]}"
elif [[ "$COMMAND" =~ -p[[:space:]]+([0-9]+) ]]; then
  PORT="${BASH_REMATCH[1]}"
fi

# Detect common default ports from command
if [[ -z "$PORT" ]]; then
  if [[ "$COMMAND" =~ dev:server ]]; then
    PORT="37001"
  elif [[ "$COMMAND" =~ dev:ui ]] || [[ "$COMMAND" =~ vite ]]; then
    PORT="3000"
  elif [[ "$COMMAND" =~ (pnpm|npm)[[:space:]]+(run[[:space:]]+)?dev ]]; then
    PORT="3000"
  fi
fi

# Find the server PID — check the port if we know it
SERVER_PID=""
if [[ -n "$PORT" ]]; then
  # Wait briefly for the server to bind
  sleep 1
  SERVER_PID=$(lsof -ti :"$PORT" 2>/dev/null | head -1 || echo "")
fi

# Fallback: find most recent node/tsx process
if [[ -z "$SERVER_PID" ]]; then
  sleep 2
  if [[ -n "$PORT" ]]; then
    SERVER_PID=$(lsof -ti :"$PORT" 2>/dev/null | head -1 || echo "")
  fi
fi

if [[ -n "$SERVER_PID" ]]; then
  echo "$SERVER_PID" > "$PID_FILE"
  echo "$COMMAND" >> "$PID_FILE"
  echo "$PORT" >> "$PID_FILE"
fi

exit 0
