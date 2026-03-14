---
description: Execute implementation tasks from feature spec and task list (also handles /continue-feature)
---

## Feature ID

$ARGUMENTS

## Plugins & Skills Composed

| Step | Plugin/Skill | Purpose |
|------|-------------|---------|
| Context | OpenSpec CLI | Read change metadata, artifact state, task progress |
| Context | `linear` plugin | Fetch ticket details |
| Context | `claude-mem` plugin | Recall decisions from /specify |
| Team | `implementer` + `reviewer` + `verifier` agents | Per-task implementation loop with review |
| Signoff | `architect` + `verifier` agents | Feature signoff after all tasks complete |
| Parallel Tasks | Agent tool with isolation | Run `[P]` tasks concurrently in worktrees |
| TDD | `test-driven-development` skill | Red-green-refactor when mode is TDD |
| Debugging | `systematic-debugging` skill | Root-cause analysis on failures |
| Implementation | `context7` plugin | Fetch latest library docs |
| Implementation | Project skills | Domain patterns (mobile/frontend/backend) |
| UI Components | `frontend-design` skill | Production-grade UI |
| Phase Review | `phase-review` skill | Combined Codex CLI + Claude code review |
| Simplification | `/simplify` skill | Clean up code before final review |
| Final Review | `pr-review-toolkit` agents | Comprehensive review suite |

## Process

### 1. Load Context

**Auto-detect feature ID** if `$ARGUMENTS` is empty or partial:
1. If empty: detect from worktree name (`~/code/feature_worktrees/[FEATURE-ID]`) or git branch (`feature/[FEATURE-ID]`)
2. If partial match (e.g., `HL-80`): glob match against worktree directories

```bash
if [ -z "$FEATURE_ID" ]; then
  # Auto-detect from worktree path or branch name
  FEATURE_ID=$(basename "$PWD" 2>/dev/null)
  # Fallback: parse from git branch
  [ -z "$FEATURE_ID" ] && FEATURE_ID=$(git branch --show-current | sed 's|feature/||')
fi
WORKTREE=$(ls -d "$HOME/code/feature_worktrees/${FEATURE_ID}"* 2>/dev/null | head -1)
if [ -z "$WORKTREE" ]; then echo "ERROR: No worktree found for $FEATURE_ID"; exit 1; fi
cd "$WORKTREE"
```

- **Read OpenSpec metadata**:
  ```bash
  openspec status --change "$FEATURE_ID" --json
  cat openspec/changes/$FEATURE_ID/.openspec.yaml
  ```
  Extract: mode (tdd/non-tdd), linear-ticket, branch, artifact states, task progress.

- Fetch ticket (if Linear ID present): `mcp__plugin_linear_linear__get_issue` with ticket ID
- Search memory: `mcp__plugin_claude-mem_mcp-search__search` for relevant patterns and decisions
- **Read context files** via OpenSpec:
  ```bash
  openspec instructions apply --change "$FEATURE_ID" --json
  ```
  This returns contextFiles (spec, design, tasks — or diagnosis, fix-plan, tasks for bugfix), progress, and dynamic instructions. Read all context files listed.

- Note schema from `.openspec.yaml` (`feature-tdd`, `feature-rapid`, or `bugfix`)
  - `feature-tdd`: TDD rules apply — tests before impl, coverage >= 90%
  - `feature-rapid`: No test requirements — type-check and build only
  - `bugfix`: Root cause investigation → regression test → fix

### 1b. Check for Resume State

Before starting fresh, check if this is a resumed session:
- Run `git status` to check for uncommitted changes from a previous run
- Check `openspec/changes/$FEATURE_ID/tasks.md` for any `[→]` (in-progress) tasks
- If uncommitted changes exist, use the `AskUserQuestion` tool to present them and ask whether to continue or discard
- If a task is marked `[→]`, resume from that task instead of starting over

### 2. Understand Task Graph

Read `openspec/changes/$FEATURE_ID/tasks.md` and identify:
- Which tasks are pending `[ ]` (skip `[x]` done and `[~]` skipped)
- Dependencies via `(depends: Txxx)` — a task is **ready** when all its dependencies are `[x]`
- Groups of `[P]` tasks that can run in parallel

### 2b. Task-First Gate

**All work MUST be tracked in `openspec/changes/$FEATURE_ID/tasks.md` before implementation begins.**

If the user requests work (bug fix, enhancement, new requirement) that doesn't have a corresponding task:
1. **Stop** — do not start coding
2. **Add a new phase** (or append to the current phase) in tasks.md with properly numbered tasks
3. **Each task MUST include scope description:**
   ```
   - [ ] T050: [Short title] (depends: T049)
     - **Why**: [Which spec requirement this satisfies, or bug/issue being fixed]
     - **Files**: [Files to create or modify]
     - **Done when**: [Concrete, verifiable completion criteria]
   ```
4. **Include dependencies** on existing tasks where applicable
5. **Then proceed** with implementation following the normal task execution flow

The only exceptions are trivial one-line fixes (typos, formatting) that don't warrant tracking.

### 3. Execute Tasks (Implementer → Reviewer → Verifier Loop)

#### Size threshold:

**Small features (≤ 2 non-gate tasks)**: Execute tasks directly without the team loop. Implement, self-review, and verify inline. The team overhead isn't justified for trivial changes.

**Larger features (≥ 3 non-gate tasks)**: Use the full Implementer→Reviewer→Verifier team loop described below.

#### Task status tracking:

**Before starting any task**, mark it `[→]` in tasks.md immediately. This enables crash recovery.

After completing a task, mark it `[x]` in tasks.md.

#### For `[P]` (parallel) task groups:

**Important**: Only dispatch parallel agents if the `[P]` tasks touch **completely different files**. Check the spec's "Files to Create/Modify" section. If any `[P]` tasks share files, run them sequentially.

Dispatch one implementation team per `[P]` task using the Agent tool with `isolation: "worktree"` to prevent file conflicts.

#### Per-Task Team Loop:

For each task, spawn the implementation team:

1. **Mark task `[→]`** in tasks.md
2. **Spawn Implementer** — Agent tool with `name: "implementer"`, `subagent_type: "implementer"`. Provide:
   - Task details (Why, Files, Verify from tasks.md)
   - Spec and design context
   - Schema mode (tdd/rapid/bugfix)
   - If TDD mode: instruct to follow `test-driven-development` skill
3. **Implementer writes code**, self-tests, then signals Reviewer via `SendMessage({to: "reviewer"})`
4. **Reviewer reviews** against spec and coding standards:
   - **Approve**: Reviewer forwards to Verifier via `SendMessage({to: "verifier"})`
   - **Reject**: Reviewer sends feedback to Implementer via `SendMessage({to: "implementer"})` — Implementer fixes and resubmits (max 3 iterations)
5. **Verifier runs verification** steps from the task's "Verify" section:
   - **Pass**: Task is verified — mark `[x]` in tasks.md
   - **Fail**: Verifier sends failure details to Implementer via `SendMessage({to: "implementer"})` — loop back to step 3
6. **After 3 failed iterations** on the same issue: use `AskUserQuestion` tool to escalate to user with details

#### On ANY failure (test, build, type error):

**Invoke `systematic-debugging` skill.** Do NOT guess-fix.

### 4. Phase Review

After completing all tasks in a phase:

**Verify before claiming phase is done:**
- Run type check: `pnpm type-check` (or per-package equivalent)
- Run tests: `pnpm test:changed` (TDD mode: `pnpm test -- --coverage`)
- Run build: `pnpm build`
- Read output, confirm exit codes, count failures
- Only THEN claim phase completion

**Invoke `phase-review` skill** — runs Codex CLI and feature-dev:code-reviewer in parallel, synthesizes findings:
- Review against spec requirements and acceptance criteria
- Target: >= 9/10 score

**If score < 9/10** (max 3 iterations):
1. Analyze feedback
2. Implement fixes (use `systematic-debugging` skill if non-obvious)
3. Re-verify (run commands, read output, confirm)
4. Re-run phase-review
5. If still < 9 after 3 iterations, escalate to user

### 5. Commit Phase

After review passes, auto-commit without waiting for user approval. Pre-commit hooks (lint, type-check) enforce quality.

```bash
git add [related-files]
git commit -m "feat: [FEATURE_ID] [description]

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Continue to next phase immediately.** Only pause for user input if:
- Review score < 9/10 after 3 iterations
- A task has `[NEEDS CLARIFICATION]`
- A merge conflict requires judgment

### 6. Final Validation

- All tasks in tasks.md should be `[x]` or `[~]`
- No `[ ]` or `[→]` remaining

```bash
pnpm test
pnpm build
git status
```

Read full output. Confirm all pass with evidence. THEN proceed.

### 7. Architect + Verifier Signoff

After all tasks are complete and validated, run the signoff gate automatically.

**Spawn Architect** — Agent tool with `name: "architect"`, `model: "opus"`, `subagent_type: "architect"`. Provide:
- Full spec.md and design.md content
- The git diff of all changes: `git diff main...HEAD`
- Instruction to review implementation against spec for gaps, spec drift, and coding practices

**Spawn Verifier** — Agent tool with `name: "verifier"`, `subagent_type: "verifier"`. Provide:
- spec.md acceptance criteria
- Instruction to run comprehensive feature-level verification (full test suite, build, type-check, each acceptance criterion)

Run both in parallel. Collect findings.

**If gaps are found** (max 2 signoff rounds):
1. Architect generates new tasks (T-N+1, T-N+2, etc.) with Why, Files, Verify
2. Append new tasks to tasks.md as a new phase ("Phase N+1: Signoff Fixes")
3. Re-enter the Implementer→Reviewer→Verifier loop (step 3) for the new tasks
4. After new tasks complete, re-run signoff (step 7)
5. If gaps remain after 2 signoff rounds, use `AskUserQuestion` tool to present remaining gaps and ask user for direction

**If signoff is clean**:
- Use `AskUserQuestion` tool to present signoff summary and ask user to approve before marking feature ready for `/complete-feature`

### 8. Simplify Code

**Before reviewing, simplify.** Invoke the `/simplify` skill on changed files.

If simplification makes changes, re-run verification (step 6) to confirm nothing broke.

### 9. Final Comprehensive Review

Run review suite in parallel (these are independent):

**a. Code Quality** - Task tool with `subagent_type=pr-review-toolkit:code-reviewer`
**b. Silent Failures** - Task tool with `subagent_type=pr-review-toolkit:silent-failure-hunter`
**c. Type Design** - Task tool with `subagent_type=pr-review-toolkit:type-design-analyzer`
**d. Test Coverage** (TDD mode) - Task tool with `subagent_type=pr-review-toolkit:pr-test-analyzer`

Launch all applicable reviews in parallel. Aggregate results.

**If any critical issues found:** Fix, re-run `/simplify` if needed, and re-verify before proceeding.

### 10. Store Learnings

Use `mcp__plugin_claude-mem_mcp-search__save_observation` with project `[FEATURE_ID]`:
- Implementation patterns discovered
- Problems solved and approaches used
- Reusable insights

### 11. Update Linear (if applicable)

If a Linear ticket exists (from `.openspec.yaml`), use `mcp__plugin_linear_linear__save_issue` to set status to "In Review" with implementation summary.

### 12. Report

Output:
- Task summary from tasks.md (count of done/skipped/total)
- Commits created
- Test results (TDD mode)
- Final review scores
- Any blockers or notes

## Autonomy Guidelines

**Run without asking unless:**
- A task has `[NEEDS CLARIFICATION]` in the spec
- Review score < 9/10 after 3 iterations
- Merge conflict that can't be auto-resolved
- Test failure that systematic-debugging can't resolve after 2 attempts

**Never start untracked work:**
- Every code change must map to a task in `tasks.md`
- If work doesn't have a task, create one first — then implement

**Always use `AskUserQuestion` tool to pause for user approval on:**
- Skipping a task (mark `[~]` with reason)
- Signoff approval (after architect+verifier pass)

## Quality Standards

| Schema | Tests | Coverage | Review Score | Final Review |
|--------|-------|----------|--------------|--------------|
| feature-tdd | Before impl | >= 90% | >= 9/10 | phase-review + silent-failure + type-design + test-analyzer + /critique (UI) |
| feature-rapid | Optional | N/A | >= 9/10 | phase-review + silent-failure + /critique (UI) |
| bugfix | Regression test required | N/A | >= 9/10 | phase-review + silent-failure |

## Next Step
Use `/complete-feature [FEATURE_ID]` to merge and cleanup.
