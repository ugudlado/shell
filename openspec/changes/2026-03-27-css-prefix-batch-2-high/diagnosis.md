# Diagnosis: Unprefix CSS Classes — Batch 2 (High Priority)

## Symptoms

Three AlgoViz visualizations have significant unprefixed CSS class exposure:

1. **merge-sort-style.css** — 40% unprefixed
   - Classes: `.active-split`, `.active-merge`, `.sorted`, `.bar-section`, `.step-counter`
   - Risk: High — `.active-*` and `.sorted` are common generic names

2. **bubble-sort-style.css** — 52% unprefixed
   - Classes: `.bar-chart`, `.bar-label`, `.comparing`, `.done`, `.step-display`
   - Risk: High — `.bar-*`, `.comparing`, `.done` likely to collide with other chart/sort algos

3. **bst-style.css** — 37% unprefixed
   - Classes: `.tree-svg`, `.stats-panel`, `.stat`, `.node-tooltip`, `.highlight`
   - Risk: Medium-high — `.stat*`, `.highlight` are generic; tree visualization names might collide

## Root Cause

Same as Batch 1: CSS isolation-by-file design without namespace prefixes. These three files have moderate-to-high unprefixed percentages, creating moderate collision risk when loaded alongside other visualization algos.

## Impact

- **Visual bugs**: Incorrect colors, spacing, borders when multiple sorting/tree algos active
- **Hard to debug**: Batch contains different algorithm types (sorts + tree), making collision patterns non-obvious
- **Progressive risk**: As more algos are added, these generic names accumulate collisions
- **Testing overhead**: Need cross-algo smoke tests to catch collisions

