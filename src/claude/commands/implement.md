---
description: Execute implementation tasks from feature spec and task list (also handles /continue-feature)
---

## Feature ID

$ARGUMENTS

## Plugins & Skills Composed

| Step | Plugin/Skill | Purpose |
|------|-------------|---------|
| Tasks | Claude native tasks (TaskCreate/Update/List) | Real-time tracking, spinners, dependency visualization |
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
| Evaluate | `iterate` skill | Score implementation quality across dimensions |
| Improve | Implementer→Reviewer→Verifier loop | Fix evaluation gaps before next phase |
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
  Extract: schema (`feature-tdd`, `feature-rapid`, or `bugfix`), linear-ticket, branch, artifact states, task progress.

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
- Run `TaskList` to check for any `in_progress` tasks from a prior session
- Run `openspec status --change "$FEATURE_ID" --json` to check artifact/task progress

**Auto-resume logic** (handle without asking when possible):
- If uncommitted changes exist AND they are on the feature branch AND tests pass → **auto-continue** (commit the work and proceed)
- If uncommitted changes exist AND tests fail → use `AskUserQuestion` to present status and ask whether to continue or discard
- If a task is `in_progress` → resume from that task instead of starting over
- If OpenSpec shows tasks partially complete → resume from the first incomplete task

### 1c. Verify Dependencies

On session start or resume, verify project dependencies are installed:
- If `package.json` exists: check `node_modules/` exists, run install command from CLAUDE.md if missing
- If `requirements.txt` or `pyproject.toml` exists: verify virtual environment, install if missing
- If `go.mod` exists: run `go mod download` if needed
- If `Makefile` has an `install` or `deps` target: run it

This is especially important on session resume — dependencies from a previous session may not be available in a new terminal.

### 2. Understand Task Graph

**Tasks are managed via Claude native task tools** (`TaskList`, `TaskGet`, `TaskUpdate`). The `CLAUDE_CODE_TASK_LIST_ID` environment variable is set to the feature ID by the SessionStart hook, so tasks persist across sessions in `~/.claude/tasks/$FEATURE_ID/`.

Run `TaskList` to see all tasks with their status, dependencies, and blockers. Identify:
- Which tasks are `pending` (skip `completed`)
- Dependencies via `blockedBy` — a task is **ready** when all blockers are `completed`
- Tasks with `metadata.parallel: true` that can run concurrently

**If no tasks exist yet** (first session for this feature): read the spec artifacts from `openspec/changes/$FEATURE_ID/` and create tasks via `TaskCreate` with proper dependencies via `addBlockedBy`.

### 2b. Task-First Gate

**All work MUST be tracked via `TaskCreate` before implementation begins.**

If the user requests work (bug fix, enhancement, new requirement) that doesn't have a corresponding task:
1. **Stop** — do not start coding
2. **Create task** via `TaskCreate` with:
   - `subject`: Short title
   - `description`: Why (requirement), Files (to create/modify), Verify (concrete criteria)
   - `metadata`: `{"phase": "Phase N"}`
3. **Wire dependencies**: `TaskUpdate` with `addBlockedBy` for any prerequisite tasks
4. **Then proceed** with implementation following the normal task execution flow

The only exceptions are trivial one-line fixes (typos, formatting) that don't warrant tracking.

### 3. Execute Tasks (Implementer → Reviewer → Verifier Loop)

#### Phase execution order:

Tasks are grouped by `metadata.phase`. Process phases in order (Phase 1 before Phase 2). After ALL tasks in Phase N are `completed`, run the phase gate (step 4) before proceeding to Phase N+1 tasks. Use `TaskList` and filter by `metadata.phase` to determine phase boundaries.

#### TDD task triples:

For `feature-tdd`, tasks come in RED/GREEN/REFACTOR triples per component. The Implementer handles all three as a **single TDD cycle** — not three independent task loops. The Reviewer reviews the entire triple (test + implementation + refactor together). The Verifier verifies: tests fail (RED), tests pass (GREEN), tests still pass after refactor. Mark all three tasks complete together.

#### Size threshold:

**Small features (≤ 2 non-gate tasks)**: Execute tasks directly without the team loop. Implement, self-review, and verify inline. The team overhead isn't justified for trivial changes.

**Larger features (≥ 3 non-gate tasks)**: Use the full Implementer→Reviewer→Verifier team loop described below.

#### Task status tracking:

Use `TaskUpdate` for all status transitions. Tasks persist automatically to `~/.claude/tasks/$FEATURE_ID/`.

| Action | Tool call |
|--------|-----------|
| Start task | `TaskUpdate(taskId, status: "in_progress")` |
| Complete task | `TaskUpdate(taskId, status: "completed")` |
| Skip task | `TaskUpdate(taskId, status: "deleted")` |

#### For `[P]` (parallel) task groups:

**Important**: Only dispatch parallel agents if the `[P]` tasks touch **completely different files**. Check the spec's "Files to Create/Modify" section. If any `[P]` tasks share files, run them sequentially.

Dispatch one implementation team per `[P]` task using the Agent tool with `isolation: "worktree"` to prevent file conflicts.

#### Per-Task Team Loop:

For each task, spawn the implementation team:

1. **Mark task started**: `TaskUpdate(taskId, status: "in_progress")`
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
   - **Pass**: `TaskUpdate(taskId, status: "completed")`
   - **Fail**: Verifier sends failure details to Implementer via `SendMessage({to: "implementer"})` — loop back to step 3
6. **After 3 failed iterations** on the same issue: use `AskUserQuestion` tool to escalate to user with details

**Bugfix-specific behavior**:
- **Phase 1 (Investigate)**: This is an investigation phase, not implementation. The Implementer should invoke `systematic-debugging` skill proactively to trace root cause. No code changes expected.
- **Phase 2 (Regression test)**: The Verifier should confirm the test **FAILS** (this is success — the test catches the bug). A passing test means the regression test doesn't reproduce the bug and should be rejected.
- **Phase 4 (Harden)**: Optional — execute if tasks exist, skip if none were created by the Architect. Include hardening when root cause was subtle, involved implicit assumptions, or could recur in similar code.

#### On ANY failure (test, build, type error):

**Invoke `systematic-debugging` skill.** Do NOT guess-fix.

### 4. Phase Review (OpenSpec Gate)

After completing all tasks in a phase, the phase gate enforces quality criteria per schema.

**Verify before claiming phase is done** (schema-specific):

| Schema | Gate Criteria |
|--------|--------------|
| `feature-tdd` | language checks ✓ + test with coverage ≥ 90% ✓ + build ✓ |
| `feature-rapid` | language checks ✓ + build ✓ |
| `bugfix` | language checks ✓ + test ✓ + build ✓ + zero regressions (no previously-passing test now fails) |

**Language-appropriate checks**: Check the project's CLAUDE.md or package.json for lint/type-check/build commands. If the project lacks quality tooling, **set it up first** — create package.json with lint, test, and format scripts appropriate to the language. Every project should have working gates before implementation begins.

**Coverage measurement** (feature-tdd only): Check the project's CLAUDE.md, package.json scripts, or test config for a coverage command (e.g., `vitest run --coverage`, `jest --coverage`, `pytest --cov`). Parse the summary output to extract the percentage. If coverage tooling is not configured, set it up (e.g., add vitest coverage config with c8). If it cannot be configured, escalate to user.

**Phase review scope**: Review only the code changed in THIS phase — `git diff` from the last phase commit (or branch start for Phase 1) to HEAD. Cross-phase integration is validated at step 6b.

**Cross-phase regression**: At each phase gate, run the FULL test suite (all phases), not just tests created in the current phase. This catches regressions in earlier phases caused by new code.

Run the appropriate verification commands, read output, confirm exit codes. Only THEN claim phase completion.

**Invoke `phase-review` skill** — runs Codex CLI and feature-dev:code-reviewer in parallel, synthesizes findings:
- Review against spec requirements and acceptance criteria
- Target: ≥ 9/10 score
- If UI changes in this phase: also invoke `/critique` for UX review

**The `phase-gate.sh` hook enforces this gate** — it runs on SubagentStop after reviewer agents complete and blocks (exit 2) if the phase review score < 9/10, forcing a fix cycle. This ensures the gate is enforced by the harness, not just by instructions that could be lost in context.

**If score < 9/10** (max 3 iterations):
1. Analyze feedback — categorize as critical, important, advisory
2. Fix critical and important issues (use `systematic-debugging` skill if non-obvious)
3. Re-verify (run commands, read output, confirm)
4. Re-run phase-review
5. If still < 9 after 3 iterations, escalate to user with review details

### 4b. Phase Evaluation & Iteration (Evaluate-Improve Loop)

After phase review passes (≥ 9/10), **evaluate the phase implementation** against quality dimensions using the `iterate` skill's evaluation framework. This catches issues that a code review misses — UX gaps, performance problems, test coverage holes, DX rough edges.

#### Evaluate

Score this phase's implementation across applicable dimensions (1-10 each):

| Dimension | Weight | What to Check |
|-----------|--------|--------------|
| Code Quality | 0.25 | Patterns, DRY, error handling, edge cases, readability |
| UX Quality | 0.25 (skip if no UI) | Invoke `/critique` — visual hierarchy, states, accessibility |
| Performance | 0.15 | N+1 queries, re-renders, blocking ops, bundle size |
| Test Quality | 0.20 | Critical path coverage, edge cases, assertion quality |
| Developer XP | 0.15 | API ergonomics, naming, sensible defaults |

**Scope**: Only evaluate files changed in this phase (not the entire codebase). Use `git diff` against the commit before the phase started.

Compute **weighted overall score** (redistribute weights if UX/tests N/A for this schema).

**Schema-aware adjustments**:
- **`feature-rapid`**: Set Test Quality weight to 0 (tests are optional per schema) and UX Quality to 0 if no UI. Redistribute weights proportionally. A low Test Quality score MUST NOT trigger the "dimension < 7" fix requirement — it's excluded entirely.
- **`bugfix`**: Evaluate Code Quality (weight 0.55) and Test Quality (weight 0.45) only. Set UX, Performance, and DX to 0 — a minimal fix should not be penalized for not improving those dimensions.
- **CLI tools with no UI**: Replace UX Quality with CLI Ergonomics (help text, output formatting, error messages, flag conventions).
- Skip any dimension that doesn't apply to the project type.

#### Improve (if needed)

**If overall score ≥ 8.5**: Phase is good enough — proceed to commit. Log scores.

**If overall score < 8.5**: Run one improvement round:
1. Identify top 3 highest-impact improvements (by score delta, user-facing first)
2. Create improvement tasks via `TaskCreate` with `metadata: {"phase": "Phase N Improve"}`
3. Execute through Implementer → Reviewer → Verifier loop
4. Re-verify (type-check, test, build)
5. Re-score — if still < 8.5 after one round, log remaining gaps and proceed (don't block indefinitely)

**If any dimension scores < 7**: That's a red flag — fix that dimension specifically before proceeding, even if the overall score is ≥ 8.5.

#### Concrete Example

Phase review scores 9.2/10 (clean code, good patterns) but evaluation finds UX=6.5 (no loading states, missing error handling in UI), Performance=6.8 (N+1 query in list view). Overall: 7.9 — triggers improvement round targeting UX and Performance.

#### Record Scores

Store phase evaluation scores in workflow state (if `/develop` is active):
```json
{
  "phases": [
    {
      "name": "Phase 1",
      "review_score": 9.2,
      "evaluation": {"code": 8.5, "ux": 9, "perf": 8, "test": 9, "dx": 8.5, "overall": 8.6}
    }
  ]
}
```

Also include scores in the phase commit message (see step 5).

### 5. Commit Phase

After review passes, auto-commit without waiting for user approval. Pre-commit hooks (lint, type-check) enforce quality.

```bash
git add [related-files]
git commit -m "feat: [FEATURE_ID] Phase N — [description]

Review: [score]/10 | Evaluation: code=X ux=Y perf=Z test=A dx=B overall=C
Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Continue to next phase immediately.** Only pause for user input if:
- Review score < 9/10 after 3 iterations
- A task has `[NEEDS CLARIFICATION]`
- A merge conflict requires judgment

### 5b. Export tasks.md

**After each phase commit**, generate a read-only `tasks.md` snapshot from native tasks for git history:

1. Run `TaskList` to get all tasks with current statuses
2. For each task, run `TaskGet` to retrieve full description (Why, Files, Verify)
3. Generate `openspec/changes/$FEATURE_ID/tasks.md` in markdown format:
   - Group tasks by `metadata.phase`
   - Use `[x]` for completed, `[ ]` for pending, `[→]` for in_progress, `[~]` for deleted
   - Include subject, description fields, and blockedBy as `(depends: #N)`
4. Include in the phase commit: `git add openspec/changes/$FEATURE_ID/tasks.md`

**Lifecycle**: `/specify` creates the initial `tasks.md` as a spec artifact that seeds `TaskCreate` calls. Once `/implement` starts and creates native tasks, `tasks.md` becomes a **generated export** overwritten at each phase commit. The spec-authored version is consumed once; native tasks are the source of truth thereafter.

**Fallback (no TaskList tools)**: If native task tools (`TaskCreate`, `TaskList`, `TaskGet`) are unavailable, track tasks directly in `tasks.md` using checkbox syntax: `[x]` completed, `[ ]` pending, `[→]` in progress, `[~]` skipped. Update the file manually after each task completes and include it in phase commits.

### 6. Final Validation

- Run `TaskList` — all tasks should be `completed`
- No `pending` or `in_progress` remaining

Run the project's verification commands (from CLAUDE.md or package.json):
- **feature-tdd**: test command + build command (both required, coverage ≥ 90%)
- **feature-rapid**: build command only (skip tests if none exist for this feature)
- **bugfix**: test command + build command (regression test must pass)
- Run `git status` to confirm clean state

Read full output. Confirm all pass with evidence. THEN proceed.

### 6b. Feature-Level Evaluation (Full Iterate Assessment)

After all phases pass and before signoff, run a **full feature evaluation** across the entire implementation (not just one phase). This is the `iterate` skill applied to the complete feature diff.

**Evaluate** the full `git diff main...HEAD` — focus on **cross-phase integration** that individual phase evaluations could not catch:
- API consistency across components, data flow end-to-end
- Cumulative performance impact, overall UX coherence
- Individual module quality was already scored per-phase — only re-evaluate if phases interact in ways that create new concerns
- Score the same 5 dimensions but from a whole-feature perspective

**Improve** (up to 2 rounds, targeting the weakest dimensions):
1. If overall score < 8.5 or any dimension < 7:
   - Identify the weakest dimension(s)
   - Create targeted improvement tasks via `TaskCreate` with `metadata: {"phase": "Pre-Signoff Improve"}`
   - Execute through Implementer → Reviewer → Verifier loop
   - Re-verify, re-score
2. After 2 rounds or when overall ≥ 8.5 with no dimension < 7, proceed to signoff

**Present evaluation scores** to the signoff agents — architect and verifier should see the quality assessment when they do their review.

### 7. Architect + Verifier Signoff

After all tasks are complete and validated, run the signoff gate automatically.

**Spawn Architect** — Agent tool with `name: "architect"`, `model: "opus"`, `subagent_type: "architect"`. Provide:
- Full artifact content: spec.md + design.md (feature-tdd/rapid) or diagnosis.md + fix-plan.md (bugfix)
- The git diff of all changes: `git diff main...HEAD`
- Instruction to review implementation against spec for gaps, spec drift, and coding practices

**Spawn Verifier** — Agent tool with `name: "verifier"`, `subagent_type: "verifier"`. Provide:
- spec.md acceptance criteria
- Instruction to run comprehensive feature-level verification (full test suite, build, type-check, each acceptance criterion)

Run both in parallel. Collect findings.

**If gaps are found** (max 2 signoff rounds):
1. Architect generates new tasks with Why, Files, Verify — create via `TaskCreate` with `metadata: {"phase": "Signoff Fixes"}`
2. Wire dependencies with `addBlockedBy`
3. Re-enter the Implementer→Reviewer→Verifier loop (step 3) for the new tasks
4. After new tasks complete, re-run signoff (step 7)
5. If gaps remain after 2 signoff rounds, use `AskUserQuestion` tool to present remaining gaps and ask user for direction

**If signoff is clean**:
- Use `AskUserQuestion` tool to present signoff summary and ask user to approve

Present for approval:
- **Signoff verdict**: architect ✓/✗, verifier ✓/✗
- **Quality evaluation**: overall score + per-dimension scores from step 6b
- **Phase review history**: scores per phase (e.g., "Phase 1: 9.2, Phase 2: 9.5")
- **Phase evaluation history**: per-phase quality scores from step 4b
- **Test evidence**: test count, coverage % (TDD), pass/fail summary
- **Acceptance criteria**: each criterion with pass/fail status from verifier
- **Improvement rounds**: how many evaluate-improve cycles ran (per-phase + pre-signoff)
- **Assumptions made**: any `[ASSUMPTION]` markers from implementation
- **Signoff fix rounds**: how many rounds were needed (0 = clean first pass)

Ask: "Approve to proceed to completion, or request changes."

### 8. Final Comprehensive Review

**Before signoff, simplify and review.** These steps run BEFORE user approval so the user sees the final code.

**8a. Simplify**: Use the `code-simplifier` plugin on changed files. If simplification makes changes, re-run verification (step 6) to confirm nothing broke.

**8b. Review suite** — run in parallel (independent reviews):
- **Code Quality**: Spawn `reviewer` agent to review `git diff main...HEAD` for code quality
- **Silent Failures**: Check for swallowed errors, missing error handling, silent catch blocks
- **Type Design** (if TypeScript): Check type exports, interfaces, generics usage
- **Test Coverage** (TDD mode only): Verify coverage ≥ 90%, check for missing edge case tests

Aggregate results. **If any critical issues found:** fix, re-verify, then proceed to signoff.

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
- Every code change must map to a task (check via `TaskList`)
- If work doesn't have a task, create one via `TaskCreate` first — then implement

**Always use `AskUserQuestion` tool to pause for user approval on:**
- Skipping a task (mark `[~]` with reason)
- Signoff approval (after architect+verifier pass)

## Quality Standards

| Schema | Tests | Coverage | Review Score | Evaluation Score | Final Review |
|--------|-------|----------|--------------|-----------------|--------------|
| feature-tdd | Before impl | >= 90% | >= 9/10 | >= 8.5 overall, no dim < 7 | phase-review + evaluate + silent-failure + type-design + test-analyzer + /critique (UI) |
| feature-rapid | Optional | N/A | >= 9/10 | >= 8.5 overall, no dim < 7 | phase-review + evaluate + silent-failure + /critique (UI) |
| bugfix | Regression test required | N/A | >= 9/10 | >= 8.5 overall, no dim < 7 | phase-review + evaluate + silent-failure |

**Two quality gates per phase:**
1. **Phase review** (code review): ≥ 9/10 — catches bugs, spec drift, coding issues
2. **Phase evaluation** (quality dimensions): ≥ 8.5 overall, no dimension < 7 — catches UX gaps, performance issues, test holes, DX problems

## Next Step
Use `/complete-feature [FEATURE_ID]` or `/iterate [FEATURE-ID]` for additional polish.
