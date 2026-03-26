# Huffman Coding — Task Breakdown

**Feature Type:** feature-rapid
**Estimated Time:** 60-90 minutes
**Scope:** Single session

## Task List

### Phase 1: Algorithm Implementation
**Time: 20-30 minutes**

#### Task 1.1: Create huffman-algorithm.js
- [ ] Create `/home/user/shell/tools/algoviz/huffman-algorithm.js`
- [ ] Implement `buildFrequencyTable(text)`
  - Count character occurrences
  - Return object with char → count mapping
  - Handle empty string (return empty object)
- [ ] Implement `buildHuffmanTree(freqTable)`
  - Create leaf nodes for each character
  - Use min-heap (simulated via array sort) for node selection
  - Repeatedly: extract 2 smallest, create parent, add back
  - Continue until one node remains
  - Return tree root object
- [ ] Implement `generateEncodingTable(tree)`
  - Traverse tree recursively
  - Build bit sequences (0 for left, 1 for right)
  - Return object with char → bitString mapping
  - Handle edge case: single character (use "0")
- [ ] Implement `encodeText(text, encodingTable)`
  - Look up each character in encoding table
  - Concatenate bit sequences
  - Return bit string
- [ ] Implement `decodeText(bitString, tree)`
  - Start at root
  - For each bit: traverse left (0) or right (1)
  - At leaf: output character, return to root
  - Return original text
- [ ] Wrap in IIFE, export via `var HuffmanAlgorithm = { ... }`
- [ ] Verify roundtrip: `decodeText(encodeText(text)) === text`

#### Task 1.2: Manual Algorithm Testing
- [ ] Test `buildFrequencyTable("abracadabra")` → correct char counts
- [ ] Test `buildHuffmanTree()` with simple input (2-3 chars)
- [ ] Test `generateEncodingTable()` produces valid bit sequences
- [ ] Test `encodeText()` and `decodeText()` roundtrip
- [ ] Test edge case: single character
- [ ] Test edge case: all same character
- [ ] Test edge case: empty string (handle gracefully)

---

### Phase 2: HTML/Page Structure
**Time: 10-15 minutes**

#### Task 2.1: Create huffman.html
- [ ] Create `/home/user/shell/tools/algoviz/huffman.html`
- [ ] Copy nav bar from existing algorithm page
- [ ] Create main content area with sections:
  - Input section (textarea, clear button, char counter)
  - Playback controls (Play, Pause, Step, Back, Reset, Speed slider)
  - Visualization area (two-column: left for tree, right for tables)
  - Output section (original, encoded, decoded)
- [ ] Include `<script src="huffman-algorithm.js"></script>` BEFORE `huffman.js`
- [ ] Include `<script src="huffman.js"></script>`
- [ ] Include `<link rel="stylesheet" href="huffman-style.css">`
- [ ] Use semantic HTML5 elements (canvas for tree, tables for data)
- [ ] Set max length on textarea to 200 characters

#### Task 2.2: Add Navigation Links
- [ ] Add `<a href="huffman.html">Huffman Coding</a>` to nav in ALL existing `.html` files:
  - index.html
  - binary-search.html
  - bfs.html
  - bst.html
  - bubble-sort.html
  - dfs.html
  - dijkstra.html
  - elevator.html
  - knapsack.html
  - levenshtein.html
  - lcs.html
  - merge-sort.html
- [ ] Verify nav links in alphabetical or logical order
- [ ] Verify no duplicate links

---

### Phase 3: UI Implementation (huffman.js)
**Time: 25-35 minutes**

#### Task 3.1: State & Initialization
- [ ] Create state object with:
  - inputText, freqTable, huffmanTree, encodingTable
  - encodeSteps (array of snapshots)
  - currentStep, playing, playSpeed
  - bitString, decodedText
- [ ] Get all DOM element references in one section
- [ ] Initialize event listeners:
  - Input change handler
  - Run/Build button
  - Playback buttons (play, pause, step, back, reset)
  - Speed slider
  - Clear/Reset button

#### Task 3.2: Input Validation & Preprocessing
- [ ] Implement `validateInput(text)`
  - Check non-empty: show error "Text cannot be empty"
  - Check max length: show error if > 200 chars
  - Return boolean (valid/invalid)
- [ ] Implement character counter display (real-time as user types)
- [ ] Clear button resets all state and UI

#### Task 3.3: Build & Render Visualization
- [ ] Implement `buildVisualization()`
  - Validate input
  - Call `HuffmanAlgorithm.buildFrequencyTable()`
  - Call `HuffmanAlgorithm.buildHuffmanTree()`
  - Generate steps for animation (each merge is one step)
  - Call `HuffmanAlgorithm.generateEncodingTable()`
  - Store results in state
  - Render initial tree (step 0)
  - Render frequency table
  - Render encoding table
  - Compute & display compression ratio
- [ ] Implement tree rendering on canvas
  - Use `drawNode(node, x, y, offset, context)` recursive function
  - Nodes as circles, label with character/frequency
  - Edges with 0/1 labels
  - Colors: leaf nodes (one color), internal nodes (another)
- [ ] Implement frequency table rendering (HTML table)
  - Sorted by frequency descending
  - Row per character
- [ ] Implement encoding table rendering (HTML table)
  - Sorted by character
  - Row per character with bit sequence
- [ ] Implement compression ratio display
  - Formula: `(bits_used / (original_chars * 8)) * 100%`
  - Display as percentage and bits saved
- [ ] Implement output display
  - Show original text
  - Show encoded bits (grouped by 4 for readability)
  - Show decoded text (verify == original)

#### Task 3.4: Playback Controls
- [ ] Implement `playAnimation()`
  - Set `playing = true`
  - Start timer calling `advanceStep()` every `playSpeed` ms
- [ ] Implement `pauseAnimation()`
  - Set `playing = false`
  - Clear timer
- [ ] Implement `advanceStep()` / `nextStep()`
  - Increment currentStep
  - If currentStep < encodeSteps.length, render that step
  - Otherwise, show final tree and tables
  - Update step counter display
- [ ] Implement `stepBack()` / `previousStep()`
  - Decrement currentStep
  - Re-render previous step
  - Handle boundary (currentStep >= 0)
- [ ] Implement `resetPlayback()`
  - Set currentStep = -1
  - Set playing = false
  - Clear all highlights
  - Re-render initial state
- [ ] Implement speed slider
  - Map slider value (1-10) to ms delay
  - Update `playSpeed` in state
  - Apply immediately if currently playing

---

### Phase 4: Styling (huffman-style.css)
**Time: 10-15 minutes**

#### Task 4.1: Layout & Typography
- [ ] Create `huffman-style.css`
- [ ] Define CSS variables for colors (reuse from style.css if available):
  - Primary color (algorithm highlight)
  - Secondary colors (merge highlight, normal, active)
  - Text colors (dark theme)
- [ ] Layout: flex or grid
  - Input section: 100% width, top
  - Controls: 100% width, below input
  - Two-column visualization below controls
  - Output section: 100% width, bottom
- [ ] Input textarea: width 100%, height 100px, max-length indicator
- [ ] Typography: font family, sizes for headers, labels, tables

#### Task 4.2: Canvas & Tree Visualization
- [ ] Style for `huffman-tree-canvas`
  - Width: 100%, height: auto (responsive)
  - Background: dark (matching AlgoViz theme)
  - Border: subtle
- [ ] Node labels: font size readable, text color white
- [ ] Edge labels (0/1): smaller font, positioned near edge midpoint
- [ ] Animation colors:
  - Normal leaf: light color (e.g., #4CAF50)
  - Normal internal: medium color (e.g., #2196F3)
  - Highlighted for merge: bright color (e.g., #FFC107)
  - New parent: bright green (e.g., #8BC34A)

#### Task 4.3: Tables & Data Display
- [ ] Style for `huffman-freq-table`, `huffman-encoding-table`
  - Bordered tables with padding
  - Row hover highlight (subtle)
  - Monospace font for characters and bits
- [ ] Table headers: bold, background color
- [ ] Compression ratio display: large, prominent
  - Show percentage prominently
  - Show bit counts (original vs encoded)
  - Green text if compression > 0%

#### Task 4.4: Playback Controls
- [ ] Buttons: consistent with AlgoViz style
  - Padding, border-radius, hover effects
  - Active/disabled states
- [ ] Speed slider: width 100%, labeled
- [ ] Step counter: display current step / total steps

#### Task 4.5: Responsive Design
- [ ] Mobile layout: stack columns vertically below 600px width
- [ ] Ensure readable on small screens (tablet, phone)
- [ ] Tree canvas resizes responsively

#### Task 4.6: CSS Prefix Verification
- [ ] Grep to verify all classes use `huffman-` prefix:
  ```bash
  grep -P 'class="(?!huffman-)' huffman-style.css
  ```
  - Should return NO matches (empty result)

---

### Phase 5: Integration & Testing
**Time: 15-20 minutes**

#### Task 5.1: Code Quality
- [ ] Run `npm run lint`
  - Fix any warnings in huffman.js and huffman-algorithm.js
  - Add globals to package.json lint config if needed
- [ ] Run `npm run format:check`
  - Run `npm run format` if needed to auto-format
- [ ] Verify no console errors (open dev tools, test UI)

#### Task 5.2: Manual Testing
- [ ] Test Case 1: Empty input
  - [ ] Show error message
  - [ ] No crash
- [ ] Test Case 2: Single character ("a")
  - [ ] Tree renders (single node)
  - [ ] Encoding table: "a" → "0"
  - [ ] Roundtrip works
- [ ] Test Case 3: Two characters ("ab")
  - [ ] Tree has root with two leaves
  - [ ] Encoding: "a" → "0", "b" → "1" (or vice versa)
  - [ ] Playback shows one merge step
- [ ] Test Case 4: Normal text ("abracadabra")
  - [ ] Frequency table correct: a=5, b=2, r=2, c=1, d=1
  - [ ] Tree builds with 4 merge steps (5 leaves → 1 root)
  - [ ] Encoding table produces valid bit sequences
  - [ ] Compression ratio calculated correctly
  - [ ] Playback smooth (Play → pause → step → reset all work)
- [ ] Test Case 5: All same character ("aaaa")
  - [ ] Tree is single node
  - [ ] Encoding: "a" → "0"
  - [ ] No compression (4 bits for 4 characters, vs 32 bits original)
- [ ] Test Case 6: Max length (200 chars)
  - [ ] Input accepts, no lag
  - [ ] Visualization renders
  - [ ] Playback works
- [ ] Test Case 7: Playback Controls
  - [ ] Play starts animation at correct speed
  - [ ] Pause stops animation
  - [ ] Step advances one step
  - [ ] Back goes to previous step
  - [ ] Reset returns to start
  - [ ] Speed slider changes animation speed
- [ ] Test Case 8: Bits Display
  - [ ] Bits grouped by 4 for readability
  - [ ] Decode output matches original text exactly

#### Task 5.3: Cross-Browser Testing
- [ ] Test on Chrome/Chromium
- [ ] Test on Firefox
- [ ] Test on Safari (if available)
- [ ] Verify canvas drawing works on all browsers

#### Task 5.4: Navigation Verification
- [ ] Visit huffman.html
- [ ] Check nav bar appears and renders correctly
- [ ] Click links to other algorithm pages (verify roundtrip)
- [ ] Check huffman.html link in other pages (grep verify)

---

### Phase 6: Final Checklist
**Time: 5 minutes**

#### Pre-Ship Verification
- [ ] All acceptance criteria checked (from spec.md)
- [ ] All test cases pass
- [ ] `npm run lint` produces no warnings
- [ ] `npm run format:check` passes
- [ ] Navigation added to all `.html` files (verify via grep)
- [ ] No lint errors in huffman.js or huffman-algorithm.js
- [ ] Roundtrip encode/decode verified (manual test)
- [ ] Tree renders for small (2 chars) and large (30 chars) inputs
- [ ] Playback controls all functional
- [ ] Compression ratio correctly calculated
- [ ] Dark theme consistent with AlgoViz style
- [ ] No external dependencies added (vanilla JS only)
- [ ] Code follows AlgoViz style guide (IIFE, DRY, no DOM in algorithm)

#### Documentation
- [ ] No docs to write (feature-rapid, no README update needed)
- [ ] Comments in code explain non-obvious logic
- [ ] Function signatures clear in huffman-algorithm.js

#### Ready to Ship
- [ ] Create git commit with message: "feat: Add Huffman Coding compression algorithm visualization"
- [ ] PR review ready

---

## Time Breakdown

| Phase | Tasks | Est. Time |
|-------|-------|-----------|
| 1. Algorithm | Implementation + manual tests | 20-30 min |
| 2. HTML | Page structure + nav updates | 10-15 min |
| 3. UI (huffman.js) | State, validation, rendering, playback | 25-35 min |
| 4. Styling | Canvas, tables, controls, responsive | 10-15 min |
| 5. Integration | Lint, format, manual testing (8 cases) | 15-20 min |
| 6. Final | Checklist, commit | 5 min |
| **TOTAL** | | **85-110 min** |

**Recommended pace:** 90 minutes (watch for getting stuck on canvas rendering)

---

## Troubleshooting

**Problem: Tree canvas not rendering**
- Check: Is canvas element in DOM?
- Check: Is getContext('2d') working?
- Debug: Add console.log at start of renderTreeCanvas()

**Problem: Frequency table shows wrong counts**
- Check: buildFrequencyTable() is returning correct object
- Debug: Log freqTable before rendering

**Problem: Encoding roundtrip fails**
- Check: Is tree structure correct (left=0, right=1)?
- Check: Is single-character edge case handled (tree is just leaf)?
- Debug: Log encoded bits and trace decoding manually

**Problem: Playback jumps through steps**
- Check: Is currentStep incrementing correctly?
- Check: Is there an off-by-one error in encodeSteps array length?
- Debug: Log currentStep and encodeSteps.length at each advance

**Problem: Speed slider doesn't work**
- Check: Is playSpeed state variable being updated?
- Check: Is timer using updated playSpeed value?
- Debug: Log playSpeed value after slider change

---

## Success Criteria

Ship when:
✅ All 8 manual test cases pass
✅ npm run lint && npm run format:check pass
✅ Navigation added to all `.html` files
✅ Roundtrip (encode → decode) verified
✅ Playback controls fully functional
✅ Code review approved (DRY, no algorithm duplication in UI)
