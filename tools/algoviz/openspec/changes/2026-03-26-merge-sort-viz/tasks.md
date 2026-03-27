# Tasks -- Merge Sort Visualization

## Phase 1: Algorithm (TDD)

### Task 1.1 [RED] Write merge sort algorithm tests
- **Why**: Tests must exist and FAIL before implementation (TDD red phase)
- **Files**: Create `merge-sort-algorithm.test.js`
- **Verify**: `npm test` runs, new tests FAIL (module not found), existing 52 tests still pass

### Task 1.2 [GREEN] Implement merge sort algorithm
- **Why**: Make failing tests pass
- **Files**: Create `merge-sort-algorithm.js`
- **Verify**: `npm test` -- all tests pass (old + new)

### Task 1.3 [REFACTOR] Clean up algorithm module
- **Why**: Improve code quality without changing behavior
- **Files**: `merge-sort-algorithm.js`
- **Verify**: `npm test` -- all tests still pass

### Task 1.4 [GATE] Phase 1 quality gate
- **Verify**: `npm test` passes, `npm run lint` passes (algorithm files excluded from lint per config)

## Phase 2: Visualization UI

### Task 2.1 Create merge sort HTML page
- **Why**: Need the page structure with nav, controls, visualization area, stats
- **Files**: Create `merge-sort.html`
- **Verify**: File exists, valid HTML, includes nav with all algorithm links

### Task 2.2 Create merge sort CSS
- **Why**: Algorithm-specific styles for the divide-and-conquer visualization
- **Files**: Create `merge-sort-style.css`
- **Verify**: File exists, follows dark theme pattern from style.css

### Task 2.3 Create merge sort visualization JS
- **Why**: Wire up controls, render bars, animate steps
- **Files**: Create `merge-sort.js`
- **Verify**: Page loads without JS errors, visualization runs with sample input

### Task 2.4 Update lint config for new files
- **Why**: `merge-sort.js` needs to be in lint scope, with `MergeSortAlgorithm` as global
- **Files**: `package.json` (lint script)
- **Verify**: `npm run lint` passes with new files included

### Task 2.5 [GATE] Phase 2 quality gate
- **Verify**: `npm run lint` passes, `npm test` passes, page loads correctly

## Phase 3: Nav Integration + Final Validation

### Task 3.1 Add merge sort to all nav bars
- **Why**: Every algorithm page needs a link to Merge Sort
- **Files**: `index.html`, `elevator.html`, `bfs.html`, `knapsack.html`, `bubble-sort.html`, `bst.html`
- **Verify**: All 6 existing pages have "Merge Sort" nav link

### Task 3.2 [GATE] Final validation
- **Verify**: `npm test` all pass, `npm run lint` passes, all nav links present, adversarial inputs tested (empty, single, sorted, reverse, duplicates, 20+ elements)
