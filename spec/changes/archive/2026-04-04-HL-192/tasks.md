# Tasks — Artifact Output Contracts

## Phase 1: Contracts

- [x] T-1: Add all five artifact format contract sections to CONVENTIONS.md
  Files: src/spec/steps/CONVENTIONS.md
  Verify: grep confirms five new section headings exist: "Discovery Brief Format Contract", "Specification Format Contract", "Design Format Contract", "Diagnosis Format Contract", "Fix Plan Format Contract". Each section has a field rules table (grep for "| Required |" or "| Optional |" within each section). UC-N identifier format defined in Discovery Brief section (grep "UC-<number>"). Traces annotation format defined in Specification section (grep "[traces: UC-N]"). Diagnosis section includes severity enum (grep "critical.*high.*medium.*low"). Fix Plan section references diagnosis.md Root Cause. Each section includes a Consumers field.

## Phase 2: Templates

- [x] T-2: Update feature templates (discovery.md, spec.md, design.md) to match contracts [P]
  Files: src/spec/templates/feature/discovery.md, src/spec/templates/feature/spec.md, src/spec/templates/feature/design.md
  Verify: Each template's section headings match required sections in its CONVENTIONS.md contract. No HTML comment placeholders (<!-- -->) remain for required fields — grep for "<!--" returns zero matches on required field lines. discovery.md includes UC-N format example, spec.md includes [traces: UC-N] example.
  depends: T-1

- [x] T-3: Update bugfix templates (diagnosis.md, fix-plan.md) to match contracts [P]
  Files: src/spec/templates/bugfix/diagnosis.md, src/spec/templates/bugfix/fix-plan.md
  Verify: Each template's section headings match required sections in its CONVENTIONS.md contract. No HTML comment placeholders remain for required fields. diagnosis.md includes file:line format example and severity enum. fix-plan.md references diagnosis.md Root Cause.
  depends: T-1

## Phase 3: Step Contracts

- [x] T-4: Add contract references to producer step contracts [P]
  Files: src/spec/steps/explore.yaml, src/spec/steps/create-or-refresh-artifacts.yaml, src/spec/steps/design-exploration.yaml, src/spec/steps/diagnose.yaml
  Verify: Each file contains a reference string matching "per CONVENTIONS.md §" followed by its artifact's contract section name. explore.yaml references Discovery Brief Format Contract. create-or-refresh-artifacts.yaml references Specification, Design, and Fix Plan contracts as applicable. design-exploration.yaml references Design Format Contract. diagnose.yaml references Diagnosis Format Contract.
  depends: T-1

- [x] T-5: Add structural compliance rule to run-phase-review and contract references to consumer step contracts [P]
  Files: src/spec/steps/run-phase-review.yaml, src/spec/steps/generate-or-refresh-tasks.yaml, src/spec/steps/run-feature-verification.yaml
  Verify: run-phase-review.yaml contains a rule about artifact structural compliance with CONVENTIONS.md contracts (grep "structural compliance" or "artifact contract"). generate-or-refresh-tasks.yaml and run-feature-verification.yaml each contain a "per CONVENTIONS.md §" reference to the artifact contract sections they consume.
  depends: T-1
