# Huffman Coding — Compression Algorithm Visualization

## Motivation

AlgoViz currently focuses on searching, sorting, and pathfinding. Huffman Coding is a canonical compression algorithm teaching:
1. **Greedy algorithms** — optimal choice at each step leads to global optimum
2. **Binary trees** — building and traversing a Huffman tree
3. **Real-world impact** — compression in ZIP files, PNG, JPEG, Huffman coding is everywhere

A visual encoding/decoding tree that builds step-by-step, then shows how frequencies map to bit sequences, makes this otherwise abstract algorithm concrete.

## Real-World Example

- **ZIP file compression**: PKware's DEFLATE uses Huffman coding for final compression layer
- **JPEG images**: Huffman encodes quantized pixel data in photos
- **PNG files**: Lossless compression stage uses Huffman coding
- **Text compression**: Simple texts compress 20-30% with Huffman alone

## Why Different

- Current algorithms: Path (BFS/DFS/Dijkstra), Sorting (Bubble/Merge), String matching (Levenshtein/LCS), Tree traversal (BST)
- Huffman: **Greedy + tree-building + compression** — unique algorithm class
- First compression algorithm in AlgoViz; introduces bit sequences and encoding tables

## Requirements

### Functional
1. **Input text**: User pastes/types text (max 200 chars)
2. **Frequency analysis**: Display character frequency table (sorted by count)
3. **Tree building animation**: Step-by-step build Huffman tree:
   - Combine two lowest-frequency nodes into parent
   - Highlight the merge operation
   - Show new node frequency
4. **Huffman tree visualization**: Display final binary tree with bit labels (0 = left, 1 = right)
5. **Encoding table**: Display character → bit sequence mapping
6. **Encode/Decode UI**:
   - Show original text
   - Display encoded bit string
   - Calculate compression ratio: `(bits_used / (original_chars * 8)) * 100%`
   - Decode bit string back to original text (verify correctness)
7. **Playback controls**: Play, Pause, Step, Reset, Speed slider (matching AlgoViz pattern)
8. **Clear button**: Reset for new input

### Non-Functional
- Dark theme matching AlgoViz style
- No external dependencies (vanilla JS + CSS)
- Separate page (huffman.html) linked from nav
- Handle duplicate frequencies consistently (tie-break by character order)

## Acceptance Criteria
- [ ] Input text field accepts max 200 characters
- [ ] Frequency table displays correct counts (sorted descending by frequency)
- [ ] Tree building animates step-by-step, showing each merge
- [ ] Final Huffman tree renders with 0/1 labels on edges
- [ ] Encoding table shows character → bit sequence correctly
- [ ] Compression ratio calculated correctly (bits / (chars * 8))
- [ ] Encoded bit string displays correctly
- [ ] Decode operation verifies against original text
- [ ] Playback controls (play/pause/step/reset/speed) work
- [ ] Navigation updated in all .html files
- [ ] No lint warnings, all tests pass

## Algorithm Complexity
- Time: O(n log n) where n = unique characters (heap operations)
- Space: O(n) for frequency table + tree
- Fast to visualize (typically 10-30 unique chars max)

## Scope
Single session, feature-rapid (no test requirements beyond manual verification):
1. `huffman-algorithm.js` — pure DP function building Huffman tree + step recording
2. `huffman.html` — page structure + nav links
3. `huffman.js` — UI visualization + controls
4. `huffman-style.css` — tree layout, encoding table, compression display
5. Update nav in all existing `.html` files

## UI Layout
```
[Input textarea (max 200 chars)]
[Playback controls: Play, Pause, Step, Reset, Speed slider]

[Left: Huffman tree visualization with step count]
[Right: Frequency table + Encoding table + Compression ratio display]

[Bottom: Original text | Encoded bits | Decoded output]
```
