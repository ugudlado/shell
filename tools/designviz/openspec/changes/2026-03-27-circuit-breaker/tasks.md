# Circuit Breaker — Tasks

## Phase 1: Algorithm + Tests

### Task 1.1: Circuit Breaker Algorithm Module
- **Why**: Core state machine logic needed before UI
- **Files**: `circuit-breaker-algorithm.js`
- **Verify**: Module exports createCircuitBreaker, sendRequest, checkTimeout, reset, getStats. IIFE + var pattern. No DOM dependencies.

### Task 1.2: Algorithm Tests
- **Why**: Validate state transitions, thresholds, half-open probe, edge cases
- **Files**: `circuit-breaker-algorithm.test.js`
- **Verify**: `npm test` passes. Tests cover: creation, CLOSED->OPEN on threshold, OPEN->HALF_OPEN on timeout, HALF_OPEN->CLOSED on probe success, HALF_OPEN->OPEN on probe failure, success resets failure count, OPEN rejects immediately, edge cases (zero threshold, zero timeout, boundary failures).

## Phase 2: UI + Integration

### Task 2.1: HTML Page
- **Why**: Page structure with nav linking to index.html
- **Files**: `circuit-breaker.html`
- **Verify**: Nav matches existing pattern. Links to style.css, circuit-breaker-style.css, circuit-breaker-algorithm.js (before circuit-breaker.js).

### Task 2.2: CSS Styles
- **Why**: Visual styling for circuit breaker page
- **Files**: `circuit-breaker-style.css`
- **Verify**: All classes prefixed with `cb-`. No unprefixed class names.

### Task 2.3: UI Module
- **Why**: Visualization, controls, request animation, state diagram
- **Files**: `circuit-breaker.js`
- **Verify**: Calls CircuitBreakerAlgorithm functions (no duplicated logic). Uses textContent. Cleans up timers. Input bounds enforced.

### Task 2.4: Nav + Package.json Updates
- **Why**: Integration — new page must be linked from all existing pages
- **Files**: `index.html`, `package.json`
- **Verify**: index.html nav includes circuit-breaker link. package.json lint script includes CircuitBreakerAlgorithm global. `npm test && npm run lint` pass.
