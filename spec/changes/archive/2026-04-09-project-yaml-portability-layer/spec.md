---
feature-id: project-yaml-portability-layer
linear-ticket: HL-207
---

# Specification: Project YAML Portability Layer

## Motivation

Bootstrap detects tech stacks and installs tooling but never generates `spec/project.yaml`. New repos have no quality_bar, verify commands, or conventions — the workflow falls back to defaults. Generating a stack-adapted project.yaml makes the workflow portable.

## What Changes

1. **New step contract** — `generate-project-yaml.yaml` that produces `spec/project.yaml` from detect-language outputs.
2. **Bootstrap schema update** — Add the step after install-tooling.

## Requirements

### Functional

1. **FR-1**: Bootstrap generates `spec/project.yaml` if it doesn't exist.
2. **FR-2**: Generated project.yaml includes stack-appropriate `quality_bar`, `context.tech_stack`, `conventions`, `verify` commands, and `signoff_policy`.
3. **FR-3**: If project.yaml already exists, the step is skipped (no-overwrite rule).
4. **FR-4**: The step runs after install-tooling (needs to know which scripts were added).

### Non-Functional

1. **NFR-1**: Generated project.yaml follows the existing format (version 1 schema).

## Architecture

| File | Change Type | Description |
|------|-------------|-------------|
| `~/.config/spec/steps/generate-project-yaml.yaml` | Create | Step contract for project.yaml generation |
| `~/.config/spec/schemas/bootstrap.yaml` | Modify | Add step to setup phase |

## Acceptance Criteria

- AC-1: Given a new repo with no project.yaml, when bootstrap runs, then `spec/project.yaml` is generated with stack-appropriate config. [traces: FR-1, FR-2]
- AC-2: Given a repo with existing project.yaml, when bootstrap runs, then the file is not modified. [traces: FR-3]
- AC-3: Given the bootstrap schema, `generate-project-yaml` appears after `install-tooling` and before `setup-claude-md`. [traces: FR-4]
- AC-4: Given a Node/TS project, generated project.yaml includes `type-check`, `test`, `lint` in verify context and `node-ts` in tech_stack. [traces: FR-2]

## Impact

No breaking changes. Only affects new bootstraps — existing repos with project.yaml are untouched.

<!-- Format contract: CONVENTIONS.md § Specification Format Contract -->
