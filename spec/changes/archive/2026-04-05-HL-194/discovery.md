---
feature-id: ux-design-artifact-handoff
linear-ticket: HL-194
---

# Discovery Brief: UX Design Artifact Handoff

## Feature Summary

The ux-design step creates playground prototypes and critique feedback during the specify phase, but this work is lost before implementation begins. The generate-or-refresh-tasks and execute-next-task steps only read spec.md and design.md, with no mechanism to reference UX prototypes. This feature adds a formal artifact contract that persists UX output and wires it into downstream steps.

## Personas & Actors

- **Autopilot orchestrator**: Spawns ux-design agent, then spawns task generation and developer agents — needs artifact continuity between them.
- **Developer agent**: Implements UI features — needs reference to approved visual/interaction design.
- **Architect agent**: Generates implementation tasks — needs UX artifacts to create UI-specific tasks.

## Use Cases

### Happy Path

UC-1: Prototype persisted — ux-design agent creates a playground prototype and saves it as `ux-prototype.html` in the change directory, with a manifest entry in `ux-artifacts.yaml`.
UC-2: Task generation reads UX — generate-or-refresh-tasks reads `ux-artifacts.yaml` and creates implementation tasks that reference specific UX decisions.

### Error & Edge Cases

UC-E1: No UX step — when ux_design=false, no UX artifacts exist and downstream steps skip UX references gracefully.

## Scope

### In Scope

- UX Artifact Contract in CONVENTIONS.md (format, fields, consumers)
- Update ux-design.yaml to persist prototype as named artifact
- Update generate-or-refresh-tasks.yaml to read UX artifacts
- Update execute-next-task.yaml with rule about referencing UX prototype

### Out of Scope

- Changing the /playground or /frontend-design skills themselves (they're fine, just their output isn't persisted)
- Adding screenshot/visual diffing (future enhancement)
- Multi-prototype support (one prototype per change is sufficient for now)

## UI Direction

N/A — no UI components. This is workflow infrastructure.

## Key Decisions

- Single `ux-prototype.html` file per change (not multiple files) — keeps the contract simple and avoids file management complexity
- Manifest file `ux-artifacts.yaml` lists artifact metadata — enables downstream steps to check existence without parsing HTML

## Open Questions

None — the gap and solution are well-defined.
