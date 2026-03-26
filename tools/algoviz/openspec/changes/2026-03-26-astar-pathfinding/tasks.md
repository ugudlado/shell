# A* Pathfinding — Tasks

## Phase 1: TDD — Algorithm Module + Tests

### Task 1.1 [RED] Write A* algorithm tests
- **Why**: TDD requires failing tests first. Tests define the contract for AStarAlgorithm.
- **Files**: `astar-algorithm.test.js`
- **Verify**: `npm test` runs, astar tests FAIL (module not yet implemented)

### Task 1.2 [GREEN] Implement A* algorithm module
- **Why**: Make all RED tests pass with correct A* implementation.
- **Files**: `astar-algorithm.js`
- **Verify**: `npm test` passes — all astar tests green

### Task 1.3 [REFACTOR] Clean up algorithm module
- **Why**: Remove duplication, improve naming, ensure IIFE + var pattern compliance.
- **Files**: `astar-algorithm.js`, `astar-algorithm.test.js`
- **Verify**: `npm test` still passes, `npm run lint` clean on algorithm files

### Task 1.4 Phase 1 Gate
- **Why**: Quality gate — tests + lint must pass before UI work
- **Files**: none
- **Verify**: `npm test && npm run lint` both exit 0

## Phase 2: Visualization UI

### Task 2.1 Create A* HTML page with grid and controls
- **Why**: Users need an interactive grid to place start/end/walls and run A*.
- **Files**: `astar.html`, `astar-style.css`
- **Verify**: Page loads, grid renders, mode buttons work, grid size selector works

### Task 2.2 Implement A* UI logic with cost annotations
- **Why**: Connect UI to AStarAlgorithm module, render open/closed sets, show f/g/h costs.
- **Files**: `astar.js`
- **Verify**: Run A* on grid, cells colored by open/closed/path, cost annotations visible at grid<=15, playback controls work

### Task 2.3 Phase 2 Gate
- **Why**: Quality gate — full visualization working
- **Files**: none
- **Verify**: `npm test && npm run lint` both exit 0, visual inspection of grid rendering

## Phase 3: Heuristic Toggle + BFS Comparison + Nav

### Task 3.1 Add heuristic toggle (Manhattan/Euclidean)
- **Why**: Users should see how different heuristics affect exploration patterns.
- **Files**: `astar.html`, `astar.js`
- **Verify**: Toggle switches heuristic, re-run shows different exploration pattern

### Task 3.2 Add BFS comparison panel
- **Why**: Side-by-side comparison demonstrates A* heuristic advantage over blind BFS.
- **Files**: `astar.html`, `astar.js`, `astar-style.css`
- **Verify**: Compare button shows dual grids, both run same layout, A* explores fewer cells shown in stats

### Task 3.3 Update nav links on all existing pages
- **Why**: Every page must link to A* and A* must link to all pages.
- **Files**: ALL `.html` files (index, elevator, bfs, dfs, knapsack, bubble-sort, bst, merge-sort, binary-search, lcs, dijkstra, huffman, astar)
- **Verify**: Every HTML file has `<a href="astar.html">A* Pathfinding</a>` in nav

### Task 3.4 Update package.json lint config
- **Why**: Add AStarAlgorithm global to eslint config so lint passes.
- **Files**: `package.json`
- **Verify**: `npm run lint` passes with astar.js included

### Task 3.5 Phase 3 Gate
- **Why**: Final quality gate — everything integrated
- **Files**: none
- **Verify**: `npm test && npm run lint` both exit 0, nav links on all pages verified
