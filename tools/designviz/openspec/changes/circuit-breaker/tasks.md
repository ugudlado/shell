# Circuit Breaker — Tasks

## Phase 1: Algorithm + Tests

- [ ] **1.1 Create circuit-breaker-algorithm.js**
  - Why: Core state machine logic, pure functions, no DOM
  - Files: circuit-breaker-algorithm.js
  - Verify: Module exports all API functions, IIFE pattern with var

- [ ] **1.2 Create circuit-breaker-algorithm.test.js**
  - Why: Verify all state transitions, thresholds, edge cases
  - Files: circuit-breaker-algorithm.test.js
  - Verify: npm test passes, covers CLOSED->OPEN, OPEN->HALF-OPEN, HALF-OPEN->CLOSED, HALF-OPEN->OPEN, zero threshold, boundary conditions

- [ ] **1.3 Update package.json lint globals**
  - Why: ESLint needs CircuitBreakerAlgorithm global
  - Files: package.json
  - Verify: npm run lint passes

## Phase 2: UI + Integration

- [ ] **2.1 Create circuit-breaker.html**
  - Why: Page structure with nav, controls, state diagram, metrics
  - Files: circuit-breaker.html
  - Verify: Nav links to index.html, loads algorithm.js before UI js

- [ ] **2.2 Create circuit-breaker-style.css**
  - Why: Concept-specific styles, all prefixed cb-
  - Files: circuit-breaker-style.css
  - Verify: All classes prefixed cb-, grep confirms no unprefixed classes

- [ ] **2.3 Create circuit-breaker.js**
  - Why: UI logic — calls algorithm module, no duplicated logic
  - Files: circuit-breaker.js
  - Verify: Uses CircuitBreakerAlgorithm for all state logic, textContent for text, timer cleanup

- [ ] **2.4 Update index.html nav**
  - Why: Link to circuit-breaker.html from existing pages
  - Files: index.html
  - Verify: Nav contains Circuit Breaker link

- [ ] **2.5 Final validation**
  - Why: All quality gates
  - Files: all
  - Verify: npm test && npm run lint pass clean
