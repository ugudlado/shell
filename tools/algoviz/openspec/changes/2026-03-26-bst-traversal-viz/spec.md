# BST Traversal Visualization

## Motivation

AlgoViz currently covers Levenshtein, Elevator (SCAN), BFS, Knapsack, and Bubble Sort. Binary Search Trees are a fundamental data structure taught in every CS curriculum. Visualizing how inorder, preorder, and postorder traversals visit nodes in different orders helps students build intuition for recursive tree algorithms.

## Requirements

### Functional
1. **Insert values**: User enters a number and clicks "Insert" to add it to the BST following standard BST insertion rules (left < parent, right >= parent)
2. **Bulk insert**: User can enter comma-separated values to insert multiple nodes at once
3. **Random tree**: Button to generate a random BST with configurable size
4. **Clear tree**: Button to reset the tree to empty
5. **Traversal selection**: Dropdown or buttons to choose inorder, preorder, or postorder traversal
6. **Animate traversal**: Step-by-step animation highlighting each node as it is visited, with visit order numbers displayed
7. **Playback controls**: Play, Pause, Step forward, Step back, Reset, Speed slider (consistent with existing pages)
8. **Info panel**: Shows current traversal step explanation (e.g., "Visit node 5 (left subtree complete)")
9. **Result display**: Shows the traversal result array when complete

### Non-Functional
- Follows existing AlgoViz architecture: `bst-algorithm.js` (pure, testable), `bst-algorithm.test.js`, `bst.html`, `bst.js`, `bst-style.css`
- Dark theme consistent with existing pages
- Nav bar updated on ALL existing pages to include BST link
- Canvas/SVG-based tree rendering with edges between nodes

## Acceptance Criteria
1. Inserting values 5, 3, 7, 1, 4, 6, 8 produces a correct BST
2. Inorder traversal of above tree yields [1, 3, 4, 5, 6, 7, 8]
3. Preorder traversal yields [5, 3, 1, 4, 7, 6, 8]
4. Postorder traversal yields [1, 4, 3, 6, 8, 7, 5]
5. Animation highlights nodes one at a time in correct order
6. All playback controls work (play, pause, step, reset, speed)
7. Nav link appears on all 6 pages (5 existing + BST)
8. `npm run lint` and `npm test` pass
