# Convex Hull — Tasks

## Phase 1: Algorithm Module + Tests

- [ ] **Task 1.1**: Create `convex-hull-algorithm.js` — pure Graham Scan with step recording
  - Why: Core algorithm needed before UI
  - Files: `convex-hull-algorithm.js`
  - Verify: `npm test` passes, handles all edge cases

- [ ] **Task 1.2**: Create `convex-hull-algorithm.test.js` — comprehensive tests
  - Why: Verify correctness for all edge cases
  - Files: `convex-hull-algorithm.test.js`
  - Verify: Tests for 0, 1, 2, 3+ points, collinear, duplicates, large set, input immutability

## Phase 2: Canvas Visualization + UI

- [ ] **Task 2.1**: Create `convex-hull.html` — page structure with canvas and controls
  - Why: Page structure for the visualization
  - Files: `convex-hull.html`
  - Verify: Page loads, nav present, all controls rendered

- [ ] **Task 2.2**: Create `convex-hull-style.css` — all classes use `hull-` prefix
  - Why: Visual styling matching AlgoViz dark theme
  - Files: `convex-hull-style.css`
  - Verify: All classes use `hull-` prefix, no unprefixed classes

- [ ] **Task 2.3**: Create `convex-hull.js` — canvas rendering, click-to-place, animation
  - Why: UI logic that calls ConvexHullAlgorithm (no logic duplication)
  - Files: `convex-hull.js`
  - Verify: Click to place points, polar sort animation, hull building animation, playback controls work, timer cleanup on reset

## Phase 3: Random Generator + Nav Integration

- [ ] **Task 3.1**: Add random points generator (5-50 range, default 20)
  - Why: Convenience for users, input bounds enforced
  - Files: `convex-hull.js`, `convex-hull.html`
  - Verify: Random button generates points, input bounded 5-50

- [ ] **Task 3.2**: Update nav in ALL existing HTML files + update package.json lint globals
  - Why: Nav integration required for all pages
  - Files: All 15 `.html` files, `package.json`
  - Verify: All HTML files have Convex Hull nav link, `npm run lint` passes

- [ ] **Task 3.3**: Final validation — npm test && npm run lint
  - Why: Quality gate
  - Verify: Both commands pass with zero errors
