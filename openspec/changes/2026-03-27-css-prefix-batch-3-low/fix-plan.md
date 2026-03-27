# Fix Plan: Consolidate Shared `.swatch` Class — Batch 3

## Strategy

Create a single global `.algo-swatch` class definition in `tools/algoviz/style.css` (main stylesheet), then remove duplicates from individual algo files.

### Option A: Global `.swatch` (Preferred)

1. **Define in main stylesheet**: `tools/algoviz/style.css`
   - Create unified `.algo-swatch` with shared color-legend styling
   - All 6 files will inherit instead of redefining

2. **Remove from individual files**:
   - Delete `.swatch` definition from:
     - `binary-search-style.css`
     - `convex-hull-style.css`
     - `dfs-style.css`
     - `dijkstra-style.css`
     - `astar-style.css`
     - `lcs-style.css`
   - Rename `.swatch` → `.algo-swatch` in all HTML/JS references (if any)

3. **Benefits**:
   - Single source of truth
   - DRY principle (no duplication)
   - Easier to theme/update swatches globally
   - Reduced file sizes

## Affected Files

- `tools/algoviz/style.css` (add global `.algo-swatch`)
- 6 algo CSS files (remove duplicate `.swatch` definitions)
- `tools/algoviz/binary-search.js`, `convex-hull.js`, `dfs.js`, `dijkstra.js`, `astar.js`, `lcs.js` (update class refs if needed)

## Risk Assessment

- **Low risk**: `.swatch` is isolated utility; globally shared styling is safe
- **Regression test**: Load all 6 algos; verify color swatches render identically
- **Verification**: Visual inspection; all color legends displayed correctly

