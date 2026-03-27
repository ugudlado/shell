# Tasks: Consolidate Shared `.swatch` Class — Batch 3

## Phase 1: Root Cause Investigation

- [ ] T-1: Extract `.swatch` definitions from all 6 files
  - **Why**: Identify duplication and confirm styling is identical
  - **Files**: `binary-search-style.css`, `convex-hull-style.css`, `dfs-style.css`, `dijkstra-style.css`, `astar-style.css`, `lcs-style.css`
  - **Verify**: Create summary document showing `.swatch` CSS rules from each file; verify all identical

- [ ] T-2: Check for `.swatch` class references in JS files
  - **Why**: Identify which JS files reference `.swatch` (may need className updates)
  - **Files**: `binary-search.js`, `convex-hull.js`, `dfs.js`, `dijkstra.js`, `astar.js`, `lcs.js`
  - **Verify**: List all `querySelector`, `classList.add`, `className` refs to `swatch`

## Phase 2: Regression Test

- [ ] T-3: Create multi-algo test page with all 6 algos using `.swatch`
  - **Why**: Document current `.swatch` behavior before consolidation
  - **Files**: `tools/algoviz/test-all-swatch-algos.html` (new)
  - **Verify**: Screenshot showing all color swatches rendered correctly

## Phase 3: Implementation

- [ ] T-4: Add global `.algo-swatch` class to main stylesheet
  - **Why**: Create single source of truth with unified swatch styling
  - **Files**: `tools/algoviz/style.css`
  - **Verify**: `grep -n "\.algo-swatch" style.css` confirms definition added

- [ ] T-5: Remove `.swatch` from binary-search-style.css
  - **Why**: Eliminate duplication; use global definition
  - **Files**: `tools/algoviz/binary-search-style.css`
  - **Verify**: `grep "\.swatch" binary-search-style.css` returns empty

- [ ] T-6: Remove `.swatch` from convex-hull-style.css
  - **Why**: Eliminate duplication
  - **Files**: `tools/algoviz/convex-hull-style.css`
  - **Verify**: `grep "\.swatch" convex-hull-style.css` returns empty

- [ ] T-7: Remove `.swatch` from dfs-style.css
  - **Why**: Eliminate duplication
  - **Files**: `tools/algoviz/dfs-style.css`
  - **Verify**: `grep "\.swatch" dfs-style.css` returns empty

- [ ] T-8: Remove `.swatch` from dijkstra-style.css
  - **Why**: Eliminate duplication
  - **Files**: `tools/algoviz/dijkstra-style.css`
  - **Verify**: `grep "\.swatch" dijkstra-style.css` returns empty

- [ ] T-9: Remove `.swatch` from astar-style.css
  - **Why**: Eliminate duplication
  - **Files**: `tools/algoviz/astar-style.css`
  - **Verify**: `grep "\.swatch" astar-style.css` returns empty

- [ ] T-10: Remove `.swatch` from lcs-style.css
  - **Why**: Eliminate duplication
  - **Files**: `tools/algoviz/lcs-style.css`
  - **Verify**: `grep "\.swatch" lcs-style.css` returns empty

- [ ] T-11: Update any JS className refs from `.swatch` → `.algo-swatch` (if needed)
  - **Why**: Keep JS class references consistent with new global name
  - **Files**: As identified in T-2
  - **Verify**: Search shows no remaining bare `.swatch` refs in JS

## Phase 4: Verification

- [ ] T-12: Re-run multi-algo test (T-3) — verify swatches still render
  - **Why**: Confirm global `.algo-swatch` works for all 6 algos
  - **Files**: `tools/algoviz/test-all-swatch-algos.html`
  - **Verify**: All color swatches display identically to before

- [ ] T-13: Smoke test each algo individually
  - **Why**: Ensure single-algo swatch rendering unaffected
  - **Verify**: Binary search, convex hull, DFS, Dijkstra, A*, LCS all show swatches correctly

