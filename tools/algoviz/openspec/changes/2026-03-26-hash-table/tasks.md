# Hash Table Visualization — Tasks

## Phase 1: Algorithm Module

### Task 1.1: Implement hash-table-algorithm.js
- **Why**: Core hash table logic needed before UI
- **Files**: `hash-table-algorithm.js` (create)
- **Verify**: Module exports `HashTableAlgorithm` with all functions

### Task 1.2: Implement hash-table-algorithm.test.js
- **Why**: Verify algorithm correctness
- **Files**: `hash-table-algorithm.test.js` (create)
- **Verify**: `npm test` passes with comprehensive coverage

### Task 1.3: Phase 1 gate
- **Verify**: `npm test && npm run lint` pass

## Phase 2: UI + Visualization

### Task 2.1: Create hash-table.html
- **Files**: `hash-table.html` (create)
- **Verify**: Page loads with nav, controls, bucket area, stats panel

### Task 2.2: Create hash-table-style.css
- **Files**: `hash-table-style.css` (create)
- **Verify**: All classes use `ht-` prefix

### Task 2.3: Create hash-table.js
- **Files**: `hash-table.js` (create)
- **Verify**: Insert/search/delete work, phonebook preset, stats, playback

### Task 2.4: Update nav on all existing pages
- **Files**: All 11 `.html` files (modify nav)
- **Verify**: Every HTML file has Hash Table nav link

### Task 2.5: Update package.json lint script
- **Files**: `package.json` (modify)
- **Verify**: `npm run lint` passes with new files

### Task 2.6: Phase 2 gate
- **Verify**: `npm test && npm run lint` pass
