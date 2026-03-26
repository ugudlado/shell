# Bubble Sort Visualization -- Design

## Algorithm Module (`bubble-sort-algorithm.js`)

**Exports**: `BubbleSortAlgorithm.sort(arr)` returns:
- `steps[]` -- array of step objects: `{ arr: number[], comparing: [i, j], swapped: boolean, sortedBoundary: number, comparisons: number, swaps: number, explanation: string }`
- `sortedArray` -- final sorted array

Each step captures the full array state after a comparison (and possible swap), the indices being compared, whether a swap occurred, and the boundary of already-sorted elements.

The algorithm runs standard bubble sort with early termination (if a pass has zero swaps, stop). Steps are generated for every comparison.

## Visualization Module (`bubble-sort.js`)

- Bar chart representation: each array element is a vertical bar whose height is proportional to its value
- Color states:
  - Default: dark theme base color
  - Comparing: yellow/amber highlight on the two bars being compared
  - Swapped: green flash on the two bars that just swapped
  - Sorted: purple/blue for elements in final position (past sortedBoundary)
- Info panel shows current step explanation
- Stats panel shows comparisons and swaps count

## Controls

- Array size input (number, 5-50, default 20)
- Custom values textarea (comma-separated)
- Generate Random button
- Visualize button (starts from current input)
- Standard playback: Play, Pause, Step Forward, Step Back, Reset, Speed slider

## Page (`bubble-sort.html`)

Standard AlgoViz layout: nav bar, title, controls, info panel, legend, visualization area, stats.

## Styles (`bubble-sort-style.css`)

Bar chart styling, color states for comparing/swapped/sorted, stats panel, responsive layout.

## Nav Update

Add `<a href="bubble-sort.html">Bubble Sort</a>` to nav in all 4 existing HTML files.
