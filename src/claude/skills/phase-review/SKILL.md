---
name: phase-review
description: Use after completing a phase of implementation tasks to get combined code review feedback from both Codex CLI (via PAL MCP clink) and the feature-dev code-reviewer agent. Triggers after each phase in openspec-apply-change, or when the user asks for a multi-model code review, cross-model review, or phase review. Also use when the user says "review this phase", "review my changes", or "run code review" during implementation.
---

# Phase Review

Run parallel code reviews from two independent models via PAL MCP, then synthesize their findings into a single actionable report.

**Why two reviewers:** Different models catch different things. Codex CLI (o3) excels at logical reasoning and subtle bugs. Claude's feature-dev:code-reviewer excels at project convention adherence and security patterns. Combined, they provide higher coverage than either alone.

## When to Use

- After completing each phase of implementation (integrated into apply-change workflow)
- Before committing a batch of changes
- When the user requests a thorough code review

## Inputs

Determine what to review:
- **During apply-change**: Changes since the phase started (use `git diff` against the commit before the phase began)
- **Otherwise**: Unstaged/staged changes, or a specific base branch if provided

## Steps

### 1. Determine the diff scope

```bash
# If reviewing a phase, find the commit before the phase started
git log --oneline -10  # identify the boundary commit

# For uncommitted changes
git diff --stat        # overview of what changed
```

Capture the base reference (commit SHA or branch) for both reviewers.

### 2. Run both reviewers in parallel

Launch both reviews simultaneously — do not wait for one before starting the other.

**Codex CLI review** (via PAL MCP clink):

Use the PAL MCP `clink` tool to invoke Codex as a code reviewer:

For branch diff reviews:
```
clink with codex codereviewer to review the changes between <base-ref> and HEAD in this repository. This is a Phase N review. Focus on:
1. Bugs, logic errors, and security vulnerabilities
2. Missing error handling or edge cases
3. Code quality and consistency issues
Report only high-confidence findings with file paths and line numbers.
```

For uncommitted changes:
```
clink with codex codereviewer to review all uncommitted changes in this repository. Focus on:
1. Bugs, logic errors, and security vulnerabilities
2. Missing error handling or edge cases
3. Code quality and consistency issues
Report only high-confidence findings with file paths and line numbers.
```

**feature-dev:code-reviewer agent** (runs as a subagent):

Spawn the `feature-dev:code-reviewer` agent with the same scope. It reads CLAUDE.md conventions and applies confidence-based filtering (only issues >= 80 confidence).

### 3. Synthesize findings

Once both complete, merge their outputs into a unified report:

**Deduplication**: If both reviewers flag the same issue (same file + same line range + same category), combine into one entry noting both caught it — this is high-signal.

**Categorize**:

| Category | Description |
|----------|-------------|
| **Critical** | Bugs, security vulnerabilities, data loss risks — must fix |
| **Important** | Logic issues, missing error handling, convention violations — should fix |
| **Advisory** | Style suggestions, minor improvements — consider fixing |

**Attribution**: Tag each finding with its source (`codex`, `claude`, or `both`) so the user knows which model caught it.

### 4. Present the report

```
## Phase Review: <phase name>

**Scope**: <N files changed, +X/-Y lines>
**Reviewers**: Codex CLI via PAL (o3) + feature-dev:code-reviewer (Claude)

### Critical (must fix)
- [both] `src/foo.ts:42` — Null dereference when input is empty...
- [codex] `src/bar.ts:115` — Race condition in async handler...

### Important (should fix)
- [claude] `src/baz.ts:23` — Missing error handling per CLAUDE.md convention...

### Advisory
- [codex] `src/utils.ts:8` — Redundant type assertion...

### Summary
- X critical, Y important, Z advisory findings
- Overlapping findings (caught by both): N
```

### 5. Handle results

- **Critical issues found**: Stop implementation. Fix before proceeding to next phase.
- **Important issues found**: Present to user. Fix or acknowledge before proceeding.
- **Advisory only or clean**: Note the clean review and proceed.

## Integration with apply-change

When used within the `openspec-apply-change` workflow, this skill runs at phase boundaries — after all tasks in a phase are marked complete but before starting the next phase. The verification gate in apply-change handles per-task verification (tests pass, types clean); this skill handles the broader "does this phase's code hold up to review?" question.
