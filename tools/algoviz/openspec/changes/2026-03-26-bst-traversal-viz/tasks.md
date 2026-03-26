# Tasks — BST Traversal Visualization

## Phase 1: Core Algorithm + Tests

### [x] Task 1.1: Create `bst-algorithm.js` — Pure BST Algorithm
- **Why**: Foundation for all visualization — must be DOM-free and testable in Node.js
- **Files**: Create `bst-algorithm.js`
- **Verify**: `node -e "const B = require('./bst-algorithm.js'); const t = B.createTree(); B.insert(t, 5); B.insert(t, 3); B.insert(t, 7); const r = B.inorder(t); console.log(JSON.stringify(r.result))"` outputs `[3,5,7]`

### [x] Task 1.2: Create `bst-algorithm.test.js` — Algorithm Tests
- **Why**: Validate correctness of insert, traversals, edge cases
- **Files**: Create `bst-algorithm.test.js`
- **Verify**: `npm test` passes with all BST tests green (24 tests)

### Phase 1 Gate
- [x] `npm run lint` passes
- [x] `npm test` passes (52 total: 24 BST + 13 bubble sort + 15 knapsack)

## Phase 2: Visualization UI

### [x] Task 2.1: Create `bst.html`, `bst.js`, `bst-style.css` — BST Page
- **Why**: Main visualization page with tree rendering, playback controls, traversal animation
- **Files**: Create `bst.html`, `bst.js`, `bst-style.css`
- **Verify**: Page loads in browser, insert/traversal/playback controls functional, `npm run lint` passes

### [x] Task 2.2: Add nav links to ALL existing pages
- **Why**: BST must be reachable from every page in the app
- **Files**: Modify `index.html`, `elevator.html`, `bfs.html`, `knapsack.html`, `bubble-sort.html`
- **Verify**: All 6 HTML files contain nav link to `bst.html`

### Phase 2 Gate
- [x] `npm run lint` passes (0 errors)
- [x] `npm test` passes (52 total)
