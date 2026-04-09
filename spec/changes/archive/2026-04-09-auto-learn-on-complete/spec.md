---
feature-id: auto-learn-on-complete
linear-ticket: HL-195
---

# Specification: Auto-Learn on Complete

## Motivation

The workflow system executes features, bugfixes, and chores through schema-driven phases, but never learns from the results unless a human manually invokes `/learn`. In `--auto` mode (the primary autopilot path), learning never happens -- the workflow executes perfectly but improves nothing for the next iteration.

The feedback loop is broken: completed changes produce step_history, quality scores, and metrics that sit unused. Closing this loop means every completed change automatically improves the next one without human involvement.

## What Changes

A new step contract `run-learn-cycle.yaml` is added to the `complete` phase of the feature, bugfix, and chore schemas. It runs after `archive-completed-change` and invokes the existing `/learn` skill against the archived state. The autopilot skill's redundant explicit `/learn` call is removed.

## Requirements

### Functional

1. **FR-1**: A `run-learn-cycle` step contract exists at `$SPEC_HOME/steps/` that invokes `/learn` for the just-completed change.
2. **FR-2**: The `run-learn-cycle` step appears as the final step in the `complete` phase of the feature, bugfix, and chore schemas (after `archive-completed-change`).
3. **FR-3**: The step reads state.yaml from the archived path (`spec/changes/archive/YYYY-MM-DD-$CHANGE_ID/`), not the active change directory (which is deleted by archive step 8).
4. **FR-4**: The autopilot skill's step 4d (explicit `/learn` call) is removed to prevent double-invocation.
5. **FR-5**: The `/develop` skill's mechanical steps dispatch table includes an entry for `run-learn-cycle`.

### Non-Functional

1. **NFR-1**: Learning failure is non-blocking -- if `/learn` fails (opus unavailable, malformed state, network error), the step logs a warning and returns success. The archive is already committed; nothing is lost.
2. **NFR-2**: In `--auto` mode, the learn step runs non-interactively. Rule changes apply without user confirmation (this is already how workflow-evaluator works).

## Architecture

### Components

| Component | Role | Change |
|-----------|------|--------|
| `run-learn-cycle.yaml` | Step contract | New file |
| `feature.yaml` | Schema | Add step to complete phase |
| `bugfix.yaml` | Schema | Add step to complete phase |
| `chore.yaml` | Schema | Add step to complete phase |
| `autopilot/SKILL.md` | Skill | Remove redundant step 4d |
| `develop/SKILL.md` | Skill | Add mechanical step entry |

### Data Flow

```
run-learn-cycle
  |-- reads state.yaml from active dir ($SPEC_CHANGES_DIR/$CHANGE_ID)
  |-- invokes /learn with $CHANGE_ID
  v
archive-completed-change
  |-- commits archive to spec/changes/archive/YYYY-MM-DD-$CHANGE_ID/
  |-- cleans up active dir ($SPEC_CHANGES_DIR/$CHANGE_ID)
  |-- /learn spawns workflow-evaluator (opus)
  |-- evaluator routes findings: step contracts, CLAUDE.md, Linear
  |-- on failure: logs warning, returns success
```

### File Modification Table

| File | Action |
|------|--------|
| `~/.config/spec/steps/run-learn-cycle.yaml` | Create |
| `~/.config/spec/schemas/feature.yaml` | Modify (add step) |
| `~/.config/spec/schemas/bugfix.yaml` | Modify (add step) |
| `~/.config/spec/schemas/chore.yaml` | Modify (add step) |
| `~/.claude/skills/autopilot/SKILL.md` | Modify (remove step 4d) |
| `~/.claude/skills/develop/SKILL.md` | Modify (add dispatch entry) |

## Test Strategy

N/A -- this is a config_docs change (YAML + markdown). No executable code, no test files.

### Key Verification Scenarios

- Step contract follows the established pattern (matches `create-linear-ticket.yaml` structure).
- Schema YAML is valid after modification (steps array intact, no syntax errors).
- Archive path reference in the step contract is correct.
- Non-blocking error handling is specified in the step contract rules.

## Acceptance Criteria

- AC-1: Given the `run-learn-cycle.yaml` step contract, when inspected, then it has `id`, `version`, `intent`, `inputs`, `rules`, `instruction`, `verify`, and `outputs` fields matching the CONVENTIONS.md step contract format. [traces: UC-1, UC-2]
- AC-2: Given the feature schema, when the `complete` phase steps are listed, then `run-learn-cycle` appears after `archive-completed-change` as the final step. [traces: UC-1]
- AC-3: Given the bugfix schema, when the `complete` phase steps are listed, then `run-learn-cycle` appears after `archive-completed-change` as the final step. [traces: UC-2]
- AC-4: Given the chore schema, when the `complete` phase steps are listed, then `run-learn-cycle` appears after `archive-completed-change` as the final step. [traces: UC-5]
- AC-5: Given the `run-learn-cycle` instruction, when reading the state.yaml path, then it references the archive path (`spec/changes/archive/YYYY-MM-DD-$CHANGE_ID/state.yaml`), not the active change directory. [traces: UC-1, UC-2]
- AC-6: Given the `run-learn-cycle` rules, when `/learn` fails, then a warning is logged to state.yaml (`learn_skipped: true, learn_error: <message>`) and the step returns success. [traces: UC-3]
- AC-7: Given the autopilot SKILL.md, when step 4d is inspected, then the explicit `/learn` invocation and its surrounding text are removed. [traces: UC-4]
- AC-8: Given the `/develop` SKILL.md mechanical steps section, when inspected, then `run-learn-cycle` has an entry describing how it is dispatched (spawn haiku-agent with step contract instruction, similar to `archive-completed-change`). [traces: UC-1]

## Alternatives Considered

**Alternative 1: Embed learn invocation inside `archive-completed-change`**
Rejected. Violates SRP -- archive's intent is metrics computation and file archiving, not workflow learning. The `create-linear-ticket` pattern (thin separate step) is the established precedent for this kind of concern separation.

**Alternative 2: Add a hooksmith rule that fires on archive completion**
Rejected. Hooks fire on session events (PreToolUse, PostToolUse, Stop), not on schema step completion. There is no hook event for "step X finished."

**Alternative 3: Add a `--no-learn` flag to skip learning**
Rejected as premature. Non-blocking failure handling already covers the skip case gracefully. If learning fails, it logs a warning and continues. A flag adds complexity without solving a real problem.

## Impact

No breaking changes. The learning step is additive and non-blocking. Existing workflows gain automatic learning; failure to learn does not affect the archive or completion outcome.

The only behavioral change is in `/autopilot`, where the redundant `/learn` call is removed. This is safe because the learn step now runs inside `/develop`'s complete phase, which autopilot delegates to.

## Decisions

- **Separate step contract (not embedded in archive)**: SRP compliance. Follows the `create-linear-ticket` pattern of thin steps that invoke existing skills.
- **Mechanical step dispatched as haiku-agent**: The step contract itself is thin (invoke `/learn`). The heavy opus reasoning happens inside `/learn`'s workflow-evaluator spawn. The dispatch entry in `/develop` uses the same pattern as `archive-completed-change` -- spawn a haiku-agent with the step contract instruction. [ASSUMPTION: haiku is sufficient to orchestrate the `/learn` skill invocation; the skill itself handles spawning opus internally.]
- **Archive path, not active path**: `archive-completed-change` step 8 deletes the active directory. The learn step must read from `spec/changes/archive/YYYY-MM-DD-$CHANGE_ID/state.yaml`. The archive path is available from state.yaml's `archive_path` field (set in archive step 4).
- **Non-blocking by design**: Matches the precedent set by metrics computation in `archive-completed-change` (rule: "Metrics script failure is non-blocking").

<!-- Format contract: CONVENTIONS.md § Specification Format Contract -->
