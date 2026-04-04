---
feature-id: artifact-output-contracts
linear-ticket: TBD
---

# Discovery Brief: Artifact Output Contracts

## Feature Summary

The workflow produces several artifact files (discovery.md, spec.md, design.md, diagnosis.md, fix-plan.md) during spec phases, but none of these have a structural format contract. Templates guide shape with HTML comments, but they impose no field-level rules: required vs optional, content constraints, traceability links, or verifiable assertions. This means two identical runs can produce artifacts with incompatible structures, breaking traceability (spec.md cites UC-N from discovery.md), making phase-review unstructurally checkable, and degrading downstream artifact quality. The fix is to promote each artifact from "template-guided" to "contract-enforced," following the proven model that already exists for tasks.md.

## Personas & Actors

- **Discoverer agent** — produces discovery.md during the `explore` step
- **Architect agent** — produces spec.md, design.md, fix-plan.md during `create-or-refresh-artifacts`
- **Reviewer agent** — consumes all artifacts during `run-phase-review` and `run-feature-verification`; needs structural invariants to evaluate against
- **Developer agent** — consumes spec.md Acceptance Criteria and tasks.md during `execute-next-task`; needs the AC-to-UC traceability to be reliable
- **Diagnose step** (discoverer role in bugfix schema) — produces diagnosis.md; fix-plan.md is a downstream consumer
- **Human reviewer** — reads archived artifacts post-completion; needs consistent, readable structure

## Use Cases

### Happy Path

UC-1: Deterministic discovery.md — The discoverer agent wants to produce a discovery.md that a reviewer can structurally validate so that the `run-phase-review` step can check required sections are present and non-empty, rather than making subjective quality judgments.

UC-2: Traceable acceptance criteria — The architect agent wants each acceptance criterion in spec.md to reference a specific UC-N from discovery.md so that the phase-review assertion "Each acceptance criterion traces to a discovery use case" can be evaluated mechanically.

UC-3: Reviewer uses structural checklist — The reviewer agent runs `run-phase-review` and wants to verify spec-phase artifacts against a concrete checklist (required fields, traceability links, non-empty sections) so that the phase review score reflects structural compliance, not just stylistic judgment.

UC-4: Consistent cross-run artifacts — Two separate runs of the same feature description produce discovery.md and spec.md with the same section names, field shapes, and traceability conventions, so that archived artifacts are comparable and the workflow can be evaluated objectively.

### Error & Edge Cases

UC-E1: Missing required section — An artifact is generated without the Acceptance Criteria section (or with only placeholder HTML comment text). The `run-phase-review` assertion "spec.md has Acceptance Criteria section with testable criteria" fires and caps the review score, triggering a fix task.

UC-E2: Broken traceability link — spec.md has an AC that references UC-7, but discovery.md only defines UC-1 through UC-3. The traceability assertion fails at review time. Without a contract defining the UC-N format and requiring cross-referencing, this is currently invisible.

UC-E3: Stale artifact on refresh — A phase-review rejection triggers `refresh_artifacts: true`. The regenerated spec.md must preserve the same section contract so the reviewer can diff semantics, not just format. Without a contract, the regenerated artifact may use different section names.

## Scope

### In Scope

- Format contracts for all five non-tasks artifacts: `discovery.md`, `spec.md`, `design.md` (feature schema); `diagnosis.md`, `fix-plan.md` (bugfix schema)
- Contract placement: CONVENTIONS.md (same location as the existing Task Format Contract)
- Required vs optional field classification for each artifact
- Traceability conventions (UC-N references, AC-to-UC links, diagnosis-to-fix-plan links)
- Updates to the relevant step contracts (`explore`, `create-or-refresh-artifacts`, `design-exploration`, `diagnose`) to reference the contracts
- Updates to `run-phase-review` verify assertions to reference the contracts structurally
- Template updates to reflect the contracts (replace HTML comments with concrete field labels)

### Out of Scope

- Automated machine-parsing of artifact content (contracts are prose-enforced, not schema-validated at runtime)
- Chore schema (`spec.md`) and spike schema (`spike-brief.md`) — minimal formats, low leverage
- Structural changes to the schemas themselves (feature.yaml, bugfix.yaml) — verify assertions already exist; contracts sharpen what they check
- New workflow steps, new agents, or changes to step execution order
- Retroactive validation of archived artifacts

## UI Direction

N/A — no UI components. All artifacts are markdown files consumed by agents and humans.

## Key Decisions

[ASSUMPTION] Contracts belong in CONVENTIONS.md alongside the Task Format Contract. Rationale: CONVENTIONS.md is the established home for format contracts read by both producer and consumer steps. Adding a new file would require updating all step contracts that consume artifacts to reference a new location.

[ASSUMPTION] Templates will be updated to reflect the contracts, not the reverse. Templates are the user-visible surface; contracts are the authoritative spec. Templates should derive from contracts, not define them.

[ASSUMPTION] Chore and spike schemas are excluded. Their artifacts are minimal (chore/spec.md is 19 lines; spike-brief.md is 18 lines) and the workflow overhead is deliberately low. Adding contracts there would conflict with the "minimal overhead" schema intent.

[ASSUMPTION] Contracts are prose-enforced (agents read CONVENTIONS.md and follow the rules), not machine-validated by a new tool. This matches the existing tasks.md contract approach.

## Open Questions

OQ-1: Should the `run-phase-review` step gain an explicit structural checklist as a new `verify:` field in CONVENTIONS.md, or should it continue to derive checklist items from the schema's `verify.assertions`? The current assertions reference the contracts by name ("spec.md has Acceptance Criteria section with testable criteria") — expanding them to cite specific required fields would be more deterministic.

OQ-2: The `design-exploration` step currently writes its output back to discovery.md's "Key Decisions" section. Should design.md have its own standalone contract, or should the design-exploration output be a separate artifact (e.g., `design-brief.md`) rather than mutating discovery.md?

OQ-3: For `diagnosis.md`, the `diagnose` step already has detailed instruction prose that effectively specifies the required sections. Should the contract simply formalize what the step already enforces, or should it rationalize/simplify the section structure?

OQ-4: Should artifact contracts include a version field (like step contracts do) so that consumers can detect when an artifact was produced against an old contract during long-running features?

## Technical Context

### Relevant Files

- `/Users/spidey/.config/spec/steps/CONVENTIONS.md` — home for the Task Format Contract; target location for new artifact contracts
- `/Users/spidey/.config/spec/templates/feature/discovery.md` — 53 lines, HTML comment placeholders, sections: Feature Summary, Personas & Actors, Use Cases (Happy/Error), Scope (In/Out), UI Direction, Key Decisions, Open Questions
- `/Users/spidey/.config/spec/templates/feature/spec.md` — 70 lines, sections: Motivation, What Changes, Requirements (Functional/Non-Functional), Architecture, Test Strategy (File Paths/Coverage Targets/Key Test Scenarios), Acceptance Criteria, Alternatives Considered, Impact, Decisions
- `/Users/spidey/.config/spec/templates/feature/design.md` — 71 lines, sections: Context, Goals/Non-Goals, Approaches Considered, Selected Approach, High-Level Design (Architecture Overview/Key Abstractions), Low-Level Design (Components/Data Flow/State Management/Error Handling), Constraints, Trade-offs, Decisions, Open Questions
- `/Users/spidey/.config/spec/templates/bugfix/diagnosis.md` — 51 lines, sections: Symptoms, Reproduction Steps, Expected vs Actual, Investigation (Evidence Gathered/Data Flow Trace), Root Cause, Impact (Severity/Affected Areas/Since When), Linear Ticket
- `/Users/spidey/.config/spec/templates/bugfix/fix-plan.md` — 30 lines, sections: Fix Strategy, Affected Files, Regression Test, Risk Assessment (Could This Break/Rollback Plan), Out of Scope

### Step Contracts That Produce Artifacts

- `/Users/spidey/.config/spec/steps/explore.yaml` (v2) — instruction says "using the template... as structural guide." No required-field enforcement.
- `/Users/spidey/.config/spec/steps/create-or-refresh-artifacts.yaml` (v2) — instruction says "Generate the artifact using available context as input." Template-driven but no structural contract reference.
- `/Users/spidey/.config/spec/steps/design-exploration.yaml` (v3) — writes chosen approach to discovery.md "Key Decisions" section. Mutations discovery.md rather than producing design.md directly.
- `/Users/spidey/.config/spec/steps/diagnose.yaml` (v3) — most structured producer: instruction explicitly lists 4 required content items (Symptom, Reproduction, Root cause, Impact). Closest to a contract today.

### Step Contracts That Consume Artifacts

- `/Users/spidey/.config/spec/steps/run-phase-review.yaml` (v3) — checks schema `verify.assertions` but has no artifact-specific structural checklist
- `/Users/spidey/.config/spec/steps/generate-or-refresh-tasks.yaml` (v3) — reads spec.md Acceptance Criteria and design.md; relies on consistent section naming to find them
- `/Users/spidey/.config/spec/steps/run-feature-verification.yaml` (v2) — reads spec.md Acceptance Criteria; same reliance

### Existing Partial Structure

**Schema assertions that already impose partial contract obligations:**

From `feature.yaml` specify phase verify:
- "spec.md has Acceptance Criteria section with testable criteria" — implies Acceptance Criteria is a required section with a specific heading
- "Each acceptance criterion traces to a discovery use case" — implies UC-N identifiers in discovery.md and `[traces: UC-N]` annotations in spec.md AC items

From `bugfix.yaml` diagnose phase verify:
- "diagnosis.md exists with runnable reproduction steps"
- "diagnosis.md has confirmed root cause with file path and line number"
- "fix-plan.md exists with approach, affected files, and risk assessment"

These assertions are proto-contracts — they name required content. The feature being scoped here formalizes them into explicit field-level contracts in CONVENTIONS.md.

### Non-Determinism Sources (by artifact)

**discovery.md:**
- Use case count is unbounded ("minimum 2 happy path, minimum 1 error")
- UC-N identifier format not enforced (could be UC-1, UC1, 1, #1)
- Scope items are free-prose lists with no minimum
- "Key Decisions" section populated by design-exploration step, not explore step — creates ordering ambiguity

**spec.md:**
- Acceptance Criteria format not specified: some ACs use Given/When/Then, others prose
- The traceability annotation `[traces: UC-N]` is suggested in a template HTML comment but not contractually required
- "Architecture" section can be anything from a paragraph to a diagram reference
- Requirements numbered list is not enforced (could be bullets, prose, or missing)

**design.md:**
- Approaches section has no minimum count (template says "2-3" but this is not enforced)
- Selected Approach rationale has no required elements
- Low-Level Design subsections are all optional — any subset can appear

**diagnosis.md:**
- Root Cause section: template has no required sub-elements; `diagnose` step instruction is more specific than the template
- Severity levels not enumerated (template says "critical / high / medium / low" as comment only)
- "Since When" field is entirely optional in template

**fix-plan.md:**
- Affected Files section: "file:line" format suggested in comment but not enforced
- Regression Test section: how the test proves the bug is prose-guided only
- Risk Assessment subsections are both optional in template
