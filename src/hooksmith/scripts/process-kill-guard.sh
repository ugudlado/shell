#!/bin/bash

# Process Kill Guard Hook
# Runs on PreToolUse for Bash commands (global scope)
#
# Rules:
# 1. Only kill processes you started (tracked via PID registry)
# 2. Only one dev server per worktree/branch
# 3. Dev server starts register PIDs; kills check the registry
#
# Registry: /tmp/claude-dev-servers/<context-hash>.pid

set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)

if [[ -z "$COMMAND" ]]; then
  exit 0
fi

# Helper: deny with structured JSON
deny() {
  jq -n --arg reason "$1" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
  exit 0
}

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

# Get the PID file for current context
get_pid_file() {
  local hash
  hash=$(get_context_key)
  echo "$REGISTRY_DIR/${hash}.pid"
}

# Check if a PID is still alive
is_alive() {
  kill -0 "$1" 2>/dev/null
}

# Clean up stale PID files
cleanup_stale() {
  local pid_file="$1"
  if [[ -f "$pid_file" ]]; then
    local stored_pid
    stored_pid=$(head -1 "$pid_file" 2>/dev/null || echo "")
    if [[ -n "$stored_pid" ]] && ! is_alive "$stored_pid"; then
      rm -f "$pid_file"
    fi
  fi
}

# ── DEV SERVER START DETECTION ──
is_dev_server_cmd=false
if [[ "$COMMAND" =~ (pnpm|npm|npx|yarn)[[:space:]]+(run[[:space:]]+)?(dev|dev:server|dev:ui|start|serve) ]]; then
  is_dev_server_cmd=true
fi
if [[ "$COMMAND" =~ (vite|tsx|node)[[:space:]] ]] && [[ "$COMMAND" =~ (watch|serve|dev|server) ]]; then
  is_dev_server_cmd=true
fi

if [[ "$is_dev_server_cmd" == "true" ]]; then
  PID_FILE=$(get_pid_file)
  cleanup_stale "$PID_FILE"

  if [[ -f "$PID_FILE" ]]; then
    EXISTING_PID=$(head -1 "$PID_FILE")
    EXISTING_CMD=$(sed -n '2p' "$PID_FILE")
    deny "Dev server already running (PID: $EXISTING_PID, cmd: $EXISTING_CMD). Kill it first."
  fi

  exit 0
fi

# ── KILL COMMAND DETECTION ──
# Match kill/pkill/killall only as a command token (preceded by start, space, semicolon, or pipe)
# This prevents false positives on filenames like "taste-skill" or paths containing "kill"
if [[ "$COMMAND" =~ (^|[[:space:]];|&&|\|)(kill|pkill|killall)[[:space:]] ]] || \
   [[ "$COMMAND" =~ (^|[[:space:]];|&&|\|)(kill|pkill|killall)$ ]] || \
   [[ "$COMMAND" =~ fuser[[:space:]]+-k ]]; then

  REGISTERED_PIDS=()
  for pid_file in "$REGISTRY_DIR"/*.pid; do
    [[ -f "$pid_file" ]] || continue
    stored_pid=$(head -1 "$pid_file" 2>/dev/null || echo "")
    if [[ -n "$stored_pid" ]]; then
      REGISTERED_PIDS+=("$stored_pid")
    fi
  done

  KILL_PIDS=()
  if [[ "$COMMAND" =~ kill[[:space:]]+(-[A-Za-z0-9]+[[:space:]]+)*([0-9]+) ]]; then
    KILL_PIDS+=("${BASH_REMATCH[2]}")
  fi

  if [[ "$COMMAND" =~ kill.*\$\(.*:([0-9]+) ]]; then
    PORT="${BASH_REMATCH[1]}"
    RESOLVED_PID=$(lsof -ti :"$PORT" 2>/dev/null || echo "")
    if [[ -n "$RESOLVED_PID" ]]; then
      KILL_PIDS+=($RESOLVED_PID)
    else
      exit 0
    fi
  fi

  if [[ "$COMMAND" =~ lsof[[:space:]]+-ti[[:space:]]+:([0-9]+).*\|.*kill ]]; then
    PORT="${BASH_REMATCH[1]}"
    RESOLVED_PID=$(lsof -ti :"$PORT" 2>/dev/null || echo "")
    if [[ -n "$RESOLVED_PID" ]]; then
      KILL_PIDS+=($RESOLVED_PID)
    else
      exit 0
    fi
  fi

  if [[ "$COMMAND" =~ fuser[[:space:]]+-k[[:space:]]+([0-9]+)/tcp ]]; then
    PORT="${BASH_REMATCH[1]}"
    RESOLVED_PID=$(fuser "$PORT"/tcp 2>/dev/null || echo "")
    if [[ -n "$RESOLVED_PID" ]]; then
      KILL_PIDS+=($RESOLVED_PID)
    else
      exit 0
    fi
  fi

  if [[ ${#KILL_PIDS[@]} -eq 0 ]]; then
    deny "Cannot determine target PID. Only kill processes you started. Registered: ${REGISTERED_PIDS[*]:-none}"
  fi

  for pid in "${KILL_PIDS[@]}"; do
    FOUND=false
    for reg_pid in "${REGISTERED_PIDS[@]}"; do
      if [[ "$pid" == "$reg_pid" ]]; then
        FOUND=true
        break
      fi
    done
    if [[ "$FOUND" != "true" ]]; then
      deny "PID $pid is not a process you started. Registered: ${REGISTERED_PIDS[*]:-none}"
    fi
  done

  # All PIDs verified — allow kill and clean up registry
  for pid in "${KILL_PIDS[@]}"; do
    for pid_file in "$REGISTRY_DIR"/*.pid; do
      [[ -f "$pid_file" ]] || continue
      stored_pid=$(head -1 "$pid_file" 2>/dev/null || echo "")
      if [[ "$stored_pid" == "$pid" ]]; then
        rm -f "$pid_file"
      fi
    done
  done

  exit 0
fi

exit 0
