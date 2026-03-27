# Convex Hull — Tasks

## Phase 1: Algorithm Module + Tests

### Task 1.1: Implement Graham Scan algorithm module
- **Why**: Core algorithm needed before any visualization
- **Files**: `convex-hull-algorithm.js`
- **Verify**: Module exports `ConvexHullAlgorithm` with `grahamScan(points)` that returns `{ steps, hull }`

### Task 1.2: Write comprehensive tests
- **Why**: Verify correctness for all edge cases before building UI
- **Files**: `convex-hull-algorithm.test.js`
- **Verify**: `npm test` passes; tests cover: empty, single, two points, collinear, all-same, triangle, square, large set (50+), does not mutate input

### Task 1.3: Update package.json lint config
- **Why**: New global `ConvexHullAlgorithm` must be registered for eslint
- **Files**: `package.json`
- **Verify**: `npm run lint` passes with new files

## Phase 2: Canvas Visualization + UI

### Task 2.1: Create HTML page with canvas and controls
- **Why**: Page structure needed for visualization
- **Files**: `convex-hull.html`
- **Verify**: Page loads, canvas visible, controls present, nav includes all 16 pages

### Task 2.2: Create CSS with hull- prefix
- **Why**: Algorithm-specific styles scoped to avoid collisions
- **Files**: `convex-hull-style.css`
- **Verify**: All classes prefixed with `hull-`, visual consistency with project theme

### Task 2.3: Implement UI logic with canvas rendering and animation
- **Why**: Core visualization — click-to-place, polar sort animation, hull building animation
- **Files**: `convex-hull.js`
- **Verify**:
  - Click-to-place works on canvas
  - Polar sort animation shows fan effect from pivot
  - Hull building animation shows stack push/pop with left-turn test
  - Hull outline drawn as edges
  - Interior points highlighted differently
  - Playback controls work (play/pause/step/reset/speed)
  - Timer cleanup on reset
  - Uses `textContent` not `innerHTML`
  - Calls `ConvexHullAlgorithm.grahamScan()` — no duplicated logic

## Phase 3: Random Generator + Nav Integration

### Task 3.1: Add random points generator
- **Why**: Convenience feature for quick demos
- **Files**: `convex-hull.js` (update)
- **Verify**: Random button generates N points (bounded 3-50), displayed on canvas

### Task 3.2: Update nav in ALL existing HTML pages
- **Why**: Every page must link to the new Convex Hull page
- **Files**: All 15 existing `.html` files (index.html, elevator.html, bfs.html, dfs.html, knapsack.html, bubble-sort.html, bst.html, merge-sort.html, binary-search.html, lcs.html, dijkstra.html, huffman.html, astar.html, topo-sort.html, lru-cache.html)
- **Verify**: Each file has `<a href="convex-hull.html">Convex Hull</a>` in nav

### Task 3.3: Final validation
- **Why**: Ensure all quality gates pass
- **Files**: All convex-hull files
- **Verify**: `npm test && npm run lint` passes, all acceptance criteria met
