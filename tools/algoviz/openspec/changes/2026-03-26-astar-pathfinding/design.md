# A* Pathfinding — Technical Design

## Architecture

Follows AlgoViz standard pattern:
- `astar-algorithm.js` — Pure algorithm module (IIFE, `var`, no DOM). Exports `AStarAlgorithm` global.
- `astar-algorithm.test.js` — Node.js tests, exports `runTests`.
- `astar.html` — Page structure, nav, controls, dual-grid layout.
- `astar.js` — UI logic (IIFE, `const/let`). Calls `AStarAlgorithm.run()` — no algorithm duplication.
- `astar-style.css` — All classes prefixed `astar-`.

## Algorithm Module API

```js
AStarAlgorithm.run({
  grid: { rows: number, cols: number, walls: [[r,c], ...] },
  start: [r, c],
  end: [r, c],
  heuristic: 'manhattan' | 'euclidean'
})
```

Returns:
```js
{
  path: [[r,c], ...] | null,
  snapshots: [{
    current: [r, c],
    openSet: [[r,c], ...],
    closedSet: [[r,c], ...],
    costs: { "r,c": { g, h, f }, ... },
    parent: { "r,c": "pr,pc" | null, ... }
  }, ...],
  explored: number,   // total cells explored
  pathLength: number,  // path length or -1
  error: string | null
}
```

### BFS Comparison

`AStarAlgorithm.runBFS(params)` — same interface as `run()` but uses BFS (no heuristic). Returns same structure so UI can render both identically. This ensures tested code == runtime code for both algorithms.

## Grid Representation

- `grid.walls` is an array of [row, col] pairs
- Internal representation: 2D boolean array for O(1) wall lookup
- Neighbors: 4-directional (up, down, left, right)
- Movement cost: 1 per step (uniform)

## Heuristics

- **Manhattan**: `|r1 - r2| + |c1 - c2|` — admissible for 4-directional
- **Euclidean**: `sqrt((r1-r2)^2 + (c1-c2)^2)` — admissible but less tight

Both exported for direct testing.

## Open Set Implementation

Array-based min-heap on f-cost (same pattern as Dijkstra's priority queue). Tie-breaking: prefer higher g (closer to goal).

## Snapshot Design

Each snapshot captures the full state at one algorithm step:
- `current`: the node being expanded
- `openSet`: all nodes currently in the open set
- `closedSet`: all nodes moved to closed set
- `costs`: map of "r,c" -> {g, h, f} for all evaluated nodes
- `parent`: map of "r,c" -> "pr,pc" for path reconstruction

This allows the UI to render any step independently (random access).

## UI Layout

```
[Controls: grid size | mode buttons | heuristic toggle | Run | Compare BFS]
[Info bar]
[Legend]
[A* Grid + Stats Sidebar] | [BFS Grid + Stats Sidebar]  (comparison mode)
[A* Grid + Stats Sidebar]                                 (single mode)
```

### Comparison Mode
- Activated by "Compare vs BFS" button
- Both grids share the same wall layout, start, and end
- Synchronized playback: stepping advances both grids
- Stats show: A* explored N cells, BFS explored M cells (M > N typically)

### Cost Annotations
- Each cell shows small `f` value when explored
- Tooltip or expanded view shows g, h, f breakdown
- Cells too small at large grid sizes: annotations only shown at grid <= 15

## CSS Prefix

All classes use `astar-` prefix:
- `astar-grid-container`, `astar-cell`, `astar-cell-wall`, `astar-cell-open`, `astar-cell-closed`, `astar-cell-path`, `astar-cell-start`, `astar-cell-end`
- `astar-cost-label`, `astar-stats`, `astar-sidebar`, `astar-comparison-layout`
- `astar-mode-btn`, `astar-active-mode`, `astar-btn-primary`, `astar-heuristic-toggle`

## Input Validation

- Grid size: min 5, max 25 (enforced in select dropdown + algorithm guard)
- Start/end must be within grid bounds
- Start/end cannot be on a wall
- Wall coordinates validated against grid bounds

## State Management

- `stepCount`: explicit counter incremented per snapshot advance (not derived from array index)
- `openSetSize`, `closedSetSize`: read from snapshot data (not computed from DOM)
- `exploredCount`: explicit counter from algorithm result

## Error Handling

- No path: display "No path found" message, show closed set (explored area)
- Start == End: immediate result, 0-length path
- Invalid grid: graceful error message
