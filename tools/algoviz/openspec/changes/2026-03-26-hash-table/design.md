# Hash Table Visualization — Technical Design

## Component Breakdown

### 1. hash-table-algorithm.js (Pure Algorithm Module)
- IIFE pattern, `var` declarations, exports `HashTableAlgorithm` global
- Node.js compatible via `module.exports`

**Functions:**
- `createTable(size)` — returns a table object `{ buckets: Array<Array<{key, value}>>, size: number }`
- `hash(key, tableSize)` — computes hash: sum of char codes mod tableSize; returns `{ index, computation: string }` showing the math
- `insert(table, key, value)` — inserts key-value; returns step object with: table state, target bucket, collision (boolean), chain position, explanation
- `search(table, key)` — searches for key; returns array of steps (hash computation, bucket navigation, chain traversal, found/not-found)
- `remove(table, key)` — removes key; returns array of steps (hash, bucket navigation, chain traversal, removal, result)
- `generatePhonebook()` — returns array of `{key, value}` sample phonebook entries
- `insertAll(size, entries)` — bulk inserts, returns `{ table, steps[] }` with all intermediate states

**Step object shape:**
```
{
  table: { buckets: [...], size },
  action: "insert" | "search" | "remove" | "hash",
  targetBucket: number,
  key: string,
  value: string | null,
  collision: boolean,
  chainIndex: number,
  found: boolean | null,
  explanation: string
}
```

### 2. hash-table-algorithm.test.js (Tests)
- Tests for: hash determinism, insert basic, insert collision/chaining, search found/not-found, remove existing/missing, empty table ops, single bucket (all collide), max entries, phonebook generation

### 3. hash-table.html (Page Structure)
- Standard AlgoViz page with nav bar (12 items now including Hash Table)
- Controls: key input, value input, table size input, Insert/Search/Delete/Phonebook/Clear buttons
- Playback controls: Reset, Step Back, Play, Pause, Step Forward, Speed slider
- Hash computation display area
- Bucket visualization container
- Stats: entries count, collisions count, load factor

### 4. hash-table.js (UI Module)
- IIFE, `const`/`let`
- Calls `HashTableAlgorithm` functions — no duplicated logic
- Renders buckets as vertical columns with chained entries as linked boxes
- Animates: hash computation highlight, bucket highlight, chain traversal, insert/remove
- Manages playback state (play/pause/step/reset)
- Input validation with error messages

### 5. hash-table-style.css (Styles)
- All classes prefixed with `ht-`
- Bucket visualization: horizontal row of vertical bucket columns
- Chain entries: stacked boxes within each bucket with connector lines
- Color scheme: consistent with AlgoViz dark theme
  - Default bucket: `#8b949e` (gray)
  - Target/active bucket: `#388bfd` (blue)
  - Collision: `#d29922` (yellow)
  - Found/success: `#2ea043` (green)
  - Not found/removed: `#f85149` (red)

## Data Flow
1. User enters key-value + clicks Insert
2. UI calls `HashTableAlgorithm.insert(table, key, value)`
3. Algorithm returns step(s) with table state + explanation
4. UI stores steps, renders initial state, enables playback
5. Playback steps through states, highlighting active bucket/chain node
