---
feature-id: artifact-output-contracts
linear-ticket: TBD
---

# Specification: Artifact Output Contracts

## Motivation

The workflow produces five non-task artifact files (discovery.md, spec.md, design.md, diagnosis.md, fix-plan.md) that serve as contracts between producer and consumer agents. Today, only tasks.md has a formal format contract in CONVENTIONS.md. The remaining artifacts rely on templates with HTML comment placeholders, which are advisory -- not enforced. This causes non-determinism: UC-N identifiers vary in format, required sections may be missing or renamed across runs, traceability annotations are optional, and phase-review has no structural checklist to score against. The result is fragile cross-artifact references, inconsistent archives, and subjective review scores.

The fix is to promote each artifact from "template-guided" to "contract-enforced" using the same approach that already works for tasks.md: define the contract in CONVENTIONS.md, update templates to match, and update step contracts to reference the contract sections.

## What Changes

- CONVENTIONS.md gains five new sections (one per artifact contract), following the same pattern as the existing Task Format Contract
- Each contract defines: required sections, field formats, identifier conventions, traceability rules, and consumer references
- Templates for all five artifacts are updated to reflect their contracts (concrete field labels replace HTML comment placeholders)
- Producer step contracts (explore, create-or-refresh-artifacts, design-exploration, diagnose) are updated to reference the relevant contract section
- Consumer step contracts (run-phase-review, generate-or-refresh-tasks, run-feature-verification) are updated to reference the relevant contract section
- Schema verify assertions remain unchanged -- the contracts formalize what the assertions already check

## Requirements

### Functional

1. **FR-1**: CONVENTIONS.md contains a "Discovery Brief Format Contract" section defining the required structure for discovery.md artifacts produced by the explore step.
2. **FR-2**: CONVENTIONS.md contains a "Specification Format Contract" section defining the required structure for spec.md artifacts produced by the create-or-refresh-artifacts step.
3. **FR-3**: CONVENTIONS.md contains a "Design Format Contract" section defining the required structure for design.md artifacts produced by the create-or-refresh-artifacts step (feature schema only).
4. **FR-4**: CONVENTIONS.md contains a "Diagnosis Format Contract" section defining the required structure for diagnosis.md artifacts produced by the diagnose step (bugfix schema only).
5. **FR-5**: CONVENTIONS.md contains a "Fix Plan Format Contract" section defining the required structure for fix-plan.md artifacts produced by the create-or-refresh-artifacts step (bugfix schema only).
6. **FR-6**: Each contract specifies which sections are required vs optional, using a field rules table (same format as the Task Format Contract's field rules table).
7. **FR-7**: The discovery.md contract defines the UC-N identifier format: `UC-<number>` for happy path, `UC-E<number>` for error/edge cases. Identifiers must be sequential within their category.
8. **FR-8**: The spec.md contract requires every acceptance criterion to include a `[traces: UC-N]` annotation referencing a valid UC identifier from the corresponding discovery.md.
9. **FR-9**: The fix-plan.md contract requires the Fix Strategy section to reference the root cause from the corresponding diagnosis.md.
10. **FR-10**: Each contract includes a "Consumers" field listing the step contracts that read the artifact, so producers know who depends on the format.
11. **FR-11**: Templates for all five artifacts are updated to match their contracts -- HTML comment placeholders replaced with concrete field labels and format examples.
12. **FR-12**: Producer step contracts are updated to include a reference like "per CONVENTIONS.md section X" in their instruction or rules, matching the pattern used by state updates ("per CONVENTIONS.md section State Updates").
13. **FR-13**: The run-phase-review step contract gains a rule stating that structural compliance with artifact contracts in CONVENTIONS.md is a review criterion. [ASSUMPTION: OQ-1 resolved -- structural checks added as a review rule, not as individual verify items per artifact]

### Non-Functional

1. **NFR-1**: Contracts are prose-enforced (agents read CONVENTIONS.md and follow the rules), not machine-validated. No new tooling, parsing, or runtime validation.
2. **NFR-2**: Contract sections in CONVENTIONS.md follow the same structural pattern as the existing Task Format Contract: heading, format example, field rules table, additional rules as needed.
3. **NFR-3**: Existing schema verify assertions are not modified. The contracts formalize what the assertions already check -- they do not add new assertion strings to feature.yaml or bugfix.yaml.
4. **NFR-4**: Changes are backward-compatible. Existing archived artifacts are not retroactively validated. New artifacts produced after this change must comply.

## Architecture

All changes are to YAML and Markdown files in `~/.config/spec/`. No code, no new tools, no new steps.

**Files modified:**

| File | Change |
|------|--------|
| `src/spec/steps/CONVENTIONS.md` | Add 5 artifact contract sections after the existing Task Format Contract |
| `src/spec/templates/feature/discovery.md` | Update to match Discovery Brief Format Contract |
| `src/spec/templates/feature/spec.md` | Update to match Specification Format Contract |
| `src/spec/templates/feature/design.md` | Update to match Design Format Contract |
| `src/spec/templates/bugfix/diagnosis.md` | Update to match Diagnosis Format Contract |
| `src/spec/templates/bugfix/fix-plan.md` | Update to match Fix Plan Format Contract |
| `src/spec/steps/explore.yaml` | Add contract reference in instruction |
| `src/spec/steps/create-or-refresh-artifacts.yaml` | Add contract reference in instruction |
| `src/spec/steps/design-exploration.yaml` | Add contract reference in instruction |
| `src/spec/steps/diagnose.yaml` | Add contract reference in instruction |
| `src/spec/steps/run-phase-review.yaml` | Add structural compliance rule |
| `src/spec/steps/generate-or-refresh-tasks.yaml` | Add contract reference in instruction (consumer) |
| `src/spec/steps/run-feature-verification.yaml` | Add contract reference in instruction (consumer) |

**Data flow:** Producer step reads CONVENTIONS.md contract -> produces artifact in compliant format -> Consumer step reads artifact knowing the format is stable -> run-phase-review checks structural compliance as part of scoring.

## Test Strategy

### Test File Paths

N/A -- no code changes, no automated tests.

### Coverage Targets

N/A -- all changes are YAML and Markdown.

### Key Test Scenarios

Verification is through step contract verify assertions and manual inspection:

1. Each contract section in CONVENTIONS.md has a field rules table with Required/Optional classification
2. Each template matches its contract's required sections (section names are identical)
3. Each producer step contract references its artifact's CONVENTIONS.md section
4. The run-phase-review step contract includes structural compliance as a review criterion
5. UC-N identifier format is specified unambiguously in the discovery.md contract
6. The `[traces: UC-N]` annotation format is specified unambiguously in the spec.md contract

## Acceptance Criteria

- AC-1: CONVENTIONS.md contains a "Discovery Brief Format Contract" section with a field rules table classifying each section as required or optional, and defining the UC-N identifier format (UC-<number> for happy path, UC-E<number> for error/edge). [traces: UC-1, UC-4]
- AC-2: CONVENTIONS.md contains a "Specification Format Contract" section with a field rules table, and requires every AC item to include a `[traces: UC-N]` annotation. [traces: UC-2, UC-4]
- AC-3: CONVENTIONS.md contains a "Design Format Contract" section with a field rules table classifying High-Level Design subsections as required and Low-Level Design subsections as contextual. [traces: UC-4]
- AC-4: CONVENTIONS.md contains a "Diagnosis Format Contract" section with a field rules table, requiring Root Cause to include file:line references and Severity to use the enumerated set (critical/high/medium/low). [traces: UC-4]
- AC-5: CONVENTIONS.md contains a "Fix Plan Format Contract" section with a field rules table, requiring Fix Strategy to reference diagnosis.md Root Cause. [traces: UC-4]
- AC-6: All five feature/bugfix templates are updated so that their section headings match the required sections in their corresponding contract. No HTML comment placeholders remain for required fields -- replaced with concrete format examples. [traces: UC-4, UC-E3]
- AC-7: Producer step contracts (explore, create-or-refresh-artifacts, design-exploration, diagnose) each contain a reference to their artifact's CONVENTIONS.md section in instruction or rules. [traces: UC-1, UC-2]
- AC-8: The run-phase-review step contract includes a rule that artifact structural compliance with CONVENTIONS.md contracts is a review criterion. [traces: UC-3, UC-E1]
- AC-9: Consumer step contracts (generate-or-refresh-tasks, run-feature-verification) reference the artifact contract sections they depend on. [traces: UC-3]
- AC-10: The discovery.md contract specifies that UC identifiers must be sequential (UC-1, UC-2, ... and UC-E1, UC-E2, ...) with no gaps, so that broken traceability links (e.g., spec.md referencing UC-7 when only UC-1 through UC-3 exist) are detectable by the reviewer. [traces: UC-E2]

## Alternatives Considered

**Alternative 1: Machine-validated contracts (JSON Schema or custom parser)**
Rejected. The existing tasks.md contract works well as prose-enforced. Adding a parser would require new tooling, a new step, and maintenance burden -- all for artifacts that are already reviewed by agents. The prose approach is simpler, proven, and sufficient.

**Alternative 2: Separate ARTIFACT-CONTRACTS.md file**
Rejected. CONVENTIONS.md is the established home for format contracts. All step contracts already reference it. Adding a new file would require updating every step contract to reference a second conventions file, fragmenting the single source of truth.

**Alternative 3: Embed contracts directly in templates (no CONVENTIONS.md change)**
Rejected. Templates are the user-visible surface consumed by producers; contracts are the authoritative spec consumed by both producers and consumers (especially reviewers). Mixing the two would make templates harder to read and would not give consumers a stable reference to check against.

**Alternative 4: Include artifact version fields (OQ-4)**
Rejected. Adds complexity without clear benefit. Long-running features are rare, and contract changes would be accompanied by a migration note in CONVENTIONS.md. Version fields on every artifact instance add noise for marginal safety.

## Impact

- All new artifacts produced after this change will follow the contracts
- Existing archived artifacts are unaffected (no retroactive validation)
- Phase reviews will be more deterministic -- reviewers have structural criteria, not just subjective quality judgment
- Templates become more prescriptive -- agents have less ambiguity about what to produce
- No breaking changes to schemas, steps, or execution order

## Decisions

1. **Contracts in CONVENTIONS.md** -- Follows the established pattern. Single file, already referenced by all step contracts. [ASSUMPTION from discovery]
2. **Templates derive from contracts** -- Contracts are authoritative; templates are the user-facing surface. When they diverge, contracts win. [ASSUMPTION from discovery]
3. **Chore and spike schemas excluded** -- Their artifacts are deliberately minimal. Adding contracts would conflict with the low-overhead intent of those schemas. [ASSUMPTION from discovery]
4. **OQ-1 resolved: structural compliance as review rule** -- Rather than adding per-artifact verify items to run-phase-review.yaml, add a single rule stating that artifact structural compliance is a review criterion. This keeps the step contract clean and lets the reviewer apply judgment about which structural violations are critical vs minor. [ASSUMPTION]
5. **OQ-2 resolved: design.md stands alone** -- design-exploration writes to discovery.md Key Decisions, but design.md has its own independent contract. No new artifact type needed. [ASSUMPTION]
6. **OQ-3 resolved: diagnosis.md contract formalizes existing practice** -- The diagnose step instruction already lists required content. The contract captures this in the standard field rules table format, making it consumable by reviewers and other steps. [ASSUMPTION]
