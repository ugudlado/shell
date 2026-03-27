# AlgoViz: 2 New Feature Proposals

**Current Algorithms (9):** Levenshtein, Elevator/SCAN, BFS, Knapsack, Bubble Sort, BST, Merge Sort, Binary Search, DFS

**Proposal Date:** 2026-03-26

---

## Feature 1: Longest Common Subsequence (LCS) — feature-rapid

**Category:** String/Dynamic Programming (visually lightweight prototype)

**Real-World Example:** Git diff algorithms, DNA sequence alignment, plagiarism detection
- Git uses LCS-like logic to show which lines changed between file versions
- Bioinformaticians use LCS to find similar DNA sequences across species
- Code similarity tools use LCS to highlight structural changes

**Why Different:**
- Current string algo: Levenshtein (edit distance) — measures cost of transformations
- LCS: finds longest matching subsequence without cost — complementary problem
- Same domain (strings) but opposite approach → reinforces string algorithm thinking

**Scope (Single Session):**
1. `lcs-algorithm.js` — pure DP function computing LCS with step-by-step traceback
2. `lcs-algorithm.test.js` — tests for empty/single/duplicates/max size (20 strings)
3. `lcs.html` / `lcs.js` / `lcs-style.css` — grid visualization showing DP table + final sequence
4. Update nav in all `.html` files

**UI Behavior:**
- Input: two strings (max 20 chars each)
- Visualization: DP table colored by match/skip decisions, highlighted final path
- Playback: step through DP computation (memoization), see traceback highlight
- Output: length of LCS + the actual subsequence

**Algorithm Complexity:**
- Time: O(m*n) where m, n = string lengths
- Space: O(m*n) for DP table
- Fast to visualize (grid is only 20×20 max)

---

## Feature 2: Dijkstra's Algorithm (Shortest Path) — feature-tdd

**Category:** Graph Traversal with Optimization (correctness critical)

**Real-World Example:** GPS navigation, network routing, game pathfinding with costs
- Google Maps: Dijkstra finds shortest distance considering traffic weights
- ISP routers: OSPF protocol uses Dijkstra to route packets with least latency
- Game engines: AI pathfinding on terrain with variable movement costs

**Why Different:**
- Current graph algos: BFS/DFS (unweighted), Elevator/SCAN (1D domain-specific)
- Dijkstra: weighted graph pathfinding with priority queue → new problem class
- Requires proving correctness across edge cases: disconnected nodes, negative weights (handled), large graphs

**Scope (Single Session):**
1. `dijkstra-algorithm.js` — Dijkstra with min-heap simulation + step recording
2. `dijkstra-algorithm.test.js` — 12+ tests covering:
   - Single node, two nodes, fully connected, linear chain, grid graph
   - Unreachable nodes (isolated islands)
   - Tie-breaking in heap (same distance candidates)
   - Max size: 15 nodes (matrix visualization limits)
3. `dijkstra.html` / `dijkstra.js` / `dijkstra-style.css` — interactive graph with node positions
4. Update nav + `package.json` globals

**UI Behavior:**
- Input: predefined graphs (4 examples: simple, grid, star, disconnected)
- Select start/end node via click
- Visualization: nodes with distance labels, explored/frontier/unvisited colors, edge weights shown
- Playback: step through queue operations, see distance updates in real-time
- Output: shortest path distance, full path sequence, number of nodes explored

**Algorithm Complexity:**
- Time: O((V + E) log V) with min-heap
- Space: O(V) for distances + visited
- Deterministic: must pass all edge cases to ship

**Test Suite Requirements (feature-tdd):**
- Empty graph (1 node)
- Simple path (2-3 nodes)
- Multiple routes (choose shortest)
- Tie-breaking (equal distances, must break consistently)
- Disconnected components (unreachable nodes marked as ∞)
- Larger graph (15 nodes, random layout)
- All duplicates weights (all edges cost 1 — reduce to BFS)
- Source = destination (distance 0)

---

## Summary

| Feature | Type | Algorithm Class | Difficulty | Session Time |
|---------|------|-----------------|-----------|--------------|
| **LCS** | feature-rapid | String DP | Low-Medium | 45-60 min |
| **Dijkstra** | feature-tdd | Graph + Heap | Medium-High | 60-90 min |

**Together:** Cover complementary domains (string processing → graph pathfinding), introduce new data structure (priority queue), and reinforce TDD discipline on a non-trivial algorithm. Both are iconic CS algorithms with clear real-world applications.

---

## Development Priority

**Recommended Order:**
1. **LCS first** (feature-rapid) — quick visual win, gets you familiar with new grid visualization pattern
2. **Dijkstra second** (feature-tdd) — more complex, benefits from having confidence in codebase from LCS

Both can be built independently in parallel if you're pairing.
