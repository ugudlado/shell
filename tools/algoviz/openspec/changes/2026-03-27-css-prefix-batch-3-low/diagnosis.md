# CSS Prefix Batch 3: Low Severity (Shared .swatch Class)

## Issue Summary

Six algorithm visualizations have low unprefixed percentages (8-21%), with a common pattern: each uses an unprefixed `.swatch` class for color legend boxes. This is a **shared class issue** rather than algorithm-specific pollution.

Files affected:
1. **astar-style.css**: 9% unprefixed — `.swatch` only
2. **convex-hull-style.css**: 21% unprefixed — `.swatch` only
3. **dfs-style.css**: 10% unprefixed — `.swatch` only
4. **dijkstra-style.css**: 8% unprefixed — `.swatch` only
5. **lcs-style.css**: 16% unprefixed — `.swatch` only
6. **binary-search-style.css**: 19% unprefixed — minor (likely `.swatch` or similar)

Note: **knapsack-style.css** (mentioned in original audit) was **already partially fixed** (`.take` and `.skip` are prefixed), so focus on remaining unprefixed classes if any remain.

## Root Cause

The `.swatch` class is used consistently across multiple visualizations as a generic legend color box:
- Each algorithm independently implemented a color legend using `.swatch`
- No coordination on naming → multiple algorithms define the same bare class
- The class is simple (small color box, border, styling) but repeated

## Risk Analysis

**Why `.swatch` is lower-risk than algorithm-specific classes:**
- `.swatch` is genuinely shared/reused across algorithms
- Collision is less likely (simple styling, unlikely to conflict with other uses)
- BUT: if two algorithms are ever loaded together, both `.swatch` styles apply, potentially causing visual glitches

**Why it still needs fixing:**
1. **Architectural consistency** — follows the established AlgoViz prefix pattern
2. **Future-proofing** — if algorithms are combined, separate `.swatch` definitions avoid undefined cascade
3. **Maintainability** — prefixed names clarify intent (e.g., `dijkstra-swatch` tells you whose legend it is)

## Affected Files and Classes

```
astar-style.css        — .swatch (9% unprefixed)
binary-search-style.css — .swatch/minor (19% unprefixed)
convex-hull-style.css  — .swatch (21% unprefixed)
dfs-style.css          — .swatch (10% unprefixed)
dijkstra-style.css     — .swatch (8% unprefixed)
lcs-style.css          — .swatch (16% unprefixed)
```

## Expected Behavior

Each algorithm's `.swatch` should be prefixed with its algorithm prefix:
- astar-style.css: `.as-swatch`
- binary-search-style.css: `.bsearch-swatch` or similar
- convex-hull-style.css: `.ch-swatch`
- dfs-style.css: `.dfs-swatch`
- dijkstra-style.css: `.dijkstra-swatch` (or shorter if exists)
- lcs-style.css: `.lcs-swatch`

## Impact

- **Low collision risk** — `.swatch` is simple and rarely duplicated elsewhere
- **Low visual impact** — fix is cosmetic for style organization, not functionality
- **High maintainability gain** — prefixes clarify which algorithm each class belongs to
- **Consistency** — aligns with established AlgoViz architectural pattern

## Call Sites Count

Phase 1 audit results:
- All 6 files: 1 occurrence of `.swatch` each in CSS
- JavaScript files: ~1-2 selectors per algorithm using `.swatch` (estimate: 6-12 call sites total)

**Total: ~6 class definitions + ~6-12 selector references**

## Note on Knapsack

From original audit: "knapsack-style.css — 100% — Already partially fixed (.take/.skip done) — remaining classes still bare"

This batch does NOT address knapsack unless additional unprefixed classes remain beyond `.take` and `.skip`. Verify in implementation phase.
