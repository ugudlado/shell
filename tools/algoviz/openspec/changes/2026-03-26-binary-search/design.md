# Binary Search — Technical Design

## Architecture

Follows the standard AlgoViz pattern: 5-file structure with separation of pure algorithm from DOM visualization.

### Files

| File | Purpose |
|------|---------|
| `binary-search-algorithm.js` | Pure binary search — IIFE, `var`, exports `BinarySearchAlgorithm` global. No DOM. |
| `binary-search-algorithm.test.js` | Node.js tests via `run-tests.js` harness |
| `binary-search.html` | Page structure, nav, inputs, visualization container |
| `binary-search.js` | UI/visualization logic — IIFE, `const`/`let`, calls algorithm functions |
| `binary-search-style.css` | Algorithm-specific styles, `bsearch-` prefixed classes |

### Algorithm Module API

```js
BinarySearchAlgorithm.search(sortedArray, target)
// Returns: { steps: Step[], found: boolean, foundIndex: number }

// Step shape:
{
  arr: number[],          // full array (unchanged)
  low: number,            // current low pointer
  mid: number,            // current mid pointer
  high: number,           // current high pointer
  target: number,         // search target
  comparison: string,     // "equal" | "less" | "greater"
  found: boolean,         // true if target found at this step
  eliminated: string,     // "left" | "right" | "none"
  step: number,           // 1-based step counter
  explanation: string     // human-readable explanation
}
```

### Visualization Layout

- Array rendered as horizontal blocks in a flex row
- Each block shows its numeric value
- Pointer labels (L, M, H) shown below blocks
- Active search space: full color
- Eliminated elements: dimmed opacity
- Found element: green highlight
- Mid element being compared: blue highlight
- "Not found" final state: all elements dimmed, red message

### Input Controls

- Values input: text field for comma-separated numbers (maxlength capped)
- Target input: number field
- Size input: number field (min=1, max=30)
- Random button: generates sorted random array
- Visualize button: runs algorithm and sets up playback
- Auto-sort: if user input is unsorted, sort it and show notification

### Playback

Standard AlgoViz playback pattern: step forward, step back, play (auto-advance), pause, reset, speed slider.
