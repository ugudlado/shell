# Diagnosis: Unprefix CSS Classes — Batch 3 (Low Priority — Shared `.swatch` Issue)

## Symptoms

Six AlgoViz visualization files use the same unprefixed `.swatch` class with very low overall unprefixed percentages (all < 21%):

1. **binary-search-style.css** — 19% unprefixed (`.swatch` only)
2. **convex-hull-style.css** — 21% unprefixed (`.swatch` only)
3. **dfs-style.css** — 10% unprefixed (`.swatch` only)
4. **dijkstra-style.css** — 8% unprefixed (`.swatch` only)
5. **astar-style.css** — 9% unprefixed (`.swatch` only)
6. **lcs-style.css** — 16% unprefixed (`.swatch` only)

## Root Cause

`.swatch` is a **shared utility class** (likely a color legend indicator) used across multiple visualizations. Repeated without prefixes in each CSS file. All other classes in these files are already properly prefixed (e.g., `.algo-binary-search-*`, `.algo-dijkstra-*`).

This is a **low-collision risk** but a **high-maintainability issue**: identical class name repeated 6 times suggests it should be:
1. **Extracted to global stylesheet** as `.algo-swatch` (single source of truth), OR
2. **Prefixed locally** in each file (`.algo-<name>-swatch`)

## Impact

- **Low functional risk**: Other classes properly prefixed; only `.swatch` is shared
- **Maintainability debt**: Any `.swatch` style change requires updating 6 files
- **Inconsistency**: Violates prefix pattern used in same files for other classes
- **Future risk**: New algos may copy `.swatch` without realizing it's duplicated elsewhere

