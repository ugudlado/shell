# Fix Plan: Prefix High-Priority CSS Classes — Batch 2

## Strategy

Prefix all unprefixed classes in `merge-sort-style.css`, `bubble-sort-style.css`, and `bst-style.css` using pattern: `.algo-<name>-<element>`.

### Merge Sort CSS Prefixes

- `.active-split` → `.algo-merge-sort-active-split`
- `.active-merge` → `.algo-merge-sort-active-merge`
- `.sorted` → `.algo-merge-sort-sorted`
- `.bar-section` → `.algo-merge-sort-bar-section`
- `.step-counter` → `.algo-merge-sort-step-counter`

Update class references in `merge-sort.js`.

### Bubble Sort CSS Prefixes

- `.bar-chart` → `.algo-bubble-sort-bar-chart`
- `.bar-label` → `.algo-bubble-sort-bar-label`
- `.comparing` → `.algo-bubble-sort-comparing`
- `.done` → `.algo-bubble-sort-done`
- `.step-display` → `.algo-bubble-sort-step-display`

Update class references in `bubble-sort.js`.

### BST CSS Prefixes

- `.tree-svg` → `.algo-bst-tree-svg`
- `.stats-panel` → `.algo-bst-stats-panel`
- `.stat` → `.algo-bst-stat`
- `.node-tooltip` → `.algo-bst-node-tooltip`
- `.highlight` → `.algo-bst-highlight`

Update class references in `bst.js`.

## Affected Files

- `tools/algoviz/merge-sort-style.css` + `merge-sort.js`
- `tools/algoviz/bubble-sort-style.css` + `bubble-sort.js`
- `tools/algoviz/bst-style.css` + `bst.js`

## Risk Assessment

- **Low risk**: Pure CSS refactoring; no behavioral changes
- **Regression test**: Cross-algo page loading bubble + merge + bst; verify no style bleeding
- **Verification**: Visual interaction tests for each algo individually + combined

