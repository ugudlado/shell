# Diagnosis: ScanAlgorithm.solve() Stale Callers

## Symptoms

`ScanAlgorithm.solve()` had its `maxFloor` (4th) parameter removed in commit 22ff9b8, but two files still pass 4 arguments. JavaScript does not error on extra arguments, so these stale calls pass silently but represent incomplete cleanup.

## Root Cause

Prior bugfix (commit 22ff9b8: "fix: remove unused `prev` variable and `maxFloor` parameter") updated the function definition in `scan-algorithm.js` but did not propagate the signature change to all call sites.

## Affected Files

1. **`elevator.js` line 381-382** — passes `input.maxFloor` as 4th argument to `ScanAlgorithm.solve()`
2. **`scan-algorithm.test.html`** — 18 call sites all pass `10` as 4th argument (maxFloor)

## Impact

- No runtime errors (JavaScript silently ignores extra arguments)
- Code is misleading: callers imply `maxFloor` matters when it does not
- Future maintainers may think the 4th param is required
- Incomplete prior bugfix — represents technical debt

## Verification

```bash
grep -n 'ScanAlgorithm\.solve(' tools/algoviz/elevator.js tools/algoviz/scan-algorithm.test.html
```

All matches should show exactly 3 arguments after fix.
