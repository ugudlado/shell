# Bubble Sort Visualization

## Motivation

AlgoViz currently covers Levenshtein Distance, Elevator/SCAN, BFS Pathfinding, and 0/1 Knapsack. Adding Bubble Sort provides a classic O(n^2) sorting algorithm visualization that is fundamental to CS education. Users can watch elements swap step-by-step with comparison highlighting and swap counting.

## Requirements

1. **Array Input**: Users can set array size (generates random values) OR input custom comma-separated values
2. **Step-by-Step Visualization**: Each comparison is a discrete step; compared elements are highlighted
3. **Swap Highlighting**: When a swap occurs, both elements are visually distinguished from non-swap comparisons
4. **Swap Counter**: Running count of total swaps performed, displayed prominently
5. **Comparison Counter**: Running count of total comparisons performed
6. **Playback Controls**: Play, Pause, Step Forward, Step Back, Reset, Speed slider (matching existing pages)
7. **Sorted Indicator**: Elements that have "bubbled" to their final position are marked as sorted
8. **Navigation**: Bubble Sort link added to nav bar on all existing pages

## Non-Goals

- Other sorting algorithms (future work)
- Sound effects
- Algorithm complexity analysis panel

## Architecture

Follows existing AlgoViz pattern:
- `bubble-sort-algorithm.js` -- pure algorithm, no DOM, exports `BubbleSortAlgorithm`
- `bubble-sort-algorithm.test.js` -- Node.js tests for algorithm correctness
- `bubble-sort.js` -- DOM logic, animation, playback controls
- `bubble-sort.html` -- page structure with nav
- `bubble-sort-style.css` -- algorithm-specific styles

## Schema

feature-rapid -- prototype/visualization tooling, no test coverage requirements.
