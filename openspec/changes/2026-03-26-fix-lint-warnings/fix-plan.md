# Fix Plan: Remove Lint Warnings

## Strategy

Minimal removal of unused code — no surrounding refactoring.

### Fix 1: elevator.js — Remove unused `shaftContainer` variable
- Delete line 20: `const shaftContainer = document.getElementById("shaftContainer");`
- Risk: None — variable is never referenced.

### Fix 2: knapsack.js — Remove unused `clearStepsAfter` function
- Delete lines 214-226: the entire `clearStepsAfter` function body.
- Risk: None — function is never called. If needed later, it can be restored from git history.

## Verification
- `npm run lint` must report 0 warnings, 0 errors
- `npm test` must still pass all 121+ tests
