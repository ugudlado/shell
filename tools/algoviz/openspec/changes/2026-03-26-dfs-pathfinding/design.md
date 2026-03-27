# DFS Pathfinding — Technical Design

## Architecture

Follows the existing AlgoViz pattern exactly:

```
dfs-algorithm.js    — Pure DFS with explicit stack, snapshot recording
dfs-algorithm.test.js — Node.js tests for algorithm correctness
dfs.html            — Page structure, nav, controls, grid, stack sidebar
dfs.js              — UI logic, calls DFSAlgorithm.search(), renders snapshots
dfs-style.css       — DFS-specific styles (dfs- prefixed classes)
```

## Algorithm Design

DFS with explicit stack (mirrors BFS queue approach for teachability):

```
function search(grid, start, end):
    stack = [start]
    visited = {start}
    parent = {}
    snapshots = []

    while stack is not empty:
        current = stack.pop()         // LIFO — last in, first out
        record snapshot (stack, visited, current)

        if current == end:
            reconstruct path via parent map
            record final snapshot with path
            return

        for each neighbor (up, right, down, left):
            if valid and not wall and not visited:
                visited.add(neighbor)
                parent[neighbor] = current
                stack.push(neighbor)

    record "no path" snapshot
```

Key difference from BFS: `stack.pop()` vs `queue.shift()`. This makes DFS go deep along one direction before backtracking.

## Snapshot Structure

Each snapshot captures:
- `stack`: current stack contents (array of [row, col])
- `visited`: all visited cells
- `current`: the cell being explored this step
- `path`: null until found, then array of [row, col]
- `found`: boolean

## UI Layout

Same as BFS but with "Stack" sidebar instead of "Queue":
- Left: interactive grid
- Right: stack sidebar (newest item at top, visually showing LIFO)
- Stats: Step, Visited, Stack size

## Component Interaction

`dfs.html` loads `dfs-algorithm.js` via `<script>` tag (before `dfs.js`).
`dfs.js` calls `DFSAlgorithm.search(gridData, start, end)` — the pure algorithm returns snapshots.
UI renders snapshots for playback — no algorithm logic in the UI file.
