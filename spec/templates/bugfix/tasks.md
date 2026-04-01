# Tasks: {title}

## Phase 1: Root Cause Investigation

- [ ] T-1 Reproduce the bug consistently
  - **Why**: Can't fix what you can't reproduce
  - **Verify**: Bug triggers reliably with documented steps
- [ ] T-2 Investigate using `systematic-debugging` skill (depends: T-1)
  - **Why**: Trace data flow, gather evidence — no guessing
  - **Verify**: Root cause identified with evidence (not symptoms)
- [ ] T-3 Document root cause in diagnosis.md (depends: T-2)
  - **Why**: Record findings for fix-plan and future reference
  - **Files**: diagnosis.md
  - **Verify**: Root cause section filled with specific file:line references

## Phase 2: Regression Test

- [ ] T-4 Write regression test that reproduces the bug (depends: T-3)
  - **Why**: Proves the bug exists in an automated, repeatable way
  - **Files**: {test file path}
  - **Verify**: Test FAILS — confirming it catches the bug
- [ ] T-5 Verify test fails for the right reason (depends: T-4)
  - **Why**: A test that fails for the wrong reason gives false confidence
  - **Verify**: Failure message matches the documented root cause

## Phase 3: Fix

- [ ] T-6 Implement fix targeting root cause: {description} (depends: T-5)
  - **Why**: Fix the root cause identified in T-2, not symptoms
  - **Files**: {affected files}
  - **Verify**: Regression test (T-4) now PASSES
- [ ] T-7 Run full test suite — zero new failures (depends: T-6)
  - **Why**: Ensure fix doesn't break anything else
  - **Verify**: All tests pass, zero regressions
- [ ] T-8 Review checkpoint (phase gate)
  - **Verify**: type-check + test + build all pass

## Phase 4: Harden (optional)

- [ ] T-9 Add defense-in-depth validation (depends: T-6)
  - **Why**: Prevent similar bugs at multiple layers
  - **Files**: {validation files}
  - **Verify**: Validation catches the original bad input
- [ ] T-10 Review checkpoint (phase gate)
  - **Verify**: type-check + test + build all pass

<!-- Status markers: [ ] pending, [→] in-progress, [x] done, [~] skipped -->
<!-- (depends: T-xxx) = dependency -->
<!-- Phase 1-3 are mandatory. Phase 4 is optional — add if root cause was subtle -->

<!-- VERIFICATION BUGS: If verification reveals new issues, add them as tasks -->
<!-- in the current phase before proceeding. Do NOT skip to the next phase. -->
<!-- Example: -->
<!-- - [ ] T-7b Fix: {new issue found during full test suite run} (depends: T-7) -->
<!--   - **Why**: Found during verification — {description} -->
<!--   - **Files**: {affected files} -->
<!--   - **Verify**: All tests pass including new regression test -->
