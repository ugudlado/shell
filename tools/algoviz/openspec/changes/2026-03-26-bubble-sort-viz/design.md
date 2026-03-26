# Bubble Sort Visualization — Design

## Component Breakdown

### bubble-sort.html
- Standard AlgoViz page structure
- Nav bar with Bubble Sort as active link
- Controls: array size input, custom values input, Generate Random button, Visualize button
- Playback bar: Reset, Step Back, Play, Pause, Step Forward, Speed slider
- Bar chart container for visualization
- Legend (comparing, swapping, sorted, unsorted)
- Stats panel (comparisons, swaps)
- Info/explanation text panel
- Result panel (shown on completion)

### bubble-sort.js
- IIFE matching elevator.js / bfs.js pattern
- Reads inputs, calls `BubbleSortAlgorithm.sort()`
- Renders bars as div elements with height proportional to value
- Steps through `steps[]` array from the algorithm
- Applies CSS classes for comparing/swapping/sorted states
- Playback controls: play/pause/step/reset with timer
- Updates stats and explanation text each step

### bubble-sort-style.css
- Bar chart layout (flexbox, bars bottom-aligned)
- Bar states: default (#8b949e), comparing (#388bfd), swapping (#d29922), sorted (#2ea043)
- Swap transition animation
- Stats panel (reuses pattern from elevator-style.css)
- Legend styling
- Responsive adjustments

## Data Flow

1. User enters values or generates random array
2. `BubbleSortAlgorithm.sort(arr)` returns `{ steps, sortedArray }`
3. Each step contains: `arr`, `comparing`, `swapped`, `sortedBoundary`, `comparisons`, `swaps`, `explanation`
4. Visualization iterates through steps, applying visual state per step
5. Bars at index >= sortedBoundary are marked sorted (done step marks all sorted)

## Dependencies

- `bubble-sort-algorithm.js` (already exists, tested)
- `style.css` (shared nav, controls, button styles)
