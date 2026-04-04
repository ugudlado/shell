#!/bin/bash

# Bash Safety Guard Hook
# Runs on PreToolUse for Bash commands
# Blocks via JSON permissionDecision: "deny" (exit 0)
# Warns via stderr (exit 0)

set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null) || true

[[ -z "$COMMAND" ]] && exit 0

# Helper: deny by echoing reason (hooksmith wraps the JSON)
deny() {
  echo "$1"
  exit 0
}

# ── BLOCKED: git commands that affect remote or rewrite history ──
if [[ "$COMMAND" =~ ^git[[:space:]] ]]; then
  if [[ "$COMMAND" =~ push ]] || \
     [[ "$COMMAND" =~ reset.*--hard ]] || \
     [[ "$COMMAND" =~ clean.*-fd ]] || \
     [[ "$COMMAND" =~ branch.*-D ]] || \
     [[ "$COMMAND" =~ rebase ]] || \
     [[ "$COMMAND" =~ filter-branch ]] || \
     [[ "$COMMAND" =~ reflog.*delete ]]; then
    deny "BLOCKED: $COMMAND"
  fi

  # Warn only
  if [[ "$COMMAND" =~ commit.*--amend ]] || [[ "$COMMAND" =~ cherry-pick ]]; then
    echo "Warning: This git operation may rewrite history: $COMMAND" >&2
  fi
fi

# ── BLOCKED: gh CLI commands that affect remote state ──
if [[ "$COMMAND" =~ ^gh[[:space:]] ]]; then
  if [[ "$COMMAND" =~ (pr[[:space:]]+create|pr[[:space:]]+merge|pr[[:space:]]+close|issue[[:space:]]+create|issue[[:space:]]+close|release[[:space:]]+create|repo[[:space:]]+delete) ]]; then
    deny "BLOCKED: $COMMAND"
  fi
fi

# ── BLOCKED: destructive system commands ──
if [[ "$COMMAND" =~ rm[[:space:]]+-rf[[:space:]]+(/|\~|\$HOME) ]] || \
   [[ "$COMMAND" =~ dd[[:space:]].*of=/dev/[sh]d ]] || \
   [[ "$COMMAND" =~ mkfs ]] || \
   [[ "$COMMAND" =~ chmod[[:space:]]+-R[[:space:]]+777[[:space:]]+/ ]] || \
   [[ "$COMMAND" =~ chown[[:space:]]+-R.*/ ]]; then
  deny "BLOCKED: $COMMAND"
fi

# ── BLOCKED: piping downloads to shell ──
if [[ "$COMMAND" =~ (wget|curl).*\|.*(bash|sh)[[:space:]]*$ ]] || \
   [[ "$COMMAND" =~ (wget|curl).*\|[[:space:]]*(bash|sh)[[:space:]] ]]; then
  deny "BLOCKED: $COMMAND"
fi

# ── WARN: risky commands ──
if [[ "$COMMAND" =~ sudo[[:space:]]+(dd|mkfs) ]] || \
   [[ "$COMMAND" =~ \|[[:space:]]*sudo ]] || \
   [[ "$COMMAND" =~ kill[[:space:]]+-9[[:space:]]+-1 ]]; then
  echo "Warning: Risky command: $COMMAND" >&2
fi

# ── WARN: operations on sensitive paths ──
if [[ "$COMMAND" =~ (rm|delete).*(\.env|\.git/|\.ssh|id_rsa|id_ed25519|\.aws) ]]; then
  echo "Warning: Command targets sensitive path: $COMMAND" >&2
fi

exit 0
