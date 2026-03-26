# Hash Table Visualization

## Motivation

Hash tables are one of the most fundamental data structures in computer science, yet the mechanism by which keys are mapped to buckets and how collisions are resolved remains opaque to many learners. This visualization demystifies hash tables by showing the hashing process step-by-step, using a real-world phonebook/dictionary analogy where entries are stored by first letter.

## Requirements

### Functional
1. Users can enter key-value pairs (e.g., name-phone number) into input fields
2. A hash function maps each key to a bucket index, shown visually with animation
3. The hash table displays as an array of buckets (0 to N-1)
4. Collision resolution uses chaining (linked lists within buckets)
5. When a collision occurs, the new entry is appended to the chain and the collision is highlighted
6. Users can search for a key and watch the lookup process step-by-step
7. Users can delete a key and watch the removal process
8. A "phonebook mode" pre-populates with name-phone entries grouped by first letter to demonstrate the concept
9. Step-by-step playback with play/pause/step/reset controls (consistent with other AlgoViz pages)
10. Speed control slider for animation tempo

### Non-Functional
- Pure algorithm module with no DOM dependencies (hash-table-algorithm.js)
- UI module consumes algorithm module — no logic duplication
- IIFE pattern, `var` for algorithm module, `const`/`let` for UI module
- CSS prefix: `ht-` for all algorithm-specific classes
- Nav link added to ALL 11 existing HTML pages
- Input validation: key max 30 chars, value max 30 chars, table size 2-26 buckets

## Acceptance Criteria
1. Entering a key-value pair and clicking "Insert" hashes the key, highlights the target bucket, and adds the entry
2. Inserting a key that collides with an existing bucket shows chaining — the new node appends to the chain
3. Searching for a key shows the hash computation, navigates to the correct bucket, and walks the chain to find or report "not found"
4. Deleting a key removes it from its chain with visual feedback
5. Phonebook mode loads sample data showing natural clustering (names by first letter)
6. Hash function computation is displayed (e.g., "hash('Alice') = sum of char codes % tableSize = 3")
7. Bucket count is configurable (2-26)
8. All 11 existing pages have nav link to hash-table.html
9. `npm test` passes with hash-table-algorithm.test.js tests
10. `npm run lint` passes with no errors
