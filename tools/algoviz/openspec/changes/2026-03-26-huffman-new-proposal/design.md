# Huffman Coding — Design & Architecture

## Algorithm Design

### Core Algorithm Phases

1. **Frequency Analysis** (O(n) where n = text length)
   - Count occurrences of each character
   - Return `Map<char, count>`

2. **Huffman Tree Construction** (O(c log c) where c = unique chars)
   - Build min-heap from leaf nodes (one per character)
   - Repeatedly extract two smallest-frequency nodes
   - Create parent with combined frequency
   - Add parent back to heap
   - Continue until one node remains (the root)
   - Return tree structure + step-by-step snapshots for animation

3. **Encoding Table Generation** (O(c * d) where c = unique chars, d = avg tree depth)
   - Traverse tree from root to each leaf
   - Path to leaf is the bit sequence (0 for left, 1 for right)
   - Store in table: `Map<char, bitSequence>`

4. **Encoding** (O(n) where n = text length)
   - For each character, look up bit sequence in encoding table
   - Concatenate all bit sequences

5. **Decoding** (O(m) where m = bit string length)
   - Start at tree root
   - For each bit, go left (0) or right (1)
   - When reaching leaf, output the character
   - Return to root
   - Repeat until all bits consumed

### Data Structures

**Frequency Table**:
```javascript
{
  'a': 5,
  'b': 2,
  'r': 2,
  'c': 1,
  'd': 1
}
```

**Huffman Tree Node**:
```javascript
{
  char: 'a' or null (null for internal nodes),
  frequency: 5,
  left: <Node or null>,
  right: <Node or null>
}
```

**Encoding Table**:
```javascript
{
  'a': '0',
  'b': '10',
  'r': '110',
  'c': '1110',
  'd': '1111'
}
```

**Step Snapshot** (for animation):
```javascript
{
  stepNumber: 1,
  action: 'merge',  // or 'init'
  mergedChars: ['c', 'd'],
  mergedFreq: 2,
  newNodeFreq: 2,
  remainingNodes: [<Node>, <Node>, ...],
  description: "Merged 'c' (freq 1) and 'd' (freq 1) into parent (freq 2)"
}
```

## Visualization Design

### Tree Rendering

**Canvas approach** (same as BST):
- Render tree with standard binary tree layout
- Spacing based on tree depth
- Nodes as circles with labels
- Edges with 0/1 labels

**Node display**:
```
    [a:5]
    /    \
  [0]    [1]
 /  \    /  \
[b]  [r] [2]  [3]
      (freq 2 internal)
```

**Colors**:
- Leaf nodes: character + frequency
- Internal nodes: just frequency (no character)
- Animation: highlight nodes being merged (yellow), new parent (green)

### Frequency Table

Simple HTML table:
- Column 1: Character (quoted for readability)
- Column 2: Count
- Sorted descending by frequency
- Highlight as tree is being built

### Encoding Table

HTML table:
- Column 1: Character
- Column 2: Bit sequence
- Sorted by character for consistency
- Monospace font for bits

### Compression Display

Large, prominent box:
```
Original: 11 chars × 8 bits = 88 bits
Encoded:  24 bits
Compression: 27.3% (saved 73% of space)
```

### Input/Output Area

Bottom section:
```
Original: "abracadabra"
Encoded:  0100 1010 1100 1010  (groups of 4)
Decoded:  "abracadabra" ✓
```

## Animation Sequence

### Initialization Step
- Display frequency table
- Show leaf nodes (all characters)

### Tree Building Steps
- For each merge:
  - Highlight two nodes being combined
  - Draw new parent node
  - Collapse two nodes under parent
  - Update remaining node list
  - Show step description

### Final State
- Complete tree rendered
- Encoding table appears
- Bit sequences shown

### Playback Interaction
- Play: auto-advance through steps at speed
- Pause: stop mid-animation
- Step: advance one step
- Back: go to previous step
- Reset: return to start
- Speed slider: control playback speed

## State Management

### Application State

```javascript
const state = {
  inputText: "abracadabra",
  freqTable: { 'a': 5, 'b': 2, ... },
  huffmanTree: <TreeNode>,
  encodingTable: { 'a': '0', 'b': '10', ... },
  encodeSteps: [<Snapshot>, <Snapshot>, ...],
  currentStep: 3,
  playing: false,
  playSpeed: 500, // ms between steps
  bitString: "0100101011001010",
  decodedText: "abracadabra"
};
```

### Event Flow

```
User enters text
  ↓
Validate input (non-empty, max 200)
  ↓
Build frequency table
  ↓
Generate tree-building steps
  ↓
[User clicks Play]
  ↓
Iterate through steps, rendering each
  ↓
[User clicks Step]
  ↓
Advance to next step, update canvas
  ↓
Render encoding table
  ↓
Compute & display compression ratio
  ↓
Encode text and show bits
```

## Code Organization

### huffman-algorithm.js (Pure, IIFE)

```javascript
var HuffmanAlgorithm = (() => {
  function buildFrequencyTable(text) { ... }
  function buildHuffmanTree(freqTable) { ... }
  function generateEncodingTable(tree) { ... }
  function encodeText(text, table) { ... }
  function decodeText(bits, tree) { ... }

  return {
    buildFrequencyTable,
    buildHuffmanTree,
    generateEncodingTable,
    encodeText,
    decodeText
  };
})();
```

### huffman.js (UI, IIFE, DOM-driven)

```javascript
(() => {
  'use strict';

  // State
  let state = { ... };

  // DOM refs
  const inputText = document.getElementById('input-text');
  const canvas = document.getElementById('huffman-canvas');
  // ... more DOM refs

  // Core UI functions
  function handleInputChange() { ... }
  function buildVisualization() {
    const freq = HuffmanAlgorithm.buildFrequencyTable(state.inputText);
    const tree = HuffmanAlgorithm.buildHuffmanTree(freq);
    const encoding = HuffmanAlgorithm.generateEncodingTable(tree);
    // ... store steps, render tree
  }
  function renderTreeCanvas() { ... }
  function renderFreqTable() { ... }
  function renderEncodingTable() { ... }
  function updateCompressionRatio() { ... }
  function advanceStep() { ... }

  // Event handlers
  function playAnimation() { ... }
  function pauseAnimation() { ... }
  function stepForward() { ... }
  function stepBack() { ... }
  function reset() { ... }

  // Init
  document.getElementById('btn-run').addEventListener('click', buildVisualization);
  document.getElementById('btn-play').addEventListener('click', playAnimation);
  // ... more event listeners
})();
```

### huffman-style.css

Classes (all prefixed `huffman-`):
- `.huffman-container` — main layout
- `.huffman-input-section` — input textarea + buttons
- `.huffman-controls` — playback controls
- `.huffman-visualization` — left column (tree canvas)
- `.huffman-info` — right column (tables + compression)
- `.huffman-tree-canvas` — canvas element
- `.huffman-freq-table` — frequency table
- `.huffman-encoding-table` — encoding table
- `.huffman-compression-ratio` — compression display
- `.huffman-output` — original/encoded/decoded display
- `.huffman-node-label` — tree node styling
- `.huffman-merge-highlight` — animation highlight color

## Edge Cases

### Single Character
- Tree has no parent (just root leaf)
- Encoding table has one entry: char → "0" (or "1")
- No actual compression (still 1 bit per character)

### All Same Character
- Frequency table has one entry
- Tree is just one node (the leaf)
- Encoding: "0" repeated n times
- Compression not beneficial

### Two Characters
- Tree has one merge step (two leaves → one parent)
- Two paths: 0 and 1
- Natural tie-break: sort by character order for consistent behavior

### Max Length (200 chars)
- Unique chars: up to 256, but typically < 50 in practice
- Tree building: log(chars) levels, so manageable
- Encoding table: display scrollable if needed

## Performance Targets

- Input processing: < 100ms (200 chars, up to 256 unique)
- Tree rendering: < 50ms
- Playback smooth: 60 FPS (16ms per frame)
- No memory leaks: cleanup on reset/unload

## Testing Checklist

- [x] Empty input: show error
- [x] Single char: tree renders (no internal nodes)
- [x] "abracadabra": correct frequency, tree, encoding
- [x] All same char: correct encoding (single bit)
- [x] Large alphabet (30+ chars): tree layout handles depth
- [x] Max length (200 chars): responsive, no slowdown
- [x] Roundtrip: encode then decode == original
- [x] Compression ratio: math is correct
- [x] Playback: all controls work at all steps
- [x] Bits display: groups of 4, readable format
