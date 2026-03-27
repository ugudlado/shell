# CSS Prefix Batch 1: Critical — Fix Plan

## Issue

Two algorithm visualizations have all or nearly all CSS classes unprefixed, creating high collision risk:
- `elevator-style.css`: 100% unprefixed
- `bfs-style.css`: 83% unprefixed (~12 of 14 classes)

## Fix Strategy

### Batch 1a: elevator-style.css
Apply `el-` prefix to all classes:

| Current Class | New Class |
|---|---|
| `.container` | `.el-container` |
| `.control-panel` | `.el-control-panel` |
| `.floor-display` | `.el-floor-display` |
| `.button` | `.el-button` |
| `.button-active` | `.el-button-active` |
| `.up-button` | `.el-up-button` |
| `.down-button` | `.el-down-button` |
| `.floor-selector` | `.el-floor-selector` |
| `.elevator-visual` | `.el-elevator-visual` |
| `.shaft` | `.el-shaft` |
| `.car` | `.el-car` |
| `.door` | `.el-door` |
| `.door-left` | `.el-door-left` |
| `.door-right` | `.el-door-right` |
| `.cabin-floor` | `.el-cabin-floor` |

### Batch 1b: bfs-style.css
Apply `bfs-` prefix to unprefixed classes (already-prefixed `.queue-item` stays as-is):

| Current Class | New Class |
|---|---|
| `.mode-buttons` | `.bfs-mode-buttons` |
| `.grid-container` | `.bfs-grid-container` |
| `.grid-cell` | `.bfs-grid-cell` |
| `.wall` | `.bfs-wall` |
| `.path` | `.bfs-path` |
| `.start` | `.bfs-start` |
| `.end` | `.bfs-end` |
| `.queue` | `.bfs-queue` |
| `.visited` | `.bfs-visited` |
| `.processing` | `.bfs-processing` |
| `.label` | `.bfs-label` |
| `.info-panel` | `.bfs-info-panel` |

## Affected Files

1. `elevator-style.css` (1 file, ~15 classes)
2. `bfs-style.css` (1 file, ~12 classes)
3. `elevator.js` (update class selectors)
4. `bfs.js` (update class selectors)

## Implementation Plan

### Phase 1: Elevator
1. Rename all classes in `elevator-style.css` (CSS file only)
2. Update all selectors in `elevator.js`:
   - Find: `querySelector/getElementById` calls using old class names
   - Update: Use new `el-` prefixed names
3. Verify: `npm run lint` passes
4. Verify: `npm run format:check` passes

### Phase 2: BFS
1. Rename all classes in `bfs-style.css` (CSS file only)
2. Update all selectors in `bfs.js`:
   - Find: `querySelector/getElementById` calls using old class names
   - Update: Use new `bfs-` prefixed names
3. Verify: `npm run lint` passes
4. Verify: `npm run format:check` passes

## Testing Strategy

### Unit Test (None required)
- No algorithm logic changed, only CSS naming

### Integration Test (UI)
Manual testing on `elevator.html` and `bfs.html`:
- [ ] **Elevator**: All controls responsive, styles applied correctly
- [ ] **Elevator**: Floor buttons highlight, elevator moves smoothly
- [ ] **BFS**: Grid displays with correct colors (wall, path, visited, processing)
- [ ] **BFS**: Mode buttons work (grid editing, pathfinding)
- [ ] **BFS**: Queue updates display correctly
- [ ] Both pages load without console errors

### Regression Test
- [ ] `npm test` passes (all 192+ tests)
- [ ] No style leakage between algorithms
- [ ] Both algorithms load independently without collision

## Call Sites Verification

From diagnosis (Phase 1 grep results):
- `elevator.js`: ~20+ selectors using unprefixed class names
- `bfs.js`: ~18+ selectors using unprefixed class names

All call sites must be updated to use new prefixed names.

## Rollback Plan

If regression detected:
1. Revert `elevator-style.css` and `elevator.js` to original unprefixed state
2. Revert `bfs-style.css` and `bfs.js` to original unprefixed state
3. Rerun tests
4. Investigate root cause

## Post-Fix Verification Checklist

- [ ] `elevator-style.css`: all classes renamed to `el-*`
- [ ] `elevator.js`: all selectors updated to use `el-*` classes
- [ ] `bfs-style.css`: all unprefixed classes renamed to `bfs-*`
- [ ] `bfs.js`: all selectors updated to use `bfs-*` classes
- [ ] Lint passes: `npm run lint` (no warnings)
- [ ] Format passes: `npm run format:check`
- [ ] Manual UI test: Elevator page loads and functions correctly
- [ ] Manual UI test: BFS page loads and functions correctly
- [ ] All tests pass: `npm test` (no regressions)
- [ ] Visual inspection: Colors, layout, typography match original intent

## Time Estimate

20-30 minutes total (rename CSS + update selectors + test)

## Documentation Update

None required — this is a refactor, not a feature change.

## Success Criteria

- All class names in both CSS files are prefixed
- All JavaScript selectors correctly reference new prefixed names
- Both visualizations render and function identically to pre-fix behavior
- No console errors or warnings
- Lint and format pass
- All tests pass
- No collision risk with other algorithms
