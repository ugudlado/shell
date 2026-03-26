# Dijkstra's Shortest Path Visualization -- Design

## Component Breakdown

### dijkstra-algorithm.js
- IIFE pattern, `var` for compatibility, exports via `DijkstraAlgorithm` global
- `run({ nodes, edges, source })` -- main entry point
  - Validates: empty graph, source not in nodes, negative weights, weight > MAX_WEIGHT (999)
  - Returns `{ distances, previous, snapshots, path(target), error }`
- Min-heap priority queue (array-based): `pqPush`, `pqPop`, `pqToArray`
- Snapshot recording: captures `{ current, distances, priorityQueue, visited, relaxedEdge }` at each node visit and edge relaxation
- `pathTo(target)` -- predecessor-chain reconstruction with cycle guard
- Node.js export via `module.exports` for test runner

### dijkstra-algorithm.test.js
- 17 test scenarios covering: basic path, detour selection, single node, empty graph, disconnected, negative weight rejection, self-loop, cycle, bidirectional, zero-weight, invalid source, large graph (25 nodes), multiple equal paths, snapshot structure, weight-exceeds-max, dense graph, multi-hop path reconstruction
- Uses project test harness (`assert`, `assertEqual`)
- All assertions are falsifiable (no disjunctions that accept multiple outcomes)

### dijkstra.html
- Standard AlgoViz page structure with shared `style.css` + `dijkstra-style.css`
- Nav bar with all algorithm pages, Dijkstra as active link
- Controls: mode buttons (Add Node, Add Edge, Set Source), Load Preset, Clear All, Run Dijkstra
- Playback bar: Reset, Step Back, Play, Pause, Step Forward, Speed slider
- Info text panel for step-by-step explanations
- Legend with color swatches (unvisited, source, visited, current, relaxed, shortest path)
- Layout: graph container (left) + PQ sidebar (right)
- PQ sidebar: min-heap display, stats (step/visited/PQ size), distance table
- Scripts load order: `dijkstra-algorithm.js` before `dijkstra.js`

### dijkstra.js
- IIFE pattern, `const`/`let`
- Interaction modes: NODE (click canvas to place, drag to reposition), EDGE (click source then dest, weight dialog), SOURCE (click to set)
- Calls `DijkstraAlgorithm.run()` from algorithm module (no duplicated logic)
- Graph rendering: SVG edges with arrow markers, DOM div nodes
- Snapshot playback with CSS state classes on nodes and edges
- Weight input dialog with validation (0-999, no self-loops, no duplicate edges)
- Preset: 8-node GPS city graph with bidirectional roads
- Timer cleanup on reset and `beforeunload`
- Max 15 nodes enforced

### dijkstra-style.css
- All classes prefixed `dijk-` to avoid collisions
- Graph container: dark background, crosshair cursor
- Node states: source (green), visited (blue), current (yellow), relaxed (purple)
- Edge states: default (gray), relaxed (purple), shortest path (green)
- SVG arrow markers for each edge state
- PQ sidebar: scrollable list with top-element highlight
- Weight dialog: positioned at edge midpoint
- Responsive: sidebar moves below graph on narrow screens (<800px)

## Data Flow

1. User builds graph (add nodes, edges, set source) or loads preset
2. "Run Dijkstra" calls `DijkstraAlgorithm.run({ nodes, edges, source })`
3. Algorithm returns `{ distances, previous, snapshots[], path() }`
4. UI computes shortest path tree edges from `path()` for final display
5. Playback steps through snapshots, applying visual states per snapshot
6. Each snapshot updates: node colors, edge highlights, PQ sidebar, distance table, stats, info text
7. Final step shows shortest path tree in green

## Dependencies

- `dijkstra-algorithm.js` -- pure algorithm module (no DOM)
- `style.css` -- shared nav, controls, button styles
- No external libraries
