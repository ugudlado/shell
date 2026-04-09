# Tasks — HL-191

## Phase 1: Infrastructure

- [ ] T-1: Add flags_read field to CONVENTIONS.md
  - Files: src/spec/steps/CONVENTIONS.md
  - Verify: CONVENTIONS.md has flags_read section with format, example, and usage guidance

- [ ] T-2: Add scoring config to project.yaml
  - Files: spec/project.yaml
  - Verify: quality_bar.scoring has critical_cap, important_cap, green_base fields
  - depends: none

## Phase 2: Schema Changes

- [ ] T-3: Add --no-ux flag to feature.yaml
  - Files: src/spec/schemas/feature.yaml
  - Verify: defaults has ux_design: true, flags has --no-ux, ux-design step uses if: ux_design
  - depends: none

## Phase 3: Step Contract Updates

- [ ] T-4: Add flags_read to design-exploration.yaml + remove duplicate skip logic
  - Files: src/spec/steps/design-exploration.yaml
  - Verify: has flags_read section, no internal auto_approve_phases prose in instruction
  - depends: T-1

- [ ] T-5: Add flags_read to phase-signoff.yaml + remove duplicate skip logic
  - Files: src/spec/steps/phase-signoff.yaml
  - Verify: has flags_read section, SKIP CONDITIONS section removed (schema gates via if:)
  - depends: T-1

- [ ] T-6: Add flags_read + auto SKIP CONDITIONS to final-signoff.yaml
  - Files: src/spec/steps/final-signoff.yaml
  - Verify: has flags_read with auto flag, SKIP CONDITIONS section matching phase-signoff pattern
  - depends: T-1

- [ ] T-7: Add flags_read to generate-or-refresh-tasks.yaml
  - Files: src/spec/steps/generate-or-refresh-tasks.yaml
  - Verify: has flags_read for tdd_required, FLAG-DEPENDENT BEHAVIOR references flags_read
  - depends: T-1

- [ ] T-8: Update run-phase-review.yaml to reference project.yaml scoring
  - Files: src/spec/steps/run-phase-review.yaml
  - Verify: instruction references project.yaml quality_bar.scoring, has flags_read for tdd_required
  - depends: T-2

- [ ] T-9: Update explore.yaml to reference discovery template
  - Files: src/spec/steps/explore.yaml
  - Verify: instruction references $SPEC_HOME/templates/$SCHEMA/ for output structure

- [ ] T-10: Add flags_read to ux-design.yaml + remove self-skip logic
  - Files: src/spec/steps/ux-design.yaml
  - Verify: has flags_read section, self-skip prose removed (schema gates via if: ux_design)
  - depends: T-1, T-3
