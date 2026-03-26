# DFS Pathfinding on a Grid

## Motivation

BFS pathfinding already exists in AlgoViz. DFS provides a natural contrast — same grid, same problem, but using a stack instead of a queue. This teaches students the fundamental difference between breadth-first and depth-first exploration: BFS expands outward level-by-level (finding shortest paths), while DFS dives deep down one path before backtracking.

Real-world analogy: exploring a cave system — pick a tunnel, go as deep as possible, backtrack when stuck, try the next tunnel.

## Requirements

### Functional
1. Interactive grid with walls, start, and end points (same UI pattern as BFS)
2. DFS algorithm using an explicit stack (not recursion, to match the queue visualization pattern)
3. Stack sidebar showing the current stack contents — contrast with BFS's queue sidebar
4. Step-by-step playback with play/pause/step controls
5. Stats: step count, visited count, stack size (computed from explicit state)
6. Legend showing cell states: empty, wall, start, end, visited, frontier (current), path
7. Grid size selector (10x10, 15x15, 20x20, 25x25)

### Non-Functional
1. Pure algorithm in `dfs-algorithm.js` (IIFE, `var`, no DOM) — testable in Node.js
2. UI in `dfs.js` calls algorithm module — no duplicated logic
3. CSS classes prefixed with `dfs-` to avoid collisions
4. `textContent` for user text, never `innerHTML` with user data
5. Input bounds validated (grid size via select dropdown)
6. Nav links added to ALL 8 existing pages + DFS page links to all

### Acceptance Criteria
- [ ] DFS explores depth-first (goes deep before backtracking) — visually distinct from BFS
- [ ] Stack sidebar shows LIFO order (newest at top), contrasting BFS queue (FIFO, oldest at front)
- [ ] Algorithm finds a path if one exists (not necessarily shortest)
- [ ] No path case handled gracefully with message
- [ ] Same grid interaction as BFS: wall drawing, start/end placement, clear
- [ ] All 9 pages have consistent nav links
- [ ] `npm test` passes with DFS algorithm tests
- [ ] `npm run lint` passes
