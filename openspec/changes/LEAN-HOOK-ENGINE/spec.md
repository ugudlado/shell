---
feature-id: LEAN-HOOK-ENGINE
---

# Specification: Lean Hook Engine v2

## Motivation

The current hook setup has 19 hand-written bash scripts in `src/claude/hooks/`, each with duplicated boilerplate (stdin parsing, `deny()` helpers, JSON output). Adding or modifying a hook requires editing both the script and `settings.json`. The official hookify plugin is Python-dependent, covers only 4 events, and maps tool names to abstract strings.

The Lean Hook Engine replaces both with a build-step model: individual YAML rule files are compiled into a native `hooks.json` that Claude Code loads directly. Each rule becomes a native hook entry -- `"type": "prompt"` for LLM rules, `"type": "command"` for script and regex rules. No dispatcher middleware. No runtime rule loading. Maximum simplicity and performance.

## What Changes

- New Claude Code plugin: `lean-hook-engine` (separate repo, marketplace-installable)
- YAML rule files in `~/.claude/hooks/rules/` define hook behavior declaratively
- A build script reads rules and generates `hooks.json` with native hook entries
- A shared `hooklib.sh` library for script-type rules
- A thin `regex-match.sh` wrapper for regex-type rules

## Requirements

### Functional

1. **Rule files**: Each rule is a YAML file in `~/.claude/hooks/rules/`. Filename is the rule name (e.g., `block-rm.yaml`).
2. **Three mechanisms**:
   - `script`: Generates a `"type": "command"` hook entry pointing to the user's script. The script receives hook JSON on stdin and produces hook-protocol JSON on stdout.
   - `regex`: Generates a `"type": "command"` hook entry pointing to a built-in `regex-match.sh` that tests a field against a pattern. No user script needed.
   - `prompt`: Generates a `"type": "prompt"` hook entry with the prompt text embedded directly in hooks.json. True LLM evaluation -- not a workaround.
3. **Result types**: `deny`, `ask`, `warn`, `context`. Each maps to the appropriate hook-protocol output. The build step validates result-event compatibility at build time.
4. **All hook events supported**: PreToolUse, PostToolUse, Stop, UserPromptSubmit, SessionStart, SubagentStart, SubagentStop, PostCompact, Notification. A rule targets exactly one event.
5. **Tool matchers**: For PreToolUse/PostToolUse, an optional `matcher` field generates the hooks.json `matcher` key, so Claude Code filters before the hook runs.
6. **Build command**: `/lean-hooks build` (or `lean-hooks build` CLI) reads all YAML rules and generates `hooks.json`. User runs this after editing rules. Session restart required for changes to take effect.
7. **Hooklib**: A `hooklib.sh` providing `deny()`, `ask()`, `warn()`, `context()`, `read_input()`, `get_field()`, `log()` for script-type rules. Scripts source it via `$HOOKLIB` (set as env var by the generated command entries).
8. **Deterministic ordering**: Rules for a given event are ordered alphabetically by filename. The build step writes them in this order in hooks.json.
9. **Fail mode**: Each rule can specify `fail_mode: open` (default) or `fail_mode: closed`. For script/regex rules, this is handled by a tiny wrapper that catches failures.
10. **Enable/disable**: Each rule has `enabled: true/false`. Disabled rules are excluded from the generated hooks.json.
11. **List command**: `/lean-hooks list` shows all rules with name, event, mechanism, result, enabled status.
12. **Validation**: The build step validates rules at build time: required fields present, result-event compatibility, script file exists, regex compiles.

### Non-Functional

1. **No Python dependency**: Build script and all runtime components are pure bash + jq.
2. **No dispatcher overhead**: Each hook invocation runs the rule's logic directly -- no intermediary that loads/parses rule files.
3. **Latency**: Regex rules complete in under 10ms (just a bash `=~` test). Prompt rules have zero script overhead (native LLM evaluation).
4. **Build time**: Under 1 second for 50 rules.

## Architecture

### Build-Step Model

```
~/.claude/hooks/rules/         # User writes YAML rules here
       |
       v
  lean-hooks build             # Reads rules, generates hooks.json
       |
       v
~/.claude/plugins/cache/.../hooks/hooks.json   # Native hook entries
       |
       v
  Claude Code loads hooks.json at session start
```

Each rule type maps to a native hook entry:

| Mechanism | Generated hooks.json type | Runtime behavior |
|-----------|---------------------------|------------------|
| `script`  | `"type": "command"` pointing to user's script | Script runs directly, no middleware |
| `regex`   | `"type": "command"` calling `regex-match.sh` with pattern/field args | Thin 20-line bash wrapper |
| `prompt`  | `"type": "prompt"` with prompt text inline | Native LLM evaluation by Claude Code |

### Result-Event Compatibility (validated at build time)

| Result  | PreToolUse | PostToolUse | Stop       | UserPromptSubmit | SessionStart | Subagent* | PostCompact | Notification |
|---------|-----------|------------|------------|-----------------|-------------|-----------|------------|-------------|
| deny    | Yes       | No         | Yes (block)| No              | No          | No        | No         | No          |
| ask     | Yes       | No         | No         | No              | No          | No        | No         | No          |
| warn    | Yes       | Yes        | Yes        | Yes             | Yes         | Yes       | Yes        | No          |
| context | No        | No         | No         | Yes             | Yes         | Yes       | Yes        | No          |

### Prompt-type hooks: no longer a workaround

The previous design faked prompt rules via command dispatchers injecting systemMessage. This design uses actual `"type": "prompt"` entries because the build step embeds the prompt text directly into hooks.json before session start. The LLM evaluates the prompt natively with full access to `$TOOL_INPUT`, `$TOOL_RESULT`, `$USER_PROMPT` variables.

Limitation: prompt text is static (written at build time). Variable substitution is limited to what Claude Code provides (`$TOOL_INPUT`, etc.). This is acceptable -- prompt rules are safety/review instructions, not dynamic logic.

## Acceptance Criteria

- AC-1: A YAML rule with `event: PreToolUse`, `mechanism: script`, `script: ~/scripts/guard.sh` generates a `"type": "command"` hooks.json entry that runs `guard.sh` directly (no dispatcher). [traces: UC-1]
- AC-2: A YAML rule with `event: UserPromptSubmit`, `mechanism: prompt`, `prompt: "Review for security..."` generates a `"type": "prompt"` hooks.json entry with the prompt text inline. [traces: UC-2]
- AC-3: A YAML rule with `event: PreToolUse`, `mechanism: regex`, `field: command`, `pattern: "rm\\s+-rf"`, `result: deny` generates a `"type": "command"` entry calling `regex-match.sh` that blocks matching commands. [traces: UC-3]
- AC-4: `hooklib.sh` exports `deny()`, `ask()`, `warn()`, `context()`, `read_input()`, `get_field()`, `log()`. A script rule can `source "$HOOKLIB"` and call `deny "reason"`. [traces: UC-4]
- AC-5: When a script rule exits non-zero and `fail_mode: open`, the wrapper allows the operation. When `fail_mode: closed`, the wrapper denies. [traces: UC-E1]
- AC-6: Given rules `aaa-guard.yaml` and `zzz-guard.yaml` for the same event+matcher, `aaa` appears first in hooks.json. [traces: UC-E2]
- AC-7: Running `/lean-hooks build` with an invalid rule (e.g., `result: deny` on `PostToolUse`) prints an error and skips that rule.
- AC-8: Running `/lean-hooks build` with a missing script file prints an error and skips that rule.
- AC-9: Disabled rules (`enabled: false`) are excluded from the generated hooks.json entirely.
- AC-10: `/lean-hooks list` shows a table of all rules with name, event, mechanism, result, enabled status.

## Alternatives Considered

1. **Runtime dispatcher (previous design)** -- Rejected. One dispatcher per event that reads rule files on every invocation. This is the hookify pattern: middleware that sits between Claude Code and rule logic. Adds latency, prevents native `"type": "prompt"` hooks, and adds a complex dispatch-core.sh engine. The build-step model is simpler and faster.

2. **Markdown with YAML frontmatter** -- Considered for rule files. Rejected in favor of plain YAML because: (a) no meaningful "body" content separate from frontmatter fields, (b) simpler to parse, (c) prompt text fits in a YAML `prompt: |` block just fine.

3. **Plugin auto-rebuild on SessionStart** -- The plugin could register a SessionStart hook that detects rule file changes and rebuilds. Rejected because hooks.json is already loaded by the time SessionStart fires -- changes would not take effect until the next session anyway. A manual build step is more honest about the restart requirement.

## Impact

- Replaces per-hook entries in `settings.json` with declarative YAML rules
- Existing hooks migrate incrementally: write a YAML rule, run build, remove the old settings.json entry
- Simple regex hooks (bash-safety-guard patterns) become 5-line YAML files
- Complex stateful hooks (process-kill-guard) become script-type rules with the same bash logic but consistent metadata
- True `"type": "prompt"` support enables LLM-evaluated safety gates that were impossible with the dispatcher model

## Decisions

1. **Build step over runtime dispatch**: Trading dynamic reload for native hook types and zero middleware. Rules change infrequently; a rebuild + restart is acceptable.
2. **YAML over markdown**: Simpler parsing, no body/frontmatter split to manage.
3. **Rules live in `~/.claude/hooks/rules/`**: User-owned directory, not inside plugin cache. The plugin reads from here during build.
4. **One hook entry per rule**: No aggregation across rules. Each rule is its own hooks.json entry. Claude Code handles running multiple hooks per event natively.
5. **jq as the only external dependency**: Already required by Claude Code hooks generally.
