# Tasks: {title}

## Phase 1: {phase-name}

- [ ] T-1 {task description}
  - **Why**: {which spec requirement this satisfies}
  - **Files**: {files to create or modify}
  - **Verify**: {concrete verification — type-check, manual test, build, etc.}
- [ ] T-2 {task description} (depends: T-1)
  - **Why**: {requirement}
  - **Files**: {files}
  - **Verify**: {verification}
- [ ] T-3 Review checkpoint (phase gate)
  - **Verify**: type-check + build pass

## Phase 2: {phase-name}

- [ ] T-4 {task description} (depends: T-1)
  - **Why**: {requirement}
  - **Files**: {files}
  - **Verify**: {verification}
- [ ] T-5 {task description} [P]
  - **Why**: {requirement}
  - **Files**: {files}
  - **Verify**: {verification}
- [ ] T-6 {task description} [P]
  - **Why**: {requirement}
  - **Files**: {files}
  - **Verify**: {verification}
- [ ] T-7 Review checkpoint (phase gate)
  - **Verify**: type-check + build pass

<!-- Status markers: [ ] pending, [→] in-progress, [x] done, [~] skipped -->
<!-- [P] = parallelizable, (depends: T-xxx) = dependency -->
<!-- No test requirements — tests are optional -->

<!-- VERIFICATION BUGS: If verification reveals new issues, add them as tasks -->
<!-- in the current phase before proceeding. Do NOT skip to the next phase. -->
<!-- Example: -->
<!-- - [ ] T-5b Fix: {bug found during T-5 verification} (depends: T-5) -->
<!--   - **Why**: Found during verification — {description} -->
<!--   - **Files**: {affected files} -->
<!--   - **Verify**: {how to confirm the fix} -->
