# Hash Table Visualization — Tasks

## Phase 1: Algorithm Module

### Task 1.1: Implement hash-table-algorithm.js
- **Why**: Core algorithm module needed before UI — all hash table logic lives here
- **Files**: `hash-table-algorithm.js` (create)
- **Verify**: Module loads in Node.js, `HashTableAlgorithm.hash("test", 10)` returns deterministic result, `insert`/`search`/`remove` return step objects with required fields

### Task 1.2: Implement hash-table-algorithm.test.js
- **Why**: Verify algorithm correctness with edge cases
- **Files**: `hash-table-algorithm.test.js` (create)
- **Verify**: `npm test` passes all tests including: empty table, single element, hash determinism, collision chaining, search found/not-found, remove existing/missing, single-bucket table, phonebook generation, bulk insert

### Task 1.3: Update package.json lint config
- **Why**: New global `HashTableAlgorithm` and new UI file need linting
- **Files**: `package.json` (modify)
- **Verify**: `npm run lint` passes with new files included

## Phase 2: UI Implementation

### Task 2.1: Create hash-table.html
- **Why**: Page structure with nav, controls, visualization container
- **Files**: `hash-table.html` (create)
- **Verify**: Page loads in browser, nav has all 12 pages, controls present, algorithm script loaded before UI script

### Task 2.2: Create hash-table-style.css
- **Why**: Algorithm-specific styles with `ht-` prefix
- **Files**: `hash-table-style.css` (create)
- **Verify**: All classes use `ht-` prefix, dark theme consistent with other pages

### Task 2.3: Create hash-table.js (UI logic)
- **Why**: Visualization and playback — consumes HashTableAlgorithm (no logic duplication)
- **Files**: `hash-table.js` (create)
- **Verify**: Insert/search/delete work with step-by-step animation, phonebook mode loads sample data, playback controls functional, input validation shows errors

## Phase 3: Integration

### Task 3.1: Add nav link to all 11 existing HTML pages
- **Why**: Every page must link to every other page (completion criterion #7)
- **Files**: `index.html`, `elevator.html`, `bfs.html`, `dfs.html`, `knapsack.html`, `bubble-sort.html`, `bst.html`, `merge-sort.html`, `binary-search.html`, `lcs.html`, `dijkstra.html` (modify)
- **Verify**: Each of the 11 files contains `<a href="hash-table.html">Hash Table</a>` in nav

### Task 3.2: Final quality gate
- **Why**: All quality gates must pass
- **Files**: none (verification only)
- **Verify**: `npm test` passes, `npm run lint` passes, all 12 HTML files have consistent nav
