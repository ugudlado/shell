# Tasks: Prefix High-Priority CSS Classes — Batch 2

## Phase 1: Root Cause Investigation

- [ ] T-1: Map class references in merge-sort.js, bubble-sort.js, bst.js
  - **Why**: Identify which classes are used in JS vs. CSS-only
  - **Files**: `tools/algoviz/merge-sort.js`, `bubble-sort.js`, `bst.js`
  - **Verify**: Create reference list showing class usage per file

## Phase 2: Regression Test

- [ ] T-2: Create multi-algo test page (bubble + merge + bst)
  - **Why**: Prove style collision bug when these three algos load together
  - **Files**: `tools/algoviz/test-multi-sort-and-tree.html` (new)
  - **Verify**: Screenshot documenting visual overlap/style bleeding before fix

## Phase 3: Implementation

- [ ] T-3: Prefix merge-sort-style.css — all 5 classes
  - **Why**: Eliminate `.active-*` and `.sorted` collisions
  - **Files**: `tools/algoviz/merge-sort-style.css`
  - **Verify**: All `.algo-merge-sort-*` classes present in file

- [ ] T-4: Update merge-sort.js — className references
  - **Why**: Sync JS to new prefixed names
  - **Files**: `tools/algoviz/merge-sort.js`
  - **Verify**: Merge sort renders and animates correctly

- [ ] T-5: Prefix bubble-sort-style.css — all 5 classes
  - **Why**: Eliminate `.bar-*`, `.comparing`, `.done` collisions
  - **Files**: `tools/algoviz/bubble-sort-style.css`
  - **Verify**: All `.algo-bubble-sort-*` classes present in file

- [ ] T-6: Update bubble-sort.js — className references
  - **Why**: Sync JS to new prefixed names
  - **Files**: `tools/algoviz/bubble-sort.js`
  - **Verify**: Bubble sort renders and animates correctly

- [ ] T-7: Prefix bst-style.css — all 5 classes
  - **Why**: Eliminate `.tree-*`, `.stats-*`, `.highlight` collisions
  - **Files**: `tools/algoviz/bst-style.css`
  - **Verify**: All `.algo-bst-*` classes present in file

- [ ] T-8: Update bst.js — className references
  - **Why**: Sync JS to new prefixed names
  - **Files**: `tools/algoviz/bst.js`
  - **Verify**: BST renders and interactions work correctly

## Phase 4: Verification

- [ ] T-9: Re-run multi-algo test (T-2) — verify no collision
  - **Why**: Confirm all three algos render without style interference
  - **Files**: `tools/algoviz/test-multi-sort-and-tree.html`
  - **Verify**: Screenshot showing clean separate renderings

- [ ] T-10: Individual smoke tests — each algo in isolation
  - **Why**: Ensure no regression in single-algo scenarios
  - **Verify**: Bubble, merge, BST all work standalone

