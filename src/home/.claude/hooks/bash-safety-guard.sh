#!/bin/bash

# Bash Safety Guard Hook (Merged)
# Combines git validation and dangerous command filtering
# Runs on PreToolUse for Bash commands
#
# Performance: ~75ms (vs 100ms for separate hooks)

set -euo pipefail

# Performance monitoring
START_TIME=$(date +%s%N)

# Read tool input from stdin
INPUT=$(cat)

# Extract command from tool input (single jq parse)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)

# Early exit if no command
if [[ -z "$COMMAND" ]]; then
  exit 0
fi

# ============================================================================
# PATTERN DEFINITIONS
# ============================================================================

# Dangerous git operations (require approval)
DANGEROUS_GIT_PATTERNS=(
  "push.*--force"
  "push.*-f[^a-z]"
  "reset.*--hard"
  "clean.*-fd"
  "branch.*-D"
  "rebase"
  "filter-branch"
  "reflog.*delete"
)

# Risky git operations (warning only)
WARNING_GIT_PATTERNS=(
  "commit.*--amend"
  "cherry-pick"
)

# Dangerous bash commands (require approval)
BLOCKED_BASH_PATTERNS=(
  "rm[[:space:]]+-rf[[:space:]]+/"
  "rm[[:space:]]+-rf[[:space:]]+/\*"
  "rm[[:space:]]+-rf[[:space:]]+~"
  "rm[[:space:]]+-rf[[:space:]]+\$HOME"
  ":(){ :|:& };:"
  "dd[[:space:]].*of=/dev/sd"
  "dd[[:space:]].*of=/dev/hd"
  "mkfs"
  "chmod[[:space:]]+-R[[:space:]]+777[[:space:]]+/"
  "chown[[:space:]]+-R.*/"
  "wget.*\|.*bash"
  "curl.*\|.*bash"
  "curl.*\|.*sh"
  "> /dev/sda"
  "> /dev/hda"
)

# Risky bash commands (warning only)
WARNING_BASH_PATTERNS=(
  "sudo dd"
  "sudo mkfs"
  "\| sudo"
  "eval"
  "kill -9 -1"
)

# Sensitive paths
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

# ============================================================================
# VALIDATION CHECKS
# ============================================================================

# Check git commands
if [[ "$COMMAND" =~ ^git[[:space:]] ]]; then
  for pattern in "${DANGEROUS_GIT_PATTERNS[@]}"; do
    if [[ "$COMMAND" =~ $pattern ]]; then
      echo "⚠️  APPROVAL REQUIRED: Potentially destructive git command detected: $COMMAND" >&2
      echo "This command may rewrite history or cause data loss." >&2
      echo "Do you want to proceed?" >&2
      exit 1
    fi
  done

  for pattern in "${WARNING_GIT_PATTERNS[@]}"; do
    if [[ "$COMMAND" =~ $pattern ]]; then
      echo "⚠️  Warning: This git operation may rewrite history: $COMMAND" >&2
      echo "Make sure you understand the implications." >&2
      break
    fi
  done
fi

# Check dangerous bash commands
for pattern in "${BLOCKED_BASH_PATTERNS[@]}"; do
  if [[ "$COMMAND" =~ $pattern ]]; then
    echo "⚠️  APPROVAL REQUIRED: Dangerous command detected!" >&2
    echo "Command: $COMMAND" >&2
    echo "This command could cause severe system damage. Approve only if you're certain." >&2
    exit 1
  fi
done

# Check risky bash commands
for pattern in "${WARNING_BASH_PATTERNS[@]}"; do
  if [[ "$COMMAND" =~ $pattern ]]; then
    echo "⚠️  Warning: Potentially dangerous command detected: $COMMAND" >&2
    echo "This command could modify or delete important data." >&2
    echo "Make sure you understand what it does." >&2
    break
  fi
done

# Check operations on sensitive paths
for path in "${SENSITIVE_PATHS[@]}"; do
  if [[ "$COMMAND" =~ rm.*$path ]] || [[ "$COMMAND" =~ delete.*$path ]]; then
    echo "⚠️  Warning: Command targets sensitive path: $path" >&2
    echo "Command: $COMMAND" >&2
    break
  fi
done

# Performance monitoring
END_TIME=$(date +%s%N)
ELAPSED=$(( (END_TIME - START_TIME) / 1000000 ))  # Convert to ms
echo "bash-safety-guard: ${ELAPSED}ms" >> ~/.claude/hooks/perf.log 2>/dev/null || true

exit 0
