# Specification: Dijkstra's Shortest Path Visualization

## Motivation

AlgoViz covers sorting, search, string algorithms, tree traversals, and grid pathfinding, but lacks a weighted graph algorithm. Dijkstra's Shortest Path is the canonical greedy graph algorithm and maps directly to a real-world GPS navigation example, making it ideal for teaching priority queues, edge relaxation, and shortest path trees.

## What Changes

New algorithm page: interactive weighted directed graph visualization with step-by-step Dijkstra execution. Users build or load a graph, pick a source node, and watch the algorithm discover shortest paths with a min-heap priority queue sidebar.

## Requirements

### Functional

1. **Graph building**: Users can add nodes (click canvas, max 15), add directed weighted edges (click source then destination, enter weight 0-999), set a source node, drag nodes to reposition.
2. **Preset graph**: "Load Preset" button creates an 8-node GPS-style city graph with bidirectional roads.
3. **Algorithm execution**: Runs Dijkstra's algorithm via the pure `dijkstra-algorithm.js` module, producing step snapshots.
4. **Step-by-step visualization**: Nodes colored by state (unvisited, visited, current, relaxed). Edges highlighted on relaxation (purple) and in final shortest path tree (green).
5. **Priority queue sidebar**: Real-time min-heap display showing queued nodes sorted by tentative distance, with the top element highlighted.
6. **Distance table**: Live distance values for all nodes, updated at each step.
7. **Statistics**: Step count, visited count, PQ size counters.
8. **Playback controls**: Play, Pause, Step Forward, Step Back, Reset, Speed slider.
9. **Explanation text**: Each step shows what node is being processed or which edge was relaxed and the new distance.
10. **Input validation**: Edge weights must be 0-999. Negative weights rejected by algorithm. Self-loops disallowed in UI. Max 15 nodes enforced.
11. **Cleanup**: Timers cleared on reset and page unload.

### Non-Functional

1. Algorithm module has zero DOM dependencies (testable in Node.js).
2. UI calls algorithm module functions directly (no duplicated logic).
3. All CSS classes prefixed with `dijk-` to avoid collisions.
4. Responsive layout (sidebar moves below graph on narrow screens).

## Architecture

Follows the AlgoViz file pattern:

| File | Purpose |
|------|---------|
| `dijkstra-algorithm.js` | Pure algorithm: Dijkstra with min-heap PQ, snapshot recording, path reconstruction |
| `dijkstra-algorithm.test.js` | Node.js tests: correctness, edge cases, snapshot structure |
| `dijkstra.html` | Page structure, nav, graph container, PQ sidebar, controls |
| `dijkstra.js` | Visualization: graph rendering (SVG edges, DOM nodes), playback, interaction modes |
| `dijkstra-style.css` | All styles prefixed `dijk-` |

## Test Strategy

### Test File Paths

- `dijkstra-algorithm.js` -> `dijkstra-algorithm.test.js`

### Coverage Targets

- `dijkstra-algorithm.js` >= 95% (all branches: empty graph, single node, disconnected, negative weight, weight-exceeds-max, cycles, self-loops, zero-weight, large graph, path reconstruction)

### Key Test Scenarios

1. **Basic shortest path**: Linear graph A->B->C, verify distances and path reconstruction.
2. **Shorter-via-detour**: A->C direct (expensive) vs A->B->C (cheap), picks cheaper.
3. **Single node**: Distance to self is 0, path to self is [X].
4. **Empty graph**: No nodes returns empty result.
5. **Disconnected node**: Unreachable node has Infinity distance, null path.
6. **Negative weight rejected**: Returns error "negative-weight".
7. **Self-loop**: Does not affect distances.
8. **Cycle**: Correct distances despite cycle.
9. **Bidirectional edges**: Finds shortest in both directions.
10. **Zero-weight edges**: Valid, distance is 0.
11. **Source not in graph**: Returns empty result with no snapshots (falsifiable: assert both conditions independently).
12. **Large graph (25 nodes)**: Completes with correct cumulative distances.
13. **Multiple equal-cost paths**: Returns one valid path of correct length.
14. **Snapshot structure**: Each snapshot has current, distances, priorityQueue, visited, relaxedEdge.
15. **Weight exceeds max (>999)**: Returns error "weight-exceeds-max" (falsifiable: assert specific error).
16. **Dense graph**: All-pairs connected, finds optimal multi-hop path.
17. **Path reconstruction**: Multi-hop path through 4 nodes with correct total distance.

### Coverage Tool

Node.js test runner via `npm test` (run-tests.js harness with assert/assertEqual).

## Acceptance Criteria

- [ ] AC-1: Page loads with empty canvas; user can add up to 15 nodes by clicking.
- [ ] AC-2: Edge mode allows creating directed weighted edges with weight input dialog (0-999).
- [ ] AC-3: Source mode sets a source node (green highlight).
- [ ] AC-4: "Load Preset" creates GPS-style 8-city graph with source A.
- [ ] AC-5: "Run Dijkstra" executes algorithm and produces step snapshots.
- [ ] AC-6: Playback (Play/Pause/Step/StepBack/Reset) animates through snapshots with correct node coloring.
- [ ] AC-7: Priority queue sidebar shows queued nodes sorted by distance; top element highlighted.
- [ ] AC-8: Distance table updates at each step.
- [ ] AC-9: Info text describes current step (node processing or edge relaxation).
- [ ] AC-10: Shortest path tree shown in green on final step.
- [ ] AC-11: All tests pass with `npm test`; no no-op disjunction assertions.
- [ ] AC-12: `npm run lint` passes.
- [ ] AC-13: Nav links present in all existing HTML pages.
- [ ] AC-14: UI calls `DijkstraAlgorithm.run()` from algorithm module (no duplicated logic).

## Alternatives Considered

- **Canvas-based rendering**: Rejected — DOM nodes + SVG edges match existing AlgoViz pages, are easier to style/animate, and support event handling natively.
- **D3.js for graph layout**: Rejected — adds external dependency; manual positioning with drag is simpler and consistent with the project's zero-dependency approach.
- **Adjacency matrix input**: Rejected — interactive node/edge building is more engaging for education.

## Impact

- New page added to nav across all existing HTML files.
- `package.json` lint globals updated for `DijkstraAlgorithm`.
- No breaking changes to existing pages.

## Decisions

1. **Directed graph with optional bidirectional edges**: Dijkstra works on directed graphs; the preset includes reverse edges to simulate undirected roads.
2. **Weight cap at 999**: Prevents overflow in distance sums and keeps UI readable.
3. **Self-loops disallowed in UI but handled in algorithm**: UI prevents creation; algorithm still handles gracefully if edges are programmatic.
