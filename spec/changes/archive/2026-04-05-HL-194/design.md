# Design: UX Design Artifact Handoff

## Context

The workflow system has 5 artifact format contracts in CONVENTIONS.md (Discovery, Specification, Design, Diagnosis, Fix Plan) but none for UX artifacts. The ux-design step is the only step that produces output without a formal contract — its output goes to a text section in discovery.md rather than a structured artifact.

## Goals / Non-Goals

### Goals

- Define a formal contract for UX artifacts (prototype file + manifest)
- Wire UX output into task generation and execution steps
- Maintain graceful degradation when UX artifacts don't exist

### Non-Goals

- Changing the /playground or /frontend-design skills
- Adding visual regression testing
- Supporting multiple prototypes per change

## Approaches Considered

### Approach 1: Inline UX in existing artifacts

Embed UX references in spec.md or design.md sections. No new files.

Pros: No new artifact types. Cons: HTML prototypes can't be embedded in markdown. Loses the visual reference entirely.

### Approach 2: Formal UX artifact contract with manifest

New `ux-prototype.html` file and `ux-artifacts.yaml` manifest. Contract in CONVENTIONS.md.

Pros: Follows existing pattern (every artifact has a contract). HTML prototype is preserved as-is. Manifest enables structured reads by downstream steps. Cons: One more artifact type to manage.

### Selected Approach

Approach 2 — formal contract with manifest. This follows the established pattern where every artifact produced by a step has a format contract in CONVENTIONS.md. The manifest file makes it easy for downstream steps to check existence and read metadata without parsing HTML.

## High-Level Design

### Architecture Overview

```
ux-design step
  → produces: ux-prototype.html (the actual prototype)
  → produces: ux-artifacts.yaml (manifest with metadata)
  → updates: discovery.md "UI Direction" section (existing behavior, kept)

generate-or-refresh-tasks step
  → reads: ux-artifacts.yaml (if exists)
  → produces: tasks that reference ux-prototype.html in Files field

execute-next-task step
  → reads: ux-prototype.html (when task references UI files)
  → implements: using prototype as visual reference
```

### Key Abstractions

- **ux-artifacts.yaml manifest**: Structured metadata about the prototype — separates "what exists" from "the prototype itself"
- **Graceful degradation**: All consumer steps check `if ux-artifacts.yaml exists` before reading — no failures when UX step was skipped

## Constraints

The ux-design step already uses /playground which produces HTML. We need to capture that HTML output without modifying the /playground skill itself.

## Trade-offs

Separate manifest file (ux-artifacts.yaml) adds one more file to manage, but enables structured metadata reads without HTML parsing — worth the tradeoff for agent ergonomics.

## Decisions

- ux-artifacts.yaml uses YAML (not JSON) for consistency with state.yaml and other workflow files
- Prototype file is always named `ux-prototype.html` (not dynamic names) for predictable references

## Open Questions

None.
