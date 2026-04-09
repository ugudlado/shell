---
feature-id: HL-191
linear-ticket: HL-191
---

# Discovery Brief: Deterministic Step Contract Improvements

## Feature Summary

Step contracts reference flags as prose in instruction blocks rather than structured config, creating a "telephone game" where each step re-interprets flag semantics. This change makes flag propagation explicit, moves hardcoded logic to configuration, adds missing deterministic controls, and removes redundant conditional logic — making the workflow engine more reliable and maintainable.

## Personas & Actors

- **Workflow orchestrator** (`/develop` skill) — resolves flags, walks phases, dispatches steps
- **Step contract agents** — receive merged context and execute step instructions
- **Autopilot** — runs `/develop --ff --auto --agents` for fully unattended execution
- **Developer (Mahesh)** — configures project.yaml, adds new schemas/steps

## Use Cases

### Happy Path

- UC-1: Orchestrator reads `flags_read:` from step contract and injects only the declared flags as structured context, eliminating prose interpretation
- UC-2: Developer changes scoring thresholds in `project.yaml` without editing step contract prose
- UC-3: `--no-ux` flag deterministically skips `ux-design` step via schema `if:` condition instead of fragile string matching

### Error & Edge Cases

- UC-E1: Step contract declares `flags_read: [auto]` but state.yaml doesn't have the flag — orchestrator uses schema default (false)
- UC-E2: `final-signoff` runs in agent mode without auto flag handling — agent blocks waiting for user input that can't arrive

## Scope

### In Scope

1. Add `flags_read:` field to step contract format + update CONVENTIONS.md
2. Move scoring caps from `run-phase-review.yaml` to `project.yaml`
3. Add `--no-ux` flag to feature schema + `ux-design if ux_design` gating
4. Add `auto` flag SKIP CONDITIONS to `final-signoff.yaml`
5. Remove duplicate skip logic from steps already gated by schema `if:` conditions
6. Define discovery brief template structure in explore step

### Out of Scope

- Extracting hardcoded matrices to YAML files (tooling, detection, gitignore) — separate chore, too large
- Changing orchestrator code (this is config/contract changes only)
- Adding new flags beyond `--no-ux`

## UI Direction

N/A — no UI components

## Key Decisions

- **flags_read is declarative, not enforced**: The field documents which flags a step reads. The orchestrator doesn't filter — it still passes the full context bundle. This avoids breaking steps that implicitly depend on flags they don't declare.
- **Scoring caps stay in step prose too**: project.yaml gets the config, but run-phase-review keeps the algorithm description for agent comprehension. The config is the source of truth; the prose is a comment.
- **Out-of-scope: matrix extraction**: Moving tooling/detection/gitignore matrices to YAML is valuable but large — tracked separately to keep this change focused.

## Open Questions

None — all decisions resolved during initial analysis.
