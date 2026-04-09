---
feature-id: HL-191
linear-ticket: HL-191
---

# Specification: Deterministic Step Contract Improvements

## Motivation

Step contracts reference flags as prose in instruction blocks. When agents execute steps, they must parse natural language to determine flag-driven behavior — introducing non-determinism. Flags resolved by the orchestrator should flow through structured declarations, not prose re-interpretation.

## What Changes

1. **Step contract format** gains a `flags_read:` field documenting flag dependencies
2. **project.yaml** gains `quality_bar.scoring` config for review score caps
3. **feature.yaml** gains `--no-ux` flag and `ux_design` default
4. **final-signoff.yaml** gains `auto` flag SKIP CONDITIONS
5. **Duplicate skip logic** removed from steps already gated by schema `if:`
6. **explore.yaml** references discovery template for output structure
7. **CONVENTIONS.md** updated with `flags_read:` documentation

## Requirements

### Functional

1. Every step that reads a flag MUST declare it in `flags_read:` with name, effect, and source
2. `project.yaml` MUST have `quality_bar.scoring` with configurable caps for critical/important findings
3. `run-phase-review.yaml` instruction MUST reference `project.yaml` scoring config as source of truth
4. `feature.yaml` MUST have `ux_design: true` default and `--no-ux` flag
5. `ux-design` step in feature.yaml MUST use `if: ux_design` instead of self-skip logic
6. `final-signoff.yaml` MUST have SKIP CONDITIONS for `auto` flag matching `phase-signoff` pattern
7. `design-exploration.yaml` MUST remove internal `auto_approve_phases` prose (schema gates it)
8. `phase-signoff.yaml` MUST remove internal skip prose (schema gates it via `if not auto_approve_phases`)
9. `explore.yaml` MUST reference `$SPEC_HOME/templates/feature/discovery.md` for output structure
10. `CONVENTIONS.md` MUST document the `flags_read:` field with examples

### Non-Functional

- Zero behavioral change to existing workflows — this is a structural improvement
- All existing step contracts remain valid (flags_read is additive)

## Architecture

Changes span three layers:
- **Step contracts** (`src/spec/steps/*.yaml`) — add flags_read, update instructions
- **Schema** (`src/spec/schemas/feature.yaml`) — add --no-ux flag
- **Project config** (`spec/project.yaml`) — add scoring config

No code changes. All YAML/Markdown edits.

## Test Strategy

### Test File Paths

N/A — YAML config files, no executable tests.

### Coverage Targets

N/A — validation is structural (YAML parsing, field presence).

### Key Test Scenarios

- Verify all step contracts with flag references have `flags_read:` field
- Verify `project.yaml` has `quality_bar.scoring` section
- Verify `feature.yaml` has `ux_design` default and `--no-ux` flag
- Verify no step has internal skip logic that duplicates schema `if:` gating

## Acceptance Criteria

- Given any step contract that references a flag, when inspected, then it has a `flags_read:` section declaring the flag [traces: UC-1]
- Given project.yaml, when read, then `quality_bar.scoring` has `critical_cap`, `important_cap` fields [traces: UC-2]
- Given feature schema with `--no-ux` flag, when `ux_design=false`, then ux-design step is skipped by schema [traces: UC-3]
- Given `final-signoff.yaml`, when `auto=true`, then SKIP CONDITIONS section documents auto-approval [traces: UC-E2]
- Given `phase-signoff.yaml` and `design-exploration.yaml`, when inspected, then no internal skip logic duplicates schema `if:` gating [traces: UC-1]
- Given `explore.yaml`, when inspected, then instruction references discovery template path [traces: UC-1]
- Given CONVENTIONS.md, when inspected, then `flags_read:` field is documented with format and example [traces: UC-1]

## Alternatives Considered

- **Orchestrator-enforced flag filtering** (only pass declared flags to agents) → Rejected: too risky, steps may implicitly depend on undeclared flags. Declarative-only is safer as a first step.
- **Moving all hardcoded matrices to YAML** → Deferred: valuable but too large for this change. Tracked separately.

## Impact

- No breaking changes — `flags_read:` is additive
- All existing workflows continue to work identically
- Future step contract authors get clearer guidance on flag usage

## Decisions

- `flags_read:` is documentation-only (not enforced by orchestrator) — safety over strictness
- Scoring config in project.yaml is source of truth; step prose kept as agent-readable comment
- Matrix extraction deferred to keep scope tight
