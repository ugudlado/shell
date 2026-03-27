# Tasks -- Dijkstra's Shortest Path Visualization

## Phase 1: Algorithm + Tests (TDD)

### [x] Task 1 (RED): Write dijkstra-algorithm.test.js
- **Why**: TDD requires tests before implementation; covers all spec test scenarios
- **Files**: `dijkstra-algorithm.test.js`
- **Verify**: Tests fail without implementation (RED phase); 17 scenarios cover basic path, edge cases (empty, single, disconnected, negative, self-loop, cycle), bounds (max weight, large graph), snapshot structure, path reconstruction

### [x] Task 2 (GREEN): Implement dijkstra-algorithm.js
- **Why**: Pure algorithm module that all tests validate
- **Files**: `dijkstra-algorithm.js`
- **Verify**: All 17 tests pass; module has zero DOM dependencies; exports via `DijkstraAlgorithm` global + `module.exports`

### [x] Task 3 (REFACTOR): Fix no-op disjunction assertions
- **Why**: Two test assertions used `||` disjunctions accepting either outcome (violates TDD falsifiability rule from CLAUDE.md)
- **Files**: `dijkstra-algorithm.test.js`
- **Verify**: "Source not in graph" test asserts exact behavior (empty distances, 0 snapshots, null error) independently; "Weight exceeds max" test asserts exact error string "weight-exceeds-max"; all 17 tests still pass

## Phase 2: UI + Visualization

### [x] Task 4: Create dijkstra.html
- **Why**: Page structure following AlgoViz conventions
- **Files**: `dijkstra.html`
- **Verify**: HTML valid, nav includes all pages with Dijkstra active, links to style.css + dijkstra-style.css + dijkstra-algorithm.js + dijkstra.js

### [x] Task 5: Create dijkstra-style.css
- **Why**: Visual styling with dijk- prefix for all classes
- **Files**: `dijkstra-style.css`
- **Verify**: All classes use `dijk-` prefix; responsive layout works; node/edge states visually distinct

### [x] Task 6: Create dijkstra.js
- **Why**: Visualization logic calling algorithm module functions (no duplicated logic)
- **Files**: `dijkstra.js`
- **Verify**: `DijkstraAlgorithm.run()` called from UI (not re-implemented); playback controls work; PQ sidebar updates; distance table updates; timer cleanup on reset/unload

### [x] Task 7: Update nav links in all existing pages
- **Why**: All pages must link to Dijkstra
- **Files**: all `.html` files
- **Verify**: Each page nav contains Dijkstra link

## Phase 3: Quality Gate

### [x] Task 8: Lint + test gate
- **Why**: feature-tdd requires lint + test pass
- **Files**: none (verification only)
- **Verify**: `npm test` passes (all 164 tests, 0 failures); `npm run lint` passes with zero errors; no no-op disjunction assertions remain
