# Binary Search — Tasks

## Phase 1: TDD — Algorithm Module

### Task 1.1 [RED] Write binary search algorithm tests
- **Why**: TDD — tests first, must fail before implementation exists
- **Files**: `binary-search-algorithm.test.js`
- **Verify**: `npm test` runs, new test file found, all binary search tests FAIL (module not found)

### Task 1.2 [GREEN] Implement binary search algorithm
- **Why**: Make failing tests pass with correct binary search implementation
- **Files**: `binary-search-algorithm.js`
- **Verify**: `npm test` — all tests pass (82 existing + new binary search tests)

### Task 1.3 [REFACTOR] Review and refine algorithm
- **Why**: Clean up algorithm code, ensure consistent style with other algorithm files
- **Files**: `binary-search-algorithm.js`, `binary-search-algorithm.test.js`
- **Verify**: `npm test && npm run lint` both pass

## Phase 2: Visualization UI

### Task 2.1 Create HTML page with nav and inputs
- **Why**: [AC1, AC7, AC10] Page structure with controls, nav links
- **Files**: `binary-search.html`
- **Verify**: Page loads, nav includes all 8 algorithm pages, inputs present

### Task 2.2 Create CSS styles
- **Why**: [AC1, AC2, AC3, AC4, AC5] Visual styling for array blocks, pointers, states
- **Files**: `binary-search-style.css`
- **Verify**: Classes use `bsearch-` prefix, no conflicts with shared styles

### Task 2.3 Create visualization JS
- **Why**: [AC1-AC8] UI logic that calls BinarySearchAlgorithm.search(), renders steps, handles playback
- **Files**: `binary-search.js`
- **Verify**: Visualization works end-to-end, calls algorithm module (no duplicated logic), `npm run lint` passes

## Phase 3: Integration

### Task 3.1 Update nav in ALL existing HTML pages
- **Why**: [AC10] New page must be linked from every existing page
- **Files**: `index.html`, `elevator.html`, `bfs.html`, `knapsack.html`, `bubble-sort.html`, `bst.html`, `merge-sort.html`
- **Verify**: All 7 existing pages have "Binary Search" nav link

### Task 3.2 Update package.json lint globals
- **Why**: Lint must recognize BinarySearchAlgorithm global
- **Files**: `package.json`
- **Verify**: `npm run lint` passes with binary-search.js included

### Task 3.3 Final validation
- **Why**: All quality gates must pass
- **Files**: none (verification only)
- **Verify**: `npm test && npm run lint` pass, all acceptance criteria met
