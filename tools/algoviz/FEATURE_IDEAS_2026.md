# AlgoViz: 2 New Feature Proposals

**Current Algorithms (11):** Levenshtein, Elevator/SCAN, BFS, Knapsack, Bubble Sort, BST, Merge Sort, Binary Search, DFS, LCS, Dijkstra

**Analysis Date:** 2026-03-26

---

## Feature 1: Huffman Coding (Compression) — feature-rapid

**Category:** Greedy Algorithm + Tree Building + Compression

**Real-World Example:** Compression in ZIP, JPEG, PNG, and text files
- **ZIP files (DEFLATE)**: PKware's DEFLATE uses Huffman coding as the final compression layer to achieve 20-50% compression on text
- **JPEG images**: Quantized pixel data is encoded using Huffman coding before being stored in image files
- **PNG lossless compression**: Uses Huffman as part of DEFLATE compression stage
- **Text compression**: Simple texts compress 20-30% with Huffman alone

**Why Different from Existing Algorithms:**
- Current algorithms: Path finding (BFS/DFS/Dijkstra), Sorting (Bubble/Merge), String matching (Levenshtein/LCS), Tree traversal (BST)
- **Huffman: Greedy algorithm + tree building + compression** — first compression algorithm in AlgoViz
- Introduces unique visualization concepts:
  - Binary tree construction step-by-step
  - Frequency-based greedy selection
  - Encoding tables (character → bit sequences)
  - Compression ratio calculation
  - Bit-level representation

**Scope (Single Session, feature-rapid):**
1. `huffman-algorithm.js` — pure algorithm building Huffman tree with step recording
2. `huffman.html` — page structure
3. `huffman.js` — UI visualization + controls
4. `huffman-style.css` — tree layout, frequency table, compression display
5. Update nav in all existing `.html` files

**UI Behavior:**
- **Input**: Text (max 200 chars)
- **Visualization**:
  - Frequency table (characters sorted by count)
  - Huffman tree building animation (step-by-step merges)
  - Final tree with 0/1 bit labels on edges
  - Encoding table (char → bit sequence)
  - Compression ratio: `(bits_used / (original_chars * 8)) * 100%`
- **Playback**: Play, Pause, Step, Reset, Speed slider
- **Output**: Original text, Encoded bits, Decoded output (verify correctness)

**Algorithm Complexity:**
- Time: O(n log n) where n = unique characters (heap operations)
- Space: O(n) for frequency table + tree
- Fast to visualize (typically 10-30 unique chars max)

**Real-World Analogy:**
Think of Huffman coding like postal sorting:
- Frequently addressed cities get shorter zip codes
- Rarely addressed towns get longer zip codes
- Overall efficiency improves when sorted by frequency

**Test Coverage (feature-rapid):**
- Empty input / single character
- All same characters (no compression possible)
- Normal text with varied frequencies
- Max length (200 chars)
- Verify encoding/decoding roundtrip correctness

---

## Feature 2: Dijkstra's Algorithm — Zero-Weight Edge Input Bug (bugfix)

**Category:** Input Validation Bug in Existing Algorithm

**Bug Description:**
The Dijkstra edge weight input dialog blocks zero-weight edges via HTML constraint, contradicting the algorithm's own validation logic.

**Location:** `/home/user/shell/tools/algoviz/dijkstra.js` line 278

**Root Cause:**
```javascript
// Current (WRONG):
input.min = "1";  // Blocks users from entering 0

// But algorithm allows (dijkstra-algorithm.js line 318):
if (isNaN(w) || w < 0 || w > MAX_WEIGHT)  // Accepts 0-999
```

**Why This Is a Real Issue:**
1. **Spec Violation**: Specification explicitly allows weights 0-999
2. **Algorithm Mismatch**: Algorithm validation accepts 0, but UI rejects it
3. **Use Case Blocking**: Cannot create graphs with zero-cost edges (instantaneous transitions, no-cost actions in games)
4. **Prevents Edge Cases**: Cannot test important pathfinding scenarios where zero-weight shortcuts exist

**Reproduction:**
1. Load `dijkstra.html`
2. Create two nodes
3. Try to add edge with weight 0
4. Browser HTML5 validation rejects input (field shows invalid state)
5. Edge cannot be created

**Fix Strategy:**
Single line change at line 278:
```javascript
// Before:
input.min = "1";

// After:
input.min = "0";
```

**Why This Fix Is Correct:**
- Aligns HTML validation with algorithm validation
- Matches specification requirement (0-999 valid range)
- No code logic changes required
- Backward compatible (existing positive-weight graphs unaffected)
- Allows testing of zero-weight edge cases

**Testing Strategy:**
1. **Unit Test** (regression):
   - Verify algorithm handles zero-weight edges correctly in pathfinding
   - Test graph: A →(0)→ B, A →(1)→ C, C →(1)→ B
   - Expected shortest path: A → B (distance 0)

2. **Integration Test** (UI):
   - Create edge with weight 0
   - Verify edge displays "0" on canvas
   - Run Dijkstra
   - Verify zero-weight edges are selected in shortest path

3. **Boundary Tests**:
   - Weight -1: rejected (algorithm validation)
   - Weight 0: accepted (fix)
   - Weight 999: accepted (MAX_WEIGHT)
   - Weight 1000: rejected

**Impact Assessment:**
- **Breaking change?** No — relaxes an artificial restriction
- **Backward compatible?** Yes — existing graphs remain valid
- **Side effects?** None — isolated to input constraint
- **Call sites?** 1 (verified via grep)

---

## Summary

| Feature | Type | Algorithm Class | Difficulty | Estimated Time |
|---------|------|-----------------|-----------|----------------|
| **Huffman Coding** | feature-rapid | Greedy + Tree + Compression | Low-Medium | 60-90 min |
| **Dijkstra Zero-Weight Bug** | bugfix | Input Validation | Low | 10-15 min |

**Strategic Value:**
- **Huffman**: Introduces compression algorithms and greedy algorithm class — expands AlgoViz scope
- **Bugfix**: Corrects input validation contradiction — prevents user frustration and enables edge case testing

**Recommended Order:**
1. **Bugfix first** (10 min) — quick win, low risk
2. **Huffman second** (60-90 min) — new algorithm, more substantial

Both are high-quality additions that expand AlgoViz's educational scope and fix real issues in existing code.

---

## Existing Algorithms Verified

**11 Total Algorithms:**
1. Levenshtein Distance (string edit distance)
2. Elevator/SCAN (disk scheduling)
3. BFS (breadth-first search, unweighted pathfinding)
4. Knapsack (dynamic programming, 0/1 variant)
5. Bubble Sort (basic sorting)
6. BST Traversal (tree traversal)
7. Merge Sort (divide-and-conquer sorting)
8. Binary Search (searching)
9. DFS (depth-first search)
10. LCS (longest common subsequence, string DP)
11. Dijkstra's Shortest Path (weighted graph pathfinding)

**Additional Hash Table:** Hash-table-algorithm.js exists but spec/features incomplete

**Not Yet Implemented:**
- Huffman Coding (proposed here as feature-rapid)
