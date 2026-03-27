# Fix Plan: Remove Stale maxFloor Arguments from ScanAlgorithm.solve() Callers

## Strategy

Remove the 4th argument (`maxFloor`) from every call to `ScanAlgorithm.solve()` across the entire codebase. The function signature is `solve(requests, startPosition, direction)` — 3 params only.

## Commitments

1. **Update `elevator.js`** — Remove `input.maxFloor` (4th arg) from the `ScanAlgorithm.solve()` call at line ~381-382
2. **Update `scan-algorithm.test.html`** — Remove the `10` (4th arg) from all 18 `ScanAlgorithm.solve()` calls
3. **Grep entire codebase** — Verify zero remaining 4-argument calls to `ScanAlgorithm.solve()` after fix
4. **Run `npm test && npm run lint`** — Confirm no regressions

## Call Sites to Update

### elevator.js (1 call site)
- Line ~381: `ScanAlgorithm.solve(input.requests, input.startPos, input.direction, input.maxFloor)` → remove `, input.maxFloor`

### scan-algorithm.test.html (18 call sites)
- Line 104: `ScanAlgorithm.solve([2, 9, 6, 4, 1], 5, "up", 10)` → remove `, 10`
- Line 118: `ScanAlgorithm.solve([2, 9, 6, 4, 1], 5, "down", 10)` → remove `, 10`
- Line 130: `ScanAlgorithm.solve([], 5, "up", 10)` → remove `, 10`
- Line 138: `ScanAlgorithm.solve([8], 3, "up", 10)` → remove `, 10`
- Line 145: `ScanAlgorithm.solve([8], 3, "down", 10)` → remove `, 10`
- Line 155: `ScanAlgorithm.solve([6, 8, 7], 5, "up", 10)` → remove `, 10`
- Line 163: `ScanAlgorithm.solve([1, 3, 2], 5, "down", 10)` → remove `, 10`
- Line 171: `ScanAlgorithm.solve([6, 8, 7], 5, "down", 10)` → remove `, 10`
- Line 181: `ScanAlgorithm.solve([0, 10], 5, "up", 10)` → remove `, 10`
- Line 188: `ScanAlgorithm.solve([0, 10], 5, "down", 10)` → remove `, 10`
- Line 198: `ScanAlgorithm.solve([3, 7, 3, 7], 5, "up", 10)` → remove `, 10`
- Line 209: `ScanAlgorithm.solve([5, 3, 8], 5, "up", 10)` → remove `, 10`
- Line 220: `ScanAlgorithm.solve([2, 8], 5, "up", 10)` → remove `, 10`
- Line 241: `ScanAlgorithm.solve([2, 9, 6, 4, 1], 5, "up", 10)` → remove `, 10`

## Risk

Low — removing unused arguments has zero behavioral impact. JavaScript ignores extra positional args.
