# BST Traversal Visualization — Design

## Component Breakdown

### 1. `bst-algorithm.js` — Pure BST Algorithm (no DOM)

Exposes `BSTAlgorithm` as an IIFE (same pattern as `BubbleSortAlgorithm`, `KnapsackAlgorithm`).

**Data structures:**
```
Node: { value: number, left: Node|null, right: Node|null }
Tree: { root: Node|null }
```

**Public API:**
- `createTree()` — returns empty tree `{ root: null }`
- `insert(tree, value)` — inserts value, returns updated tree (mutates in place for simplicity, returns same ref)
- `bulkInsert(tree, values)` — inserts array of values sequentially
- `inorder(tree)` — returns `{ steps: Step[], result: number[] }`
- `preorder(tree)` — returns `{ steps: Step[], result: number[] }`
- `postorder(tree)` — returns `{ steps: Step[], result: number[] }`
- `getLayout(tree)` — returns positioned nodes for rendering: `{ nodes: [{value, x, y, left, right}], edges: [{fromX, fromY, toX, toY}] }`

**Step structure:**
```
Step: {
  visitedNode: number|null,    // value of node being visited (null for "done" step)
  visitedValues: number[],     // cumulative list of visited values so far
  currentNode: number|null,    // node currently being examined
  explanation: string          // human-readable description
}
```

### 2. `bst-algorithm.test.js` — Node.js Tests

Tests for: insert correctness, all three traversal orderings, edge cases (empty tree, single node, duplicates, unbalanced), step structure validation, layout positioning.

### 3. `bst.html` — Page Structure

Standard AlgoViz page with nav bar (6 entries including BST as active), controls section (value input, insert/bulk/random/clear buttons, traversal type selector), playback controls, SVG container for tree visualization, info panel, result display.

### 4. `bst.js` — Visualization + UI Logic

IIFE following bubble-sort.js pattern. Manages:
- DOM refs for all controls
- State: current tree, traversal steps, step index, playback timer
- SVG rendering: nodes as circles with value labels, edges as lines, highlighting via CSS classes
- Playback: same play/pause/step/reset pattern as other pages

### 5. `bst-style.css` — BST-Specific Styles

Tree visualization styles: node circles, edges, highlighting states (unvisited, current, visited), legend, responsive layout.

## Tree Layout Algorithm

Simple level-based layout:
- Root at top center
- Each level doubles the horizontal spread
- Y position = level * verticalSpacing
- X position calculated by binary subdivision of available width

This is computed in `getLayout()` in the algorithm module so the visualization just plots coordinates.

## Color Scheme (consistent with dark theme)

| State | Color | Hex |
|-------|-------|-----|
| Unvisited | Gray | #8b949e |
| Current (being visited) | Blue | #388bfd |
| Visited | Green | #2ea043 |
| Edge | Dark gray | #30363d |

## Nav Update

Add `<a href="bst.html">BST Traversal</a>` to the nav bar in all 6 HTML files (index.html, elevator.html, bfs.html, knapsack.html, bubble-sort.html, bst.html).
