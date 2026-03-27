# CSS Prefix Batch 2: High — Tasks

## Bugfix: Prefix Unprefixed CSS Classes (Bubble Sort + Merge Sort + BST)

Rename unprefixed CSS classes across three sorting/tree visualizations:
- `bubble-sort-style.css`: 52% unprefixed → apply `bs-` prefix
- `merge-sort-style.css`: 40% unprefixed → apply `ms-` prefix
- `bst-style.css`: 37% unprefixed → apply `bst-` prefix

### Phase 1: Problem Diagnosis (COMPLETED)
- [x] Audit identified 52% unprefixed in `bubble-sort-style.css`
- [x] Audit identified 40% unprefixed in `merge-sort-style.css`
- [x] Audit identified 37% unprefixed in `bst-style.css`
- [x] Root cause: Inconsistent prefix application in initial CSS implementation
- [x] Impact: Moderate collision risk across similar algorithm types
- [x] Call sites verified: ~15+ selectors in each JS file

### Phase 2: Fix Implementation
- [ ] **Task 2.1**: Rename classes in bubble-sort-style.css
  - File: `/home/user/shell/tools/algoviz/bubble-sort-style.css`
  - Prefix all unprefixed classes with `bs-`
  - Update pseudo-selectors and media queries

- [ ] **Task 2.2**: Update selectors in bubble-sort.js
  - File: `/home/user/shell/tools/algoviz/bubble-sort.js`
  - Update all `querySelector`, `classList`, `getElementById` references
  - Verify all element selections use new `bs-*` class names

- [ ] **Task 2.3**: Rename classes in merge-sort-style.css
  - File: `/home/user/shell/tools/algoviz/merge-sort-style.css`
  - Prefix all unprefixed classes with `ms-`
  - Update pseudo-selectors and media queries

- [ ] **Task 2.4**: Update selectors in merge-sort.js
  - File: `/home/user/shell/tools/algoviz/merge-sort.js`
  - Update all `querySelector`, `classList`, `getElementById` references
  - Verify all element selections use new `ms-*` class names

- [ ] **Task 2.5**: Rename classes in bst-style.css
  - File: `/home/user/shell/tools/algoviz/bst-style.css`
  - Prefix all unprefixed classes with `bst-`
  - Update pseudo-selectors and media queries

- [ ] **Task 2.6**: Update selectors in bst.js
  - File: `/home/user/shell/tools/algoviz/bst.js`
  - Update all `querySelector`, `classList`, `getElementById` references
  - Verify all element selections use new `bst-*` class names

- [ ] **Task 2.7**: Verify lint passes
  - Run: `npm run lint` -- Expected: PASS (no warnings)

- [ ] **Task 2.8**: Verify format passes
  - Run: `npm run format:check` -- Expected: PASS

### Phase 3: Regression Testing
- [ ] **Task 3.1**: Test Bubble Sort UI
  - Load `bubble-sort.html` in browser
  - Verify bars render with correct heights and colors
  - Verify bar labels display values correctly
  - No console errors

- [ ] **Task 3.2**: Test Bubble Sort Functionality
  - Start sort animation → bars update correctly
  - Comparing state highlights bars
  - Comparison counter and swap counter update
  - Step counter advances with each operation

- [ ] **Task 3.3**: Test Merge Sort UI
  - Load `merge-sort.html` in browser
  - Verify array bars render correctly
  - Verify split highlighting shows during split phase
  - No console errors

- [ ] **Task 3.4**: Test Merge Sort Functionality
  - Start sort animation → split highlighting works
  - Merge phase highlights active merge sections
  - Sorted sections highlighted correctly
  - Animation timing and visual feedback correct

- [ ] **Task 3.5**: Test BST UI
  - Load `bst.html` in browser
  - Verify tree renders with correct node layout
  - Verify stats panel displays correctly
  - Verify controls (insert, delete, search) visible and responsive
  - No console errors

- [ ] **Task 3.6**: Test BST Functionality
  - Insert nodes → tree structure updates correctly
  - Delete nodes → tree rebalances properly
  - Search operation → highlights traversal path
  - Stats update with tree operations (height, size, etc.)

- [ ] **Task 3.7**: Test backward compatibility
  - Run: `npm test` -- Expected: 192+ passed, 0 failed
  - Verify no regressions in any algorithm tests

- [ ] **Task 3.8**: Visual inspection
  - All three pages render without visual regression
  - Colors, layout, spacing match original intent
  - Typography and labels readable

### Phase 4: Validation Checklist
- [ ] All unprefixed classes in bubble-sort-style.css use `bs-` prefix
- [ ] All unprefixed classes in merge-sort-style.css use `ms-` prefix
- [ ] All unprefixed classes in bst-style.css use `bst-` prefix
- [ ] All selectors in bubble-sort.js reference prefixed classes
- [ ] All selectors in merge-sort.js reference prefixed classes
- [ ] All selectors in bst.js reference prefixed classes
- [ ] Lint: `npm run lint` passes with no warnings
- [ ] Format: `npm run format:check` passes
- [ ] All three visualizations render and function correctly
- [ ] Backward compatibility verified (all tests pass)
- [ ] No console errors or warnings
- [ ] No style collision risk

## Expected Time: 25-35 minutes

## Rollback Plan
If regression detected:
1. Revert all CSS and JS files to original unprefixed state
2. Rerun tests
3. Investigate root cause if tests still fail

## Success Criteria
- All unprefixed classes are prefixed
- All JavaScript selectors updated
- All three visualizations render and function identically
- No lint or format warnings
- All tests pass
- No collision risk

## Notes
- This is a BUGFIX (architectural correctness), not a feature
- Changes improve maintainability and prevent future collisions
- No algorithm logic changed
- No new test code required (UI regression testing only)
