# AlgoViz — Visual Algorithm Teacher

Interactive web-based algorithm visualizations for CS education.

## Development

```bash
cd tools/algoviz

# Lint JavaScript
npm run lint

# Run tests (Node.js)
npm test

# Format check
npm run format:check

# Auto-format
npm run format
```

## Quality Gates

| Check | Command | When |
|-------|---------|------|
| JS Lint | `npm run lint` | Every phase gate |
| Tests | `npm test` | Every phase gate (feature-tdd), final validation |
| Format | `npm run format:check` | Before commit |

## Architecture

Each algorithm is a standalone page:
- `[algo].html` — page structure + nav
- `[algo].js` — visualization + UI logic
- `[algo]-style.css` — algorithm-specific styles
- `[algo]-algorithm.js` — pure algorithm (no DOM, testable in Node)
- `[algo]-algorithm.test.js` — Node.js tests for algorithm correctness

Shared: `style.css` (nav bar, dark theme base)

## Code Rules (from reviewer learnings)

These rules come from real issues found during code review. Follow them to avoid repeating mistakes.

### DRY: Tested code == Runtime code
- If `[algo]-algorithm.js` exports a function, the UI in `[algo].js` MUST call that function — never duplicate the logic inline
- If tests pass but the UI calls different code, the tests prove nothing
- One source of truth per algorithm — algorithm file is the source, UI file consumes it

### Edge Case Testing (mandatory for feature-tdd)
- Always test: empty input, single element, already-sorted, reverse-sorted, all duplicates, max size (20+)
- For tree structures: test degenerate/skewed trees, not just balanced ones
- For bugfix: test empty source, empty target, single-char operations

### Input Bounds
- Every input field must have max length/value validation
- Guard against unbounded recursive depth (cap tree size, array size)
- Display clear error message when input exceeds bounds

### Visualization UX
- If spec promises a visualization feature (e.g., "recursion tree"), it MUST be implemented — not just the algorithm
- Test UX with extreme cases: 1 element AND 20 elements — does the layout work for both?
- Use `textContent` not `innerHTML` for user-visible text (XSS prevention)
- Clean up timers on reset/page unload (prevent memory leaks)
- Timer cleanup accuracy: use `clearTimeout` for `setTimeout` timers, `clearInterval` for `setInterval` timers — they are not interchangeable

### Style Consistency
- Algorithm files: IIFE pattern, `var` for broad compatibility
- UI files: IIFE pattern, `const`/`let`
- CSS: prefix algorithm-specific classes (e.g., `ms-` for merge-sort) to avoid collisions with shared styles

### Nav Links
- When adding a new page, update nav in ALL existing `.html` files — not just index.html

### CSS Prefix Verification
- After implementing CSS, grep for unprefixed class names — self-reported "prefixed" is insufficient without exhaustive check
- Run: `grep -P 'class="(?!algo-prefix-)' [algo]-style.css` to verify all classes use the feature prefix
- After renaming CSS classes, grep for old names as both standalone AND compound selectors (e.g., `td.traceback.old-name`) — old compounds become dead code

### Display Values
- Never derive user-visible counts (step count, progress) from array.length — compute from explicit state
- If any operation mutates user input (sort, filter, normalize), disclose the transformation in the UI

### TDD Test Quality
- Every test assertion must be falsifiable — disjunctions that accept any outcome are invalid (e.g., `assert(A || B)` where one is always true)
- Before marking a RED test task complete, confirm the test actually FAILS without the implementation

### Bugfix Accuracy
- When fix-plan.md lists a count of affected call sites, take it verbatim from Phase 1 grep output — no estimation
- Regression tests must assert post-fix behavior (absence of bug), not tolerance of the old pattern

## Adding a New Algorithm

1. Create `[algo]-algorithm.js` with pure functions (no DOM, IIFE, exports via global)
2. Create `[algo]-algorithm.test.js` with `module.exports = { runTests }` — test edge cases
3. Create `[algo].html` (include `[algo]-algorithm.js` via script tag BEFORE `[algo].js`)
4. Create `[algo].js` — UI calls functions from algorithm module, no logic duplication
5. Create `[algo]-style.css` with prefixed class names
6. Add nav link to ALL existing `.html` files
7. Update `package.json` lint script with new globals
8. Run `npm test && npm run lint` before committing
