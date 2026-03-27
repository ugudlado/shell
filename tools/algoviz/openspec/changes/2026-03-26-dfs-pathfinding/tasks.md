# Tasks — DFS Pathfinding

## Phase 1: Algorithm + Tests

- [ ] **Task 1: Create `dfs-algorithm.js`**
  - Why: Pure DFS algorithm needed before UI
  - Files: `dfs-algorithm.js`
  - Verify: `node -e "const D = require('./dfs-algorithm.js'); console.log(D.search)"` prints function

- [ ] **Task 2: Create `dfs-algorithm.test.js`**
  - Why: Verify algorithm correctness — even for rapid, test the algorithm
  - Files: `dfs-algorithm.test.js`
  - Verify: `npm test` passes with DFS tests

## Phase 2: UI + Styles

- [ ] **Task 3: Create `dfs.html`**
  - Why: Page structure with nav, controls, grid, stack sidebar
  - Files: `dfs.html`
  - Verify: Valid HTML, nav has all 9 pages, loads dfs-algorithm.js before dfs.js

- [ ] **Task 4: Create `dfs.js`**
  - Why: UI visualization — calls DFSAlgorithm.search(), renders snapshots
  - Files: `dfs.js`
  - Verify: `npm run lint` passes, no duplicated algorithm logic

- [ ] **Task 5: Create `dfs-style.css`**
  - Why: Algorithm-specific styles with dfs- prefix
  - Files: `dfs-style.css`
  - Verify: All classes use `dfs-` prefix (grep verification)

## Phase 3: Integration

- [ ] **Task 6: Update nav on all 8 existing pages**
  - Why: All pages must link to DFS
  - Files: `index.html`, `elevator.html`, `bfs.html`, `knapsack.html`, `bubble-sort.html`, `bst.html`, `merge-sort.html`, `binary-search.html`
  - Verify: Each file has `<a href="dfs.html">DFS Pathfinding</a>` in nav

- [ ] **Task 7: Update `package.json` lint globals + lint target**
  - Why: Add DFSAlgorithm global and dfs.js to lint command
  - Files: `package.json`
  - Verify: `npm run lint` passes, `npm test` passes

## Phase Gate
- [ ] `npm test && npm run lint` passes
