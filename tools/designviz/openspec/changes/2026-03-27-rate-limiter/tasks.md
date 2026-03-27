# Rate Limiter — Tasks

## Phase 1: Algorithm (TDD)

### Task 1.1 [RED] — Write failing tests for Token Bucket
- **Why**: TDD requires tests before implementation; token bucket is core algorithm
- **Files**: `rate-limiter-algorithm.test.js`
- **Verify**: `npm test` fails with meaningful assertion errors (functions not found or wrong results)

### Task 1.2 [GREEN] — Implement Token Bucket algorithm
- **Why**: Make failing tests pass with correct token bucket logic
- **Files**: `rate-limiter-algorithm.js`
- **Verify**: Token bucket tests pass in `npm test`

### Task 1.3 [RED] — Write failing tests for Sliding Window
- **Why**: TDD requires tests before implementation; sliding window is second core algorithm
- **Files**: `rate-limiter-algorithm.test.js`
- **Verify**: Sliding window tests fail (function not implemented or returns wrong values)

### Task 1.4 [GREEN] — Implement Sliding Window algorithm
- **Why**: Make failing sliding window tests pass
- **Files**: `rate-limiter-algorithm.js`
- **Verify**: All tests pass in `npm test`

### Task 1.5 [RED] — Write failing tests for edge cases and presets
- **Why**: Cover zero capacity, zero refill, burst at boundary, window edge, presets
- **Files**: `rate-limiter-algorithm.test.js`
- **Verify**: Edge case tests fail

### Task 1.6 [GREEN] — Implement edge cases and presets
- **Why**: Make edge case tests pass; add createPreset function
- **Files**: `rate-limiter-algorithm.js`
- **Verify**: All tests pass (`npm test`), `npm run lint` passes

### Task 1.7 [REFACTOR] — Clean up algorithm module
- **Why**: Remove duplication, improve naming, ensure IIFE exports are clean
- **Files**: `rate-limiter-algorithm.js`
- **Verify**: All tests still pass, lint passes

## Phase 2: UI + Integration

### Task 2.1 — Create HTML page with side-by-side layout
- **Why**: Spec requires side-by-side comparison of both algorithms
- **Files**: `index.html`
- **Verify**: Page loads in browser, nav present, layout has two panels

### Task 2.2 — Implement UI logic (visualization + controls)
- **Why**: Wire up algorithm module to interactive UI; UI must call algorithm functions (not duplicate logic)
- **Files**: `rate-limiter.js`
- **Verify**: Send Request works, Flood works, presets configure both panels, request log updates

### Task 2.3 — Create rate-limiter-style.css
- **Why**: Visual styling for bucket visualization, request log, side-by-side panels
- **Files**: `rate-limiter-style.css`
- **Verify**: All classes prefixed with `rl-`, visual bucket indicator works, responsive

### Task 2.4 — Timer management and cleanup
- **Why**: Token refill needs real-time timer; must clean up on unload
- **Files**: `rate-limiter.js`
- **Verify**: Tokens refill visually, `beforeunload` clears intervals, Reset restarts timers

### Task 2.5 [GATE] — Phase 2 quality gate
- **Why**: All quality checks must pass before feature is complete
- **Verify**: `npm test && npm run lint` passes, all acceptance criteria verified
