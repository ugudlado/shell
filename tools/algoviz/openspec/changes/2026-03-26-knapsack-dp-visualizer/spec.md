# Spec: 0/1 Knapsack DP Visualizer

## Motivation

The 0/1 Knapsack problem is a classic dynamic programming problem frequently encountered in CS education and technical interviews. Learners struggle to understand how the DP table is filled and how traceback identifies the optimal item selection. A step-by-step visual walkthrough of the DP table construction and traceback makes the algorithm intuitive.

## Requirements

### Functional

1. **Item Configuration**: Users can add/remove items with custom weights and values. Minimum 1 item, maximum 10 items. Default preset of 4 items provided.
2. **Capacity Setting**: Users set knapsack capacity (1-50). Default: 7.
3. **DP Table Visualization**: Display the full (items+1) x (capacity+1) DP table. Cells fill one-by-one during animation showing the value computed at each step.
4. **Step-by-Step Playback**: Play/Pause/Step Forward/Step Back/Reset controls (matching existing AlgoViz pattern). Speed slider controls animation rate.
5. **Cell Highlight**: Current cell under computation is highlighted. Cells that contributed to the current cell's value are indicated (the "take" vs "skip" decision).
6. **Traceback**: After table is fully filled, traceback highlights the optimal path and shows which items were selected, their total weight, and total value.
7. **Info Panel**: Displays contextual explanation for each step (e.g., "Considering item 2 (w=3, v=4) at capacity 5: max(skip=5, take=4+dp[1][2]=7) = 7, TAKE").
8. **Navigation**: Add "Knapsack (0/1)" link to nav bar on all existing pages.

### Non-Functional

- Pure vanilla JS/HTML/CSS (no frameworks), consistent with existing AlgoViz pages
- Algorithm logic in a separate pure-function module (no DOM) for testability
- Responsive layout matching existing pages

## Architecture

### Files

| File | Purpose |
|------|---------|
| `knapsack-algorithm.js` | Pure algorithm: solveKnapsack(), traceback, step generation |
| `knapsack-algorithm.test.html` | Browser-based test suite for the algorithm module |
| `knapsack.html` | Page markup with nav, controls, DP table container |
| `knapsack.js` | DOM logic: renders table, drives animation, handles user input |
| `knapsack-style.css` | Page-specific styles (color scheme matches existing) |

### Algorithm Module API

```js
KnapsackAlgorithm.solve(items, capacity)
// items: Array<{weight: number, value: number, name?: string}>
// capacity: number
// Returns: { dp: number[][], steps: Step[], traceback: TracebackResult }

// Step: { row: number, col: number, value: number, take: boolean, explanation: string }
// TracebackResult: { selectedItems: number[], totalValue: number, totalWeight: number, path: {row,col}[] }
```

## Test Strategy

### Test File
- `tools/algoviz/knapsack-algorithm.test.html` — browser-based test suite (same pattern as `scan-algorithm.test.html`)

### Key Test Scenarios

1. **Basic correctness**: 4 items, known optimal solution, verify dp table values and selected items
2. **Single item fits**: One item that fits => selected
3. **Single item does not fit**: One item too heavy => not selected, value = 0
4. **All items fit**: Total weight <= capacity => all selected
5. **No items fit**: All items exceed capacity => value = 0
6. **Zero capacity**: Capacity 0 => no items selected
7. **Exact capacity match**: Items whose weights sum exactly to capacity
8. **Greedy trap**: Items where greedy (highest value/weight ratio) gives wrong answer but DP gives correct answer
9. **Steps array**: Correct number of steps (items * (capacity+1)), each step has row/col/value/take/explanation
10. **Traceback path**: Path traces correctly through DP table, selected items match expected
11. **Edge case: duplicate weights/values**: Multiple identical items handled correctly

### Coverage Target
- 100% of `knapsack-algorithm.js` functions exercised
- All branches in solve() and traceback() covered

## Acceptance Criteria

1. Opening `knapsack.html` shows the nav bar, item inputs, capacity input, and Visualize button
2. Clicking Visualize builds and displays the DP table
3. Play animates cell-by-cell filling with correct values
4. Step forward/back navigates one cell at a time
5. After completion, traceback highlights selected items in the table
6. Info panel shows correct explanation at each step
7. All tests in `knapsack-algorithm.test.html` pass
8. Nav bar on all pages includes Knapsack link
