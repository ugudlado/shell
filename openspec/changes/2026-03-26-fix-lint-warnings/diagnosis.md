# Diagnosis: Lint Warnings in AlgoViz Algorithm Files

## Symptoms

`npm run lint` in `tools/algoviz/` reports 2 warnings (0 errors):

1. **elevator.js:20:9** — `'shaftContainer'` is assigned a value but never used (`no-unused-vars`)
2. **knapsack.js:214:12** — `'clearStepsAfter'` is defined but never used (`no-unused-vars`)

## Root Cause

### Warning 1: `shaftContainer` in elevator.js
- Line 20: `const shaftContainer = document.getElementById("shaftContainer");`
- The DOM element is fetched but the variable is never referenced anywhere in the file.
- Likely leftover from development — the element exists in HTML but the JS reference is unnecessary.

### Warning 2: `clearStepsAfter` in knapsack.js
- Lines 214-226: A function `clearStepsAfter(stepIdx)` is defined but never called.
- It clears step visualizations after a given index and calls `clearTraceback()`.
- Dead code — possibly intended for a step-back feature that was never wired up.

## Impact
- No functional impact (warnings, not errors)
- Breaks zero-warning lint status, making it harder to spot new issues
