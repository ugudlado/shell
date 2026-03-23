# Design: Lean Hook Engine Plugin

## Context

Claude Code hooks are bash/python scripts registered in a static `hooks.json` (or `settings.json`). The current setup has 19 hand-written scripts with duplicated boilerplate and a Python-based hookify plugin that only covers 4 of 11 events. This design replaces both with a bash-native plugin that uses `.local.md` rule files and a shared library.

### Key Constraints

1. **hooks.json is static** -- loaded once at session start. Cannot add/remove hook entries dynamically.
2. **`"type": "prompt"` hooks have a fixed prompt string** -- no command execution, no file reading, limited variable substitution (`$TOOL_INPUT`, `$TOOL_RESULT`, `$USER_PROMPT`). Cannot dynamically compose prompts from multiple rule files.
3. **Plugin hooks.json uses `${CLAUDE_PLUGIN_ROOT}`** -- paths are resolved relative to the plugin's install location.
4. **Multiple hooks per event run in parallel** -- result aggregation (deny wins) happens within a single hook's output, not across hooks.
5. **Exit code semantics**: `exit 0` always. `exit 2` is treated as hook error, not as a block. Blocking requires JSON output with `permissionDecision: "deny"` or `decision: "block"`.

## Goals / Non-Goals

### Goals

- Cover all 11 hook events with a single plugin
- Bash-native dispatchers (no Python dependency)
- Dynamic rule loading from `.local.md` files (no restart needed)
- Shared `hooklib.sh` with common helpers
- Three evaluation mechanisms: regex, script, prompt
- Four result types: deny, ask, warn, context
- Deterministic rule ordering (alphabetical by filename)
- Per-rule fail mode (open/closed)

### Non-Goals

- Replacing complex stateful hooks wholesale (process-kill-guard's PID registry stays as a script rule)
- Python or Node.js rule handlers (scripts can be any language, but the engine is bash)
- Condition combinators (AND/OR trees) -- rules are single-condition; use script mechanism for complex logic
- Hot-reload of hooks.json entries (adding a new event type still requires plugin update)

## Approaches Considered

### Approach A: One Mega-Dispatcher

A single `dispatch.sh` script registered for all events. It receives the event name from stdin JSON, loads rules for that event, and dispatches.

**Pros**: Single hooks.json entry pattern, simple to maintain.
**Cons**: Cannot use `matcher` field in hooks.json (which filters by tool name before the hook even runs). Every hook event invocation would load ALL rules, parse ALL frontmatter, then filter. Performance hit for high-frequency events like PreToolUse.

### Approach B: Per-Event Dispatcher (Selected)

One thin dispatcher script per event type. Each dispatcher sources `hooklib.sh` and `dispatch-core.sh`, then calls `dispatch_event <event_name>`. The core handles rule loading, filtering, evaluation, and result aggregation.

**Pros**: hooks.json can use `matcher` for tool filtering (PreToolUse/PostToolUse). Each event's dispatcher is a 5-line shim. Core logic is shared. Can register different timeouts per event.
**Cons**: More files (11 dispatchers), but they are trivially generated.

### Approach C: Build-Time Compilation

A build script reads all `.local.md` files and generates hooks.json + individual hook scripts. Run after editing rules.

**Pros**: Could generate native `"type": "prompt"` hooks. Optimal runtime performance.
**Cons**: Requires a build step. Rules are not dynamic. Contradicts the core requirement.

### Selected Approach

**Approach B: Per-Event Dispatcher**. The thin-shim pattern keeps hooks.json clean while allowing per-event customization (matchers, timeouts). The shared `dispatch-core.sh` contains all rule loading and evaluation logic. `hooklib.sh` provides the user-facing API for script rules.

## High-Level Design

### Architecture Overview

```
.claude-plugin/
  plugin.json                    # Plugin manifest

hooks/
  hooks.json                     # Static hook registrations (one per event)
  dispatchers/
    pre-tool-use.sh              # Thin shim: source core, call dispatch
    post-tool-use.sh
    stop.sh
    user-prompt-submit.sh
    session-start.sh
    subagent-start.sh
    subagent-stop.sh
    post-compact.sh
    notification.sh
  dispatch-core.sh               # Shared dispatch logic (rule loading, eval, aggregation)

lib/
  hooklib.sh                     # User-facing API for script rules

scripts/                         # Example migration scripts
  bash-safety-guard.sh           # Migrated from monolithic hook
  worktree-boundary.sh

commands/
  lean-hooks.md                  # /lean-hooks list command

skills/
  writing-rules/                 # Skill: how to write rules

examples/
  lean-hook-engine.block-rm.local.md
  lean-hook-engine.warn-console-log.local.md
  lean-hook-engine.task-gate.local.md
```

### Key Abstractions

**Rule**: A `.local.md` file with YAML frontmatter and markdown body. The frontmatter defines behavior; the body is the message/prompt text.

**Dispatcher**: A per-event bash script that sources dispatch-core.sh and calls `dispatch_event`. It is the entry point registered in hooks.json.

**dispatch-core.sh**: The engine. Loads rules, filters by event/matcher/enabled, evaluates mechanisms, aggregates results, outputs hook-protocol JSON.

**hooklib.sh**: The user API. Sourced by script-type rules. Provides helpers for output formatting, feature-ID detection, and field extraction.

## Low-Level Design

### Rule File Format

```markdown
---
name: block-dangerous-rm
enabled: true
event: PreToolUse
matcher: Bash
mechanism: regex
field: command
pattern: "rm\\s+-rf\\s+(/|~|\\$HOME)"
result: deny
fail_mode: open
---

Blocked: destructive rm command targeting system or home directory.
```

#### Frontmatter Fields

| Field | Required | Type | Default | Description |
|-------|----------|------|---------|-------------|
| `name` | Yes | string | -- | Human-readable rule name (used in logs and list output) |
| `enabled` | No | boolean | `true` | Whether the rule is active |
| `event` | Yes | string | -- | Hook event: PreToolUse, PostToolUse, Stop, UserPromptSubmit, SessionStart, SubagentStart, SubagentStop, PostCompact, Notification |
| `matcher` | No | string | `*` | Tool name filter for PreToolUse/PostToolUse (e.g., `Bash`, `Write\|Edit`). Ignored for other events. |
| `mechanism` | Yes | string | -- | `regex`, `script`, or `prompt` |
| `field` | Cond. | string | -- | Required for `regex`. JSON field to match: `command`, `file_path`, `content`, `new_string`, `old_string`, `user_prompt`, `reason` |
| `pattern` | Cond. | string | -- | Required for `regex`. Extended regex pattern (bash `=~` syntax). |
| `script` | Cond. | string | -- | Required for `script`. Path to bash script (relative to plugin root or absolute). |
| `result` | Yes | string | -- | `deny`, `ask`, `warn`, or `context` |
| `fail_mode` | No | string | `open` | `open` (errors allow) or `closed` (errors deny). Only applies to `script` mechanism. |

#### Body

The markdown body after the `---` closing fence is the **message text**:
- For `result: deny/ask/warn`: used as `permissionDecisionReason` or `systemMessage`
- For `result: context`: used as `additionalContext`
- For `mechanism: prompt`: used as the prompt text injected via `additionalContext` or `systemMessage`

### hooks.json Configuration

```json
{
  "description": "Lean Hook Engine - bash-native rule dispatcher",
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/dispatchers/pre-tool-use.sh",
            "timeout": 10
          }
        ]
      },
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/dispatchers/pre-tool-use.sh",
            "timeout": 10
          }
        ]
      },
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/dispatchers/pre-tool-use.sh",
            "timeout": 10
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/dispatchers/post-tool-use.sh",
            "timeout": 10,
            "async": true
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/dispatchers/stop.sh",
            "timeout": 10
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/dispatchers/user-prompt-submit.sh",
            "timeout": 10
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/dispatchers/session-start.sh",
            "timeout": 10
          }
        ]
      }
    ],
    "SubagentStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/dispatchers/subagent-start.sh",
            "timeout": 10
          }
        ]
      }
    ],
    "SubagentStop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/dispatchers/subagent-stop.sh",
            "timeout": 10
          }
        ]
      }
    ],
    "PostCompact": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/dispatchers/post-compact.sh",
            "timeout": 5
          }
        ]
      }
    ],
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/dispatchers/notification.sh",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

**Design note on PreToolUse matchers**: hooks.json supports `matcher` to filter by tool name *before* the hook runs. We register three PreToolUse entries:
1. `matcher: "Bash"` -- catches bash-specific rules efficiently
2. `matcher: "Write|Edit|MultiEdit"` -- catches file-specific rules
3. No matcher (catch-all) -- catches rules with `matcher: *` or custom tool names

All three invoke the same dispatcher. The dispatcher further filters by per-rule `matcher` from frontmatter. This is slightly redundant but ensures the dispatcher sees the right subset. [ASSUMPTION: Claude Code deduplicates hook results when the same script runs in multiple matcher groups. If not, we need a single catch-all entry instead and lose the pre-filtering optimization.]

**Revised PreToolUse strategy**: To avoid potential double-execution, use a single catch-all entry (no matcher). The dispatcher handles all matcher logic internally. This is safer:

```json
"PreToolUse": [
  {
    "hooks": [
      {
        "type": "command",
        "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/dispatchers/pre-tool-use.sh",
        "timeout": 10
      }
    ]
  }
]
```

### Dispatcher Flow

Each per-event dispatcher is a thin shim:

```bash
#!/bin/bash
# hooks/dispatchers/pre-tool-use.sh
set -euo pipefail
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/../.." && pwd)}"
source "$PLUGIN_ROOT/hooks/dispatch-core.sh"
dispatch_event "PreToolUse"
```

### dispatch-core.sh: The Engine

```bash
#!/bin/bash
# hooks/dispatch-core.sh -- Core dispatch logic
# Sourced by per-event dispatchers. Do not run directly.

source "${PLUGIN_ROOT}/lib/hooklib.sh"

# ── Rule Loading ──

load_rules() {
  local event="$1"
  local tool_name="${2:-}"
  local rules_dir=".claude"
  local -a matched_files=()

  # Find all rule files, sorted alphabetically (deterministic order)
  while IFS= read -r -d '' file; do
    matched_files+=("$file")
  done < <(find "$rules_dir" -maxdepth 1 -name "lean-hook-engine.*.local.md" -print0 2>/dev/null | sort -z)

  local -a result=()
  for file in "${matched_files[@]}"; do
    # Parse frontmatter
    local fm
    fm=$(parse_frontmatter "$file")

    # Filter: enabled
    local enabled
    enabled=$(echo "$fm" | jq -r '.enabled // "true"')
    [[ "$enabled" == "false" ]] && continue

    # Filter: event
    local rule_event
    rule_event=$(echo "$fm" | jq -r '.event // ""')
    [[ "$rule_event" != "$event" ]] && continue

    # Filter: matcher (for PreToolUse/PostToolUse)
    if [[ -n "$tool_name" ]]; then
      local rule_matcher
      rule_matcher=$(echo "$fm" | jq -r '.matcher // "*"')
      if [[ "$rule_matcher" != "*" ]]; then
        if ! echo "$rule_matcher" | tr '|' '\n' | grep -qx "$tool_name"; then
          continue
        fi
      fi
    fi

    # Validate result-event compatibility
    local rule_result
    rule_result=$(echo "$fm" | jq -r '.result // "warn"')
    if ! validate_result_event "$rule_result" "$event"; then
      log "SKIP: Rule $(basename "$file") has incompatible result=$rule_result for event=$event"
      continue
    fi

    result+=("$file")
  done

  printf '%s\n' "${result[@]}"
}

# ── Frontmatter Parser ──

parse_frontmatter() {
  local file="$1"
  # Extract YAML between --- markers, convert to JSON via inline awk/sed + jq
  local yaml_block
  yaml_block=$(awk '/^---$/{if(n++)exit;next}n' "$file")

  # Minimal YAML-to-JSON: handles key: value, key: "value", booleans
  echo "$yaml_block" | awk '
    BEGIN { print "{" }
    /^[a-zA-Z_][a-zA-Z0-9_]*:/ {
      key = $0; sub(/:.*/, "", key)
      val = $0; sub(/^[^:]*:[[:space:]]*/, "", val)
      gsub(/^["'\'']|["'\'']$/, "", val)
      # Boolean normalization
      if (val == "true" || val == "false") {
        printf "  \"%s\": %s", key, val
      } else {
        gsub(/"/, "\\\"", val)
        printf "  \"%s\": \"%s\"", key, val
      }
      if (NR > 1) printf ","
      printf "\n"
    }
    END { print "}" }
  ' | jq '.' 2>/dev/null || echo '{}'
}

# ── Get Message Body ──

get_message_body() {
  local file="$1"
  # Everything after the second ---
  awk '/^---$/{if(++n==2){found=1;next}}found' "$file" | sed '/^$/d; 1{/^$/d}'
}

# ── Evaluation ──

evaluate_rule() {
  local file="$1"
  local input="$2"
  local fm
  fm=$(parse_frontmatter "$file")

  local mechanism
  mechanism=$(echo "$fm" | jq -r '.mechanism // "regex"')
  local fail_mode
  fail_mode=$(echo "$fm" | jq -r '.fail_mode // "open"')

  case "$mechanism" in
    regex)
      evaluate_regex "$file" "$fm" "$input"
      ;;
    script)
      evaluate_script "$file" "$fm" "$input" "$fail_mode"
      ;;
    prompt)
      evaluate_prompt "$file" "$fm" "$input"
      ;;
    *)
      log "Unknown mechanism: $mechanism in $(basename "$file")"
      return 1
      ;;
  esac
}

evaluate_regex() {
  local file="$1" fm="$2" input="$3"
  local field pattern
  field=$(echo "$fm" | jq -r '.field // "command"')
  pattern=$(echo "$fm" | jq -r '.pattern // ""')

  [[ -z "$pattern" ]] && return 1

  local value
  value=$(echo "$input" | get_field "$field")

  if [[ "$value" =~ $pattern ]]; then
    return 0  # matched
  fi
  return 1  # no match
}

evaluate_script() {
  local file="$1" fm="$2" input="$3" fail_mode="$4"
  local script_path
  script_path=$(echo "$fm" | jq -r '.script // ""')

  [[ -z "$script_path" ]] && return 1

  # Resolve relative paths to plugin root
  if [[ "$script_path" != /* ]]; then
    script_path="$PLUGIN_ROOT/$script_path"
  fi

  if [[ ! -x "$script_path" ]] && [[ ! -f "$script_path" ]]; then
    log "Script not found: $script_path"
    [[ "$fail_mode" == "closed" ]] && return 0 || return 1
  fi

  local output exit_code
  output=$(echo "$input" | bash "$script_path" 2>/dev/null) || exit_code=$?
  exit_code=${exit_code:-0}

  if [[ $exit_code -ne 0 ]]; then
    log "Script failed (exit $exit_code): $script_path"
    [[ "$fail_mode" == "closed" ]] && return 0 || return 1
  fi

  # Script produced output -- use it directly as the hook response
  if [[ -n "$output" ]]; then
    echo "$output"
    return 0
  fi

  return 1
}

evaluate_prompt() {
  local file="$1" fm="$2" input="$3"
  # Prompt rules always "match" -- their body is injected as context
  return 0
}

# ── Result Aggregation ──

# Priority: deny=3, ask=2, warn=1, context=0
result_priority() {
  case "$1" in
    deny) echo 3 ;;
    ask) echo 2 ;;
    warn) echo 1 ;;
    context) echo 0 ;;
    *) echo -1 ;;
  esac
}

dispatch_event() {
  local event="$1"
  local input
  input=$(cat)

  local tool_name=""
  if [[ "$event" == "PreToolUse" || "$event" == "PostToolUse" ]]; then
    tool_name=$(echo "$input" | jq -r '.tool_name // ""')
  fi

  # Stop hook infinite loop guard
  if [[ "$event" == "Stop" ]]; then
    local stop_active
    stop_active=$(echo "$input" | jq -r '.stop_hook_active // false')
    [[ "$stop_active" == "true" ]] && exit 0
  fi

  # Load matching rules
  local -a rule_files=()
  while IFS= read -r f; do
    [[ -n "$f" ]] && rule_files+=("$f")
  done < <(load_rules "$event" "$tool_name")

  [[ ${#rule_files[@]} -eq 0 ]] && exit 0

  # Evaluate each rule, collect results
  local best_priority=-1
  local best_result=""
  local -a messages=()
  local -a script_outputs=()

  for file in "${rule_files[@]}"; do
    local fm
    fm=$(parse_frontmatter "$file")
    local rule_result rule_name mechanism
    rule_result=$(echo "$fm" | jq -r '.result // "warn"')
    rule_name=$(echo "$fm" | jq -r '.name // "unnamed"')
    mechanism=$(echo "$fm" | jq -r '.mechanism // "regex"')

    local eval_output=""
    if [[ "$mechanism" == "script" ]]; then
      eval_output=$(evaluate_rule "$file" "$input") && matched=true || matched=false
    else
      evaluate_rule "$file" "$input" > /dev/null 2>&1 && matched=true || matched=false
    fi

    if [[ "$matched" == "true" ]]; then
      local priority
      priority=$(result_priority "$rule_result")

      # For script mechanism with direct output, use script's JSON
      if [[ "$mechanism" == "script" && -n "$eval_output" ]]; then
        script_outputs+=("$eval_output")
        # Still track priority for aggregation
        if (( priority > best_priority )); then
          best_priority=$priority
          best_result=$rule_result
        fi
        continue
      fi

      local msg
      msg=$(get_message_body "$file")
      messages+=("**[$rule_name]** $msg")

      if (( priority > best_priority )); then
        best_priority=$priority
        best_result=$rule_result
      fi
    fi
  done

  # If a script produced direct output and it's the highest priority, use it
  if [[ ${#script_outputs[@]} -gt 0 && ${#messages[@]} -eq 0 ]]; then
    # Use the first script output (scripts handle their own JSON)
    echo "${script_outputs[0]}"
    exit 0
  fi

  # No matches
  [[ ${#messages[@]} -eq 0 && ${#script_outputs[@]} -eq 0 ]] && exit 0

  # Build combined message
  local combined
  combined=$(printf '%s\n\n' "${messages[@]}")

  # Output based on best_result and event
  case "$best_result" in
    deny)
      if [[ "$event" == "Stop" ]]; then
        jq -n --arg reason "$combined" '{decision:"block",reason:$reason}'
      else
        deny "$combined"
      fi
      ;;
    ask)
      ask "$combined"
      ;;
    warn)
      warn "$combined"
      ;;
    context)
      context "$combined"
      ;;
  esac

  exit 0
}

# ── Validation ──

validate_result_event() {
  local result="$1" event="$2"
  case "$result" in
    deny)
      [[ "$event" == "PreToolUse" || "$event" == "Stop" ]]
      ;;
    ask)
      [[ "$event" == "PreToolUse" ]]
      ;;
    warn)
      return 0  # warn works on all events
      ;;
    context)
      [[ "$event" == "UserPromptSubmit" || "$event" == "SessionStart" || \
         "$event" == "SubagentStart" || "$event" == "SubagentStop" || \
         "$event" == "PostCompact" ]]
      ;;
    *)
      return 1
      ;;
  esac
}
```

### hooklib.sh: Function Signatures

```bash
#!/bin/bash
# lib/hooklib.sh -- User-facing API for lean-hook-engine rules
# Source this in script-type rules: source "$HOOKLIB"

# ── Output Helpers ──

# deny(reason) -- Block operation (PreToolUse only)
deny() {
  local reason="${1:-Blocked by hook rule}"
  jq -n --arg r "$reason" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $r
    }
  }'
  exit 0
}

# ask(reason) -- Request manual approval (PreToolUse only)
ask() {
  local reason="${1:-Manual approval required}"
  jq -n --arg r "$reason" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason: $r
    }
  }'
  exit 0
}

# warn(message) -- Show warning without blocking
warn() {
  local message="${1:-Warning from hook rule}"
  jq -n --arg m "$message" '{systemMessage: $m}'
  exit 0
}

# context(text) -- Inject additional context
context() {
  local text="$1"
  local event="${HOOK_EVENT:-UserPromptSubmit}"
  jq -n --arg t "$text" --arg e "$event" '{
    hookSpecificOutput: {
      hookEventName: $e,
      additionalContext: $t
    }
  }'
  exit 0
}

# block_stop(reason) -- Block a Stop event
block_stop() {
  local reason="${1:-Blocked by hook rule}"
  jq -n --arg r "$reason" '{decision:"block",reason:$r}'
  exit 0
}

# ── Input Helpers ──

# read_input() -- Read and cache stdin JSON. Call once.
# Sets global INPUT variable.
read_input() {
  INPUT=$(cat)
  export INPUT
}

# get_field(field_name) -- Extract a field from INPUT or piped JSON
# Handles tool_input.command, tool_input.file_path, etc.
get_field() {
  local field="$1"
  local json="${2:-$INPUT}"

  case "$field" in
    command)
      echo "$json" | jq -r '.tool_input.command // empty'
      ;;
    file_path)
      echo "$json" | jq -r '.tool_input.file_path // empty'
      ;;
    content|new_string)
      echo "$json" | jq -r '.tool_input.content // .tool_input.new_string // empty'
      ;;
    old_string)
      echo "$json" | jq -r '.tool_input.old_string // empty'
      ;;
    user_prompt)
      echo "$json" | jq -r '.user_prompt // empty'
      ;;
    tool_name)
      echo "$json" | jq -r '.tool_name // empty'
      ;;
    cwd)
      echo "$json" | jq -r '.cwd // empty'
      ;;
    reason)
      echo "$json" | jq -r '.reason // empty'
      ;;
    transcript_path)
      echo "$json" | jq -r '.transcript_path // empty'
      ;;
    stop_hook_active)
      echo "$json" | jq -r '.stop_hook_active // "false"'
      ;;
    *)
      echo "$json" | jq -r ".tool_input.$field // .$field // empty"
      ;;
  esac
}

# ── Detection Helpers ──

# detect_feature_id() -- Detect feature ID from CWD or git branch
# Prints feature ID or empty string
detect_feature_id() {
  local cwd="${1:-$PWD}"

  # Check worktree path
  if [[ "$cwd" =~ feature_worktrees/([^/]+) ]]; then
    echo "${BASH_REMATCH[1]}"
    return 0
  fi

  # Check git branch
  if command -v git &>/dev/null; then
    local branch
    branch=$(git -C "$cwd" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
    if [[ "$branch" =~ ^feature/(.+)$ ]]; then
      echo "${BASH_REMATCH[1]}"
      return 0
    fi
  fi

  echo ""
}

# ── Logging ──

# log(message) -- Log to stderr (visible as hook context but non-blocking)
log() {
  echo "[lean-hook-engine] $*" >&2
}
```

### How Prompt-Type Rules Work

Given that `"type": "prompt"` hooks have a fixed string in hooks.json and cannot reference dynamic rule files, prompt-type rules use the command dispatcher path:

1. User creates a rule with `mechanism: prompt`
2. The command dispatcher loads this rule like any other
3. The `evaluate_prompt()` function always returns "matched" (prompt rules are unconditional or use field/pattern for conditional activation in a future version)
4. The rule's markdown body is injected as:
   - `additionalContext` for events that support it (UserPromptSubmit, SessionStart, SubagentStart, SubagentStop, PostCompact)
   - `systemMessage` for other events

This is weaker than true `"type": "prompt"` hooks because:
- `systemMessage` is advisory -- the LLM can ignore it
- `additionalContext` is stronger (treated as system context) but only available on certain events
- True prompt hooks let the LLM make a decision (approve/deny) based on the prompt; our approach can only inject context

For users who need true LLM-evaluated gates, the recommendation is to register a `"type": "prompt"` hook directly in settings.json or to use a script-type rule that invokes an LLM API.

### Data Flow: Single Hook Invocation

```
Claude Code triggers PreToolUse for Bash("rm -rf /tmp")
  |
  v
hooks.json -> bash dispatchers/pre-tool-use.sh
  |
  v
dispatch_event("PreToolUse")
  |
  +-- cat stdin -> $input (JSON with tool_name, tool_input, cwd, etc.)
  +-- load_rules("PreToolUse", "Bash")
  |     +-- find .claude/lean-hook-engine.*.local.md
  |     +-- sort alphabetically
  |     +-- for each: parse frontmatter, filter event/matcher/enabled
  |     +-- return: [block-rm.local.md, warn-sensitive.local.md]
  |
  +-- evaluate block-rm (regex, field=command, pattern=rm\s+-rf)
  |     +-- extract command from input JSON
  |     +-- bash =~ match -> TRUE
  |     +-- result=deny, message="Blocked: destructive rm..."
  |
  +-- evaluate warn-sensitive (regex, field=command, pattern=\.env|\.ssh)
  |     +-- bash =~ match -> FALSE (no .env in command)
  |     +-- skip
  |
  +-- aggregate: deny (priority 3) wins
  +-- output: {"hookSpecificOutput":{"permissionDecision":"deny",...}}
  |
  v
Claude Code blocks the command
```

### State Management

The plugin is **stateless between invocations**. Each dispatcher invocation:
- Reads rule files from disk (dynamic)
- Reads stdin JSON (ephemeral)
- Produces stdout JSON (ephemeral)

Script-type rules may maintain their own state (e.g., PID registry files in `/tmp/`) but the engine itself holds no state.

### Error Handling

| Error | Behavior |
|-------|----------|
| Malformed YAML frontmatter | Skip rule, log warning to stderr |
| Missing required field (event, mechanism, result) | Skip rule, log warning |
| Regex compilation failure | Skip rule, log warning |
| Script not found | If `fail_mode: open`, skip. If `closed`, deny. |
| Script exits non-zero | If `fail_mode: open`, skip. If `closed`, deny. |
| Script produces invalid JSON | Treat as no output, log warning |
| jq not available | Dispatcher fails entirely -- all rules skipped (fail-open) |
| No rule files found | Exit 0 silently (no effect) |

## Migration Strategy for Existing Hooks

### Phase 1: Simple Regex Hooks (direct conversion)

These hooks are pure regex matching and can become `.local.md` rules immediately:

| Existing Hook | New Rule | Mechanism |
|---------------|----------|-----------|
| bash-safety-guard.sh (git push/reset/clean/branch -D) | `lean-hook-engine.git-safety.local.md` | regex |
| bash-safety-guard.sh (gh CLI) | `lean-hook-engine.gh-safety.local.md` | regex |
| bash-safety-guard.sh (destructive system) | `lean-hook-engine.system-safety.local.md` | regex |
| bash-safety-guard.sh (curl pipe to shell) | `lean-hook-engine.pipe-safety.local.md` | regex |
| protected-files.sh | `lean-hook-engine.protected-files.local.md` | regex (field=file_path) |
| worktree-boundary.sh | `lean-hook-engine.worktree-boundary.local.md` | script (needs CWD logic) |

**Note**: bash-safety-guard.sh contains both deny and warn patterns. These become separate rule files (one per result type, or combined if the engine gains multi-pattern support).

### Phase 2: Context Injection Hooks

| Existing Hook | New Rule | Mechanism |
|---------------|----------|-----------|
| task-gate.sh | `lean-hook-engine.task-gate.local.md` | script (needs feature-ID detection) |
| session-git-status.sh | `lean-hook-engine.session-git-status.local.md` | script (complex output) |
| subagent-task-context.sh | `lean-hook-engine.subagent-context.local.md` | script |
| post-compact-reminders.sh | `lean-hook-engine.post-compact.local.md` | prompt (static text) |

### Phase 3: Stateful/Complex Hooks (remain as scripts)

| Existing Hook | Migration | Reason |
|---------------|-----------|--------|
| process-kill-guard.sh | script-type rule | PID registry state, complex matching |
| dev-server-register.sh | script-type rule | PID file management |
| loop-detector.sh | script-type rule | Marker file state, transcript parsing |
| auto-format.sh | script-type rule | Side-effect (runs prettier) |
| smart-notify.sh | script-type rule | osascript invocation |
| session-reflect.sh | script-type rule | Complex transcript analysis |

These hooks move their scripts into `scripts/` or stay at absolute paths. The `.local.md` rule file provides metadata (name, event, enabled) while delegating logic to the script.

### Backward Compatibility

During migration, both systems can coexist:
- Existing hooks remain in `settings.json`
- Plugin hooks run in parallel via `hooks.json`
- After verifying each migrated rule works, remove the corresponding `settings.json` entry

## Rule Conflict Resolution

When multiple rules match for the same event invocation:

1. **Result priority**: deny (3) > ask (2) > warn (1) > context (0)
2. **Message aggregation**: All matching rule messages are combined with rule name headers
3. **Script output**: If a script-type rule produces direct JSON output, it takes precedence for its result type (script authors control their own output format)
4. **Same priority**: All messages combined; first file alphabetically determines the primary output structure

## Constraints

- **jq required**: The only external dependency beyond bash. Present on all systems where Claude Code runs.
- **bash 4+**: Uses associative arrays and `=~` regex. macOS ships bash 3.2 but Claude Code environments have bash 4+ or zsh (dispatch scripts use `/bin/bash` explicitly; on macOS with Homebrew, `/opt/homebrew/bin/bash` is 5.x). [ASSUMPTION: The target environment has bash 4+ or the scripts degrade gracefully with bash 3.2 by avoiding associative arrays.]
- **File I/O on every invocation**: Rule files are read from disk each time. For a typical session with 5-10 rules, this adds <5ms overhead. Not a concern at hook invocation frequency.

## Trade-offs

1. **Prompt rules are weaker than native `"type": "prompt"` hooks**: Accepted because dynamic loading is a higher priority than LLM-evaluated gating. Users who need true prompt hooks can register them directly.
2. **No complex condition operators (AND/OR)**: Use script mechanism for complex logic. Keeps the regex mechanism simple and fast.
3. **One event per rule file**: Cannot have a rule that fires on both PreToolUse and Stop. Use two files. This keeps the model simple and the result-event validation straightforward.
4. **Re-parsing frontmatter on every invocation**: No caching between invocations. Accepted because rule files are small (<1KB typically) and invocation frequency is modest.

## Decisions

1. **Single catch-all PreToolUse entry in hooks.json** -- Rather than multiple matcher entries that risk double-execution, use one entry and filter matchers in the dispatcher. Cost: the dispatcher runs even when no rules match the tool. Benefit: correctness guaranteed.

2. **hooklib.sh `deny()`/`ask()`/`warn()` all call `exit 0`** -- Matches the hook protocol requirement. Scripts should call these as terminal actions (like the existing `deny()` pattern in bash-safety-guard.sh).

3. **Script rules receive raw stdin JSON, not pre-parsed fields** -- Scripts have full access to the hook input, including fields the engine doesn't know about. This future-proofs against new hook protocol fields.

4. **`HOOKLIB` env var set by dispatcher** -- Script rules source `$HOOKLIB` instead of computing the path themselves. The dispatcher exports `HOOKLIB="$PLUGIN_ROOT/lib/hooklib.sh"` and `HOOK_EVENT="<event>"` before running scripts.

5. **File naming: `lean-hook-engine.<name>.local.md`** -- The `.local.md` extension follows Claude Code plugin conventions. The `lean-hook-engine.` prefix avoids collision with hookify's `hookify.*.local.md` pattern.

## Open Questions

1. **Bash version on macOS**: Does Claude Code's sandbox environment use `/bin/bash` (3.2) or a Homebrew bash (5.x)? This affects whether we can use associative arrays. Mitigation: avoid associative arrays in dispatch-core.sh; use indexed arrays and jq instead.

2. **Deduplication across matcher groups**: If we register multiple PreToolUse entries with different matchers, does Claude Code deduplicate results from the same script? Current decision: use single catch-all to avoid the question entirely.

3. **hooks.json merge behavior**: When a plugin provides hooks.json and the user also has hooks in settings.json, are they merged or does one override? [ASSUMPTION: They are merged -- both sets of hooks run. This is consistent with the plugin architecture where plugins add capabilities rather than replacing user config.]
