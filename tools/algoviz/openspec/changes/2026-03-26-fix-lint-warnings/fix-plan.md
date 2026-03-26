# Fix Plan: Remove Unused Variables

## Strategy

Minimal removal of dead code — no refactoring of surrounding logic.

## Changes

### 1. levenshtein-algorithm.js (line 74)
- **Remove** the `var prev = traceback[k - 1];` assignment entirely
- No other code references `prev`, so no cascading changes

### 2. scan-algorithm.js (line 25)
- **Remove** the `maxFloor` parameter from the `solve()` function signature
- Update JSDoc to remove the `@param {number} maxFloor` line
- Check all callers (scan-algorithm.test.js, elevator.js) and remove the `maxFloor` argument from call sites

## Risk

- **Low**: Both are dead code removals with no behavioral change
- Tests (121 passing) must remain passing after fix
- Callers passing extra arguments to a JS function that no longer declares them will silently ignore the extra arg, but we should clean up call sites for clarity
