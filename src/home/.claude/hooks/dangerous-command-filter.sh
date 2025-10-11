#!/bin/bash

# Dangerous Command Filter Hook
# Blocks potentially harmful bash commands

set -euo pipefail

# Read tool input from stdin
INPUT=$(cat)

# Extract command from tool input
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)

if [[ -z "$COMMAND" ]]; then
  exit 0
fi

# Patterns that should be blocked
BLOCKED_PATTERNS=(
  "rm[[:space:]]+-rf[[:space:]]+/"           # rm -rf /
  "rm[[:space:]]+-rf[[:space:]]+/\*"         # rm -rf /*
  "rm[[:space:]]+-rf[[:space:]]+~"           # rm -rf ~
  "rm[[:space:]]+-rf[[:space:]]+\$HOME"      # rm -rf $HOME
  ":(){ :|:& };:"                            # Fork bomb
  "dd[[:space:]].*of=/dev/sd"                # Disk wipe
  "dd[[:space:]].*of=/dev/hd"                # Disk wipe
  "mkfs"                                     # Format filesystem
  "chmod[[:space:]]+-R[[:space:]]+777[[:space:]]+/" # Chmod everything
  "chown[[:space:]]+-R.*/"                   # Chown root
  "wget.*\|.*bash"                           # Download and execute
  "curl.*\|.*bash"                           # Download and execute
  "curl.*\|.*sh"                             # Download and execute
  "> /dev/sda"                               # Write to disk
  "> /dev/hda"                               # Write to disk
)

for pattern in "${BLOCKED_PATTERNS[@]}"; do
  if [[ "$COMMAND" =~ $pattern ]]; then
    echo "🚨 BLOCKED: Dangerous command detected!" >&2
    echo "Command: $COMMAND" >&2
    echo "This command could cause severe system damage and has been blocked." >&2
    exit 2  # Exit code 2 blocks the operation
  fi
done

# Patterns that should be blocked
BLOCKED_PATTERNS+=(
  "^rm[[:space:]]"                           # Any rm command
)

# Check blocked patterns
for pattern in "${BLOCKED_PATTERNS[@]}"; do
  if [[ "$COMMAND" =~ $pattern ]]; then
    echo "🚨 BLOCKED: Dangerous command detected!" >&2
    echo "Command: $COMMAND" >&2
    echo "This command could cause severe system damage and has been blocked." >&2
    exit 2  # Exit code 2 blocks the operation
  fi
done

# Patterns that should trigger warnings
WARNING_PATTERNS=(
  "sudo dd"                                  # sudo dd
  "sudo mkfs"                                # sudo mkfs
  "\| sudo"                                  # Piping to sudo
  "eval"                                     # eval command
  "kill -9 -1"                               # Kill all processes
)

for pattern in "${WARNING_PATTERNS[@]}"; do
  if [[ "$COMMAND" =~ $pattern ]]; then
    echo "⚠️  Warning: Potentially dangerous command detected: $COMMAND" >&2
    echo "This command could modify or delete important data." >&2
    echo "Make sure you understand what it does." >&2
    # Don't block, just warn
    break
  fi
done

# Check for operations on sensitive files/directories
SENSITIVE_PATHS=(
  ".env"
  ".git"
  "node_modules"
  ".ssh"
  "id_rsa"
  "id_ed25519"
  ".aws"
  ".config"
)

for path in "${SENSITIVE_PATHS[@]}"; do
  if [[ "$COMMAND" =~ rm.*$path ]] || [[ "$COMMAND" =~ delete.*$path ]]; then
    echo "⚠️  Warning: Command targets sensitive path: $path" >&2
    echo "Command: $COMMAND" >&2
    break
  fi
done

exit 0
