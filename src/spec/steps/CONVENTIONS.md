# Step Contract Conventions

Rules for designing, evaluating, and modifying step contracts.
Read by workflow-evaluator (when auditing) and workflow-fixer (when editing).

## Single Responsibility Principle

Each step contract does ONE thing. Its `intent:` field must be a single sentence
describing that one thing. If the intent uses "and" to join unrelated verbs, it's
doing too much — split it.

**Test**: Can you describe what this step does in 5 words? If not, it's too broad.

## Structure

Every step contract has exactly 4 sections, each with a distinct purpose:

| Section | Purpose | Contains |
|---------|---------|----------|
| `rules:` | Constraints on HOW to do the one thing | Short declarative statements. Guards and quality criteria. |
| `instruction:` | Sequential steps for the one thing | Numbered steps the agent follows. Only the happy path + error handling. |
| `verify:` | Assertions that the one thing was done correctly | Checkable conditions. Must be evaluable without re-reading instruction. |
| `outputs:` | What the step produces | Artifact names only. |

## Where learned rules go

When `/learn` discovers a new rule, route it to the right section:

| Rule type | Target section | Example |
|-----------|---------------|---------|
| Quality constraint | `rules:` | "For FIXED claims, re-verify from scratch" |
| Verification check | `verify:` | "Catalog count matches full-tree grep count" |
| Process guidance | `instruction:` (only if it's a step in the existing flow) | Rarely — prefer rules over instruction additions |

**Never** add a rule as a paragraph in `instruction:`. Instructions describe the flow;
rules constrain it. If you're tempted to add a "### Special Rule" section inside
instruction, it belongs in `rules:` instead.

## Flag Dependencies (`flags_read:`)

Steps that change behavior based on runtime flags (from `state.yaml.flags`) MUST
declare them in a `flags_read:` section. This makes behavioral flag dependencies
explicit and auditable — agents see structured config instead of parsing prose.

**Gating vs behavioral flags**: Flags that control *whether* a step runs (e.g.,
`ux_design`, `linear`, `auto_approve_phases`) are handled by the schema via `if:`
conditions — the orchestrator pre-filters steps before execution, so gated steps
never load. Only flags that change *how* a step runs need `flags_read:`.

### Format

```yaml
flags_read:
  - name: auto_approve_phases
    effect: "Pick recommended approach automatically instead of asking user"
  - name: tdd_required
    effect: "Require test task before each implementation task"
```

### Rules

- **Only declare behavioral flags** — flags that change how the step executes, not
  whether it runs. Gating is the schema's job (`if:` / `if not`).
- **Do NOT duplicate skip logic in instruction** when the schema already gates the
  step. The step should assume it will only run when the condition is met.
- **`effect` is a human-readable description** of what the flag changes in the step's
  behavior. Keep it under one sentence.

### Example

```yaml
id: generate-or-refresh-tasks
flags_read:
  - name: tdd_required
    effect: "Every implementation task must have a preceding test task"
rules:
  - Tasks must be small, verifiable, and ordered.
instruction: |
  ...
  FLAG-DEPENDENT BEHAVIOR (per flags_read):
  - When tdd_required: every implementation task has a preceding test task.
```

## State Updates

Every step that modifies `state.yaml` MUST use the standardized `step_history` entry
format. This ensures resume works regardless of which model or agent executed the step.

### Standard step_history entry

```yaml
step_history:
  - step_id: <step contract id>
    phase: <current phase name>
    status: completed          # or: failed, blocked
    agent: <agent name or "inline">
    artifacts: [<files created or modified>]  # optional, list artifact filenames
    review_score: <N>          # only for run-phase-review
```

### Rules

- **Always append** — never overwrite existing entries.
- **Use exact field names** — `step_id`, `phase`, `status`, `agent`, `artifacts`.
- **Status values**: `completed`, `failed`, `blocked` — no other values.
- **Artifacts field**: only include files the step created or modified in
  `$SPEC_CHANGES_DIR/$CHANGE_ID/`. Omit for steps that don't produce artifacts.
- **`review_score`**: only present on `run-phase-review` entries.

### In step contracts

Instead of writing "Update state.yaml with X completion status", reference:

```yaml
instruction: |
  N. Update state.yaml step_history per CONVENTIONS.md § State Updates.
```

This replaces all variants of "update state.yaml with discovery/design/artifact/task/
verification status."

## Task Format Contract

The `tasks.md` file is a structural contract between `generate-or-refresh-tasks`
(producer) and `execute-next-task` (consumer). Both steps MUST use this exact format.

### Format

```markdown
# Tasks — <Change Title>

## Phase N: <Phase Name>

- [ ] T-1: <one-line description>
  Files: <comma-separated file paths>
  Verify: <concrete verification check>

- [ ] T-2: <one-line description>
  Files: <comma-separated file paths>
  Verify: <concrete verification check>
  depends: T-1

- [ ] T-3: <one-line description> [P]
  Files: <comma-separated file paths>
  Verify: <concrete verification check>
```

### Field rules

| Field | Required | Format |
|-------|----------|--------|
| Checkbox | Yes | `- [ ]` (pending) or `- [x]` (done) |
| ID | Yes | `T-<N>:` sequential within the file |
| Description | Yes | One line, imperative verb |
| Files | Yes | Indented 2 spaces, comma-separated paths |
| Verify | Yes | Indented 2 spaces, concrete check (command output, file exists, etc.) |
| depends | No | Indented 2 spaces, `depends: T-N` or `depends: T-N, T-M` |
| Parallel | No | `[P]` suffix on description line = safe to run concurrently with other ready `[P]` tasks |

### Phase grouping

Tasks are grouped under `## Phase N: <Name>` headers. Phases execute sequentially;
tasks within a phase execute in dependency order (or in parallel if marked `[P]`
with no unmet dependencies).

### Parallel execution rules

1. A task marked `[P]` can run concurrently with **other `[P]` tasks whose
   `depends:` are all satisfied**.
2. `depends:` is always honored — even between two `[P]` tasks. If T-2 `[P]`
   depends on T-1 `[P]`, T-1 must complete before T-2 starts.
3. Non-`[P]` tasks always run sequentially, one at a time.
4. Orchestrator pseudo-logic:
   ```
   ready = [T for T in unchecked if all depends(T) are [x]]
   parallel_batch = [T for T in ready if T.has_marker("[P]")]
   sequential = [T for T in ready if not T.has_marker("[P]")]
   if parallel_batch: run all in parallel, wait for all
   elif sequential: run sequential[0], wait
   ```

## Discovery Brief Format Contract

The `discovery.md` file is a structural contract between `explore` (producer) and
`create-or-refresh-artifacts` / `run-phase-review` (consumers). Both producer and
consumer steps MUST use this exact format.

### Format

```markdown
---
feature-id: FEATURE-ID
linear-ticket: HL-XXX
---

# Discovery Brief: {title}

## Feature Summary

{One paragraph: what this feature does and why it matters.}

## Personas & Actors

{Who interacts with this feature — user roles, system actors, external services.}

## Use Cases

### Happy Path

UC-1: {title} — {actor} wants to {action} so that {outcome}.
UC-2: {title} — {actor} wants to {action} so that {outcome}.

### Error & Edge Cases

UC-E1: {title} — what happens when {error condition}.

## Scope

### In Scope

- {explicit list items}

### Out of Scope

- {explicit list items with rationale}

## UI Direction

{For UI features: playground description. For non-UI: "N/A — no UI components."}

## Key Decisions

- {Decision}: {rationale}

## Open Questions

- OQ-N: {question}
```

### Field rules

| Field | Required | Format |
|-------|----------|--------|
| Frontmatter | Yes | YAML block with `feature-id` and `linear-ticket` |
| Feature Summary | Yes | Single paragraph, no bullet lists |
| Personas & Actors | Yes | At least one actor identified |
| Happy Path Use Cases | Yes | Minimum 2, format: `UC-<N>: title — actor wants to action so that outcome` |
| Error & Edge Cases | Yes | Minimum 1, format: `UC-E<N>: title — what happens when condition` |
| In Scope | Yes | Bulleted list, at least one item |
| Out of Scope | Yes | Bulleted list with rationale per item |
| UI Direction | Yes | "N/A — no UI components" if non-UI |
| Key Decisions | Contextual | Populated by design-exploration step if design=true |
| Open Questions | Yes | Empty section means no blockers. Format: `OQ-<N>: question` |

### Identifier conventions

- Use case IDs: `UC-1`, `UC-2`, ... for happy path; `UC-E1`, `UC-E2`, ... for error/edge
- IDs are sequential within their category with no gaps
- Open question IDs: `OQ-1`, `OQ-2`, ... sequential with no gaps

### Consumers

- `create-or-refresh-artifacts` — reads UC-N identifiers for spec.md traceability
- `generate-or-refresh-tasks` — reads scope and use cases for task derivation
- `run-phase-review` — verifies structural compliance

---

## Specification Format Contract

The `spec.md` file is a structural contract between `create-or-refresh-artifacts`
(producer) and `generate-or-refresh-tasks` / `run-phase-review` / `run-feature-verification`
(consumers).

### Format

```markdown
---
feature-id: FEATURE-ID
linear-ticket: HL-XXX
---

# Specification: {title}

## Motivation

{What problem does this solve and why.}

## What Changes

{High-level description of new or modified capabilities.}

## Requirements

### Functional

1. **FR-1**: {requirement description}
2. **FR-2**: {requirement description}

### Non-Functional

1. **NFR-1**: {requirement description}

## Architecture

{Components, data flow, file modification table.}

## Test Strategy

### Test File Paths

{Map each component to its test file.}

### Coverage Targets

{Minimum 90% overall. Per-module targets if needed.}

### Key Test Scenarios

{Critical paths that MUST have test coverage.}

## Acceptance Criteria

- AC-1: {testable criterion using Given/When/Then} [traces: UC-N]
- AC-2: {testable criterion} [traces: UC-N, UC-EN]

## Alternatives Considered

**Alternative N: {name}**
Rejected. {Why rejected or why chosen approach is better.}

## Impact

{Breaking changes, migration, affected areas.}

## Decisions

- {Decision}: {rationale}
```

### Field rules

| Field | Required | Format |
|-------|----------|--------|
| Frontmatter | Yes | YAML block with `feature-id` and `linear-ticket` |
| Motivation | Yes | One or more paragraphs |
| What Changes | Yes | Prose or bulleted list |
| Functional Requirements | Yes | Numbered list, format: `N. **FR-N**: description` |
| Non-Functional Requirements | Yes | Numbered list, format: `N. **NFR-N**: description`. Use "N/A" if genuinely none |
| Architecture | Yes | File modification table for implementation-oriented specs; prose for conceptual |
| Test Strategy | Contextual | Required when code changes exist. "N/A" for YAML/markdown-only changes |
| Acceptance Criteria | Yes | Bulleted list, each with `[traces: UC-N]` referencing discovery.md use case(s) |
| Alternatives Considered | Yes | At least one alternative per major design choice |
| Impact | Yes | "No breaking changes" if none |
| Decisions | Contextual | Populated when non-obvious choices were made |

### Traceability rules

- Every AC item MUST include `[traces: UC-N]` or `[traces: UC-N, UC-EN]`
- The referenced UC-N must exist in the corresponding discovery.md
- Every discovery.md use case (UC-N and UC-EN) should be traced by at least one AC
- AC identifiers: `AC-1`, `AC-2`, ... sequential with no gaps

### Consumers

- `generate-or-refresh-tasks` — reads Acceptance Criteria and Architecture for task derivation
- `run-feature-verification` — reads Acceptance Criteria for final verification
- `run-phase-review` — verifies structural compliance and traceability

---

## Design Format Contract

The `design.md` file is a structural contract between `create-or-refresh-artifacts`
(producer) and `generate-or-refresh-tasks` / `run-phase-review` (consumers).
Only produced in the feature schema when `design=true`.

### Format

```markdown
# Design: {title}

## Context

{Problem space, constraints, and existing system boundaries.}

## Goals / Non-Goals

### Goals

- {What this design achieves}

### Non-Goals

- {What this design explicitly does NOT do}

## Approaches Considered

### Approach 1: {name}

{Brief description, pros, cons.}

### Approach 2: {name}

{Brief description, pros, cons.}

### Selected Approach

{Which approach was chosen and WHY. Reference constraints that ruled out alternatives.}

## High-Level Design

### Architecture Overview

{System-level view — how components interact.}

### Key Abstractions

{Core interfaces, patterns, or concepts introduced.}

## Low-Level Design

### Components

{Component breakdown with responsibilities, inputs, outputs, dependencies.}

### Data Flow

{How data moves through the system.}

### State Management

{What state exists, where it lives, how it changes.}

### Error Handling

{Error handling strategy — what can fail and how.}

## Constraints

{Technical and business constraints.}

## Trade-offs

{What was sacrificed and why it's acceptable.}

## Decisions

- {Decision} → {Rationale} → {Consequence}

## Open Questions

- {Unresolved questions that may affect implementation}
```

### Field rules

| Field | Required | Format |
|-------|----------|--------|
| Context | Yes | Prose describing problem space |
| Goals | Yes | Bulleted list, at least one |
| Non-Goals | Yes | Bulleted list, at least one |
| Approaches Considered | Yes | At least 2 approaches with pros/cons |
| Selected Approach | Yes | References constraints that ruled out alternatives |
| Architecture Overview | Yes | System-level component interaction |
| Key Abstractions | Yes | Core interfaces or patterns introduced |
| Components | Contextual | Required when >2 components involved |
| Data Flow | Contextual | Required when data passes through >1 component |
| State Management | Contextual | Required when mutable state exists |
| Error Handling | Contextual | Required when external dependencies or user input involved |
| Constraints | Yes | "None beyond standard project conventions" if genuinely none |
| Trade-offs | Yes | At least one trade-off articulated |
| Decisions | Contextual | Populated when non-obvious choices made |
| Open Questions | Yes | Empty section means no blockers |

### Consumers

- `generate-or-refresh-tasks` — reads Components and Data Flow for task derivation
- `run-phase-review` — verifies structural compliance

---

## Diagnosis Format Contract

The `diagnosis.md` file is a structural contract between `diagnose` (producer) and
`create-or-refresh-artifacts` / `run-phase-review` (consumers). Only produced in the
bugfix schema.

### Format

```markdown
# Diagnosis: {title}

## Symptoms

{What's broken — error messages, screenshots, logs.}

## Reproduction Steps

1. {Step 1}
2. {Step 2}
3. {Observed failure}

## Expected vs Actual

- **Expected**: {what should happen}
- **Actual**: {what happens instead}

## Investigation

### Evidence Gathered

- {What was checked — logs, git blame, recent changes, config diffs}

### Data Flow Trace

{Trace from input to error point. Where does it diverge from expected?}

## Root Cause

{The actual cause — not symptoms, not guesses.}
Reference: `file_path:line_number`

## Impact

### Severity

{One of: critical, high, medium, low}

### Affected Areas

{Users, features, or systems impacted.}

### Since When

{Commit, PR, or date when introduced. "Unknown" if not determinable.}

## Linear Ticket

{HL-XXX or "none"}
```

### Field rules

| Field | Required | Format |
|-------|----------|--------|
| Symptoms | Yes | Prose with concrete evidence (error messages, logs) |
| Reproduction Steps | Yes | Numbered list, must be runnable/followable |
| Expected vs Actual | Yes | Two items: `**Expected**:` and `**Actual**:` |
| Evidence Gathered | Yes | Bulleted list of what was checked |
| Data Flow Trace | Yes | Prose tracing data path to error point |
| Root Cause | Yes | Prose with `file_path:line_number` reference |
| Severity | Yes | One of: `critical`, `high`, `medium`, `low` |
| Affected Areas | Yes | Prose or bulleted list |
| Since When | Yes | Commit/PR/date or "Unknown" |
| Linear Ticket | Yes | `HL-XXX` or `none` |

### Consumers

- `create-or-refresh-artifacts` — reads Root Cause for fix-plan.md generation
- `run-phase-review` — verifies structural compliance and root cause evidence

---

## Fix Plan Format Contract

The `fix-plan.md` file is a structural contract between `create-or-refresh-artifacts`
(producer) and `generate-or-refresh-tasks` / `run-phase-review` (consumers). Only
produced in the bugfix schema.

### Format

```markdown
# Fix Plan: {title}

## Fix Strategy

{What will be changed and why.}
Root cause reference: {from diagnosis.md Root Cause section}

## Affected Files

- `file_path:line_number` — {what changes and why}

## Regression Test

- **Test file**: {path}
- **Test name**: {name}
- **Asserts**: {what it proves}
- **Must fail before fix**: yes
- **Must pass after fix**: yes

## Risk Assessment

### Could This Break Other Things?

{Other code paths touching the same area. Shared state, side effects, coupling.}

### Rollback Plan

{How to revert if the fix causes issues.}

## Out of Scope

- {Related issues NOT fixed in this change — file separate bugs if needed}
```

### Field rules

| Field | Required | Format |
|-------|----------|--------|
| Fix Strategy | Yes | Prose referencing diagnosis.md Root Cause |
| Affected Files | Yes | Bulleted list, format: `` `file_path:line_number` — description `` |
| Regression Test | Yes | Structured block with Test file, Test name, Asserts, fail-before/pass-after |
| Could This Break Other Things? | Yes | Prose analysis or "No — isolated change" |
| Rollback Plan | Yes | Concrete revert steps or "git revert <commit>" |
| Out of Scope | Yes | Bulleted list or "None — fix is self-contained" |

### Consumers

- `generate-or-refresh-tasks` — reads Affected Files and Regression Test for task derivation
- `run-phase-review` — verifies structural compliance and diagnosis.md reference

---

## Repeat Conditions

Schemas use `repeat_until:` to loop step execution. Each condition has a formal
definition so all agents evaluate it identically.

| Condition | Definition |
|-----------|------------|
| `all_tasks_completed` | No task in tasks.md has an unchecked checkbox (`- [ ]`) remaining. A task marked `- [x]` is complete. A task marked `- [skip]` does not block completion. Evaluate by reading tasks.md and checking: zero lines match `^- \[ \]`. |

## State Field Registry

Steps that write to `state.yaml` MUST use the exact field paths below. This
prevents field name drift across agents and ensures resume/metrics consumers
find data where they expect it.

| Field Path | Type | Written By | Values / Format |
|------------|------|-----------|-----------------|
| `status` | string | check-bootstrap-state, archive-completed-change, final-signoff | `active`, `paused`, `completed` |
| `phase` | string | load-project-context, phase-signoff | Current phase name (lowercase, e.g., `specify`, `implement`, `complete`) |
| `next_step` | object | phase-signoff, any step advancing flow | `{ skill, phase, step_id, instruction }` |
| `step_history` | list | All steps (append-only) | See § State Updates above |
| `flags` | object | load-project-context | Resolved runtime flags (e.g., `{ tdd_required: true, ff: true }`) |
| `linear_ticket_id` | string | create-linear-ticket | Linear issue ID (e.g., `HL-123`). Also stored in `.spec.yaml`. |
| `archive_path` | string | archive-completed-change | Relative to repo root (e.g., `spec/changes/archive/2026-04-04-HL-123/`) |
| `metrics` | object | archive-completed-change | Full metrics block or `{ status: script_unavailable, reason: "..." }` |
| `approval` | object | phase-signoff, final-signoff | `{ type: user|auto, phase: <name>, timestamp: <ISO> }` |
| `rejection` | object | phase-signoff, final-signoff | `{ phase: <name>, feedback: "...", fix_tasks_created: [T-N, ...] }` |
| `retries` | object | run-phase-review, execute-next-task | `{ <step_id_or_task_id>: <count> }` — per-step/task retry counter |
| `refresh_artifacts` | boolean | run-phase-review (on fail) | `true` when artifacts need regeneration |

### Rules

- **Append-only for lists**: `step_history` is append-only. Never overwrite or reorder.
- **Exact field names**: Use the paths above verbatim. Do not invent aliases.
- **Null means absent**: If a field has no value yet, omit it entirely — do not write `null`.
- **Timestamps**: Use ISO 8601 format (`2026-04-04T20:00:00Z`).

## Rules-When Evaluation

Schemas use `rules_when:` on step references to inject conditional rules at
runtime. The evaluation protocol:

1. Read `state.yaml.flags` to get resolved flag values.
2. For each key in `rules_when:`:
   - If key matches a flag name and flag is truthy → activate those rules.
   - If key is `not <flag_name>` and flag is falsy (or absent) → activate those rules.
   - If key doesn't match any flag → ignore (no error).
3. Activated rules become **additional** rules for the step, appended after the
   step contract's own `rules:` section.
4. If both a `when:` condition (positive) and `not when:` condition match, this
   is a conflict — only the positive match applies.

## Phase Name Matching

When looking up `signoff_policy` from `project.yaml`, normalize the phase name:

1. Convert to lowercase.
2. Replace spaces and hyphens with underscores (e.g., `Design Phase` → `design_phase`).
3. Look up the normalized name in `signoff_policy`.
4. If key not found → **default to `required`** (conservative).

This ensures new phases get signoff by default rather than silently skipping approval.

## Anti-patterns

- **Instruction bloat**: Adding paragraphs of conditional logic to `instruction:`. Move to `rules:`.
- **Multi-intent**: Step that computes metrics AND archives AND writes logs. Split into separate steps.
- **Verify-as-instruction**: Writing verification logic in `instruction:` instead of `verify:`.
- **Rules in CLAUDE.md**: Project-agnostic rules belong in step contracts, not per-repo CLAUDE.md.

## When to split a step

Split when:
1. The intent has two unrelated verbs (e.g., "compute metrics and archive")
2. The step frequently fails at one part but not the other
3. Different agents should handle different parts (e.g., metrics = reviewer, archive = haiku)

Don't split when:
1. Steps are sequential parts of one investigation (reproduce → trace → document)
2. Steps are tightly coupled (check → decide based on check)
3. Splitting would add overhead with no quality benefit
