---
description: Execute implementation tasks from feature spec and task list (also handles /continue-feature)
---

## Feature ID

$ARGUMENTS

## Plugins & Skills Composed

| Step | Plugin/Skill | Purpose |
|------|-------------|---------|
| Task Gen | Claude native tasks (TaskCreate/Update/List) | Generate minimal task set from spec, then track progress |
| Context | OpenSpec CLI | Read change metadata, artifact state, task progress |
| Context | `linear` plugin | Fetch ticket details |
| Context | `claude-mem` plugin | Recall decisions from /specify |
| Per-task loop | `implementer` → `reviewer` → `verifier` agents (orchestrated sequential) | Main session spawns each agent, collects result, feeds to next |
| Signoff | `architect` + `verifier` agents (parallel) | Feature signoff after all tasks complete |
| Parallel Tasks | Agent tool with isolation | Run `[P]` tasks concurrently in worktrees |
| TDD | `test-driven-development` skill | Red-green-refactor when mode is TDD |
| Debugging | `systematic-debugging` skill | Root-cause analysis on failures |
| Implementation | `context7` plugin | Fetch latest library docs |
| Implementation | Project skills | Domain patterns (mobile/frontend/backend) |
| UI Components | `frontend-design` skill | Production-grade UI |
| UX Review | `/critique` skill | Design effectiveness evaluation for UI phases |
| Cross-Model Review | `phase-review` skill | Codex CLI + Claude code review at final review |
| Security | PAL MCP `secaudit` | Security audit at final review |
| Runtime Verify | Chrome DevTools MCP + `curl` | Live server verification — UI navigation or API requests (no mocks) |
| Simplification | `/simplify` skill | Clean up code before final review |
| Final Review | `pr-review-toolkit` agents | Comprehensive review suite (staff engineer bar) |
| Feedback Loop | Auto memory (file-based) | Classify review findings as spec-gap vs implementation-gap for /specify improvement |

## Staff Engineer Bar

Every agent in this pipeline operates as a **staff-level engineer**. This isn't just about the final review — it applies at every stage:

- **Implementer**: Writes code you'd defend in a senior code review — correct, minimal, secure
- **Reviewer**: Reviews with the rigor of someone who'll be paged when it breaks
- **Verifier**: Proves correctness with evidence, not assumptions
- **Architect**: Owns long-term system health, not just today's feature

The quality bar is not a gate at the end — it's the standard from the first line of code.

## Process

### 1a. Load Context

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

- **Read Discovery Brief** (feature schemas only):
  ```bash
  cat openspec/changes/$FEATURE_ID/discovery.md 2>/dev/null
  ```
  If `discovery.md` exists, note the use cases and scope constraints. These inform task generation (step 2a) and signoff verification (step 9a).

- Note schema from `.openspec.yaml` (`feature-tdd`, `feature-rapid`, or `bugfix`)
  - `feature-tdd`: TDD rules apply — tests before impl, coverage >= 90%
  - `feature-rapid`: No test requirements — type-check and build only
  - `bugfix`: Root cause investigation → regression test → fix

### 1b. Auto-Resume

Before starting fresh, detect and automatically resume from prior session state:

1. **Run `TaskList`** to check task states
2. **Run `git status`** to check for uncommitted changes

**Auto-resume rules (no user prompt needed):**

| State | Action |
|-------|--------|
| A task is `in_progress` | Resume from that task — re-enter the implement→review→verify loop at step 3 |
| Tasks are `completed` but phase not committed | Run phase verification (step 4a) and commit (step 5a) for the completed phase, then continue |
| Uncommitted changes exist + an `in_progress` task | Treat as mid-task crash — continue implementing that task with existing changes |
| All tasks `completed` + all phases committed | Jump to final validation (step 6a) |
| All tasks `completed` + final review done | Jump to signoff (step 9a) |

**Only prompt user if:**
- Uncommitted changes exist but NO task is `in_progress` (orphaned changes — ask continue or discard)
- A task was `in_progress` but its files have conflicts with current working tree

**Always restart the dev server** (step 2b) after detecting a resume — a prior session's server process will be dead.

Log the resume decision: `"Resuming: [state detected] → [action taken]"`

### 2a. Generate Tasks (Minimal Set)

**Tasks are generated at implement time**, not during `/specify`. This ensures tasks reflect the final approved spec and are the minimal set needed to deliver the feature.

1. **Check for existing tasks**: Run `TaskList`. If tasks already exist (e.g., from a resumed session), skip to step 2b.

2. **Read the approved spec and design**: `openspec/changes/$FEATURE_ID/spec.md` and `design.md`
   - If `discovery.md` exists, read it for use case context. Tasks should collectively cover all discovery use cases. Each task's **Why** should reference the use case it satisfies (e.g., "Implements UC-1: user login").

3. **Generate the minimal task set**: For each task:
   - Focus on the **smallest set of changes** that delivers the spec — prefer simple, elegant solutions
   - Don't create tasks for boilerplate, setup, or obvious steps — only for work with real implementation decisions
   - Create via `TaskCreate`:
     - `subject`: `T-N: [Task title]`
     - `description`: Must include `**Why**:`, `**Files**:`, `**Verify**:` sections
     - `metadata`: `{"phase": "Phase N", "taskNumber": "T-N"}` — add `"parallel": true` for `[P]` tasks
   - Wire dependencies via `TaskUpdate` with `addBlockedBy`

4. **Generate initial tasks.md**: Write `openspec/changes/$FEATURE_ID/tasks.md` using the template from `openspec/schemas/<schema>/templates/tasks.md` (where `<schema>` is `feature-tdd`, `feature-rapid`, or `bugfix` from `.openspec.yaml`). All tasks start as `[ ]`.

5. **Verify**: Run `TaskList` and confirm all tasks are `pending` with correct dependency graph.

Tasks persist across sessions via `CLAUDE_CODE_TASK_LIST_ID` (set by SessionStart hook from worktree path).

### 2b. Start Dev Server

Start the dev server once and keep it running for the entire implementation session. Read the project's CLAUDE.md for the correct dev command, port, and any setup steps.

```bash
cd "$WORKTREE"
# Read CLAUDE.md to find the dev command (e.g., pnpm dev, npm run dev, cargo watch, etc.)
# Start it in the background
<dev-command> &
```

Wait for the server to be ready — retry `curl` against the project's dev URL for up to 15s.

The `dev-server-register` PostToolUse hook automatically registers the PID. The `process-kill-guard` PreToolUse hook ensures only this registered process can be killed.

**The server stays running through all phases.** Do NOT restart between tasks or phases — if the project uses watch mode / HMR, code changes are picked up automatically.

**If server fails to start**: Check for stale processes on the dev port, kill any registered stale PIDs, then retry once. If still failing, escalate to user.

### 2c. Understand Task Graph

Run `TaskList` to see all tasks with their status, dependencies, and blockers. Identify:
- Which tasks are `pending` (skip `completed`)
- Dependencies via `blockedBy` — a task is **ready** when all blockers are `completed`
- Tasks with `metadata.parallel: true` that can run concurrently

### 2d. Task-First Gate

**All work MUST be tracked via `TaskCreate` before implementation begins.**

If the user requests work (bug fix, enhancement, new requirement) that doesn't have a corresponding task:
1. **Stop** — do not start coding
2. **Create task** via `TaskCreate` with:
   - `subject`: Short title
   - `description`: Why (requirement), Files (to create/modify), Verify (concrete criteria)
   - `metadata`: `{"phase": "Phase N", "source": "user"}` — **always tag user-requested tasks with `"source": "user"`** so they're excluded from unplanned-work metrics in `/complete-feature`
3. **Wire dependencies**: `TaskUpdate` with `addBlockedBy` for any prerequisite tasks
4. **Then proceed** with implementation following the normal task execution flow

The only exceptions are trivial one-line fixes (typos, formatting) that don't warrant tracking.

### 3. Execute Tasks (Implementer → Reviewer → Verifier Loop)

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

**Merge-back protocol** for parallel worktree agents:
1. Wait for all parallel agents to complete
2. Merge each agent's worktree branch back into the feature branch **one at a time, sequentially**:
   ```bash
   cd "$WORKTREE"
   git merge --no-ff <agent-worktree-branch>
   ```
3. If a merge conflict occurs, spawn a `sonnet-agent` to resolve it:
   - Provide the conflict markers, the feature spec context, and `git log` of both branches
   - The agent resolves based on intent from commit history, not guessing
4. After each merge, run `pnpm type-check` to catch integration issues before merging the next
5. If type-check fails after a merge, spawn a `sonnet-agent` to fix the type errors. Provide the type-check output + the merge context. Re-run type-check after fixes. Only proceed once clean.
6. Only proceed to the next agent's merge after the current one is clean

#### Per-Task Sequential Loop:

For each task, the main session orchestrates three stages sequentially. Each stage spawns a subagent, collects its result, and feeds it to the next stage.

1. **Mark task started**: `TaskUpdate(taskId, status: "in_progress")`

2. **Implement** — Spawn Agent with `subagent_type: "implementer"`. Provide:
   - Task details (Why, Files, Verify)
   - Spec and design context
   - Schema mode (tdd/rapid/bugfix)
   - If TDD mode: instruct to follow `test-driven-development` skill
   - Implementer writes code, self-tests, and returns a summary of changes made

3. **Review** — Spawn Agent with `subagent_type: "reviewer"`. Provide:
   - The Implementer's change summary and list of files modified
   - Spec and design context for comparison
   - Instruction to review against spec and coding standards
   - **Instruction to score the review 1-10** on: correctness, security, simplicity, spec adherence
   - **If score < 9 or rejected**: Feed rejection feedback + score breakdown back to a new Implementer agent (max 3 iterations)
   - **If score >= 9 and approved**: Proceed to verification

4. **Verify** — Spawn Agent with `subagent_type: "verifier"`. Provide:
   - The task's "Verify" steps
   - List of files modified by the Implementer
   - The running dev server URL (from project's CLAUDE.md)
   - **Runtime verification instructions** (see Runtime Verification Protocol below)
   - **If pass**: `TaskUpdate(taskId, status: "completed")`
   - **If fail**: Feed failure details back to a new Implementer agent, then re-review and re-verify (max 3 iterations total)

5. **After 3 failed iterations** on the same issue: use `AskUserQuestion` tool to escalate to user with details

#### On ANY failure (test, build, type error):

**Invoke `systematic-debugging` skill.** Do NOT guess-fix.

### 4. Phase Verification

After completing all tasks in a phase:

#### 4a. Static Verification

- Run type check: `pnpm type-check` (or per-package equivalent)
- Run tests: `pnpm test:changed` (fallback to `pnpm test` if script not found). TDD mode: `pnpm test -- --coverage`
- Run build: `pnpm build`
- Read output, confirm exit codes, count failures

#### 4b. Runtime Verification (mandatory)

The dev server is already running from step 2b. Watch mode auto-reloads changes. Verify the feature **actually works** against the live server — no mocks.

**Backend verification** (any phase that touches API routes, data, or server logic):

1. **Hit the affected endpoints** with `curl` and verify real responses:
   ```bash
   # Use the dev URL from the project's CLAUDE.md
   curl -sf http://localhost:<PORT>/[endpoint] | jq .
   curl -sf -X PATCH http://localhost:<PORT>/[endpoint] -H 'Content-Type: application/json' -d '{"key":"value"}' | jq .
   ```
2. **Assert on response shape and data** — check status codes, required fields, correct values. Don't just check "200 OK" — verify the response body matches what the spec requires.
3. **Test error paths** — send malformed input, missing params, invalid values. Verify the server returns appropriate error responses (4xx with error message), not 500s or silent failures.
4. **Verify side effects** — if the endpoint writes to filesystem, check the file was written correctly. If it triggers SSE events, connect to `/api/events` and confirm the event fires.

**UI verification** (any phase that touches components, pages, or styling):

1. **Navigate to the affected page** via Chrome DevTools MCP:
   ```
   mcp__chrome-devtools__navigate_page → http://localhost:<PORT>/[path]
   ```
2. **Interact with the feature** — don't just screenshot. Click buttons, fill forms, expand sections, toggle states:
   ```
   mcp__chrome-devtools__take_snapshot  → get fresh UIDs
   mcp__chrome-devtools__click          → interact with elements
   mcp__chrome-devtools__fill           → enter data in inputs
   mcp__chrome-devtools__type_text      → type into fields
   mcp__chrome-devtools__press_key      → keyboard interactions
   ```
3. **Verify state changes** — after interactions, take a new snapshot and confirm the DOM reflects the expected state (new elements appeared, values updated, errors cleared, etc.)
4. **Check for console errors** — `mcp__chrome-devtools__list_console_messages` after each interaction. Zero errors expected unless explicitly handling a known case.
5. **Check network requests** — `mcp__chrome-devtools__list_network_requests` to verify the UI made the correct API calls with correct payloads.
6. **Screenshot for evidence** — `mcp__chrome-devtools__take_screenshot` of the final state as proof.

**Full-stack verification** (phase touches both): Run both backend AND UI verification. Additionally, verify the round-trip — make a change via the UI, then verify it persisted via a direct API call (or vice versa).

#### 4c. Acceptance Criteria Check

Read spec.md acceptance criteria relevant to this phase's tasks. For each criterion that this phase should satisfy, verify it with concrete evidence from the runtime verification above (response bodies, screenshots, console output). Document which criteria are now met vs. still pending for future phases.

Only THEN claim phase completion.

#### 4d. Phase Score Gate

Score the phase 1-10 based on:
- **Static verification**: type-check, tests, build all clean
- **Runtime verification**: feature works against live server with evidence
- **Acceptance criteria**: relevant criteria for this phase are met

**Score >= 9**: Proceed to commit (step 5a).

**Score < 9**: Identify the gaps, fix them (invoke `systematic-debugging` if needed), re-run verification (steps 4a-4c), and re-score. Max 3 iterations — if still < 9 after 3 rounds, escalate to user via `AskUserQuestion`.

### 5a. Commit Phase

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

### 5b. Sync tasks.md from Native Tasks

**After each task completion or skip** (not on started), regenerate `tasks.md` from native tasks. This balances visibility with overhead — syncing on every status change is too expensive for large features.

1. Run `TaskList` to get all tasks with current statuses
2. For each task, run `TaskGet` to retrieve full description (Why, Files, Verify)
3. Overwrite `openspec/changes/$FEATURE_ID/tasks.md` using the template from `openspec/schemas/<schema>/templates/tasks.md`
4. Include in phase commits: `git add openspec/changes/$FEATURE_ID/tasks.md`

Native tasks remain the **source of truth** — tasks.md is a generated mirror. Never edit tasks.md directly.

### 6a. Final Validation

- Run `TaskList` — all tasks should be `completed`
- No `pending` or `in_progress` remaining

```bash
pnpm test
pnpm build
git status
```

Read full output. Confirm all pass with evidence. THEN proceed.

### 6b. Final tasks.md Sync

**After all tasks are completed**, do a final sync of `tasks.md` to ensure it reflects the completed state. This is the version that gets committed for PR review.

Use the template from `openspec/schemas/<schema>/templates/tasks.md`.

Commit with the final validation: `git add openspec/changes/$FEATURE_ID/tasks.md`

**This file is generated, not manually edited.** The local-review UI task parser reads this format.

### 7. Simplify Code

> **Global iteration cap (steps 7→8→9):** The simplify→review→signoff pipeline may loop back (review findings → new tasks → re-simplify → re-review, or signoff gaps → new tasks → re-simplify → re-review → re-signoff). **Cap the total number of loop-backs across steps 7-8-9 at 3.** If after 3 loop-backs there are still critical/important findings or signoff gaps, escalate to user via `AskUserQuestion` with the remaining issues.

**Before reviewing, simplify.** Invoke the `/simplify` skill on changed files.

If simplification makes changes, re-run verification (step 6a) to confirm nothing broke. If simplification reveals issues that need new work, create tasks via `TaskCreate` with `metadata: {"phase": "Simplification Fixes"}`, implement them through the task loop (step 3), then re-simplify.

### 8. Final Comprehensive Review (Staff Engineer Bar)

Run the applicable review suite in parallel based on what the feature touches. Pick the matching scenario:

#### Scenario A: Full-Stack (UI + Backend)

| # | Review | Tool |
|---|--------|------|
| 1 | Code Quality | `pr-review-toolkit:code-reviewer` agent |
| 2 | Silent Failures | `pr-review-toolkit:silent-failure-hunter` agent |
| 3 | Type Design | `pr-review-toolkit:type-design-analyzer` agent |
| 4 | Security Audit | PAL MCP `secaudit` |
| 5 | Cross-Model Review | `phase-review` skill |
| 6 | UX Critique | `/critique` skill |
| 7 | Frontend Design | `frontend-design:frontend-design` skill |
| 8 | Runtime Verification | Live server validation — API curl + Chrome DevTools interaction |

#### Scenario B: UI Only (no new API/backend logic)

| # | Review | Tool |
|---|--------|------|
| 1 | Code Quality | `pr-review-toolkit:code-reviewer` agent |
| 2 | Silent Failures | `pr-review-toolkit:silent-failure-hunter` agent |
| 3 | Cross-Model Review | `phase-review` skill |
| 4 | UX Critique | `/critique` skill |
| 5 | Frontend Design | `frontend-design:frontend-design` skill |
| 6 | Runtime Verification | Live server validation — API curl + Chrome DevTools interaction |

#### Scenario C: Backend Only (APIs, data, infra)

| # | Review | Tool |
|---|--------|------|
| 1 | Code Quality | `pr-review-toolkit:code-reviewer` agent |
| 2 | Silent Failures | `pr-review-toolkit:silent-failure-hunter` agent |
| 3 | Type Design | `pr-review-toolkit:type-design-analyzer` agent |
| 4 | Security Audit | PAL MCP `secaudit` |
| 5 | Cross-Model Review | `phase-review` skill |

#### Scenario D: Bugfix

| # | Review | Tool |
|---|--------|------|
| 1 | Code Quality | `pr-review-toolkit:code-reviewer` agent |
| 2 | Silent Failures | `pr-review-toolkit:silent-failure-hunter` agent |
| 3 | Cross-Model Review | `phase-review` skill |
| 4 | Security Audit | PAL MCP `secaudit` |

#### Additional (add to any scenario when applicable):

| Condition | Review | Tool |
|-----------|--------|------|
| TDD mode (`feature-tdd` schema) | Test Coverage | `pr-review-toolkit:pr-test-analyzer` agent |
| Config/tooling changes | Type Design | `pr-review-toolkit:type-design-analyzer` agent |

**Launch ALL reviews for the matching scenario in parallel.** Aggregate results into a unified report.

**Score the review 1-10** across all reviewers. Compute a single aggregate score weighted by finding severity (critical findings cap the score at 5, important findings cap at 7).

**Score >= 9**: Compile the **Final Review Report** and proceed to signoff (step 9a).

**Score < 9 — Feedback loop (max 2 iterations):**
1. Categorize all findings: **critical** (must fix), **important** (should fix), **advisory** (nice to have)
2. Create tasks via `TaskCreate` with `metadata: {"phase": "Review Fixes"}` for each critical/important finding
3. Implement fixes through the task loop (step 3)
4. Re-run `/simplify` on changed files
5. Re-verify (type-check, tests, build)
6. Re-run only the reviews that had critical/important findings
7. Re-score — repeat until score >= 9 or 2 iterations exhausted
8. If still < 9 after 2 iterations, escalate to user via `AskUserQuestion`

### 9a. Architect + Verifier Signoff (Final Gate)

**This is the terminal quality gate.** After simplification and all reviews pass, run signoff. No new implementation steps follow signoff.

**Spawn Architect** — Agent tool with `name: "architect"`, `model: "opus"`, `subagent_type: "architect"`. Provide:
- Full spec.md and design.md content
- The git diff of all changes: `git diff main...HEAD`
- Instruction to review implementation against spec for gaps, spec drift, and coding practices

**Spawn Verifier** — Agent tool with `name: "verifier"`, `subagent_type: "verifier"`. Provide:
- spec.md acceptance criteria
- Discovery Brief use cases from `discovery.md` (if it exists) — verify every use case has been implemented and tested
- The running dev server URL (from project's CLAUDE.md)
- Instruction to run comprehensive feature-level verification:
  - Full test suite, build, type-check
  - **End-to-end runtime validation of every acceptance criterion** against the live server — curl API endpoints, navigate UI via Chrome DevTools, interact with features, verify real responses and DOM state
  - No mocks — every criterion must be verified against the running application

Run both in parallel. Collect findings.

**If gaps are found** (max 2 signoff rounds):
1. Architect generates new tasks with Why, Files, Verify — create via `TaskCreate` with `metadata: {"phase": "Signoff Fixes"}`
2. Wire dependencies with `addBlockedBy`
3. Re-enter the Implementer→Reviewer→Verifier loop (step 3) for the new tasks
4. Re-run simplify (step 7) and final review (step 8) on the new changes
5. Re-run signoff (step 9a)
6. If gaps remain after 2 signoff rounds, use `AskUserQuestion` tool to present remaining gaps and ask user for direction

**If signoff is clean**:

**Only present to user when ALL of these pass:**
- Phase-review score >= 9/10
- Zero critical findings from any reviewer
- Zero important findings (or explicitly accepted)
- Security audit clean
- Runtime verification passed — all acceptance criteria validated against live server (API responses verified, UI interactions confirmed)
- All tests pass, build succeeds, types check
- Architect confirms spec compliance
- Verifier confirms all acceptance criteria met with runtime evidence

Use `AskUserQuestion` tool to present the complete review report and signoff summary. Ask user to approve before marking feature ready for `/complete-feature`.

### 9b. Stop Dev Server

After signoff is complete (or if escalating to user), kill the dev server started in step 2b:

```bash
# Kill the registered dev server PID (allowed by process-kill-guard since we started it)
PID_FILE=$(ls /tmp/claude-dev-servers/*.pid 2>/dev/null | head -1)
if [ -f "$PID_FILE" ]; then
  kill $(head -1 "$PID_FILE")
fi
```

### 10. Store Learnings & Review-to-Spec Feedback

#### 10a. Classify Review Findings

Before storing learnings, classify every **critical** and **important** finding from step 8 into one of these categories:

| Category | Definition | Example | Action |
|----------|-----------|---------|--------|
| **Spec gap** | Spec should have required this but didn't | "No error handling for malformed input" — spec never mentioned input validation | Save as Architect feedback memory |
| **Design gap** | Design approach caused issues found in review | "Component tree too deep, causing re-render perf issues" — design chose wrong component structure | Save as design pattern feedback |
| **Implementation gap** | Spec covered this but implementer missed it | "Spec said validate input but handler has no validation" | No feedback needed — implementation error |
| **Scope gap** | Feature fundamentally needed something the spec couldn't have anticipated | "3rd-party API changed behavior since spec was written" | Note for awareness only |

For each **spec gap** and **design gap**, save a feedback auto memory file (type: `feedback`):
- Name: `feedback_[FEATURE_ID]_[topic].md`
- Content: What was missed, what the spec/design should have included, and which review caught it
- Include **Why:** and **How to apply:** lines per the auto memory format
- Example: *"Specs for data I/O features must include error handling requirements for malformed input — missed in [FEATURE_ID], caught by silent-failure-hunter in final review"*

These memories are loaded during `/specify` step 2 (memory search) so the Architect avoids the same gaps.

#### 10b. Store Implementation Learnings

Save implementation learnings as auto memory files (type: `project`) named `project_[FEATURE_ID]_[topic].md`:
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

**Run the full pipeline autonomously** — implement all phases, run all reviews, fix all findings, verify everything — then present the finished, fully-verified feature to the user.

**Only pause for user input when:**
- A task has `[NEEDS CLARIFICATION]` in the spec
- Review score < 9/10 after 3 iterations of fixes
- Merge conflict that sonnet-agent can't resolve from commit history context
- Test failure that systematic-debugging can't resolve after 2 attempts
- Security audit reveals a design-level concern (not just a code fix)

**Never start untracked work:**
- Every code change must map to a task (check via `TaskList`)
- If work doesn't have a task, create one via `TaskCreate` first — then implement

**Always use `AskUserQuestion` tool to pause for user approval on:**
- Skipping a task (mark `[~]` with reason)
- Final signoff (after ALL quality gates pass — present the complete review report)

**Parallel fix dispatch:**
- When multiple reviewers flag issues, dispatch parallel subagents to fix them simultaneously
- Each subagent gets one reviewer's findings + the relevant files
- After all subagents complete, re-verify holistically before re-running reviews

## Quality Standards

| Schema | Tests | Coverage | Review Score | Final Review |
|--------|-------|----------|--------------|--------------|
| feature-tdd | Before impl | >= 90% | >= 9/10 | Scenario A/B/C (by scope) + test-analyzer |
| feature-rapid | Optional | N/A | >= 9/10 | Scenario A/B/C (by scope) |
| bugfix | Regression test required | N/A | >= 9/10 | Scenario D |

See step 8 for scenario definitions (A: full-stack, B: UI-only, C: backend-only, D: bugfix).

**"Staff Engineer Bar"**: No feature is presented to the user until ALL applicable reviews pass with zero critical/important findings. The feedback loop in steps 4a and 8 iterates autonomously until this bar is met or escalation is needed. Signoff (step 9a) is the terminal gate — nothing follows it except reporting.

## Next Step
Use `/complete-feature [FEATURE_ID]` to merge and cleanup.
