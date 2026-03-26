# Tasks -- Bubble Sort Visualization

## Phase 1: Core Implementation

- [ ] **Task 1: Create bubble-sort-algorithm.js**
  - Why: Pure algorithm module needed for visualization steps
  - Files: `bubble-sort-algorithm.js`
  - Verify: `node -e "const B = require('./bubble-sort-algorithm.js'); const r = B.sort([3,1,2]); console.log(r.sortedArray);"` prints `[1,2,3]`

- [ ] **Task 2: Create bubble-sort-algorithm.test.js**
  - Why: Algorithm correctness tests (follows project convention)
  - Files: `bubble-sort-algorithm.test.js`
  - Verify: `npm test` passes with bubble sort tests

- [ ] **Task 3: Create bubble-sort.html**
  - Why: Page structure with nav, controls, visualization area
  - Files: `bubble-sort.html`
  - Verify: File loads in browser, nav links present

- [ ] **Task 4: Create bubble-sort-style.css**
  - Why: Algorithm-specific styles for bar chart and states
  - Files: `bubble-sort-style.css`
  - Verify: Styles applied correctly

- [ ] **Task 5: Create bubble-sort.js**
  - Why: DOM logic, bar chart rendering, playback controls, animation
  - Files: `bubble-sort.js`
  - Verify: Visualization runs end-to-end with playback controls

- [ ] **Task 6: Update nav in all existing pages**
  - Why: Bubble Sort must be accessible from every page
  - Files: `index.html`, `elevator.html`, `bfs.html`, `knapsack.html`
  - Verify: All 5 pages have consistent nav with Bubble Sort link

## Phase 2: Polish

- [ ] **Task 7: Lint and format check**
  - Why: Quality gate
  - Files: all new files
  - Verify: `npm run lint` passes, `npm run format:check` passes
