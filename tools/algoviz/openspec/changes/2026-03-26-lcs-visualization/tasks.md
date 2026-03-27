# Tasks — LCS Visualization

## Phase 1: Core Algorithm + Tests

- [ ] **Task 1**: Create `lcs-algorithm.js` — pure LCS with solve() returning dp, steps, traceback, lcsString
  - Why: Core algorithm module, no DOM dependency
  - Files: `lcs-algorithm.js`
  - Verify: `npm test` passes, edge cases covered

- [ ] **Task 2**: Create `lcs-algorithm.test.js` — comprehensive tests
  - Why: Verify correctness for all edge cases
  - Files: `lcs-algorithm.test.js`
  - Verify: Tests pass for empty, single char, identical, no common, long strings, all duplicates

## Phase 2: UI + Visualization

- [ ] **Task 3**: Create `lcs.html` — page structure with nav, inputs, table container
  - Why: Page entry point
  - Files: `lcs.html`
  - Verify: Page loads, nav present

- [ ] **Task 4**: Create `lcs-style.css` — all classes prefixed `lcs-`
  - Why: Algorithm-specific styling
  - Files: `lcs-style.css`
  - Verify: All classes use `lcs-` prefix

- [ ] **Task 5**: Create `lcs.js` — UI logic calling LCSAlgorithm.solve(), playback controls
  - Why: Visualization and interaction
  - Files: `lcs.js`
  - Verify: Uses textContent not innerHTML for user text, calls algorithm module functions

## Phase 3: Integration

- [ ] **Task 6**: Add nav links to ALL 9 existing HTML pages
  - Why: Nav consistency across all pages
  - Files: All `.html` files
  - Verify: Every HTML file has LCS nav link

- [ ] **Task 7**: Update `package.json` lint script with LCSAlgorithm global
  - Why: Lint must pass with new global
  - Files: `package.json`
  - Verify: `npm run lint` passes

## Phase Gate
- [ ] `npm test && npm run lint` passes
