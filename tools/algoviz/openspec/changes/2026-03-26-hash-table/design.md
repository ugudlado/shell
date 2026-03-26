# Hash Table Visualization — Design

## Architecture

### Files
| File | Purpose |
|------|---------|
| `hash-table-algorithm.js` | Pure hash table logic (IIFE, var, no DOM) |
| `hash-table-algorithm.test.js` | Node.js tests for algorithm correctness |
| `hash-table.html` | Page structure + nav |
| `hash-table.js` | UI logic + visualization (IIFE, const/let) |
| `hash-table-style.css` | Styles with `ht-` prefix |

### Algorithm Module (`hash-table-algorithm.js`)

Global: `HashTableAlgorithm`

**Functions:**
- `createTable(bucketCount)` — returns `{ buckets: Array<Array<{key, value}>>, bucketCount, size }`
- `hash(key, bucketCount)` — returns `{ charCodes: number[], sum: number, index: number }`
- `insert(table, key, value)` — returns `{ table, steps, collision }`
- `search(table, key)` — returns `{ found, value, steps, bucketIndex, chainIndex }`
- `remove(table, key)` — returns `{ table, removed, steps }`
- `getStats(table)` — returns `{ size, bucketCount, loadFactor, longestChain, collisionCount, emptyBuckets }`

**Hash function:** Sum of character codes modulo bucket count.

### UI Module (`hash-table.js`)

- Renders buckets as columns with chained entries as stacked cards
- Animates insert/search/delete operations step-by-step
- Playback controls reuse the standard AlgoViz pattern
- Phonebook preset: name-phone pairs demonstrating distribution and collisions

### Color Scheme (dark theme)
- Empty bucket: `#21262d` border
- Occupied entry: `#58a6ff` border
- Active/hashing: `#d29922` (yellow)
- Collision highlight: `#f85149` (red)
- Found/success: `#2ea043` (green)
- Chain traversal: `#bc8cff` (purple)

## Component Interactions
- UI calls `HashTableAlgorithm.*` functions — no logic duplication
- UI is purely a renderer of algorithm state
