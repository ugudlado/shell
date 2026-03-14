---
feature-id: 2026-03-15-session-git-status-hook
linear-ticket: none
---

# SessionStart Git Status Hook

## Motivation

The CLAUDE.md lessons learned section explicitly states: "Session start: check git status — Always run `git status` at session start and explicitly note whether prior session's changes are committed vs working-tree-only to avoid false 'revert' confusion."

Currently this is a manual discipline. A SessionStart hook can automate it by injecting a compact git status summary into Claude's context at the beginning of every session, eliminating the risk of Claude misunderstanding the working tree state.

## Requirements

- **R1**: On session start, inject a compact git status summary into Claude's context via `additionalContext`
- **R2**: Summary must include: current branch name, count of uncommitted changes (staged + unstaged + untracked), and ahead/behind remote tracking branch
- **R3**: Gracefully handle non-git directories (no error, no output)
- **R4**: Complete within 5 seconds (timeout guard)
- **R5**: Follow existing hook conventions (shebang, set -euo pipefail, stdin consumption, JSON output)

## Architecture

Single bash script registered as a `SessionStart` hook in `settings.json`. Uses `git` CLI commands to gather status info, formats a compact summary, and outputs it as `additionalContext` JSON. No external dependencies beyond `git`, `jq`, and standard shell utilities.

## Acceptance Criteria

1. Starting a new Claude Code session in a git repo shows branch name, change counts, and ahead/behind in Claude's context
2. Starting a session in a non-git directory produces no error and no injected context
3. Hook completes in under 2 seconds for typical repos
4. Output follows the `hookSpecificOutput.additionalContext` JSON format used by existing hooks
