# Merge Sort Visualization

## Motivation

AlgoViz currently has 6 algorithm pages but lacks a divide-and-conquer algorithm. Merge sort is the canonical example of divide-and-conquer and is essential for CS education. Unlike the existing bubble sort (which operates in-place with simple swaps), merge sort requires visualizing recursive splitting and merging — a fundamentally different visual paradigm.

## Requirements

### Functional

1. **Pure algorithm module** (`merge-sort-algorithm.js`): Implements merge sort recording every step of the divide and merge process. No DOM dependencies. Exports step-by-step trace including:
   - Recursive splits (which subarray is being divided, at what depth)
   - Merge operations (which two subarrays are being merged, element comparisons, result)
   - Recursion depth tracking
   - Subarray boundaries at each step

2. **Visualization page** (`merge-sort.html`, `merge-sort.js`, `merge-sort-style.css`):
   - Tree-like layout showing the divide phase (array splitting into subarrays at increasing depth)
   - Merge phase showing subarrays combining back together with comparison highlighting
   - Color-coded states: unsorted, active-split, comparing, merged/sorted
   - Recursion depth indicator
   - Stats: comparisons, merge operations, current depth, step count

3. **Controls**: Same pattern as existing pages — input values, random generation, play/pause/step/reset, speed slider

4. **Navigation**: Add "Merge Sort" link to all existing HTML pages' nav bars

### Non-Functional

- Pure algorithm module testable in Node.js (no DOM)
- Follow existing project conventions (IIFE pattern, `var` for algorithm module, dark theme)
- Responsive design matching existing pages

## Architecture

Follows the established AlgoViz pattern:
- `merge-sort-algorithm.js` — pure algorithm, step recording
- `merge-sort-algorithm.test.js` — Node.js tests
- `merge-sort.html` — page structure
- `merge-sort.js` — visualization and UI logic
- `merge-sort-style.css` — algorithm-specific styles

## Test Strategy

### Test Files
- `merge-sort-algorithm.test.js` — Node.js tests for algorithm correctness

### Key Test Scenarios
1. **Basic sorting**: `[3,1,2]` produces `[1,2,3]`
2. **Empty array**: `[]` produces `[]` with minimal steps
3. **Single element**: `[42]` produces `[42]` with no merge steps
4. **Already sorted**: `[1,2,3,4,5]` produces correct result
5. **Reverse sorted**: `[5,4,3,2,1]` produces correct result
6. **All duplicates**: `[3,3,3,3]` produces `[3,3,3,3]`
7. **Two elements**: `[2,1]` produces `[1,2]` with one merge
8. **Large array (20+)**: correctness with many elements
9. **Negative numbers**: `[-3, 5, -1, 0]` sorts correctly
10. **Step structure**: each step has required fields (type, depth, subarrays, etc.)
11. **Divide steps**: correct number of splits for known input
12. **Merge steps**: comparisons recorded correctly during merge
13. **Input not mutated**: original array unchanged after sort
14. **Stability**: equal elements maintain relative order

### Coverage Tool
- Node.js test runner via `run-tests.js` (existing harness)
- Target: all algorithm paths covered (>= 90%)

## Review Summary

Self-reviewed spec. Merge sort is well-understood; the main design challenge is the visualization layout for recursive tree structure vs. the flat bar chart used by bubble sort.
