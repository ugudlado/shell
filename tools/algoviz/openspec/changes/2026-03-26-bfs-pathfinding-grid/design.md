# BFS Pathfinding Grid — Technical Design

## Architecture

Single-page app: `bfs.html` + `bfs.js`, reusing `style.css` with BFS-specific additions appended.

### Grid Model (`bfs.js`)

```
grid[row][col] = { wall: bool, visited: bool, distance: int, parent: [r,c] }
```

- 2D array, default 20x20
- Resize via dropdown (10x10, 15x15, 20x20, 25x25)

### BFS Algorithm

Standard queue-based BFS with 4-directional movement (up/down/left/right):
1. Enqueue start cell with distance 0
2. Dequeue front, mark visited, enqueue unvisited non-wall neighbors
3. Record parent pointers for path reconstruction
4. Stop when end cell is dequeued (shortest path found) or queue empty (no path)

### Step Snapshots

Each "step" = one full level expansion (all cells at distance D processed before D+1). Snapshots captured during BFS execution, then replayed for animation.

Snapshot structure:
```
{ frontier: [[r,c]...], visited: [[r,c]...], queue: [[r,c]...], path: null | [[r,c]...] }
```

### Interaction Modes

Three modes toggled by buttons: `WALL` (default), `START`, `END`. Click behavior depends on active mode.

### Color Scheme (dark theme)

| Cell State | Background | Border |
|-----------|-----------|--------|
| Empty     | #0d1117   | #21262d |
| Wall      | #8b949e   | #6e7681 |
| Start     | #2ea043   | #3fb950 |
| End       | #f85149   | #ff7b72 |
| Visited   | #1f6feb40 | #388bfd |
| Frontier  | #d2992280 | #e3b341 |
| Path      | #bc8cff60 | #bc8cff |

### Layout

```
[Nav Bar]
[Title: AlgoViz — BFS Pathfinding]
[Controls: mode buttons | grid size | playback controls]
[Info panel]
[Legend]
[Grid (left) | Queue Sidebar (right)]
```

### Files

| File | Action |
|------|--------|
| `bfs.html` | Create — page structure, grid container, sidebar |
| `bfs.js` | Create — grid model, BFS algo, animation, interaction |
| `style.css` | Append — BFS-specific grid cell styles, sidebar, layout |
| `index.html` | Edit — add BFS link to nav |
| `elevator.html` | Edit — add BFS link to nav |
