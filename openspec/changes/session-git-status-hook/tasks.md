# Tasks: SessionStart Git Status Hook

## Phase 1: Implementation

- [ ] T-1: Create session-git-status.sh hook script
  - **Why**: R1, R2, R3 — core hook that gathers and outputs git status
  - **Files**: `src/claude/hooks/session-git-status.sh` (create)
  - **Verify**:
    - Script is executable (`chmod +x`)
    - Running `echo '{}' | bash src/claude/hooks/session-git-status.sh` in a git repo outputs valid JSON with `additionalContext`
    - Running it in `/tmp` (non-git) produces no output and exits 0
    - Output includes branch name, staged/unstaged/untracked counts, ahead/behind info

- [ ] T-2: Register SessionStart hook in settings.json
  - **Why**: R1, R4 — wire the script into Claude Code's hook system
  - **Files**: `src/claude/settings.json` (modify)
  - **Verify**:
    - SessionStart hook entry exists in settings.json
    - Hook entry has `timeout: 5`
    - JSON is valid
  - **depends**: T-1

## Phase 2: Validation

- [ ] T-3: End-to-end validation
  - **Why**: R1-R5 — confirm the hook works in a real session context
  - **Files**: none (manual verification)
  - **Verify**:
    - Symlink exists: `~/.claude/hooks/session-git-status.sh` → `src/claude/hooks/session-git-status.sh`
    - Script handles edge cases: detached HEAD, shallow clone, brand new repo with no commits
    - Script completes in under 2 seconds (measure with `time`)
  - **depends**: T-2

<!-- Status markers: [ ] pending, [→] in-progress, [x] done, [~] skipped -->
