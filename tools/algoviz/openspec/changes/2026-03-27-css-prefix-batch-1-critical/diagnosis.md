# CSS Prefix Batch 1: Critical (100% and 83% Unprefixed)

## Issue Summary

Two algorithm visualizations have unprefixed CSS classes at critical severity levels, creating significant collision risk with shared styles or other algorithms:

1. **elevator-style.css**: 100% unprefixed — all classes are bare (no prefix)
2. **bfs-style.css**: 83% unprefixed — `.mode-buttons`, `.grid-container`, `.grid-cell`, and others lack the `bfs-` prefix

These bare class names are high-risk because:
- `.grid-container`, `.grid-cell` could collide with other grid-based visualizations
- `.mode-buttons` is generic and likely used elsewhere
- No namespace isolation — styles accidentally override each other

## Affected Files

```
elevator-style.css  — 100% unprefixed (ALL classes bare)
bfs-style.css       — 83% unprefixed (.mode-buttons, .grid-container, .grid-cell, etc.)
```

## Unprefixed Classes

### elevator-style.css (100%)
All classes need the `el-` prefix (elevator):
- `.container`, `.control-panel`, `.floor-display`, `.button`, `.button-active`
- `.up-button`, `.down-button`, `.floor-selector`, `.elevator-visual`
- `.shaft`, `.car`, `.door`, `.door-left`, `.door-right`, `.cabin-floor`

### bfs-style.css (83%)
Key unprefixed classes:
- `.mode-buttons` (ALL buttons container)
- `.grid-container` (the visualization grid)
- `.grid-cell` (individual grid cells)
- `.wall`, `.path`, `.start`, `.end`, `.queue`, `.visited`, `.processing`

Already prefixed: `.queue-item` (correctly uses `bfs-queue-item`)

## Root Cause

Initial CSS implementations did not consistently apply algorithm-specific prefixes. The code review guidance (from CLAUDE.md) requires:

> CSS: prefix algorithm-specific classes (e.g., `ms-` for merge-sort) to avoid collisions with shared styles

Both files violate this rule.

## Reproduction

1. Open `elevator.html` and `bfs.html` simultaneously in browser dev tools
2. Search for `.grid-container` or `.container` in both stylesheets
3. Observe: class names overlap without prefix isolation
4. In a browser with both algorithms loaded, styles may unexpectedly cross-apply

## Expected Behavior

All algorithm-specific CSS classes must be prefixed:
- elevator-style.css: `el-container`, `el-button`, `el-shaft`, etc.
- bfs-style.css: `bfs-mode-buttons`, `bfs-grid-container`, `bfs-grid-cell`, etc.

## Impact

- **High collision risk** — generic names like `.container`, `.button`, `.grid-cell` are likely duplicated across visualizations
- **Unpredictable style application** — if two algorithms are embedded or loaded together, styles break
- **Maintenance burden** — future developers must remember not to use these bare names elsewhere
- **Architecture violation** — contradicts established AlgoViz prefix pattern

## Call Sites Count

Phase 1 audit results:
- elevator-style.css: 100% unprefixed (all ~15 classes)
- bfs-style.css: 83% unprefixed (~12 of 14 classes)

**Total: ~27 class names need prefixing across 2 files**
