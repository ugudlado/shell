# CSS Prefix Batch 2: High Severity (37-52% Unprefixed)

## Issue Summary

Three algorithm visualizations have significant unprefixed CSS classes (37-52%), creating moderate collision risk and architectural inconsistency:

1. **bubble-sort-style.css**: 52% unprefixed — `.bar-chart`, `.bar-label`, `.comparing`
2. **merge-sort-style.css**: 40% unprefixed — `.active-split`, `.active-merge`, `.sorted`
3. **bst-style.css**: 37% unprefixed — `.tree-svg`, `.stats-panel`, `.stat`

These unprefixed class names create risk because:
- `.bar-chart` and `.bar-label` could conflict with other chart/visualization algorithms
- `.tree-svg` is generic enough to collide with any tree-based visualization
- `.stats-panel` and `.stat` are generic naming likely duplicated elsewhere
- No namespace isolation — hard to maintain as codebase grows

## Affected Files

```
bubble-sort-style.css  — 52% unprefixed (.bar-chart, .bar-label, .comparing, etc.)
merge-sort-style.css   — 40% unprefixed (.active-split, .active-merge, .sorted, etc.)
bst-style.css          — 37% unprefixed (.tree-svg, .stats-panel, .stat, etc.)
```

## Unprefixed Classes

### bubble-sort-style.css (52%)
~7 unprefixed classes:
- `.bar-chart` (main container for bars)
- `.bar-label` (bar value labels)
- `.bar` (individual bars)
- `.comparing` (highlight state during comparison)
- `.compare-count`, `.swap-count` (statistics display)
- `.step-counter` (step display)
- `.controls` (button container)

### merge-sort-style.css (40%)
~5 unprefixed classes:
- `.active-split` (highlight during split phase)
- `.active-merge` (highlight during merge phase)
- `.sorted` (highlight for sorted sections)
- `.array-container` (main visualization)
- `.bar` (individual bars, conflict risk with bubble-sort)

### bst-style.css (37%)
~5 unprefixed classes:
- `.tree-svg` (SVG canvas for tree)
- `.stats-panel` (information panel)
- `.stat` (individual stat line)
- `.controls` (button container)
- `.node` (tree node element)

## Root Cause

Initial CSS implementations did not consistently apply algorithm-specific prefixes. Architectural guidance (from CLAUDE.md) requires:

> CSS: prefix algorithm-specific classes (e.g., `ms-` for merge-sort) to avoid collisions with shared styles

All three files violate this rule to varying degrees.

## Reproduction

1. Load `bubble-sort.html` and `merge-sort.html` in browser dev tools
2. Observe `.bar`, `.bar-chart`, `.controls` overlap without prefix isolation
3. Load `bst.html` alongside — `.stats-panel`, `.tree-svg` could conflict with other tree-based algorithms
4. In a combined or modular scenario, unprefixed classes cause style cross-application

## Expected Behavior

All algorithm-specific CSS classes must be prefixed:
- bubble-sort-style.css: `bs-bar-chart`, `bs-bar-label`, `bs-comparing`, etc.
- merge-sort-style.css: `ms-active-split`, `ms-active-merge`, `ms-sorted`, etc.
- bst-style.css: `bst-tree-svg`, `bst-stats-panel`, `bst-stat`, etc.

## Impact

- **Moderate collision risk** — `.bar`, `.controls`, `.stats-panel` are generic names likely used elsewhere
- **Maintenance burden** — developers must remember not to reuse these bare names
- **Architecture violation** — contradicts established AlgoViz prefix pattern
- **Cross-algorithm style leakage** — if algorithms are dynamically loaded, styles may interfere

## Call Sites Count

Phase 1 audit results:
- bubble-sort-style.css: 52% unprefixed (~7 of 13 classes)
- merge-sort-style.css: 40% unprefixed (~5 of 12 classes)
- bst-style.css: 37% unprefixed (~5 of 13 classes)

**Total: ~17 class names need prefixing across 3 files**
