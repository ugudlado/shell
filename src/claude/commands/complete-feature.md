---
description: Complete feature development with merge to main and cleanup
gitignored: true
project: true
---

## Feature ID

$ARGUMENTS

Use the Agent tool to spawn a haiku-agent with the following prompt, passing the Feature ID above:

---

# Complete Feature — Autonomous Agent Task

Complete the feature with ID: [FEATURE_ID from arguments]

## Skills Composed

| Step | Skill | Purpose |
|------|-------|---------|
| Context | OpenSpec CLI | Read change metadata and verify completion |
| Verification | Verification gate | Evidence before claiming ready |
| Completion | Branch finishing flow | Structured merge and cleanup |
| Memory | `claude-mem` plugin | Store final learnings |
| Ticket | `linear` plugin | Close ticket |
| Retrospective | Native tasks (`TaskList`) | Count planned vs unplanned tasks by phase category |
| Telemetry | `~/.claude/logs/feature-metrics.jsonl` | Append per-feature metrics for `/diagnose` trending |
| Reflect | `/reflect` workflow | Mandatory session mistake extraction |

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

Confirm all artifacts are DONE and all tasks are completed.

**Verify with evidence before claiming ready:**

1. **All tasks done?** Run `TaskList` — confirm zero `pending` or `in_progress` tasks. Native tasks are the source of truth (not tasks.md).

```bash
cd "$WORKTREE"

# Tests pass?
pnpm test

# Build passes?
pnpm build

# Clean state?
git status
```

Read all output. Confirm all pass with evidence. If anything fails, stop and fix before proceeding.

### 2. Sync With Main

All reviews and verification are completed during `/implement`. This step only handles merge logistics.

```bash
cd "$WORKTREE"
git fetch origin
git merge origin/main
```

If conflicts: spawn a `sonnet-agent` to resolve them. Provide:
- The conflict markers (`git diff --name-only --diff-filter=U` for conflicted files)
- `git log --oneline main..HEAD` and `git log --oneline HEAD..origin/main` for both sides' history
- The feature spec context from `openspec/changes/$FEATURE_ID/spec.md`
- Instruction to resolve based on commit intent from history, not guessing

After resolution, re-test and re-build. Verify again with evidence. If the sonnet-agent cannot confidently resolve (e.g., both sides made intentional competing changes to the same logic), use `AskUserQuestion` tool to escalate to the user.

### 3. Archive Change via OpenSpec

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

### 4. Spec Retrospective

**Run BEFORE worktree removal** — needs `git diff` from the worktree.

Compare what the spec predicted against what actually happened. This feeds back to improve future `/specify` runs.

**4a. Spec accuracy — predicted vs actual files:**

```bash
cd "$WORKTREE"
# Actual files changed
git diff --stat main...HEAD --name-only > /tmp/actual-files.txt
```

Read the spec's `design.md` "Files to Create/Modify" section and compare against actual files changed.

Compute:
- **Predicted files**: files listed in design.md
- **Actual files**: files from `git diff --stat`
- **Hit rate**: (predicted ∩ actual) / actual — what % of actual changes did the spec predict?
- **Noise rate**: (predicted - actual) / predicted — what % of spec predictions were unnecessary?
- **Surprise files**: actual - predicted — files that needed changes but weren't in the spec

**4b. Task granularity — planned vs unplanned work:**

Run `TaskList` and categorize all tasks by their `metadata.phase`:

| Category | Phase values | Meaning |
|----------|-------------|---------|
| **Planned** | `Phase 1`, `Phase 2`, etc. | Original tasks from `/specify` |
| **Review fixes** | `Review Fixes` | Issues caught by final review (step 8) |
| **Signoff fixes** | `Signoff Fixes` | Gaps found during architect/verifier signoff (step 9) |
| **Simplification fixes** | `Simplification Fixes` | Issues found during code cleanup (step 7) |
| **Verification bugs** | Any task created during phase verification (step 4) | Broken assumptions in verify steps |
| **User requests** | `User Request` | Scope additions by the user mid-implementation |

Count tasks in each category. Compute:
- **Planned tasks**: count of Phase N tasks
- **Unplanned tasks**: review fixes + signoff fixes + simplification fixes + verification bugs (excludes user requests — those aren't quality signals)
- **Unplanned ratio**: unplanned / (planned + unplanned) — lower is better
- **Top unplanned source**: which category contributed most unplanned tasks

**4c. Write telemetry:**

Append one JSON line to `~/.claude/logs/feature-metrics.jsonl`:

```bash
mkdir -p ~/.claude/logs
```

```json
{
  "featureId": "FEATURE_ID",
  "schema": "feature-tdd|feature-rapid|bugfix",
  "completedAt": "ISO timestamp",
  "tasks": {
    "planned": N,
    "reviewFixes": N,
    "signoffFixes": N,
    "simplificationFixes": N,
    "verificationBugs": N,
    "userRequests": N,
    "skipped": N,
    "total": N
  },
  "unplannedRatio": 0.XX,
  "specAccuracy": {
    "predictedFiles": N,
    "actualFiles": N,
    "hitRate": 0.XX,
    "noiseRate": 0.XX,
    "surpriseFiles": ["file1.ts", "file2.ts"]
  },
  "reviewIterations": N,
  "signoffRounds": N
}
```

**4d. Save spec-gap feedback (if unplanned ratio > 0.2):**

If unplanned ratio exceeds 20%, analyze the unplanned tasks to identify patterns:
- Are they concentrated in one area (e.g., all error handling)?
- Do they share a common root cause (e.g., spec didn't consider edge cases)?

Save a feedback auto memory file (type: `feedback`) named `feedback_[FEATURE_ID]_spec_retrospective.md`:
- Content: what types of tasks were missed, and what `/specify` should include next time
- Include **Why:** and **How to apply:** lines
- Only save if the pattern is non-obvious and actionable

### 5. Close Out

- If a Linear ticket exists (from `.openspec.yaml`), update it to "Done": `mcp__plugin_linear_linear__save_issue`
- Store final learnings as auto memory file (type: `project`) named `project_[FEATURE_ID]_learnings.md`:
  - What worked well
  - What was harder than expected
  - Patterns worth reusing

### 6. Return to Main Session for Cleanup

**The haiku-agent stops here and returns results to the main session.** The following destructive operations (worktree removal, branch deletion) are handled by the main session, not the agent, per Agent Restrictions.

Return to the main session:
- Feature ID
- Worktree path (`$WORKTREE`)
- Branch name (`feature/$FEATURE_ID`)
- Retrospective metrics (telemetry from step 4c)
- Confirmation that all prior steps passed

**Main session then executes:**

**6a. Commit remaining changes:**

```bash
cd "$WORKTREE"
if [ -n "$(git status --porcelain)" ]; then
  # Use /commit-group to create logical commits for remaining changes
  echo "Uncommitted changes found — running /commit-group before merge"
fi
```

If `git status --porcelain` is non-empty, invoke the `/commit-group` skill in the worktree to commit remaining changes in logical groups. Only proceed with merge after the worktree is clean.

**6b. Merge to main:**

```bash
MAIN_REPO=$(git worktree list | head -1 | awk '{print $1}')
cd "$MAIN_REPO"
git merge --no-ff "feature/$FEATURE_ID"
```

**6c. Clean up worktree:**

Use the `ExitWorktree` tool to remove the worktree and its branch:

```
ExitWorktree({ action: "remove" })
```

The `WorktreeRemove` hook (`worktree-remove.sh`) automatically handles:
- `git worktree remove` with force flag
- `git worktree prune` for stale references
- `git branch -d` for the feature branch (warns if not merged)

### 7. Reflect on Session Mistakes (Mandatory, run by main session)

**This step is mandatory** — do not skip it. Extract permanent learnings from mistakes made during implementation.

1. Read `~/.claude/projects/*/memory/auto-lessons.md`
2. If entries marked `needs-review` exist:
   - Read referenced transcripts
   - Extract learnings following `/reflect` instructions
   - Write to MEMORY.md or CLAUDE.md as appropriate
   - Mark entries as `status: reviewed`
3. If no `needs-review` entries exist, log: "No sessions flagged for review — reflecting on feature metrics instead"
   - Check the telemetry from step 6c
   - If unplanned ratio > 0.3, flag as a learning: the spec process needs improvement for this type of feature
   - If any surprise files appear in >2 features (cross-reference `feature-metrics.jsonl`), save as a lesson

### 8. Report

```
Feature Complete: [FEATURE_ID]
- Merged to main, worktree cleaned up
- Linear ticket closed
- Learnings stored in memory

Metrics:
- Tasks: N planned, N unplanned (ratio: X%)
- Spec accuracy: X% hit rate, N surprise files
- Review iterations: N, Signoff rounds: N
- Top unplanned source: [category]
```
