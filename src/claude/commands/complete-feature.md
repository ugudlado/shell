---
description: Complete feature development with merge to main and cleanup
model: haiku
---

## Feature ID

$ARGUMENTS

## Skills Composed

| Step | Skill | Purpose |
|------|-------|---------|
| Context | OpenSpec CLI | Read change metadata and verify completion |
| Verification | Verification gate | Evidence before claiming ready |
| Completion | Branch finishing flow | Structured merge and cleanup |
| Memory | `claude-mem` plugin | Store final learnings |
| Review | PAL MCP (`clink`) | Advisory cross-model review via Codex CLI |
| Ticket | `linear` plugin | Close ticket |

## Process

### 1. Verify Completion

**Find worktree** (feature ID may be partial):
```bash
WORKTREE=$(ls -d "$HOME/code/feature_worktrees/${FEATURE_ID}"* 2>/dev/null | head -1)
if [ -z "$WORKTREE" ]; then echo "ERROR: No worktree found for $FEATURE_ID"; exit 1; fi
cd "$WORKTREE"
```

**Read OpenSpec metadata:**
```bash
cat openspec/changes/$FEATURE_ID/.openspec.yaml
openspec status --change "$FEATURE_ID" --json
```

Confirm all artifacts are DONE and all tasks are checked off.

**Verify with evidence before claiming ready:**

```bash
cd "$WORKTREE"

# All tasks done?
grep -c "\[ \]" openspec/changes/$FEATURE_ID/tasks.md  # Should be 0

# Tests pass?
pnpm test

# Build passes?
pnpm build

# Clean state?
git status
```

Read all output. Confirm all pass with evidence. If anything fails, stop and fix before proceeding.

### 2. Advisory Codex Review (via PAL MCP)

Run a final cross-model review of the full feature diff. This is **advisory** — findings are presented to the user but do not block the merge.

Use the PAL MCP `clink` tool to invoke Codex CLI:

```
clink with codex codereviewer to review the full feature diff (git diff main...HEAD) in this repository. Focus on:
1. Bugs, logic errors, and security vulnerabilities
2. Missing error handling or edge cases
3. Code quality and consistency issues
Report findings with file paths and line numbers. Categorize as: critical, important, or advisory.
```

**Present findings to the user** with the label `[codex-final]`. The user decides whether to fix issues or proceed with the merge.

### 3. Sync With Main

```bash
cd "$WORKTREE"
git fetch origin
git merge origin/main
```

If conflicts: resolve them carefully, re-test, re-build. Verify again with evidence.

**Note**: If merge conflicts involve complex code semantics (not just formatting), escalate to the user rather than guessing at resolution.

### 4. Archive Change via OpenSpec

Use OpenSpec to archive the completed change:

```bash
cd "$WORKTREE"
openspec archive "$FEATURE_ID"
```

This moves `openspec/changes/$FEATURE_ID/` to `openspec/changes/archive/YYYY-MM-DD-$FEATURE_ID/` and syncs any delta specs into `openspec/specs/`.

```bash
git add openspec/
git commit -m "chore: archive specs for $FEATURE_ID

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

### 5. Finish Branch (invoke skill)

**Finish the branch.** Merge to main and clean up:


```bash
MAIN_REPO=$(git worktree list | head -1 | awk '{print $1}')
cd "$MAIN_REPO"
git merge --no-ff "feature/$FEATURE_ID"
git worktree remove "$WORKTREE_PATH"
git branch -d "feature/$FEATURE_ID"
```

### 6. Close Out

After the finishing skill completes:

- If a Linear ticket exists (from `.openspec.yaml`), update it to "Done": `mcp__plugin_linear_linear__save_issue`
- Store final learnings via `mcp__plugin_claude-mem_mcp-search__save_observation` with project `[FEATURE_ID]`
  - What worked well
  - What was harder than expected
  - Patterns worth reusing

### 7. Reflect on Session Mistakes

Run the `/reflect` workflow to process any flagged sessions from this feature's development. This extracts permanent learnings from mistakes made during implementation and writes them to MEMORY.md or CLAUDE.md.

Check if `~/.claude/projects/*/memory/auto-lessons.md` has entries marked `needs-review`. If yes, process them following the `/reflect` instructions. If no flagged sessions exist, skip this step.

### 8. Report

```
Feature Complete: [FEATURE_ID]
- Merged to main, worktree cleaned up
- Linear ticket closed
- Learnings stored in memory
```
