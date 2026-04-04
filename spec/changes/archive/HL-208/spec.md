---
feature-id: verify-command-portability
linear-ticket: HL-208
---

# Specification: Verify Command Portability

## Motivation

Schemas hardcode `type-check/test/build` as phase verify commands. This breaks in any repo without those exact scripts. project.yaml should be the source of truth for verify commands.

## What Changes

1. **`verify_commands` in project.yaml** — Explicit list of verify commands per repo.
2. **Schema variable reference** — Schemas use `$project.verify_commands` instead of hardcoded lists.
3. **generate-project-yaml update** — Step produces the `verify_commands` field.

## Requirements

### Functional

1. **FR-1**: project.yaml has a `verify_commands` list.
2. **FR-2**: feature.yaml, bugfix.yaml, chore.yaml verify.commands reference `$project.verify_commands`.
3. **FR-3**: generate-project-yaml step includes `verify_commands` in its output.
4. **FR-4**: This repo's project.yaml updated with `verify_commands: [type-check, test, build]`.

## Acceptance Criteria

- AC-1: Given project.yaml, it has a `verify_commands` field. [traces: FR-1]
- AC-2: Given feature.yaml implement phase, verify.commands references project.verify_commands, not hardcoded. [traces: FR-2]
- AC-3: Given generate-project-yaml step, it produces verify_commands in the output. [traces: FR-3]
- AC-4: Given this repo's project.yaml, it includes verify_commands. [traces: FR-4]

## Impact

No breaking changes. Existing project.yaml files without verify_commands — the orchestrator should fall back to `[type-check, test, build]` for backward compatibility.

<!-- Format contract: CONVENTIONS.md § Specification Format Contract -->
