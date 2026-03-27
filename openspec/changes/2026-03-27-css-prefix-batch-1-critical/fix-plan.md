# Fix Plan: Prefix Critical CSS Classes — Batch 1

## Strategy

Systematically prefix all unprefixed classes in `elevator-style.css` and `bfs-style.css` using pattern: `.algo-<name>-<element>`.

### Elevator CSS Prefixes

- `.rope` → `.algo-elevator-rope`
- `.car` → `.algo-elevator-car`
- `.button` → `.algo-elevator-button`
- `.animation-state` → `.algo-elevator-animation-state`
- `.controls` → `.algo-elevator-controls`
- `.floor-select` → `.algo-elevator-floor-select`
- `.velocity-display` → `.algo-elevator-velocity-display`
- `.step-label` → `.algo-elevator-step-label`

Update corresponding class references in `elevator.js`.

### BFS CSS Prefixes

- `.mode-buttons` → `.algo-bfs-mode-buttons`
- `.grid-container` → `.algo-bfs-grid-container`
- `.grid-cell` → `.algo-bfs-grid-cell`
- `.visited-cell` → `.algo-bfs-visited-cell`
- `.path-cell` → `.algo-bfs-path-cell`
- `.edge` → `.algo-bfs-edge`
- `.step-info` → `.algo-bfs-step-info`

Update corresponding class references in `bfs.js`.

## Affected Files

- `tools/algoviz/elevator-style.css` (find/replace)
- `tools/algoviz/elevator.js` (class name refs)
- `tools/algoviz/bfs-style.css` (find/replace)
- `tools/algoviz/bfs.js` (class name refs)

## Risk Assessment

- **Low risk**: Classes are isolated per-file; prefixing is purely additive (same behavior, different names)
- **Regression test**: Load both elevator + bfs visualizations on same page; verify no visual overlap or style bleeding
- **Verification**: Visual inspection + manual interaction test (buttons, animations working)

