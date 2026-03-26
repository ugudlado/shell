# Huffman Coding — Compression Algorithm Visualization

**Feature Type:** feature-rapid (no test requirements beyond manual verification)

**Proposal Date:** 2026-03-26

## Motivation

AlgoViz currently teaches searching, sorting, pathfinding, and string algorithms. Huffman Coding fills a critical gap: **compression algorithms using greedy selection and tree construction**.

Huffman is a canonical example of:
1. **Greedy algorithms** — optimal choice at each step (combine two smallest-frequency nodes) leads to global optimum
2. **Binary tree construction** — build tree step-by-step from leaves to root
3. **Real-world impact** — ubiquitous in ZIP, JPEG, PNG, and text compression

Visualizing the tree being built step-by-step, then showing how frequencies map to bit sequences, transforms this abstract algorithm into concrete intuition.

## Real-World Example

- **ZIP file compression (DEFLATE)**: Final compression layer uses Huffman coding to achieve 20-50% size reduction on text
- **JPEG image compression**: Quantized pixel data is Huffman-encoded before storage
- **PNG lossless compression**: Huffman is part of the DEFLATE compression stage
- **Simple text compression**: 20-30% reduction with Huffman alone (no preprocessing)

## Why Different

**Current algorithms**: Path (BFS/DFS/Dijkstra), Sorting (Bubble/Merge), String matching (Levenshtein/LCS), Tree traversal (BST)

**Huffman**: **Greedy + tree-building + compression** — first compression algorithm in AlgoViz
- Introduces unique concepts: frequency-based selection, binary tree animation, bit encoding tables, compression ratio
- Complements existing algorithms: while Dijkstra is "find best single path," Huffman is "build optimal tree"
- Different problem class: optimization through structure building, not path selection

## Requirements

### Functional

1. **Input text**: User enters text (max 200 characters)
2. **Frequency analysis**: Display character frequency table (sorted by count, descending)
3. **Tree building animation**: Step-by-step Huffman tree construction
   - Each step combines two lowest-frequency nodes into parent
   - Highlight the merge operation (color the nodes being combined)
   - Show new parent node's frequency
   - Continue until one tree remains
4. **Huffman tree visualization**: Display final binary tree
   - Edges labeled with 0 (left) and 1 (right)
   - Node labels showing characters and frequencies
5. **Encoding table**: Display character → bit sequence mapping
   - Sorted by character for readability
6. **Encoding/Decoding display**:
   - Show original text
   - Display encoded bit string
   - Calculate compression ratio: `(bits_used / (original_chars * 8)) * 100%`
   - Decode bit string back to original text (verify correctness)
7. **Playback controls**: Play, Pause, Step forward, Step back, Reset, Speed slider (consistent with AlgoViz pattern)
8. **Clear button**: Reset for new input

### Input Validation

- Max length: 200 characters
- Handle empty input with clear error message
- All printable ASCII characters accepted

### Visualization UX

- Dark theme matching AlgoViz style
- Tree layout handles both small (2-5 chars) and large (30 chars) alphabets
- Compression ratio highlighted (especially when >= 20%)
- Clean display of bit sequences (groups of 4 for readability)

### Non-Functional

- No external dependencies (vanilla JS + CSS)
- Separate page (`huffman.html`) linked from navigation
- Consistent with AlgoViz architecture (IIFE pattern, separate -algorithm.js, -style.css)
- All CSS classes prefixed with `huffman-`
- Navigation updated in ALL existing `.html` files

## Acceptance Criteria

- [ ] Input field accepts max 200 characters with validation
- [ ] Frequency table displays correct counts (sorted descending)
- [ ] Tree building animates step-by-step, showing each merge operation
- [ ] Final Huffman tree renders with 0/1 labels on edges
- [ ] Encoding table shows character → bit sequence correctly
- [ ] Compression ratio calculated correctly: `(bits_used / (original_chars * 8)) * 100%`
- [ ] Encoded bit string displays and groups bits for readability
- [ ] Decode operation verifies against original text (matches exactly)
- [ ] Playback controls (play/pause/step/reset/speed) all work correctly
- [ ] Random example button loads preset test cases
- [ ] Navigation updated in all `.html` files (grep-verified)
- [ ] All CSS classes use `huffman-` prefix
- [ ] No lint warnings: `npm run lint` passes
- [ ] No format violations: `npm run format:check` passes

## Algorithm Complexity

- **Time**: O(n log n) where n = unique characters (priority queue operations)
- **Space**: O(n) for frequency table + Huffman tree
- **Visualization speed**: Typically 10-30 unique chars, so tree builds in 10-30 steps (visualizable in < 2 sec at normal speed)

## Scope (Single Session)

### Files to Create

1. **`huffman-algorithm.js`**
   - Pure functions (no DOM dependency)
   - `buildFrequencyTable(text)` — returns map of char → count
   - `buildHuffmanTree(freqTable)` — returns tree with step-by-step snapshots
   - `generateEncodingTable(tree)` — returns char → bit sequence mapping
   - `encodeText(text, encodingTable)` — returns bit string
   - `decodeText(bitString, tree)` — returns original text
   - Global export: `var HuffmanAlgorithm = { ... }`

2. **`huffman.html`**
   - Page structure with nav links
   - Input textarea, playback controls, visualization area
   - Include `huffman-algorithm.js` before `huffman.js`

3. **`huffman.js`**
   - UI logic, event handlers, canvas drawing
   - Calls `HuffmanAlgorithm` functions (no algorithm duplication)
   - Canvas-based tree drawing with animation

4. **`huffman-style.css`**
   - All classes prefixed with `huffman-`
   - Tree visualization styles
   - Frequency table and encoding table styles
   - Compression display and bit string styling
   - Playback control styling

5. **Update nav in all `.html` files**
   - Add link to `huffman.html` in all existing pages

### Testing

**Manual verification** (feature-rapid scope):
- [ ] Empty input: clear error message
- [ ] Single character: tree has no merge steps, encoding is "0" or "1"
- [ ] Two characters: single merge step
- [ ] Normal text "abracadabra": freq table correct, tree builds correctly, compression works
- [ ] All same character "aaaa": no compression (or minimal), encoding is single bit repeated
- [ ] Max length (200 chars): visualization handles large tree layout
- [ ] Decode roundtrip: encoded bits decode back to original text exactly

**No unit tests required** (feature-rapid), but verify:
- `buildFrequencyTable()` accuracy
- `generateEncodingTable()` produces valid bit sequences
- Roundtrip: `decodeText(encodeText(text))` == `text`

## UI Layout

```
┌─────────────────────────────────────────────────┐
│ [Input textarea: max 200 chars, with counter]   │
│                                                  │
│ [Playback: Play | Pause | Step | Reset | Speed]│
│                                                  │
├──────────────┬──────────────────────────────────┤
│ Left Column: │ Right Column:                    │
│              │                                  │
│ Huffman tree │ Frequency Table (5 rows visible)│
│ visualization│ ┌──────┬───────────┐             │
│              │ │ Char │ Frequency │             │
│ [Step count] │ ├──────┼───────────┤             │
│              │ │  a   │     5     │             │
│              │ │  b   │     2     │             │
│              │ └──────┴───────────┘             │
│              │                                  │
│              │ Encoding Table:                  │
│              │ ┌──────┬──────────┐              │
│              │ │ Char │ Bits     │              │
│              │ ├──────┼──────────┤              │
│              │ │  a   │ 0        │              │
│              │ │  b   │ 10       │              │
│              │ └──────┴──────────┘              │
│              │                                  │
│              │ Compression:                    │
│              │ Original: 88 bits                │
│              │ Encoded: 24 bits                 │
│              │ Ratio: 27.3%                    │
│              │                                  │
├──────────────┴──────────────────────────────────┤
│ Original: "abracadabra"                        │
│ Encoded: 0100101011001010                      │
│ Decoded: "abracadabra"                         │
└──────────────────────────────────────────────────┘
```

## Success Criteria

**Ship when:**
1. ✅ All acceptance criteria checked
2. ✅ Manual testing passes all cases (empty, single, normal, max)
3. ✅ Tree visualization clean for both small and large alphabets
4. ✅ Encoding/decoding roundtrip verified
5. ✅ `npm run lint` and `npm run format:check` pass
6. ✅ Navigation added to ALL `.html` files
7. ✅ Code reviews pass (DRY: algorithm module called from UI, not duplicated)

## Time Estimate

60-90 minutes (feature-rapid scope, manual testing only)

---

## Implementation Notes

**Algorithm Correctness**: Focus on correctness of frequency analysis, tree building algorithm, and encoding. Test roundtrip (encode then decode) thoroughly.

**Visualization Priority**: Make tree-building animation smooth and clear. Users should see exactly how each merge happens.

**Edge Case Handling**:
- Single character: tree is just a node, no parent, encoding is "0" or "1"
- All same character: no diversity in frequencies, tree is linear
- Large alphabet (30 chars): ensure tree layout doesn't overflow

**Compression Ratio**: Real compression improves when text has skewed frequency (some chars much more common). Show this clearly in UI.
