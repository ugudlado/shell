# AlgoViz — Feature Backlog

Interactive algorithm visualizations for CS education.

## Built (17 algorithms)

| # | Algorithm | Schema | Tests | Status |
|---|-----------|--------|-------|--------|
| 1 | Levenshtein Distance | feature-rapid | ✓ | Shipped |
| 2 | Elevator / SCAN | feature-tdd | 35 | Shipped |
| 3 | BFS Grid Pathfinding | feature-rapid | 17 | Shipped |
| 4 | DFS Grid Pathfinding | feature-rapid | 16 | Shipped |
| 5 | 0/1 Knapsack DP | feature-tdd | 15 | Shipped |
| 6 | Bubble Sort | feature-rapid | 13 | Shipped |
| 7 | BST Traversal | feature-rapid | 24 | Shipped |
| 8 | Merge Sort | feature-tdd | 22 | Shipped |
| 9 | Binary Search | feature-tdd | 23 | Shipped |
| 10 | LCS (Longest Common Subsequence) | feature-rapid | 20 | Shipped |
| 11 | Dijkstra's Shortest Path | feature-tdd | 17 | Shipped |
| 12 | Huffman Coding | feature-rapid | 26 | Shipped |
| 13 | A* Pathfinding | feature-tdd | 22 | Shipped |
| 14 | Topological Sort (Kahn's) | feature-tdd | 20 | Shipped |
| 15 | LRU Cache Eviction | feature-tdd | 27 | Shipped |
| 16 | Convex Hull (Graham Scan) | feature-rapid | 17 | Shipped |
| 17 | Bloom Filter | feature-rapid | 24 | Shipped |

**Total: 319 passing tests, 0 lint errors**

## Known Issues

| # | Issue | Severity | File(s) |
|---|-------|----------|---------|
| 1 | CSS prefix incomplete: remaining unprefixed classes in binary-search-style.css | Low | binary-search-style.css |
| 2 | knapsack-style.css has dead `td.traceback.take`/`td.traceback.skip` selectors | Low | knapsack-style.css |
| 3 | knapsack.js beforeunload uses clearTimeout for setInterval timer | Low | knapsack.js |
| 4 | A* BFS comparison animation caps at A*'s step count (BFS freezes mid-exploration) | Medium | astar.js |
| 5 | A* showCostDetail has dead else-branch (both ternary arms return same value) | Low | astar.js |
| 6 | Merge Sort doesn't show persistent recursion tree (spec promised it) | Medium | merge-sort.js |

## Future Ideas (5)

### 1. Quick Sort with Pivot Selection Strategies
- **Algorithm**: Quick Sort (Lomuto/Hoare partition, random/median-of-3 pivot)
- **Schema**: feature-tdd
- **Description**: Side-by-side comparison of pivot strategies on the same array. Show how bad pivots create O(n²) behavior while good pivots achieve O(n log n). Animate partition boundaries, pivot selection, and element swaps. Real-world: why most standard library sort implementations use introsort (quicksort + heapsort fallback).
- **Why interesting**: The MOST asked sorting algorithm in interviews. Pivot visualization makes the O(n²) worst case viscerally obvious.

### 2. Floyd-Warshall All-Pairs Shortest Paths
- **Algorithm**: Floyd-Warshall with intermediate vertex animation
- **Schema**: feature-tdd
- **Description**: Visualize the 3D DP concept — for each intermediate vertex k, update the entire distance matrix. Show the matrix evolving as k increases, highlight which pairs get shorter paths, and animate the "going through k" concept. Real-world: network routing tables, finding shortest paths between all cities.
- **Why interesting**: Makes the abstract "for each k" concept concrete — students can SEE the matrix change and understand why O(V³) is necessary.

### 3. Red-Black Tree Insertion & Balancing
- **Algorithm**: Red-Black Tree insert with rotations and recoloring
- **Schema**: feature-tdd
- **Description**: Step through RB-tree insertion showing each rotation (left/right) and recoloring operation. Side panel shows which RB property was violated and how the fix restores it. Compare tree height before/after each insertion. Real-world: Java TreeMap, Linux kernel CFS scheduler.
- **Why interesting**: Self-balancing trees are notoriously hard to understand from text — seeing the rotations animate makes it click instantly.

### 4. Minimax with Alpha-Beta Pruning (Tic-Tac-Toe)
- **Algorithm**: Minimax game tree search with alpha-beta cutoffs
- **Schema**: feature-rapid
- **Description**: Play tic-tac-toe against the AI while watching the game tree expand. Show minimax scores propagating up from leaves, then highlight the branches alpha-beta prunes (grayed out). Toggle pruning on/off to see the performance difference. Real-world: chess engines, Go AI (simplified).
- **Why interesting**: Combines game playing (fun!) with algorithm visualization. Students can play and see WHY the AI makes each move.

### 5. KMP String Matching with Failure Function
- **Algorithm**: Knuth-Morris-Pratt string search with prefix table
- **Schema**: feature-tdd
- **Description**: Visualize the failure function table construction, then animate the matching process showing how KMP skips ahead instead of backtracking. Highlight the current comparison position, the pattern shift, and which failure function entry triggers the skip. Real-world: grep, text editors' find function, DNA sequence matching.
- **Why interesting**: The failure function is the hardest part of KMP to understand — visualizing it being built character-by-character demystifies the preprocessing step.
