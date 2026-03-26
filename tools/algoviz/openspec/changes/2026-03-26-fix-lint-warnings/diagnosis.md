# Diagnosis: Lint Warnings in Algorithm Files

## Symptoms

Running ESLint on algorithm files (`*-algorithm.js`) with `no-unused-vars` rule produces 2 substantive warnings:

1. **`levenshtein-algorithm.js:74:9`** — `'prev' is assigned a value but never used` (`no-unused-vars`)
   - In `tracebackDescription()`, `var prev = traceback[k - 1]` is assigned but never referenced
2. **`scan-algorithm.js:25:54`** — `'maxFloor' is defined but never used` (`no-unused-vars`)
   - The `solve()` function accepts a `maxFloor` parameter but never uses it in the function body

A third warning (`ScanAlgorithm` assigned but never used) is a false positive from the IIFE global-export pattern used across all algorithm files — not a real issue.

## Root Cause

- `prev` in levenshtein: Dead variable — the traceback loop only uses `cur` (the current cell) to look up operations; the previous cell coordinates are not needed.
- `maxFloor` in scan: Vestigial parameter — the SCAN algorithm implementation doesn't need the max floor because it only visits requested floors, not the boundary.

## Impact

- No runtime bugs — these are dead code, not logic errors
- Lint noise — prevents maintaining a zero-warning policy
