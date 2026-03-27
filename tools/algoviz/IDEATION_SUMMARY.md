# AlgoViz Ideation Summary — Two New Features

**Role:** Ideator Agent
**Date:** 2026-03-26
**Task:** Generate 2 new algorithm features for AlgoViz

---

## Executive Summary

Generated two high-quality feature proposals:

1. **Huffman Coding** — feature-rapid (60-90 min)
   - NEW algorithm class: Compression + Greedy + Tree Building
   - Real-world: ZIP, JPEG, PNG file compression
   - Visually compelling: Frequency table → Tree building → Encoding table

2. **Dijkstra Zero-Weight Bug** — bugfix (10-15 min)
   - REAL issue: Input validation blocks zero-weight edges
   - Spec says 0-999 valid, but UI enforces min="1"
   - Simple 1-line fix with high impact (enables edge case testing)

---

## Feature 1: Huffman Coding (feature-rapid)

### What
Interactive visualization of Huffman compression algorithm — how frequent characters get shorter bit sequences to optimize file size.

### Why Different
- **New algorithm class**: First compression algorithm in AlgoViz
- **New data structure**: Priority queue (min-heap) for greedy selection
- **New concepts**: Frequency analysis, binary tree construction, bit encoding, compression ratio
- **Complements existing**: Dijkstra finds single best path; Huffman builds optimal tree structure

### Real-World Context
- **ZIP compression**: DEFLATE uses Huffman as final stage (20-50% size reduction)
- **Image formats**: JPEG and PNG use Huffman in their compression pipelines
- **Text compression**: Simple texts compress 20-30% with Huffman alone

### Visual Learning Value
- Frequency table (sorted by popularity)
- Step-by-step tree building (animated merges)
- Final tree with 0/1 bit labels on edges
- Encoding table (character → bit mapping)
- Compression ratio displayed prominently
- Roundtrip verify: decode(encode(text)) == text

### Architecture
```
huffman-algorithm.js (pure, no DOM)
├── buildFrequencyTable(text) → {char: count, ...}
├── buildHuffmanTree(freq) → treeNode + steps
├── generateEncodingTable(tree) → {char: "010...", ...}
├── encodeText(text, table) → "0101..."
└── decodeText(bits, tree) → originalText

huffman.js (UI, DOM-driven)
├── Input validation & preprocessing
├── Visualization (canvas tree, tables)
├── Playback controls (play, pause, step, speed)
└── Output display (compression ratio, bits)

huffman-style.css (all classes prefixed huffman-)
└── Canvas, tables, controls styling
```

### Scope
Single session, feature-rapid:
- 1. Algorithm module
- 2. HTML page
- 3. UI module
- 4. CSS styling
- 5. Navigation updates (all `.html` files)

### Test Coverage
Manual verification (feature-rapid, no unit tests required):
- Empty input (error)
- Single character (trivial case)
- Two characters (one merge)
- Normal text ("abracadabra")
- All same character (no compression)
- Max length (200 chars)
- Roundtrip: encode → decode == original

### Files Created
```
openspec/changes/2026-03-26-huffman-new-proposal/
├── spec.md (110 lines)
├── design.md (250+ lines)
└── tasks.md (450+ lines)
```

### Time Estimate
**60-90 minutes** (single session)
- Algorithm: 20-30 min
- HTML: 10-15 min
- UI (huffman.js): 25-35 min
- Styling: 10-15 min
- Testing & integration: 15-20 min

---

## Feature 2: Dijkstra Zero-Weight Bug (bugfix)

### What
Fix input validation that blocks zero-weight edges in Dijkstra's edge creation dialog.

### Why It's a Real Bug
**Contradiction in code:**
- Spec says: "weights 0-999 valid"
- Algorithm allows: `if (isNaN(w) || w < 0 || w > MAX_WEIGHT)` (accepts 0)
- HTML blocks: `input.min = "1"` (rejects 0)

**User impact:** Cannot create zero-weight edges despite the algorithm supporting them

### Root Cause
Single incorrect line: `/home/user/shell/tools/algoviz/dijkstra.js` line 278

```javascript
// WRONG:
input.min = "1";  // Browser-level validation blocks 0

// CORRECT:
input.min = "0";  // Allow 0-999 range as spec requires
```

### Why This Fix Matters
1. **Spec compliance**: Fix aligns UI with documented requirements
2. **Algorithm correctness**: Enable testing of zero-weight edge cases
3. **Real use case**: Zero-cost edges are valid in graphs (teleports, free transfers, instant moves)
4. **Educational value**: Enables interesting pathfinding scenarios (is zero-weight shortcut worth it?)

### Example Scenario
```
Create graph:
A →(0)→ B        (zero-weight shortcut)
A →(5)→ C →(1)→ B  (longer route, distance 6)

Run Dijkstra:
Expected shortest path: A → B (distance 0, uses zero-weight edge)
Current broken behavior: Cannot create A → B with weight 0
```

### Fix Impact
- **Scope**: 1 file, 1 line
- **Backward compatible**: Yes (relaxes restriction, doesn't change existing functionality)
- **Breaking change**: No
- **Side effects**: None (isolated change)

### Testing Strategy
Unit + Integration:
- Zero-weight edge creation (UI accepts input)
- Zero-weight edge display ("0" shows on canvas)
- Dijkstra selection (shortest path uses zero-weight edge)
- Boundary validation (-1 rejected, 0 accepted, 999 accepted, 1000 rejected)
- Regression (positive weights still work)

### Files Created
```
openspec/changes/2026-03-26-dijkstra-input-zero-weight-fix/
├── spec.md (200+ lines)
└── tasks.md (300+ lines)
```

### Time Estimate
**10-15 minutes** (with testing)
- Apply fix: 1-2 min
- Code quality (lint/format): 3-5 min
- Unit tests: 5-10 min (optional)
- Integration testing: 5-10 min
- Verification checklist: 2-3 min

---

## Algorithms Coverage

### Current (11 Total)
1. Levenshtein (string edit distance)
2. Elevator/SCAN (disk scheduling)
3. BFS (unweighted pathfinding)
4. Knapsack (dynamic programming)
5. Bubble Sort (sorting)
6. BST Traversal (tree traversal)
7. Merge Sort (divide-and-conquer)
8. Binary Search (searching)
9. DFS (graph traversal)
10. LCS (longest common subsequence)
11. Dijkstra (weighted pathfinding)

### After Adding Huffman (12 Total)
12. **Huffman Coding** (compression + greedy + tree building) ← NEW

### Categories
- **Sorting**: Bubble, Merge
- **Searching**: Binary Search, BST Traversal
- **Pathfinding**: BFS, DFS, Dijkstra
- **String Algorithms**: Levenshtein, LCS
- **DP/Optimization**: Knapsack
- **System Algorithms**: Elevator/SCAN
- **Compression**: **Huffman** ← NEW

---

## Recommended Implementation Order

### Option 1: Fix First (Recommended)
1. **Dijkstra bugfix** (10 min)
   - Quick win
   - Low risk
   - Builds confidence
2. **Huffman feature** (90 min)
   - Larger scope
   - More complex visualization
   - Benefits from codebase confidence

**Total time: ~100 minutes**

### Option 2: Feature First (Parallel)
If pairing with another developer:
- Dev A: Huffman feature (in parallel)
- Dev B: Dijkstra bugfix (in parallel)
- Merge at end

**Advantage**: Both done in ~90 min (longest task duration)

---

## File Organization

All specifications follow OpenSpec structure:

```
/home/user/shell/tools/algoviz/
├── FEATURE_IDEAS_2026.md (analysis summary)
├── IDEATION_SUMMARY.md (this file)
└── openspec/changes/
    ├── 2026-03-26-huffman-new-proposal/
    │   ├── spec.md (full specification)
    │   ├── design.md (architecture)
    │   └── tasks.md (implementation breakdown)
    └── 2026-03-26-dijkstra-input-zero-weight-fix/
        ├── spec.md (bug description + fix)
        └── tasks.md (testing strategy)
```

---

## Quality Standards

Both features meet AlgoViz code rules from `CLAUDE.md`:

### DRY (Tested Code == Runtime Code)
- Algorithm module pure (no DOM)
- UI calls algorithm functions
- No code duplication
- Tests verify algorithm behavior

### Edge Case Testing
- Empty inputs, single elements, boundary values
- Tree structures (degenerate cases for Huffman)
- Max size inputs (20-30 chars for Huffman, existing graphs for Dijkstra)

### Input Validation
- Max length enforced
- Clear error messages
- Boundary checks

### Visualization UX
- Spec promises kept
- Layout handles extreme cases (1 and 20+ elements)
- XSS prevention (textContent not innerHTML)
- Memory leak prevention (timer cleanup)

### Style Consistency
- IIFE pattern
- CSS prefixes verified (grep check)
- Class naming conventions followed

### Navigation
- Updated in ALL `.html` files (not just index)

---

## Key Insights

### Why Huffman?
1. **Unique algorithm class**: First greedy algorithm, first compression algorithm
2. **Visually compelling**: Tree grows step-by-step, encoding table appears, compression ratio calculated
3. **Real-world relevance**: Ubiquitous in file formats (ZIP, JPEG, PNG)
4. **Different learning value**: While other algos find paths/sort/search, Huffman shows how to build optimal structures
5. **Interesting edge cases**: Single char (no compression), skewed frequencies (high compression)

### Why This Bugfix?
1. **Real issue**: Not theoretical, verified via grep and code inspection
2. **High impact**: Enables edge case testing for existing feature (Dijkstra)
3. **Low risk**: 1-line change, fully backward compatible
4. **Quick win**: 10 min effort, improves user experience immediately
5. **Educational**: Shows zero-weight edges are valid and useful

---

## Next Steps for Implementation

### For Huffman
1. **Phase 1**: Implement `huffman-algorithm.js` (pure algorithm)
2. **Phase 2**: Create `huffman.html` and add nav links
3. **Phase 3**: Build UI in `huffman.js` (state, validation, rendering)
4. **Phase 4**: Style with `huffman-style.css`
5. **Phase 5**: Test (lint, format, manual cases)
6. **Commit**: Create git commit with full message

### For Dijkstra Bug
1. **Phase 1**: Apply 1-line fix
2. **Phase 2**: Lint & format check
3. **Phase 3**: Unit test (optional but recommended)
4. **Phase 4**: Integration test (UI testing)
5. **Commit**: Create git commit with detailed message

---

## Estimated Project Metrics

### Huffman Coding (feature-rapid)
- **New files**: 4 (algorithm, html, js, css) + update 12 nav files
- **Lines of code**: ~400-500 (algorithm + UI)
- **Test coverage**: Manual (feature-rapid, ~8 test cases)
- **Time**: 60-90 minutes

### Dijkstra Bug (bugfix)
- **Files modified**: 1
- **Lines changed**: 1
- **Test coverage**: Automated + manual (5 test scenarios)
- **Time**: 10-15 minutes

### Combined Impact
- **New algorithms**: +1 (Huffman)
- **Bug fixes**: +1 (Dijkstra zero-weight)
- **Code quality**: Improved (specs, design docs, task lists)
- **Educational value**: High (compression algorithm + edge case testing)
- **User experience**: Better (Dijkstra now works as documented)

---

## Conclusion

Both features represent high-quality additions to AlgoViz:

**Huffman Coding** expands the algorithm curriculum with a new category (compression/greedy algorithms) and introduces compelling visual learning (tree building, bit encoding, compression ratio).

**Dijkstra Bug Fix** corrects a real discrepancy between specification and implementation, enabling important edge case testing and aligning user expectations with algorithm capability.

Together, they represent ~100 minutes of focused development with clear specifications, architecture, and task breakdowns — ready for implementation by the development team.

---

**Generated by: Ideator Agent**
**Date: 2026-03-26**
**Status: Ready for Development**
