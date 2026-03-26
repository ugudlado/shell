# Bubble Sort Visualization

## Motivation

AlgoViz currently covers Levenshtein Distance, Elevator/SCAN, BFS Pathfinding, and 0/1 Knapsack. Adding Bubble Sort extends the collection with a classic O(n^2) sorting algorithm that is ideal for teaching comparison-based sorting concepts: pairwise comparisons, adjacent swaps, early termination, and sorted-boundary shrinking.

## Requirements

1. **Array input**: Users can set array size (generates random values) or input custom comma-separated values.
2. **Step-by-step visualization**: Bar chart where each element is a bar, with height proportional to value.
3. **Comparison highlighting**: The two elements being compared are visually highlighted (distinct color).
4. **Swap animation**: When a swap occurs, bars animate to their new positions with a distinct swap color.
5. **Sorted boundary**: Elements that have "bubbled" to their final position are visually marked as sorted.
6. **Statistics**: Live counters for comparisons and swaps.
7. **Playback controls**: Play, Pause, Step Forward, Step Back, Reset, Speed slider — matching existing pages.
8. **Explanation text**: Each step shows a human-readable explanation of the comparison and outcome.

## Architecture

Follows the existing AlgoViz pattern:
- `bubble-sort-algorithm.js` — pure algorithm (already exists with tests)
- `bubble-sort.html` — page structure with nav
- `bubble-sort.js` — visualization and UI logic
- `bubble-sort-style.css` — algorithm-specific styles

## Acceptance Criteria

- [ ] Page loads with default array and auto-visualizes
- [ ] Users can enter custom values or generate random arrays of a chosen size
- [ ] Step/Play/Pause/Reset controls work correctly
- [ ] Bars highlight during comparison (blue) and swap (orange/amber)
- [ ] Sorted elements are visually distinct (green)
- [ ] Comparison and swap counters update in real time
- [ ] Nav links added to all existing pages
- [ ] `npm run lint` passes
