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
| Parallel | No | `[P]` suffix on description line = safe to run concurrently |

### Phase grouping

Tasks are grouped under `## Phase N: <Name>` headers. Phases execute sequentially;
tasks within a phase execute in dependency order (or in parallel if marked `[P]`
with no unmet dependencies).

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
