# Tasks — BFS Pathfinding Grid

## Phase 1: Core Grid + BFS

### Task 1.1: Create bfs.html page structure
- **Why**: Need the HTML page with grid container, sidebar, controls, and nav
- **Files**: Create `bfs.html`
- **Verify**: Page loads in browser, shows grid container and sidebar layout

### Task 1.2: Create bfs.js with grid model and BFS algorithm
- **Why**: Core data model and algorithm logic
- **Files**: Create `bfs.js`
- **Verify**: Grid renders, cells clickable, BFS runs and finds path

### Task 1.3: Add BFS-specific styles to style.css
- **Why**: Cell state colors, sidebar styling, grid layout
- **Files**: Edit `style.css`
- **Verify**: Cells show correct colors for wall/start/end/visited/frontier/path states

## Phase 2: Animation + Polish

### Task 2.1: Step-by-step playback with queue sidebar
- **Why**: Animate BFS expansion level-by-level, show queue contents
- **Files**: Edit `bfs.js`
- **Verify**: Play/pause/step controls work, sidebar shows queue, animation progresses level-by-level

### Task 2.2: Update nav bar on all pages
- **Why**: BFS page needs to be accessible from existing pages
- **Files**: Edit `index.html`, `elevator.html`
- **Verify**: All three pages show nav with links to all three visualizations

### Task 2.3: Final integration and edge cases
- **Why**: Handle no-path-found, empty grid, start==end, boundary conditions
- **Files**: Edit `bfs.js`
- **Verify**: "No path found" message displays correctly, edge cases handled gracefully
