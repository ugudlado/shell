# CSS Prefix Batch 2: High — Fix Plan

## Issue

Three algorithm visualizations have 37-52% unprefixed CSS classes, creating collision risk:
- `bubble-sort-style.css`: 52% unprefixed
- `merge-sort-style.css`: 40% unprefixed
- `bst-style.css`: 37% unprefixed

## Fix Strategy

### Batch 2a: bubble-sort-style.css
Apply `bs-` prefix to unprefixed classes:

| Current Class | New Class |
|---|---|
| `.bar-chart` | `.bs-bar-chart` |
| `.bar-label` | `.bs-bar-label` |
| `.bar` | `.bs-bar` |
| `.comparing` | `.bs-comparing` |
| `.compare-count` | `.bs-compare-count` |
| `.swap-count` | `.bs-swap-count` |
| `.step-counter` | `.bs-step-counter` |
| `.controls` | `.bs-controls` |

### Batch 2b: merge-sort-style.css
Apply `ms-` prefix to unprefixed classes:

| Current Class | New Class |
|---|---|
| `.active-split` | `.ms-active-split` |
| `.active-merge` | `.ms-active-merge` |
| `.sorted` | `.ms-sorted` |
| `.array-container` | `.ms-array-container` |
| `.bar` | `.ms-bar` |

### Batch 2c: bst-style.css
Apply `bst-` prefix to unprefixed classes:

| Current Class | New Class |
|---|---|
| `.tree-svg` | `.bst-tree-svg` |
| `.stats-panel` | `.bst-stats-panel` |
| `.stat` | `.bst-stat` |
| `.controls` | `.bst-controls` |
| `.node` | `.bst-node` |

## Affected Files

1. `bubble-sort-style.css` (~8 classes)
2. `bubble-sort.js` (update selectors)
3. `merge-sort-style.css` (~5 classes)
4. `merge-sort.js` (update selectors)
5. `bst-style.css` (~5 classes)
6. `bst.js` (update selectors)

## Implementation Plan

### Phase 1: Bubble Sort
1. Rename all unprefixed classes in `bubble-sort-style.css` with `bs-` prefix
2. Update all selectors in `bubble-sort.js` to use new class names
3. Verify: `npm run lint` and `npm run format:check` pass

### Phase 2: Merge Sort
1. Rename all unprefixed classes in `merge-sort-style.css` with `ms-` prefix
2. Update all selectors in `merge-sort.js` to use new class names
3. Verify: `npm run lint` and `npm run format:check` pass

### Phase 3: BST
1. Rename all unprefixed classes in `bst-style.css` with `bst-` prefix
2. Update all selectors in `bst.js` to use new class names
3. Verify: `npm run lint` and `npm run format:check` pass

## Testing Strategy

### Unit Test (None required)
- No algorithm logic changed, only CSS naming

### Integration Test (UI)
Manual testing on all three pages:
- [ ] **Bubble Sort**: Bars render with correct heights, colors, labels
- [ ] **Bubble Sort**: Comparing state highlights bars correctly
- [ ] **Bubble Sort**: Statistics (comparisons, swaps, steps) update during sort
- [ ] **Merge Sort**: Arrays display, split highlighting works
- [ ] **Merge Sort**: Merge highlighting shows merge process correctly
- [ ] **Merge Sort**: Sorted sections highlight correctly
- [ ] **BST**: Tree renders with correct node positions and labels
- [ ] **BST**: Stats panel displays correctly
- [ ] **BST**: Controls responsive (insert, delete, search operations)

### Regression Test
- [ ] `npm test` passes (all 192+ tests)
- [ ] No style leakage between algorithms
- [ ] All three algorithms load independently without collision

## Call Sites Verification

From diagnosis (Phase 1 grep results):
- `bubble-sort.js`: ~15+ selectors using unprefixed class names
- `merge-sort.js`: ~12+ selectors using unprefixed class names
- `bst.js`: ~16+ selectors using unprefixed class names

All call sites must be updated to use new prefixed names.

## Rollback Plan

If regression detected:
1. Revert all three CSS and JS files to original unprefixed state
2. Rerun tests
3. Investigate root cause

## Post-Fix Verification Checklist

- [ ] `bubble-sort-style.css`: all unprefixed classes renamed to `bs-*`
- [ ] `bubble-sort.js`: all selectors updated to use `bs-*` classes
- [ ] `merge-sort-style.css`: all unprefixed classes renamed to `ms-*`
- [ ] `merge-sort.js`: all selectors updated to use `ms-*` classes
- [ ] `bst-style.css`: all unprefixed classes renamed to `bst-*`
- [ ] `bst.js`: all selectors updated to use `bst-*` classes
- [ ] Lint passes: `npm run lint` (no warnings)
- [ ] Format passes: `npm run format:check`
- [ ] Manual UI test: All three visualizations render and function correctly
- [ ] All tests pass: `npm test` (no regressions)
- [ ] Visual inspection: Colors, layout, typography match original

## Time Estimate

25-35 minutes total (rename CSS + update selectors across 3 algorithms + test)

## Documentation Update

None required — this is a refactor, not a feature change.

## Success Criteria

- All unprefixed classes in all three CSS files are now prefixed
- All JavaScript selectors correctly reference new prefixed names
- All three visualizations render and function identically to pre-fix behavior
- No console errors or warnings
- Lint and format pass
- All tests pass
- No collision risk with other algorithms
