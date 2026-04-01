# Design: SessionStart Git Status Hook

## Approach

A single bash script (`session-git-status.sh`) that:
1. Consumes stdin JSON (standard hook protocol)
2. Checks if CWD is inside a git work tree
3. Gathers git status data via porcelain commands
4. Formats a compact summary string
5. Outputs `additionalContext` JSON so Claude receives the summary

## Component Design

### Script: `src/claude/hooks/session-git-status.sh`

**Input**: JSON on stdin (may contain `session_id`, `cwd`; not used — we rely on `$PWD`)

**Git data gathered**:
- Branch: `git rev-parse --abbrev-ref HEAD`
- Staged count: `git diff --cached --numstat | wc -l`
- Unstaged count: `git diff --numstat | wc -l`
- Untracked count: `git ls-files --others --exclude-standard | wc -l`
- Ahead/behind: `git rev-list --left-right --count @{upstream}...HEAD` (with fallback if no upstream)

**Output format** (additionalContext string):
```
GIT STATUS: branch=main | staged=0 unstaged=2 untracked=1 | ahead=1 behind=0
```

If no changes and not ahead/behind, still output branch name so Claude knows the repo state:
```
GIT STATUS: branch=main | clean | in-sync
```

**Error handling**:
- Not a git repo → `exit 0` (no output)
- No upstream configured → omit ahead/behind, show "no-upstream"
- Any git command fails → `exit 0` (silent failure, don't block session)

### Settings change: `src/claude/settings.json`

Add new `SessionStart` hook entry:
```json
"SessionStart": [
  {
    "hooks": [
      {
        "type": "command",
        "command": "bash ~/.claude/hooks/session-git-status.sh",
        "timeout": 5
      }
    ]
  }
]
```

## Data Flow

```
Session starts → Claude Code fires SessionStart event
  → session-git-status.sh receives JSON stdin
  → Script runs git commands against $PWD
  → Script outputs additionalContext JSON to stdout
  → Claude Code injects context string into conversation
  → Claude sees git status summary before first user message
```
