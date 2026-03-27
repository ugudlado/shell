# CSS Prefix Batch 1: Critical — Tasks

## Bugfix: Prefix Unprefixed CSS Classes (Elevator + BFS)

Rename all unprefixed CSS classes to prevent collisions:
- `elevator-style.css`: 100% unprefixed → apply `el-` prefix
- `bfs-style.css`: 83% unprefixed → apply `bfs-` prefix
- Update all JavaScript selectors in `elevator.js` and `bfs.js`

### Phase 1: Problem Diagnosis (COMPLETED)
- [x] Audit identified 100% unprefixed in `elevator-style.css`
- [x] Audit identified 83% unprefixed in `bfs-style.css`
- [x] Root cause: Initial CSS implementation did not apply prefix pattern
- [x] Impact: High collision risk with shared styles or other algorithms
- [x] Call sites verified: ~20+ selectors in elevator.js, ~18+ in bfs.js

### Phase 2: Fix Implementation
- [ ] **Task 2.1**: Rename classes in elevator-style.css
  - File: `/home/user/shell/tools/algoviz/elevator-style.css`
  - Prefix all classes with `el-`
  - Update pseudo-selectors and media queries as needed

- [ ] **Task 2.2**: Update selectors in elevator.js
  - File: `/home/user/shell/tools/algoviz/elevator.js`
  - Update all `querySelector`, `getElementById`, `classList` references
  - Verify all element selections use new `el-*` class names

- [ ] **Task 2.3**: Rename classes in bfs-style.css
  - File: `/home/user/shell/tools/algoviz/bfs-style.css`
  - Prefix unprefixed classes with `bfs-`
  - Preserve already-correct prefixed classes (e.g., `.bfs-queue-item`)

- [ ] **Task 2.4**: Update selectors in bfs.js
  - File: `/home/user/shell/tools/algoviz/bfs.js`
  - Update all `querySelector`, `getElementById`, `classList` references
  - Verify all element selections use new `bfs-*` class names

- [ ] **Task 2.5**: Verify lint passes
  - Run: `npm run lint` -- Expected: PASS (no warnings)

- [ ] **Task 2.6**: Verify format passes
  - Run: `npm run format:check` -- Expected: PASS

### Phase 3: Regression Testing
- [ ] **Task 3.1**: Test Elevator UI
  - Load `elevator.html` in browser
  - Verify all controls render (floor buttons, direction buttons, elevator visual)
  - Verify styles applied correctly (colors, layout, spacing)
  - No console errors

- [ ] **Task 3.2**: Test Elevator Functionality
  - Click floor buttons → elevator moves to correct floor
  - Button highlighting works (button-active state)
  - Doors open/close animation
  - Display updates (current floor, direction)

- [ ] **Task 3.3**: Test BFS UI
  - Load `bfs.html` in browser
  - Verify grid renders with correct initial state
  - Verify mode buttons visible and functional
  - Verify color scheme intact (walls, paths, visited, processing)
  - No console errors

- [ ] **Task 3.4**: Test BFS Functionality
  - Switch to grid editing mode → create walls
  - Switch to pathfinding mode → select start/end points
  - Run BFS → queue items display, visited cells animate
  - Colors update correctly during visualization
  - Info panel updates with statistics

- [ ] **Task 3.5**: Test backward compatibility
  - Run: `npm test` -- Expected: 192+ passed, 0 failed
  - Verify no regressions in any algorithm tests

- [ ] **Task 3.6**: Visual inspection
  - Elevator: layout matches original (proportions, colors, typography)
  - BFS: grid proportions correct, colors distinguishable, labels readable
  - Both pages: no visual regression vs. pre-fix version

### Phase 4: Validation Checklist
- [ ] All classes in elevator-style.css use `el-` prefix
- [ ] All classes in bfs-style.css use `bfs-` prefix
- [ ] All selectors in elevator.js reference prefixed classes
- [ ] All selectors in bfs.js reference prefixed classes
- [ ] Lint: `npm run lint` passes with no warnings
- [ ] Format: `npm run format:check` passes
- [ ] Elevator UI renders and functions correctly
- [ ] BFS UI renders and functions correctly
- [ ] Backward compatibility verified (all tests pass)
- [ ] No console errors or warnings
- [ ] No style collision risk

## Expected Time: 20-30 minutes

## Rollback Plan
If regression detected:
1. Revert `elevator-style.css` and `elevator.js`
2. Revert `bfs-style.css` and `bfs.js`
3. Rerun tests
4. Investigate root cause if tests still fail

## Success Criteria
- All unprefixed classes are prefixed
- All JavaScript selectors updated
- Both visualizations render and function identically
- No lint or format warnings
- All tests pass
- No collision risk with other algorithms

## Notes
- This is a BUGFIX (architectural correctness), not a feature
- Changes improve maintainability and prevent future collisions
- No algorithm logic changed
- No new test code required (UI regression testing only)
