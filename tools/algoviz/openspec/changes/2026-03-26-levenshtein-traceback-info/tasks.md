# Tasks: Levenshtein Traceback Info Panel Fix

## Phase 1: Investigate
- [x] 1.1 Read script.js and trace traceback code path
- [x] 1.2 Identify root cause: `showTraceback()` does not update `infoEl`

## Phase 2: Regression Test
- [ ] 2.1 Write test proving `showTraceback` does not produce traceback info text
  - **Why**: Proves the bug exists before fixing
  - **Files**: `levenshtein-algorithm.js` (extract testable logic), `levenshtein-algorithm.test.js`
  - **Verify**: Test FAILS with current code (traceback info is missing/empty)

## Phase 3: Fix
- [ ] 3.1 Update `showTraceback()` to set info panel text with traceback path summary
  - **Why**: Users need to see which operations form the optimal edit path
  - **Files**: `script.js`
  - **Verify**: Regression test PASSES; `npm test` passes; `npm run lint` passes

## Phase 4: Harden (optional)
- Skipped -- single-line fix with no edge cases
