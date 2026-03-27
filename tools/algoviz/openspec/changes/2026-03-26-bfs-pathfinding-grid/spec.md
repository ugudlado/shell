# BFS Pathfinding Grid Visualization

## Motivation

AlgoViz currently has Levenshtein distance and Elevator (SCAN) visualizations. BFS (Breadth-First Search) is a fundamental graph algorithm ideal for teaching queue-based exploration. An interactive grid where users place walls, set start/end, and watch BFS expand level-by-level makes the algorithm intuitive.

## Requirements

### Functional
1. **Grid display**: Render an N x N grid (default 20x20) of clickable cells
2. **Wall placement**: Click cells to toggle walls (blocked cells BFS cannot traverse)
3. **Start/End points**: Click to set start (green) and end (red) points on the grid
4. **BFS animation**: Step-by-step playback showing queue expansion level-by-level
5. **Path highlighting**: On completion, highlight the shortest path from start to end
6. **Queue sidebar**: Display current queue contents during animation
7. **Playback controls**: Play, Pause, Step, Reset, Speed slider (matching existing AlgoViz pattern)
8. **Clear walls**: Button to clear all walls while keeping start/end

### Non-Functional
- Dark theme matching existing AlgoViz style (colors from style.css)
- Responsive layout
- No external dependencies (vanilla JS + CSS)
- Separate page (bfs.html) linked from nav bar

## Acceptance Criteria
- [ ] Grid renders with clickable cells
- [ ] Walls toggle on click
- [ ] Start/end points settable via mode buttons
- [ ] BFS animates level-by-level with distinct colors for visited/frontier/path
- [ ] Queue sidebar updates each step
- [ ] Shortest path highlighted on completion
- [ ] Playback controls (play/pause/step/reset/speed) work correctly
- [ ] "No path found" message when start is unreachable from end
- [ ] Navigation bar includes BFS link on all pages
