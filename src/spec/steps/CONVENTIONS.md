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
| `next_step` | object | phase-signoff, any step advancing flow | See § Resume Token Format Contract |
| `step_history` | list | All steps (append-only) | See § State Updates above |
| `flags` | object | load-project-context | Resolved runtime flags (e.g., `{ tdd_required: true, ff: true }`) |
| `linear_ticket_id` | string | create-linear-ticket | Linear issue ID (e.g., `HL-123`). Also stored in `.spec.yaml`. |
| `archive_path` | string | archive-completed-change | Relative to repo root (e.g., `spec/changes/archive/2026-04-04-HL-123/`) |
| `metrics` | object | archive-completed-change | Full metrics block or `{ status: script_unavailable, reason: "..." }` |
| `approval` | object | phase-signoff, final-signoff | `{ type: user|auto, phase: <name>, timestamp: <ISO> }` |
| `rejection` | object | phase-signoff, final-signoff | `{ phase: <name>, feedback: "...", fix_tasks_created: [T-N, ...] }` |
| `retries` | object | run-phase-review, execute-next-task | `{ <step_id_or_task_id>: <count> }` — per-step/task retry counter |
| `refresh_artifacts` | boolean | run-phase-review (on fail) | `true` when artifacts need regeneration |
| `change_type` | string | generate-or-refresh-tasks (after task creation) | `code` or `config_docs` — per § Change Type Detection |
| `flag_adaptations` | list | generate-or-refresh-tasks (when change_type adapts flags) | `[{ flag, original, effective, reason }]` |

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

## Rule Merge Contract

Every step executes with a **merged rule set** — the union of rules from multiple
sources, deduplicated and filtered by flag conditions. This contract defines the
deterministic algorithm that any agent (or the orchestrator) uses to compute the
merged rules for a given step.

### Rule Source Taxonomy

Rules come from 5 sources, listed in precedence order (highest to lowest):

| Source | Location | Format | Precedence |
|--------|----------|--------|------------|
| Step entry injections | Schema `phases[].steps[]` — `rules_when:` and `extra_rules:` | Plain strings | 1 (highest) |
| Step contract rules | `$SPEC_HOME/steps/<step>.yaml` — `rules:` | Plain strings | 2 |
| Phase rules | Schema `phases[].rules:` | Plain strings | 3 |
| Schema rules | Schema top-level `rules:` | Named (`id:`, `rule:`, optional `when:`) | 4 |
| Project rules | `project.yaml` `rules:` | Named (`id:`, `rule:`, optional `when:`) | 5 (lowest) |

### Rule Formats

**Named rules** (schema and project levels):
```yaml
- id: tdd-default
  when: tdd_required        # optional — omit for always-active
  rule: Write failing test before implementation.
```

**Plain string rules** (phase, step contract, and injected):
```yaml
- Keep scope explicit (in-scope and out-of-scope).
- Fix root cause, not symptoms.
```

**Injected rules** (from `rules_when:` and `extra_rules:` on step entries):
- `rules_when:` → conditional on flags, evaluated per § Rules-When Evaluation
- `extra_rules:` → always included

### Merge Algorithm

Given: `state.yaml.flags`, `project.yaml`, schema YAML, current phase, current step.

```
MERGE(flags, project, schema, phase, step_entry, step_contract):

  1. COLLECT named rules:
     a. Start with project.yaml rules[] → named_rules{}  (keyed by id)
     b. For each schema rules[] entry:
        - If same id exists in named_rules → OVERRIDE (schema wins over project)
        - Else → ADD to named_rules
     c. Result: named_rules{} with one entry per unique id

  2. FILTER named rules by when-conditions:
     For each entry in named_rules:
       - If entry has no `when:` → KEEP (always active)
       - If entry has `when: <flag>` and flags[flag] is truthy → KEEP
       - If entry has `when: <flag>` and flags[flag] is falsy → REMOVE
     Result: active_named_rules[]

  3. COLLECT plain rules (no deduplication — accumulate all):
     a. phase_rules[] = schema.phases[current].rules[]  (plain strings)
     b. step_rules[] = step_contract.rules[]  (plain strings)
        FILTER learned rules by repo scope:
        For each rule in step_rules[]:
          If rule has `<!-- learned: ... repo: X -->` metadata:
            If X == $REPO_NAME or X == "*": KEEP
            Else: SKIP (rule is scoped to a different repo)
          If rule has `<!-- learned: ... -->` but no `repo:` field: KEEP (backward compat = universal)
          If rule has no metadata (permanent rule): KEEP
     c. injected_rules[] = evaluate rules_when(step_entry, flags)
        per § Rules-When Evaluation
     d. extra[] = step_entry.extra_rules[]  (always included)

  4. ASSEMBLE merged list in precedence order:
     merged = []
     merged += injected_rules[]     # source 1 (highest)
     merged += extra[]              # source 1
     merged += step_rules[]         # source 2
     merged += phase_rules[]        # source 3
     merged += active_named_rules[] # sources 4+5 (extract rule: text only)

  5. RETURN merged[]
```

### Precedence Semantics

- **Named rules**: Deduplicated by `id`. Higher-precedence source wins on collision
  (schema overrides project). Within the same source, original order preserved.
- **Plain/injected rules**: Never deduplicated. All accumulate. Two identical strings
  from different sources both appear in the merged list.
- **Output order**: Highest precedence first (injected → step → phase → named).
  Within each source, original declaration order preserved.

### Example

Given:
- project.yaml: `[{id: evidence-based, rule: "Show output"}, {id: tdd, when: tdd_required, rule: "Write tests first"}]`
- schema rules: `[{id: tdd, when: tdd_required, rule: "Write failing test before impl"}]`
- phase rules: `["Keep scope explicit"]`
- step contract rules: `["Verify every criterion"]`
- step entry extra_rules: `["Fix root cause"]`
- flags: `{tdd_required: false}`

Merge result:
```
1. "Fix root cause"              # extra_rules (source 1)
2. "Verify every criterion"      # step contract (source 2)
3. "Keep scope explicit"         # phase (source 3)
4. "Show output"                 # project named, id: evidence-based (source 5, no when → active)
```

Note: `tdd` rule is REMOVED because `tdd_required` is false. Schema's version
overrode project's version (same id), but both are filtered out by the when-condition.

## Change Type Detection

The orchestrator classifies each change as "code" or "config_docs" to adapt
agent spawning, TDD applicability, and review behavior. This prevents false
expectations (e.g., TDD for YAML-only changes) and allows efficient inline
execution for non-code changes without violating flag contracts.

### Extension Classification

| Category | Extensions |
|----------|-----------|
| Code | `.ts`, `.tsx`, `.js`, `.jsx`, `.py`, `.rs`, `.go`, `.java`, `.rb`, `.swift`, `.kt`, `.c`, `.cpp`, `.h`, `.cs`, `.vue`, `.svelte` |
| Config/Docs | `.yaml`, `.yml`, `.json`, `.toml`, `.md`, `.mdx`, `.txt`, `.css`, `.scss`, `.html`, `.xml`, `.env`, `.sh`, `.bash`, `.zsh` |
| Unknown | Any extension not in either list → treat as **code** (conservative) |

### Detection Algorithm

```
DETECT_CHANGE_TYPE(tasks_md):
  1. Parse all `Files:` fields from tasks.md
  2. Extract file extensions from each path
  3. Classify each extension per table above
  4. If ALL extensions are config/docs → change_type = "config_docs"
     If ANY extension is code or unknown → change_type = "code"
  5. Write change_type to state.yaml
```

### Flag Adaptation Rules

When `change_type = "config_docs"`:

| Flag | Adaptation | Rationale |
|------|-----------|-----------|
| `agents` | Steps with `agent: developer` MAY execute inline instead of spawning. Log `agent: inline (config_docs)` in step_history. | No benefit to spawning a developer agent for YAML/markdown edits. |
| `agents` | Steps with `agent: reviewer` MAY execute inline instead of spawning. Log `agent: inline (config_docs)` in step_history. | Structural review is faster inline for non-code. |
| `tdd_required` | Effective value becomes `false` regardless of flag setting. Tasks omit RED/GREEN/REFACTOR pattern. Log adaptation in state.yaml. | No code to test — TDD is meaningless. |
| `auto_approve_phases` | No change — phases still need signoff per flag. | Signoff is about scope control, not code quality. |

When `change_type = "code"`: No adaptations — all flags apply as-is.

### State Recording

When change type causes flag adaptation, record it in state.yaml:

```yaml
change_type: config_docs
flag_adaptations:
  - flag: tdd_required
    original: true
    effective: false
    reason: "config_docs change — no code to test"
  - flag: agents
    original: true
    effective: true
    note: "agents flag honored but developer/reviewer steps may execute inline"
```

## Error Recovery Contract

Defines deterministic state transitions for all failure scenarios in the workflow.
The orchestrator and agents follow this contract to ensure identical recovery
behavior regardless of which model executes the step.

### State Transition Table

| Trigger | Condition | state.yaml Update | Next Action |
|---------|-----------|-------------------|-------------|
| Step completed | verify: assertions all pass | `step_history[]: {status: completed}` | Advance to next step |
| Step failed | verify: assertion fails | `step_history[]: {status: failed}`, increment `retries.<step_id>` | Re-execute step (same instruction + failure context) |
| Step blocked | Agent returns `STATUS: blocked` | `step_history[]: {status: blocked, blocker: "..."}` | Re-spawn agent once with blocker context (see § Agent Blocked Protocol) |
| Step blocked (2nd) | Agent blocked after re-spawn | `step_history[]: {status: failed}`, increment `retries.<step_id>` | Treat as step failure → retry or escalate |
| Phase verification failed | Any verify.command exits non-0, assertion false, or metric below threshold | `step_history[]: {step_id: run-phase-review, status: failed}`, increment `retries.phase_verify` | Generate fix tasks per § Fix Task Protocol, re-run phase review |
| Retry exhausted | `retries.<key> >= max_retries` | No additional update | Execute `on_max_retries` action per § Escalation Protocol |
| Agent spawn failed | Agent tool returns error | `step_history[]: {status: failed, error: "spawn failed"}` | Retry spawn once. If still fails, treat as retry exhausted. |

### Fix Task Protocol

When phase verification fails and retries remain:

1. For each failing assertion or command, generate exactly one fix task:
   - **Finding**: the specific failure (command output or assertion text)
   - **Scope**: only files directly related to the failure
   - **Approach**: minimal change to make the assertion/command pass
2. Append fix tasks to tasks.md under the current phase, using Task Format Contract
3. Mark the failing step as needing re-execution
4. Do NOT generate refactoring or improvement tasks — only fix the specific failure

### Agent Blocked Protocol

When an agent returns `STATUS: blocked`:

```
HANDLE_BLOCKED(agent_result, step, attempt):
  1. If attempt == 1:
     - Append blocker context to prompt: "Previous attempt was blocked: [BLOCKER]"
     - Re-spawn agent with augmented prompt
     - Set attempt = 2
  2. If attempt == 2:
     - Do NOT re-spawn
     - Record as step failure: {status: failed, blocker: agent_result.BLOCKER}
     - Increment retries.<step_id>
     - Follow retry/escalation logic
```

Maximum agent re-spawns for blocked status: **1** (total attempts: 2).

### Escalation Protocol

When `retries.<key> >= max_retries`, execute the `on_max_retries` action:

| Action Value | Behavior | When Used |
|-------------|----------|-----------|
| `escalate` | Set `status: paused` in state.yaml. Present failure summary to user with: failing assertions, retry count, suggested fix direction. Wait for user input. | Default. Used when `auto` flag is false. |
| `ticket` | Create a Linear ticket with failure details. Set `status: paused`. Continue to next phase if possible, or stop. | Used when `auto` flag is true — autonomous mode cannot pause for user input. |
| *(absent)* | Default to `escalate` if `auto` is false, `ticket` if `auto` is true. | When schema omits `on_max_retries`. |

### Missing STATUS Rule

If an agent's output does not contain a `STATUS:` field (either `completed` or `blocked`),
treat the result as `STATUS: blocked` with `stop_reason: missing_status`. Follow the
Agent Blocked Protocol — re-spawn once with context explaining the missing STATUS, then
treat as step failure if the second attempt also lacks STATUS.

This prevents silent success assumptions when agents return ambiguous output (e.g., empty
output, unstructured text, or error messages without the structured result format).

### State Recording for Failures

```yaml
# Step failure example
step_history:
  - step_id: execute-next-task
    phase: implement
    status: failed
    agent: developer
    error: "Test assertion failed: expected 200, got 404"
    retry_count: 2  # optional — total attempts for this step

# Retry counter
retries:
  execute-next-task: 2
  phase_verify: 1
```

### Structured Error Events

The `error_events` field in state.yaml records every agent failure with structured data.
This enables post-run diagnostics (autopilot reading state.yaml to understand why a run
failed) and cross-session resume (hooks reading failure context on session start).

```yaml
# Top-level field in state.yaml — backward compatible (optional)
error_events:
  - step_id: execute-next-task
    phase: implement
    agent: developer
    attempt: 1
    stop_reason: error
    detail: "Agent internal error — no output returned"
    timestamp: "2026-04-05T04:12:00Z"
  - step_id: execute-next-task
    phase: implement
    agent: developer
    attempt: 2
    stop_reason: missing_status
    detail: "Agent returned output without STATUS field (0 tool calls)"
    timestamp: "2026-04-05T04:15:00Z"
```

#### error_events Field Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `step_id` | string | Yes | Step contract ID where failure occurred |
| `phase` | string | Yes | Phase name |
| `agent` | string | Yes | Agent role (e.g., `developer`, `reviewer`, `discoverer`) |
| `attempt` | integer | Yes | 1-based attempt number for this step |
| `stop_reason` | enum | Yes | One of: `error`, `missing_status`, `empty_output`, `spawn_failed`, `max_iterations_exceeded` |
| `detail` | string | Yes | Human-readable failure description (agent output excerpt or error message) |
| `timestamp` | string | Yes | ISO 8601 timestamp |

#### stop_reason Values

| Value | Meaning |
|-------|---------|
| `error` | Agent returned `STATUS: blocked` or subagent-gate reported `stop_reason: error` |
| `missing_status` | Agent output did not contain a `STATUS:` field |
| `empty_output` | Agent returned with zero tool calls (subagent-gate detected) |
| `spawn_failed` | Agent tool itself returned an error (spawn did not complete) |
| `max_iterations_exceeded` | `repeat_until` step hit the max_iterations ceiling |

#### Backward Compatibility

`error_events` is optional. State.yaml files without this field are valid — the
orchestrator initializes it as an empty array on first failure. Existing tools
(workflow-state.sh, auto-continue.sh) that read state.yaml are not affected.

## Resume Token Format Contract

The `next_step` object in state.yaml is the critical resume mechanism. Session-start
hooks (`workflow-state.sh`, `auto-continue.sh`) and the `/develop` orchestrator read
this to know exactly where to continue after a pause or session boundary.

### Format

```yaml
next_step:
  skill: develop          # which skill to invoke for resume
  phase: implement        # current or next phase name
  step_id: execute-next-task  # next step to execute
  instruction: "Execute next task from tasks.md"  # human-readable from step's intent field
```

### Field Rules

| Field | Required | Format |
|-------|----------|--------|
| `skill` | Yes | Skill name to invoke (e.g., `develop`, `implement`, `complete-feature`). Hooks use this to construct the resume command (`/{skill}`). |
| `phase` | Yes | Phase name (lowercase, e.g., `specify`, `implement`, `complete`). Must match a phase in the current schema. |
| `step_id` | Yes | Step contract ID (e.g., `execute-next-task`, `run-phase-review`). Must be a valid step in the named phase. |
| `instruction` | Yes | Human-readable description from the step's `intent:` field. Displayed in hook messages. |

### Validity Rules

- `next_step` is written after every step completion (not just phase boundaries)
- `next_step` is cleared (removed) when `status` transitions to `completed`
- `phase` must reference a phase that exists in the schema loaded from state.yaml's `schema:` field
- `step_id` must reference a step in the phase's active step list (post-filtering)
- If the current step is the last in the last phase, `next_step` should reference
  the completion step (`archive-completed-change`) or be omitted

### Consumers

- `workflow-state.sh` — reads `skill` and `instruction` for session-start context
- `auto-continue.sh` — reads `skill` and `instruction` for auto-resume messages
- `/develop` skill — reads `phase` and `step_id` to jump directly to resume point

## UX Artifact Contract

The `ux-design` step produces visual prototypes and critique feedback. This contract
defines the artifact format so downstream steps (task generation, implementation) can
reference approved designs instead of working from text-only specs.

### Artifacts

| File | Required | Producer | Format |
|------|----------|----------|--------|
| `ux-prototype.html` | Yes (when ux-design runs) | `ux-design` | Self-contained HTML file from /playground or /frontend-design |
| `ux-artifacts.yaml` | Yes (when ux-design runs) | `ux-design` | Manifest with artifact metadata |

### ux-artifacts.yaml Format

```yaml
prototype:
  file: ux-prototype.html
  description: "<one-line description of the design>"
  options_considered: <number of options generated>
  selected_option: <which option was chosen (1-indexed)>
  critique_status: "<passed|passed-with-fixes|skipped>"
  critique_rounds: <number of /critique iterations>
```

### Field Rules

| Field | Required | Format |
|-------|----------|--------|
| `prototype.file` | Yes | Always `ux-prototype.html` |
| `prototype.description` | Yes | One-line summary of the visual direction |
| `prototype.options_considered` | Yes | Integer >= 1 |
| `prototype.selected_option` | Yes | Integer, 1-indexed |
| `prototype.critique_status` | Yes | One of: `passed`, `passed-with-fixes`, `skipped` |
| `prototype.critique_rounds` | Yes | Integer >= 0 |

### Graceful Degradation

When `ux_design=false` or the ux-design step was filtered out:
- `ux-artifacts.yaml` does not exist
- Downstream steps MUST check for `ux-artifacts.yaml` existence before reading
- Missing UX artifacts is a normal condition, not an error

### Consumers

- `generate-or-refresh-tasks` — reads `ux-artifacts.yaml` to create UI-specific tasks referencing `ux-prototype.html`
- `execute-next-task` — developer reads `ux-prototype.html` as visual reference when implementing UI tasks
- `run-phase-review` — verifies UX artifacts exist when ux-design step completed
- `run-feature-verification` — verifies implementation matches prototype direction

---

## Auto-Commit Convention

After each task passes verification in the `execute-next-task` step, the agent
commits the changes immediately. This ensures long implementation phases survive
session interruptions — each completed task is durably saved.

### Commit Message Format

```
<prefix>(<change-id>): T-<N> <task title>
```

### Schema-to-Prefix Mapping

| Schema | Prefix |
|--------|--------|
| `feature` | `feat` |
| `bugfix` | `fix` |
| `chore` | `chore` |
| `spike` | `spike` |

### Rules

- **Commit only on success**: Only commit after the task's verification passes and
  it is marked `[x]` in tasks.md. Never commit failing state.
- **Scope**: Stage only files listed in the task's `Files:` field plus `tasks.md`.
  Do not `git add -A` — this prevents accidentally committing unrelated changes.
- **Squash-friendly**: These per-task commits may be squashed during
  `archive-completed-change` or at merge time. The granularity is for resilience,
  not final history.
- **Co-author**: Include the standard Co-Authored-By trailer.
- **Skip if no changes**: If verification passes but `git status --porcelain` shows
  no modified files (e.g., the task was a verification-only task), skip the commit.

### Example

```
feat(HL-193): T-2 Add retry logic to API client

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Consumers

- `execute-next-task` — produces commits per this convention
- `archive-completed-change` — may squash per-task commits at completion
- `run-phase-review` — can verify commits exist for completed tasks

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
- **Rules in wrong place**: Workflow rules belong in step contracts. Project-specific learnings belong in project.yaml `learnings:`. CLAUDE.md is a pointer only.

## When to split a step

Split when:
1. The intent has two unrelated verbs (e.g., "compute metrics and archive")
2. The step frequently fails at one part but not the other
3. Different agents should handle different parts (e.g., metrics = reviewer, archive = haiku)

## Rule Lifecycle Convention

Rules in step contracts have two classes: **permanent** (hand-written, original to the step) and **learned** (added by `/learn` via workflow-fixer). Only learned rules are subject to decay evaluation.

### Metadata Comment Format

Every rule added by `/learn` MUST include a metadata comment on the same line, immediately after the rule text:

```yaml
rules:
  - When keeping an intentionally broad catch, annotate with a justification comment. <!-- learned: 2026-04-05, source: HL-194, cycle: 5, hits: 3, misses: 0, repo: shell -->
```

| Field | Format | Required | Default |
|-------|--------|----------|---------|
| `learned:` | `YYYY-MM-DD` — date the rule was added | Yes | — |
| `source:` | Feature ID (e.g., `HL-194`) that triggered this rule | Yes | — |
| `cycle:` | `/learn` cycle count when this rule was added | Yes | — |
| `hits:` | Count of features where the rule's step had zero retries | No | `0` |
| `misses:` | Count of features where the rule's step had retries | No | `0` |
| `repo:` | Repo name this rule applies to, or `*` for universal | No | `*` |

**Repo scoping**: Learned rules are scoped to the repo that generated them. When `/learn`
writes a rule, it includes `repo: $REPO_NAME` (e.g., `repo: shell`). The Rule Merge
Contract (§ below) filters learned rules so only rules matching the current repo (or
`repo: *` universal rules) are applied. This prevents rules learned in one repo from
incorrectly constraining a different repo with a different tech stack.

- **Repo-scoped** (`repo: <name>`): Default. Tech-stack or domain rules — apply only to the originating repo.
- **Universal** (`repo: *`): Workflow mechanics — rules about the workflow system itself that apply everywhere. The evaluator must explicitly classify a rule as universal.

**Backward compatibility**: Rules without `repo:` are treated as `repo: *` (universal).
Rules without `hits`/`misses` fields are treated as `hits: 0, misses: 0`.
The `/learn` cycle updates counters automatically (see `/learn` skill § Rule Effectiveness Update).

### Permanent Rules

Rules **without** a `<!-- learned: ... -->` metadata comment are permanent. They:
- Were hand-written as part of the original step contract
- Are never evaluated for decay
- Are never removed by the decay evaluation process

### Learned Rules (Lifecycle)

Rules **with** a `<!-- learned: ... -->` metadata comment are subject to decay evaluation.

**Effectiveness-based removal**: A learned rule is eligible for removal when ANY of:
- `hits == 0 AND (current_cycle - rule_cycle) > 5` — rule has never demonstrably helped after 5+ features
- `misses / (hits + misses) > 0.7 AND (current_cycle - rule_cycle) > 10` — rule is mostly ineffective (>70% miss rate) over a sufficient sample
- The `source:` feature-id does not appear in recent retry analysis or evaluator findings, AND `hits == 0`

**Effectiveness-based retention**: A learned rule is retained when:
- `hits > 0 AND misses / (hits + misses) <= 0.7` — rule is demonstrably working

A learned rule is flagged for resolution when:
- It offers opposing advice to a newer learned rule in the same step contract on the same topic

### Evaluation Trigger

Decay evaluation runs every 5th `/learn` invocation (see `/learn` skill § Rule Decay Evaluation). Flagged rules are routed to workflow-fixer for pruning — never removed inline. Rules without metadata are never touched.

Don't split when:
1. Steps are sequential parts of one investigation (reproduce → trace → document)
2. Steps are tightly coupled (check → decide based on check)
3. Splitting would add overhead with no quality benefit
