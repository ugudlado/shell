---
feature-id: FEATURE-ID
linear-ticket: HL-XXX
---

# Specification: {title}

## Motivation

<!-- What problem does this solve? What's the motivation? -->

## What Changes

<!-- High-level description of the change -->
<!-- New capabilities, modified capabilities -->

## Requirements

### Functional

<!-- Numbered list of functional requirements -->

### Non-Functional

<!-- Performance, security, accessibility requirements -->

## Architecture

<!-- Components, packages, data flow -->

## Test Strategy

### Test File Paths

<!-- Map each component to its test file -->
<!-- e.g., src/auth/session.ts → src/auth/__tests__/session.test.ts -->

### Coverage Targets

<!-- Minimum 90% overall. Per-module targets if needed -->
<!-- e.g., auth/ >= 95%, utils/ >= 90% -->

### Key Test Scenarios

<!-- Critical paths that MUST have test coverage -->

## Acceptance Criteria

<!-- Testable scenarios using Given/When/Then -->
<!-- Each criterion MUST trace to a Discovery Brief use case: [traces: UC-N] -->
<!-- Example:
  - Given a logged-in user, when they click "Save", then the document is persisted [traces: UC-1]
  - Given invalid input, when the form is submitted, then field-level errors display [traces: UC-E1]
-->

## Alternatives Considered

<!-- For each major design choice, list at least one alternative approach that was evaluated.
     Format: Alternative → Why rejected (or why chosen approach is better).
     This section ensures the architect actively challenged assumptions rather than going with the first idea.
     Include library search results from Context7, npm, web where applicable. -->

## Impact

<!-- What does this affect? Breaking changes? Migration needed? -->

## Decisions

<!-- Key decisions made and rationale -->
