# A* Pathfinding Visualization

## Motivation

A* is the gold-standard pathfinding algorithm used in GPS navigation, game AI, and robotics. Students need to see how f(n) = g(n) + h(n) guides search more efficiently than blind BFS. This visualization makes the heuristic advantage tangible through an interactive grid with per-cell cost annotations and a side-by-side BFS comparison panel.

Real-world analogy: GPS finding the fastest route — it doesn't explore every road equally (BFS), it prioritizes roads heading toward the destination (A*).

## Requirements

### Functional

1. **Interactive grid** (configurable 5x5 to 25x25) where users place:
   - Start cell (exactly one)
   - End cell (exactly one)
   - Wall cells (click/drag to toggle)
2. **A* algorithm execution** with step-by-step visualization:
   - Open set cells highlighted (frontier — candidates to explore)
   - Closed set cells highlighted (already evaluated)
   - Current cell being processed highlighted distinctly
   - Final shortest path highlighted on completion
3. **Per-cell cost annotations** showing f(n), g(n), h(n) values:
   - g(n): cost from start to this cell
   - h(n): heuristic estimate to end
   - f(n) = g(n) + h(n): total estimated cost
4. **Heuristic toggle**: Manhattan distance vs Euclidean distance
   - Manhattan: |dx| + |dy| (no diagonal movement)
   - Euclidean: sqrt(dx^2 + dy^2) (diagonal movement allowed)
5. **BFS comparison panel**: side-by-side grid showing BFS running on the same layout
   - Same walls, start, end
   - Shows cells explored count comparison
   - Highlights how A* explores fewer cells
6. **Playback controls**: play, pause, step forward, step back, speed slider, reset
7. **Statistics display**: step count, cells explored, open set size, path length — all from explicit algorithm state

### Non-Functional

- Pure algorithm module with no DOM dependencies (testable in Node.js)
- CSS prefixed with `astar-` to avoid collisions
- textContent (not innerHTML) for all user-visible text
- Input bounds validated: grid size 5-25, start/end required before run
- Clean up timers on reset/page unload
- Nav links added to ALL 13 existing HTML pages

## Acceptance Criteria

1. A* finds shortest path on grid with walls; path matches BFS path length
2. Per-cell f/g/h annotations visible during and after algorithm run
3. Both heuristics use 4-directional movement; Manhattan is tighter, Euclidean is admissible but less informative
4. Open/closed sets visually distinct with legend
5. BFS comparison panel shows identical grid, runs simultaneously, displays cell count comparison
6. Heuristic toggle re-runs algorithm with different heuristic
7. Edge cases handled: no path possible, start==end, empty grid (no walls), single-cell grid (1x1 returns immediately)
8. Grid size validated (5-25), error shown for invalid input
9. All 13 existing pages have nav link to astar.html
10. npm test passes with all A* algorithm tests; npm run lint passes

## Test Strategy

- **Test file**: `astar-algorithm.test.js`
- **Coverage target**: >= 90% of `astar-algorithm.js`
- **Coverage tool**: Node.js test runner via `run-tests.js`
- **Key scenarios**:
  - Basic pathfinding: straight line, L-shaped path, maze
  - Manhattan vs Euclidean heuristic: different path costs
  - Edge cases: empty grid, no path (fully walled), start==end, single cell (1x1)
  - Large grid (25x25) completes without error
  - Open/closed set snapshots have correct structure
  - Cost annotations: g(n) increases along path, h(n) decreases toward goal, f(n) = g(n) + h(n)
  - BFS algorithm: finds shortest path, snapshot structure correct
  - Adversarial: all walls except start/end (no path), start surrounded by walls
