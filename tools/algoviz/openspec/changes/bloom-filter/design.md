# Bloom Filter Visualization — Design

## Architecture

### Files
- bloom-filter-algorithm.js — Pure algorithm module (IIFE, var, exports via global BloomFilterAlgorithm)
- bloom-filter-algorithm.test.js — Node.js tests
- bloom-filter.js — UI/visualization (IIFE, const/let, calls BloomFilterAlgorithm)
- bloom-filter-style.css — Styles, all classes prefixed bloom-
- bloom-filter.html — Page structure + nav

### Algorithm Module API (BloomFilterAlgorithm)

createFilter(m, k) -> { bits: Array(m) of 0s, m, k, insertedWords: {}, n: 0 }
hash(word, seed, m) -> index (0..m-1)  // deterministic FNV-1a with seed
getHashIndices(word, k, m) -> [index0, ..., indexK-1]
insert(filter, word) -> { indices: [...], alreadyPresent: bool }
query(filter, word) -> { indices: [...], allBitsSet: bool, isKnownInserted: bool, result: "true-positive"|"true-negative"|"false-positive" }
getFalsePositiveRate(n, m, k) -> number  // (1 - e^(-kn/m))^k
getFillLevel(filter) -> { setBits: number, total: number, percentage: number }
reset(m, k) -> new filter

### Hash Function
FNV-1a variant with seed mixing for deterministic, well-distributed indices.

### Query Result Classification
- true-positive: all k bits set AND word in insertedWords
- true-negative: at least one bit is 0
- false-positive: all k bits set AND word NOT in insertedWords

### Color Scheme
- Unset bit (0): #21262d (dark)
- Set bit (1): #58a6ff (blue)
- Insert highlight: #3fb950 (green)
- True positive query: #3fb950 (green)
- True negative query: #f85149 (red)
- False positive: #d29922 (amber)

### Password Blacklist Preset
Words: password, 123456, qwerty, letmein, admin, welcome, monkey, dragon
Sequential insertion with 300ms delay, live FP rate and fill meter updates.

### Edge Cases
- Empty string -> reject with error
- Query on empty filter -> true negative
- All bits set -> warn, FP rate ~100%
- Duplicate insert -> note already inserted, show indices
- Long word -> max 30 chars
