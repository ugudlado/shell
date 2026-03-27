# Huffman Coding Design Notes

## Algorithm Design

### Data Structures
- **Frequency table**: `Map<char, count>` (or object in JS)
- **Priority queue**: Min-heap (array-based) of nodes, prioritized by frequency
- **Huffman tree node**: `{ char: string|null, freq: number, left: Node, right: Node }`
  - Leaf nodes have `char` set
  - Internal nodes have `char: null`

### Core Algorithm Steps (with snapshots)
1. Count character frequencies in input text
2. Create leaf node for each unique character
3. While queue has > 1 node:
   - Pop two minimum-frequency nodes
   - Create new parent node with combined frequency
   - Push parent back to queue
   - **SNAPSHOT**: Show merge operation, updated queue state
4. Root is the last remaining node
5. Traverse tree (DFS) to build encoding table: `char -> bitstring`

### Encoding Process
- For each character in original text, append its bitstring to output
- Example: if 'a' → '01', text "aab" → "010101..."

### Decoding Process
- Start at tree root
- For each bit in encoded string:
  - If bit=0, go left; if bit=1, go right
  - When reaching leaf, output character, restart from root
- Verify decoded text matches original

### Snapshot Structure
```javascript
{
  step: 0,                    // Step count
  phase: "init|build|done",   // Current phase
  freqTable: {...},           // Current frequency table
  queue: [...],               // Current priority queue state
  tree: Node|null,            // Current tree (null during build)
  action: "merge|init",       // What just happened
  detail: "merged A(1) + B(2) → AB(3)"
}
```

## UI Design

### Tree Visualization
- Use canvas or SVG to render Huffman tree
- Leaf nodes: colored boxes with character label
- Internal nodes: circles with combined frequency
- Edges labeled with 0 (left) and 1 (right)
- Layout: top-down, balanced spacing (no overlaps)

### Frequency & Encoding Tables
- Frequency table: `[char | count | bits]` in HTML table format
- Encoding table: `[char | binary | hex (optional)]`
- Sort frequency table by count descending
- Highlight current character being processed during playback

### Compression Display
```
Original:        "MISSISSIPPI" (11 chars, 88 bits at 8 bits/char)
Encoded:         "10110111001001101111001011..." (36 bits example)
Compression:     36 / 88 = 40.9% of original
Saved:           52 bits (59.1% reduction)
```

### Animation Strategy
- **Initialization step**: Show input text, count frequencies
- **Build steps**: For each merge, highlight the two nodes being combined, show parent creation
- **Final step**: Show complete tree, encoding table, compression result
- **Playback**: Step through each merge operation smoothly

## Code Organization

### `huffman-algorithm.js` (IIFE, no DOM)
```javascript
var HuffmanAlgorithm = (function() {
  function buildHuffmanTree(text) { ... }
  function encodeText(text, tree) { ... }
  function decodeText(bits, tree) { ... }
  function getSnapshots(text) { ... }
  return { buildHuffmanTree, encodeText, decodeText, getSnapshots };
})();
```

### `huffman.js` (IIFE, handles DOM)
- State: `inputText`, `snapshots`, `currentStep`, `tree`, `encoding`
- Event handlers: input change, playback controls
- Render function: clear SVG, redraw tree with current state
- Helper: format bits for display (groups of 8 for readability)

### `huffman-style.css`
- Prefix all classes with `huff-` (e.g., `huff-tree-container`, `huff-encoding-table`)
- Flex layout for two-column (tree left, tables right)
- SVG styling for tree nodes and edges
- Dark theme colors matching style.css

## Testing Notes (feature-rapid, manual verification)
- **Single character**: 'A' → tree is single node, encoding is '0'
- **Two chars same freq**: 'AB' → either could be 0 or 1 (consistent tie-breaking)
- **Skewed**: 'AAAAAAB' → A gets short code, B gets long code
- **All duplicates**: 'AAAAAA' → encoding is arbitrary (tree is degenerate)
- **Max size**: 200 characters (browser shouldn't lag)

## CSS Prefix Verification
After implementing, run:
```bash
grep -P 'class="(?!huff-)' huffman-style.css
```
Should return no results if all classes properly prefixed.
