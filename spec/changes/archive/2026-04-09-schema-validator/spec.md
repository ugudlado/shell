---
feature-id: schema-validator
linear-ticket: HL-188
---

# Chore: Schema Validator Script

## What

Create `src/spec/validate-schemas.sh` — a bash script that structurally validates all workflow schemas in `src/spec/schemas/`. Called by `/workflow-improve` step 1 and runnable standalone.

## Why

After the HL-187 schema refactor (4 schemas, 14 steps), there's no automated way to verify that schemas, steps, flags, templates, and project config are internally consistent. Manual grep verification works but doesn't scale. This script catches structural issues before they cause runtime workflow failures.

## Acceptance Criteria

- Script at `src/spec/validate-schemas.sh` exits 0 on pass, 1 on failure
- Validates all 7 checks: step resolution, flag consistency, phase dependencies, template existence, stale references, signoff policy, required fields
- Produces clear output showing each check with PASS/FAIL per schema
- Works with current 4 schemas (feature, bugfix, chore, spike)
- Can be called from `/workflow-improve` or standalone
