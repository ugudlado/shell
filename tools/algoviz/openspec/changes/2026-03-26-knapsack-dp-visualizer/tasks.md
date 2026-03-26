# Tasks: 0/1 Knapsack DP Visualizer

## Phase 1: Algorithm + Tests (TDD)

### [x] Task 1.1 [RED] Write knapsack algorithm tests
- **Why**: TDD requires tests first; validates algorithm correctness before implementation
- **Files**: `knapsack-algorithm.test.html` (browser), `knapsack-algorithm.test.js` (Node.js for `npm test`)
- **Verify**: Test file loads in browser, references `KnapsackAlgorithm`, all tests FAIL (module not yet created). Node test file exports `runTests`.

### [x] Task 1.2 [GREEN] Implement knapsack algorithm
- **Why**: Pure algorithm module that solve() builds DP table with steps and traceback
- **Files**: `knapsack-algorithm.js`
- **Verify**: All tests in `knapsack-algorithm.test.html` PASS. Algorithm handles all edge cases.

### [x] Task 1.3 [REFACTOR] Clean up algorithm module
- **Why**: Ensure code quality — clear naming, no duplication, good JSDoc
- **Files**: `knapsack-algorithm.js`
- **Verify**: All tests still PASS. Code is well-documented.

## Phase 2: Visualization UI

### [x] Task 2.1 Build knapsack.html page structure
- **Why**: Main visualization page with nav, controls, table container, info panel
- **Files**: `knapsack.html`
- **Verify**: Page loads, nav bar visible with all 4 links, controls present, no JS errors

### [x] Task 2.2 Build knapsack.js visualization logic
- **Why**: DOM rendering, animation state machine, playback controls
- **Files**: `knapsack.js`
- **Verify**: Click Visualize -> DP table appears. Play fills cells. Step/Reset work. Traceback highlights path.

### [x] Task 2.3 Create knapsack-style.css
- **Why**: Page-specific styles for item config, DP cell states, traceback highlighting
- **Files**: `knapsack-style.css`
- **Verify**: Visual appearance matches AlgoViz design language. Responsive on mobile.

## Phase 3: Integration + Validation

### [x] Task 3.1 Update nav bar on all existing pages
- **Why**: Users need to navigate to/from the new Knapsack page
- **Files**: `index.html`, `elevator.html`, `bfs.html`
- **Verify**: All 4 pages show nav with Knapsack link. Links work correctly.

### [x] Task 3.2 Final validation
- **Why**: End-to-end check that everything works together
- **Files**: (all knapsack files)
- **Verify**: All algorithm tests pass. knapsack.html renders correctly. Nav works on all pages. No console errors.
