# Huffman Coding Implementation Tasks

## Feature-Rapid Implementation Plan

### Phase 1: Algorithm Implementation (huffman-algorithm.js)
- [ ] **Task 1.1**: Implement frequency table construction
  - Input: text string
  - Output: Map/object of char → count
  - Handle: empty input, single char, duplicates

- [ ] **Task 1.2**: Implement priority queue (min-heap) for Huffman tree building
  - `pqPush(heap, node)` — add node, maintain heap property
  - `pqPop(heap)` — remove min, maintain heap property
  - Nodes: `{ char, freq, left, right }`

- [ ] **Task 1.3**: Implement Huffman tree construction
  - While queue > 1 node: pop 2 minimum nodes, create parent, push back
  - Record snapshots at each merge showing state
  - Return final tree root

- [ ] **Task 1.4**: Implement encoding table generation
  - Traverse tree (DFS) from root
  - Left = append '0', Right = append '1'
  - Build char → bitstring map
  - Output: `{ 'A': '01', 'B': '10', ... }`

- [ ] **Task 1.5**: Implement encode function
  - Input: original text, encoding table
  - Output: bit string (e.g., '010110111...')

- [ ] **Task 1.6**: Implement decode function
  - Input: bit string, Huffman tree
  - Output: reconstructed text
  - Verify: decode(encode(text)) === text

- [ ] **Task 1.7**: Export test via IIFE
  - `HuffmanAlgorithm.buildHuffmanTree(text)`
  - `HuffmanAlgorithm.getSnapshots(text)` — for UI playback

### Phase 2: UI Implementation (huffman.html, huffman.js, huffman-style.css)
- [ ] **Task 2.1**: Create huffman.html structure
  - Input textarea (max 200 chars, char counter)
  - Playback controls (Play, Pause, Step, Reset, Speed slider)
  - Tree visualization container (SVG)
  - Frequency & encoding tables (right sidebar)
  - Compression stats display
  - Navigation links to all other algorithms

- [ ] **Task 2.2**: Implement huffman.js state management
  - `inputText` — user input
  - `snapshots` — array from algorithm
  - `currentStep` — index into snapshots
  - `tree` — Huffman tree root
  - `encoding` — char → bits map
  - `playing` — playback state
  - `playTimer` — animation interval ID

- [ ] **Task 2.3**: Implement input handler
  - Listen for textarea change
  - Limit to 200 characters
  - Display character count ("42 / 200")
  - Update frequency table in real-time (optional, for preview)
  - Clear animation state on new input

- [ ] **Task 2.4**: Implement tree rendering (SVG)
  - `renderTree()` — clear SVG, redraw current tree state from snapshots
  - Node rendering: leaf nodes as rectangles, internal nodes as circles
  - Edge rendering: lines with 0/1 labels
  - Layout: top-down, recursively position children
  - Highlight: on merge, highlight the two nodes being combined

- [ ] **Task 2.5**: Implement frequency & encoding tables
  - Frequency table: [char | count | bits] sorted by count descending
  - Encoding table: [char | binary] with monospace font
  - Update both tables every step

- [ ] **Task 2.6**: Implement compression display
  - Calculate bits used: sum of (char frequency * bitstring length)
  - Calculate ratio: bits_used / (original_length * 8)
  - Display: "36 / 88 bits = 40.9% (59.1% reduction)"

- [ ] **Task 2.7**: Implement playback controls
  - `play()` — start animation, step through snapshots at interval
  - `pause()` — stop animation, keep current step
  - `step()` — advance one snapshot
  - `reset()` — go back to step 0 (frequency initialization)
  - Speed slider: adjust delay (800ms - (speed * 75ms))
  - Step count display: "Step 5 / 12"

- [ ] **Task 2.8**: Implement final output display
  - Original text: display in monospace, truncate if > 100 chars
  - Encoded bits: display in monospace, group by 8 ("01010101 11110000 ...")
  - Decoded text: display in monospace (should match original)
  - Show checkmark if decode matches original

- [ ] **Task 2.9**: Implement CSS styling (huffman-style.css)
  - All classes prefixed with `huff-` (e.g., `huff-tree-svg`, `huff-freq-table`)
  - Two-column layout: tree (60%) + tables (40%)
  - Dark theme colors (matching style.css)
  - Responsive design: stack vertically on small screens
  - Tree node colors: leaf = light blue, internal = light purple
  - Highlight color on merge: bright yellow border

### Phase 3: Navigation & Testing
- [ ] **Task 3.1**: Update navigation in ALL .html files
  - Add link: `<a href="huffman.html">Huffman Coding</a>`
  - Include in nav bar in: index.html, levenshtein, elevator, bfs, dfs, knapsack, bubble-sort, bst, merge-sort, binary-search, lcs, dijkstra, and any others

- [ ] **Task 3.2**: Update package.json globals
  - Add `HuffmanAlgorithm` to eslintrc globals list (for eslint to recognize)

- [ ] **Task 3.3**: Manual testing
  - Test single character input: 'A'
  - Test two characters same frequency: 'AB'
  - Test skewed distribution: 'AAAAAAB'
  - Test all same character: 'AAAAAA'
  - Test 100+ characters
  - Test 200 characters (max)
  - Verify encode/decode correctness at each step
  - Verify compression ratio math
  - Check playback controls (play/pause/step/reset)
  - Check speed slider responsiveness
  - Verify tree rendering doesn't overlap nodes
  - Test on small and large screens

- [ ] **Task 3.4**: Code quality
  - Run `npm run lint` — no errors or warnings
  - Run `npm run format:check` — no formatting issues
  - Verify CSS prefix: `grep -P 'class="(?!huff-)' huffman-style.css` returns nothing

## Expected Time: 45-60 minutes

## DRY Principle Enforcement
- Algorithm logic lives ONLY in `huffman-algorithm.js`
- UI calls `HuffmanAlgorithm.getSnapshots(text)` and renders snapshots
- No duplicate tree-building logic in huffman.js

## Edge Case Checklist
- Empty input: `""` → show message "Enter text to compress"
- Single character: `"A"` → tree is single node, compression shows no benefit
- Duplicate frequencies: consistent tie-breaking (left child = first node, right = second)
- Max input: 200 characters → ensure no browser lag
- Non-ASCII: handle UTF-8 characters (each char is treated as unique)
