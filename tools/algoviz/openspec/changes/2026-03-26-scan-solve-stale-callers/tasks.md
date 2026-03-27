# Tasks: ScanAlgorithm.solve() Stale Caller Cleanup

## Phase 1: Investigate
- [ ] **T1: Confirm stale callers exist**
  - **Why**: Verify the bug report — grep codebase for all 4-arg ScanAlgorithm.solve() calls
  - **Files**: (read-only investigation)
  - **Verify**: Document every stale call site with file + line number

## Phase 2: Regression Test
- [ ] **T2: Write regression test for stale 4-arg calls**
  - **Why**: Prove stale callers exist before fixing — regression test must detect 4-arg calls
  - **Files**: scan-algorithm.test.js (create Node.js test)
  - **Verify**: Test passes confirming the function accepts 3 args and ignores the 4th (documenting current behavior)

## Phase 3: Fix
- [ ] **T3: Remove 4th argument from elevator.js**
  - **Why**: Commitment #1 from fix-plan — clean up stale caller
  - **Files**: elevator.js
  - **Verify**: `grep 'ScanAlgorithm.solve' elevator.js` shows exactly 3 arguments

- [ ] **T4: Remove 4th argument from all scan-algorithm.test.html calls**
  - **Why**: Commitment #2 from fix-plan — clean up all 18 stale test callers
  - **Files**: scan-algorithm.test.html
  - **Verify**: `grep 'ScanAlgorithm.solve' scan-algorithm.test.html` — all calls have exactly 3 arguments

- [ ] **T5: Full codebase grep — verify zero stale callers remain**
  - **Why**: Commitment #3 from fix-plan — confirm complete cleanup
  - **Files**: (read-only verification)
  - **Verify**: `grep -rn 'ScanAlgorithm.solve' tools/algoviz/` shows zero 4-arg calls

- [ ] **T6: Run npm test && npm run lint**
  - **Why**: Commitment #4 from fix-plan — no regressions
  - **Files**: (verification only)
  - **Verify**: Both commands exit 0
