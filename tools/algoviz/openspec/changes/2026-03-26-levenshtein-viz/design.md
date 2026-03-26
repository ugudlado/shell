# Design: Interactive Levenshtein Distance Visualization

## Architecture

Single-page application with three files:

```
tools/algoviz/
├── index.html    # Structure, input form, matrix container, controls
├── style.css     # Matrix styling, operation colors, animations, layout
└── script.js     # Levenshtein algorithm, step engine, playback controller
```

## Component Breakdown

### HTML Structure (index.html)

```
<header>          AlgoViz title + feature subtitle
<section#input>   Two text inputs + "Visualize" button
<section#info>    Current step description + edit distance result
<section#matrix>  Dynamically generated table
<section#controls> Play/Pause/Step/Reset buttons + speed slider
<footer>          Legend showing color-operation mapping
```

### CSS Design (style.css)

**Color scheme** (accessible with text labels):
| Operation  | Background | Border   | Text Label |
|-----------|-----------|----------|------------|
| Match     | #4CAF50 (green) | #388E3C | "M" |
| Substitute| #FFC107 (yellow)| #FFA000 | "S" |
| Insert    | #2196F3 (blue)  | #1976D2 | "I" |
| Delete    | #F44336 (red)   | #D32F2F | "D" |
| Current   | pulsing border animation | | |
| Traceback | highlighted with thicker border | | |
| Unfilled  | #f5f5f5 (light gray) | #ddd | |

**Layout**: CSS Grid for controls, table for matrix. Media queries for responsive behavior.

**Animations**: CSS keyframe for current-cell pulse. Transition on background-color for smooth fill.

### JavaScript Architecture (script.js)

**Data Model**:
```js
state = {
  source: string,
  target: string,
  matrix: number[][],        // DP values
  operations: string[][],    // "match"|"substitute"|"insert"|"delete"
  steps: Step[],             // ordered list of {row, col, value, operation}
  currentStep: number,       // -1 = not started, 0..N = step index
  isPlaying: boolean,
  speed: number,             // ms per step
  traceback: {row, col}[],   // optimal path cells
}
```

**Core Functions**:
1. `computeLevenshtein(source, target)` -- fills matrix and operations arrays, records steps in order, computes traceback path
2. `renderMatrix()` -- creates/updates the HTML table from state
3. `stepForward()` -- advances currentStep, colors the cell, updates info
4. `stepBackward()` -- decrements currentStep, uncolors the cell
5. `play()` / `pause()` -- setInterval/clearInterval with speed
6. `reset()` -- returns to step -1, clears all cell colors
7. `highlightTraceback()` -- after last step, highlights the optimal path

**Step Recording**: During `computeLevenshtein`, for each cell (i,j) processed in row-major order (i=0..m, j=0..n):
- Row 0: all "delete" (base case: delete j characters)
- Column 0: all "insert" (base case: insert i characters)
- Interior: compare diagonal/up/left costs, pick minimum, record operation

Wait -- convention note: The standard formulation uses:
- Row headers = source characters (going down)
- Column headers = target characters (going right)
- Cell (i,j) = edit distance between source[0..i-1] and target[0..j-1]
- Operations: insert (from cell above, i-1,j), delete (from cell left, i,j-1), substitute/match (diagonal, i-1,j-1)

**Traceback**: After matrix is complete, trace from (m,n) to (0,0) following the minimum-cost path, recording the cells for highlighting.

## Interaction Flow

1. User enters source and target strings
2. Clicks "Visualize" -- matrix is rendered with headers and empty cells
3. User clicks "Play" or "Step" -- cells fill one by one
4. Info panel updates with each step's operation description
5. When all cells filled, traceback path highlights automatically
6. Edit distance displayed prominently
7. User can step backward to review, or reset to start over
