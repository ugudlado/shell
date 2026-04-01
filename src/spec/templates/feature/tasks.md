# Tasks: {title}

## Phase 1: {phase-name}

- [ ] T-1 Write tests: {component} (RED — tests must fail)
  - **Why**: {which spec requirement this satisfies}
  - **Files**: {test files to create}
  - **Verify**: Tests run and FAIL (red) for the right reason
- [ ] T-2 Implement: {component} (GREEN — make tests pass) (depends: T-1)
  - **Why**: {which spec requirement this satisfies}
  - **Files**: {files to create or modify}
  - **Verify**: All T-1 tests pass (green), type-check clean
- [ ] T-3 Refactor: {component} (REFACTOR — clean up) (depends: T-2)
  - **Why**: Code quality — simplify without changing behavior
  - **Files**: {same files as T-2}
  - **Verify**: All tests still pass, no new warnings
- [ ] T-4 Review checkpoint (phase gate)
  - **Verify**: type-check + test (coverage >= 90%) + build all pass

## Phase 2: {phase-name}

- [ ] T-5 Write tests: {component} (RED) (depends: T-2)
  - **Why**: {requirement}
  - **Files**: {test files}
  - **Verify**: Tests fail (red)
- [ ] T-6 Implement: {component} (GREEN) (depends: T-5)
  - **Why**: {requirement}
  - **Files**: {files}
  - **Verify**: Tests pass (green), type-check clean
- [ ] T-7 Review checkpoint (phase gate)
  - **Verify**: type-check + test (coverage >= 90%) + build all pass

<!-- Status markers: [ ] pending, [→] in-progress, [x] done, [~] skipped -->
<!-- [P] = parallelizable, (depends: T-xxx) = dependency -->
<!-- TDD: test tasks (RED) always precede implementation tasks (GREEN) -->
<!-- Coverage target: >= 90% at each phase gate -->

<!-- VERIFICATION BUGS: If verification reveals new issues, add them as tasks -->
<!-- in the current phase before proceeding. Do NOT skip to the next phase. -->
<!-- Example: -->
<!-- - [ ] T-6b Fix: {bug found during T-6 verification} (depends: T-6) -->
<!--   - **Why**: Found during verification — {description} -->
<!--   - **Files**: {affected files} -->
<!--   - **Verify**: Original test + new regression test pass -->
