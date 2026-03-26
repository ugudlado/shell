# Binary Search Step-by-Step Visualizer

## Motivation

Binary search is a fundamental algorithm that finds a target value in a sorted array by repeatedly halving the search space. This visualization teaches the algorithm by showing low/mid/high pointers and shrinking the search space at each comparison. Real-world analogy: finding a word in a dictionary by checking the middle page and eliminating half with each comparison.

## Requirements

### Functional
1. Accept a sorted array of numbers and a target value from the user
2. Perform binary search step-by-step, recording each midpoint comparison
3. Show low, mid, and high pointers at each step
4. Highlight the current search space (elements between low and high)
5. Highlight eliminated portions of the array (dimmed/greyed out)
6. Highlight the target value when found
7. Show a "not found" state when target is absent
8. Display step count and current comparison explanation
9. Support playback controls: step forward, step back, play, pause, reset
10. Display a real-world analogy panel ("Like finding a word in a dictionary...")

### Input Validation
1. Array size: minimum 1, maximum 30 elements
2. Array values: must be valid numbers
3. Target value: must be a valid number
4. Auto-sort array if user provides unsorted input (with notification)
5. Clear error messages for invalid inputs

### Acceptance Criteria
- [AC1] Sorted array rendered as horizontal bars/blocks with values displayed
- [AC2] Low/mid/high pointers visually labeled below/above the array
- [AC3] Search space visually shrinks at each step (eliminated elements dimmed)
- [AC4] Target found: target element highlighted in success color
- [AC5] Target not found: final state shows exhausted search space with "not found" message
- [AC6] Step counter and explanation text update at each step
- [AC7] Playback controls (step forward/back, play/pause, reset, speed) work correctly
- [AC8] Edge cases handled: empty array, single element, target at boundaries
- [AC9] Algorithm logic in binary-search-algorithm.js, UI calls it (no duplicated logic)
- [AC10] Nav link added to ALL existing pages, all nav links updated

## Test Strategy

- **Test file**: `binary-search-algorithm.test.js`
- **Coverage tool**: Node.js test runner via `run-tests.js` harness
- **Key test scenarios**:
  - Target found at middle
  - Target found at start (index 0)
  - Target found at end (last index)
  - Target not found (value between existing elements)
  - Target not found (smaller than all elements)
  - Target not found (larger than all elements)
  - Empty array
  - Single element array (found and not found)
  - All duplicates (target present)
  - All duplicates (target absent)
  - Large array (20+ elements)
  - Two element array
  - Step structure validation (low, mid, high, comparison, explanation)
  - Input not mutated
  - Steps count is O(log n)
- **Coverage target**: >= 90% of algorithm functions
