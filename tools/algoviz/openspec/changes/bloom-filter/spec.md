# Bloom Filter Visualization — Spec

## Schema
feature-rapid

## Motivation
Bloom filters are a fundamental probabilistic data structure used everywhere (databases, caches, network routers, password blacklists). Students struggle to understand why false positives occur and how the math connects to bit-array fill level. An interactive visualization makes this tangible.

## Real-World Context
Website "have you used this password before?" check — a bloom filter lets servers quickly reject known-compromised passwords without storing the full list.

## Requirements

### Functional
1. Display a bit array as a horizontal row of cells (0/1), default size m=32
2. Users type a word and click Insert — k hash functions each light up k bits simultaneously
3. Users type a word and click Query — show true positive (all k bits set, word was inserted), true negative (at least one bit unset), or false positive (all k bits set but word was NOT inserted) in distinct colors
4. Live false-positive-rate formula: P(fp) = (1 - e^(-kn/m))^k — updates as items are inserted
5. "Password Blacklist" preset loads common passwords and shows the filter filling up
6. Fill-level meter (percentage of bits set) with reliability warning when fill > 50%
7. Configurable parameters: m (bit array size, 16-128), k (hash functions, 1-7)

### Non-Functional
8. All algorithm logic in bloom-filter-algorithm.js (pure, no DOM)
9. UI in bloom-filter.js calls algorithm module — no duplicated logic
10. CSS prefixed with bloom-
11. Nav updated in ALL existing HTML files
12. textContent for all user-visible text
13. Timer cleanup on reset
14. Input validation with error messages

## Acceptance Criteria
1. Inserting a word highlights k bits in the bit array
2. Querying an inserted word shows "Probably in set" (true positive) in green
3. Querying a never-inserted word with unset bits shows "Definitely not in set" (true negative) in red
4. False positives are visually distinct (orange/amber) with explanation
5. FP rate formula displays and updates live with each insertion
6. Password blacklist preset inserts 8 common passwords with visible fill progression
7. Fill meter shows percentage and warns when > 50%
8. Parameters m and k are configurable within bounds
9. All edge cases handled: empty filter query, empty string rejection, all-bits-set state
10. Nav links present on all pages
