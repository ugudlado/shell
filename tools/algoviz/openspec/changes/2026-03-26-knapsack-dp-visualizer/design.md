# Design: 0/1 Knapsack DP Visualizer

## Component Breakdown

### 1. KnapsackAlgorithm (knapsack-algorithm.js)

Pure-function module exposed as `KnapsackAlgorithm` global (IIFE pattern matching `ScanAlgorithm`).

**`solve(items, capacity)`**:
- Build DP table: `dp[i][w]` = max value using items 0..i-1 with capacity w
- For each cell, record a Step: `{ row, col, value, take, explanation, prevRow, prevCol }`
  - `take`: whether item i was included (dp[i-1][w-items[i-1].weight] + items[i-1].value > dp[i-1][w])
  - `explanation`: human-readable string for the info panel
- Row 0 and column 0 are base cases (all zeros), included as steps for completeness
- Returns `{ dp, steps, traceback }`

**`traceback(dp, items, capacity)`**:
- Walk from dp[n][capacity] back to dp[0][0]
- At each cell, determine if item was taken (dp[i][w] !== dp[i-1][w])
- Return `{ selectedItems: number[], totalValue, totalWeight, path: {row,col}[] }`

### 2. Visualization (knapsack.js)

**State machine**: IDLE -> READY -> PLAYING/PAUSED/STEPPING -> TRACEBACK -> DONE

**Rendering**:
- Build HTML table: rows = items (0..n), cols = capacities (0..W)
- Row headers: item name/weight/value. Column headers: capacity 0..W
- On each animation step, fill one cell with its value, apply CSS class for take/skip
- Current cell gets `.current` class; cells referenced for the decision get `.compare` class
- On traceback, path cells get `.traceback` class, selected items listed below table

**Controls**: Reuse the same Play/Pause/Step/Reset/Speed pattern from index.html.

### 3. Styling (knapsack-style.css)

Extends the base style.css patterns:
- `.take` cell: green tint (item included) — reuses `.match` color scheme
- `.skip` cell: neutral (item not included)
- `.current` cell: white outline (same as Levenshtein)
- `.traceback` cell: purple outline (same as Levenshtein)
- `.compare` cell: subtle highlight for the two cells being compared
- Item config panel: flex layout with add/remove buttons

## Data Flow

1. User configures items + capacity, clicks Visualize
2. `knapsack.js` reads inputs, calls `KnapsackAlgorithm.solve(items, capacity)`
3. Result stored; table rendered with all cells empty/hidden
4. Playback iterates through `steps[]`, revealing one cell per tick
5. At each step, info panel updates with `step.explanation`
6. After last step, automatically enter traceback mode
7. Traceback highlights path cells and lists selected items

## Integration

- `knapsack.html` includes `<link rel="stylesheet" href="style.css">` (shared base) + `<link rel="stylesheet" href="knapsack-style.css">` (page-specific)
- `knapsack.html` includes `<script src="knapsack-algorithm.js">` then `<script src="knapsack.js">`
- Nav bar updated on all 4 pages to include Knapsack link
