---
feature-id: ux-design-artifact-handoff
linear-ticket: HL-194
---

# Specification: UX Design Artifact Handoff

## Motivation

The ux-design step produces playground prototypes and critique feedback, but only records a text summary in the discovery brief. Downstream steps (task generation, implementation) read only spec.md and design.md, losing all visual/interaction design work. In autonomous runs building features with novel UX, the developer agent implements from text alone — ignoring approved designs.

## What Changes

1. New § UX Artifact Contract in CONVENTIONS.md defining what ux-design produces and what consumers read
2. Updated ux-design.yaml to persist prototype as `ux-prototype.html` and write `ux-artifacts.yaml` manifest
3. Updated generate-or-refresh-tasks.yaml to read UX artifacts when generating UI tasks
4. Updated execute-next-task.yaml with a rule to reference UX prototype for UI implementation tasks

## Requirements

### Functional

1. **FR-1**: ux-design step persists the final polished prototype as `ux-prototype.html` in `$SPEC_CHANGES_DIR/$CHANGE_ID/`
2. **FR-2**: ux-design step writes `ux-artifacts.yaml` manifest with artifact metadata (file, description, critique-status)
3. **FR-3**: generate-or-refresh-tasks reads `ux-artifacts.yaml` and creates tasks that reference `ux-prototype.html` for UI component implementation
4. **FR-4**: execute-next-task has a rule to read `ux-prototype.html` when implementing tasks tagged with UI files

### Non-Functional

1. **NFR-1**: Graceful degradation — when no UX artifacts exist (ux_design=false or non-UI feature), all downstream steps work unchanged

## Architecture

| File | Change | Purpose |
|------|--------|---------|
| `src/spec/steps/CONVENTIONS.md` | Add § UX Artifact Contract | Format contract for UX artifacts |
| `src/spec/steps/ux-design.yaml` | Add persist + manifest steps | Producer: save prototype and metadata |
| `src/spec/steps/generate-or-refresh-tasks.yaml` | Add UX artifact read | Consumer: reference UX in task generation |
| `src/spec/steps/execute-next-task.yaml` | Add UX reference rule | Consumer: developer reads prototype during UI tasks |

## Test Strategy

N/A — YAML/markdown-only changes. Verification is structural (sections exist, references are correct).

## Acceptance Criteria

- AC-1: CONVENTIONS.md has § UX Artifact Contract with format, field rules, and consumers [traces: UC-1]
- AC-2: ux-design.yaml instruction includes steps to save ux-prototype.html and write ux-artifacts.yaml [traces: UC-1]
- AC-3: generate-or-refresh-tasks.yaml instruction reads ux-artifacts.yaml when available [traces: UC-2]
- AC-4: execute-next-task.yaml has rule about referencing UX prototype for UI tasks [traces: UC-2]
- AC-5: All changes gracefully handle missing UX artifacts (ux_design=false) [traces: UC-E1]

## Alternatives Considered

**Alternative 1: Embed UX direction in spec.md instead of separate artifacts**
Rejected. spec.md is text-based and can't carry HTML prototypes. The prototype file is the actual visual reference — text summaries lose fidelity.

**Alternative 2: Save multiple prototype files (one per option)**
Rejected. Over-engineered for current needs. The ux-design step already selects one direction — only the final polished version needs to persist.

## Impact

No breaking changes. Existing features without UX artifacts continue working unchanged (NFR-1). The ux-artifacts.yaml manifest is new — downstream steps check for its existence before reading.

## Decisions

- Single prototype file per change for simplicity
- YAML manifest over JSON for consistency with other workflow artifacts
