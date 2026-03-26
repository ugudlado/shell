# Hash Table Visualization

## Motivation
Hash tables are one of the most widely used data structures, yet how keys map to buckets and how collisions are resolved remains opaque to learners. This visualization demystifies hashing by letting users insert key-value pairs and watch them hash into buckets with collision chaining — using the analogy of a phonebook organized by first letter.

## Schema
`feature-rapid` — interactive visualization tool, no TDD requirements.

## Requirements

### Functional
1. Users can enter a key (string, max 20 chars) and a value (string, max 20 chars) and insert into the hash table
2. A simple hash function maps keys to bucket indices (sum of char codes mod bucket count)
3. The hash computation is shown step-by-step: display each character's code, the sum, and the modulo result
4. Buckets are displayed as vertical columns; each entry in a bucket is a node in a chain (collision resolution via chaining)
5. When a collision occurs, the new entry is appended to the chain with a visual highlight
6. Users can delete entries by key
7. Users can search for a key and see the lookup path highlighted
8. A "Load Phonebook" preset populates the table with name/phone entries
9. Bucket count is configurable (default 8, range 2-16)
10. Step-by-step playback controls (play, pause, step, reset) for insert/search operations
11. Stats panel: total entries, load factor, longest chain, collision count

### Non-Functional
- Consistent with AlgoViz dark theme and nav pattern
- CSS prefix: `ht-` for all algorithm-specific classes
- Pure algorithm module (IIFE, var) separate from UI
- Works for 1 entry and 20+ entries

## Acceptance Criteria
- [ ] Insert key-value pairs and see them hash into the correct bucket
- [ ] Collision chaining is visually clear (stacked nodes in same bucket)
- [ ] Hash computation shown step-by-step (char codes, sum, modulo)
- [ ] Search highlights the lookup path through the chain
- [ ] Delete removes an entry and updates the visualization
- [ ] Phonebook preset loads sample data
- [ ] Bucket count is adjustable (2-16)
- [ ] Stats panel shows load factor, longest chain, collision count
- [ ] Nav link added to all 11 existing pages + new page
- [ ] npm test passes (algorithm tests)
- [ ] npm run lint passes
