---
feature-id: FEATURE-ID
linear-ticket: HL-XXX
---

# Specification: {title}

## Motivation

{What problem does this solve? What's the motivation?}

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
{e.g., src/auth/session.ts → src/auth/__tests__/session.test.ts}

### Coverage Targets

{Minimum 90% overall. Per-module targets if needed.}

### Key Test Scenarios

{Critical paths that MUST have test coverage.}

## Acceptance Criteria

- AC-1: Given {precondition}, when {action}, then {outcome}. [traces: UC-1]
- AC-2: Given {precondition}, when {action}, then {outcome}. [traces: UC-2, UC-E1]

## Alternatives Considered

**Alternative 1: {name}**
Rejected. {Why rejected or why chosen approach is better.}

## Impact

{Breaking changes, migration, affected areas. "No breaking changes" if none.}

## Decisions

- {Decision}: {rationale}

<!-- Format contract: CONVENTIONS.md § Specification Format Contract -->
