# Bloom Filter — Tasks

## Phase 1: Algorithm Module + Tests

### Task 1.1: bloom-filter-algorithm.js
- Why: Core algorithm logic, pure functions, no DOM
- Files: bloom-filter-algorithm.js
- Verify: node -e "require('./bloom-filter-algorithm.js')" succeeds

### Task 1.2: bloom-filter-algorithm.test.js
- Why: Verify correctness + edge cases
- Files: bloom-filter-algorithm.test.js
- Verify: npm test passes; covers empty filter, insert, query types, FP rate, fill level, edge cases

### Task 1.3: Update package.json lint globals
- Why: Add BloomFilterAlgorithm global
- Files: package.json
- Verify: npm run lint passes

### Phase 1 Gate: npm test && npm run lint

## Phase 2: Visualization UI + Nav

### Task 2.1: bloom-filter.html
- Why: Page structure, nav (all pages), controls, containers
- Files: bloom-filter.html
- Verify: Valid HTML, nav complete

### Task 2.2: bloom-filter-style.css
- Why: Algorithm-specific styles, bloom- prefix
- Files: bloom-filter-style.css
- Verify: All classes prefixed bloom-

### Task 2.3: bloom-filter.js
- Why: UI calls BloomFilterAlgorithm, no duplicated logic
- Files: bloom-filter.js
- Verify: All operations work, textContent used, timers cleaned up

### Task 2.4: Update nav in ALL existing HTML files
- Why: Every page links to Bloom Filter
- Files: All 16 existing .html files + index.html
- Verify: grep bloom-filter.html *.html shows all files

### Task 2.5: Update package.json lint targets
- Why: Add bloom-filter.js to lint
- Files: package.json
- Verify: npm run lint passes

### Phase 2 Gate: npm test && npm run lint
