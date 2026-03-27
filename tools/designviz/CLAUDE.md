# DesignViz — Interactive Software Engineering Design Concepts Teacher

Interactive web-based visualizations for software engineering design concepts.

## Development

```bash
cd tools/designviz

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

Each design concept is a standalone page:
- `[concept].html` — page structure + nav
- `[concept].js` — visualization + UI logic
- `[concept]-style.css` — concept-specific styles
- `[concept]-algorithm.js` — pure logic (no DOM, testable in Node)
- `[concept]-algorithm.test.js` — Node.js tests for correctness

Shared: `style.css` (nav bar, dark theme base)

## Code Rules (from AlgoViz reviewer learnings)

These rules come from real issues found during code review. Follow them to avoid repeating mistakes.

### DRY: Tested code == Runtime code
- If `[concept]-algorithm.js` exports a function, the UI in `[concept].js` MUST call that function — never duplicate the logic inline
- If tests pass but the UI calls different code, the tests prove nothing
- One source of truth per concept — algorithm file is the source, UI file consumes it

### Edge Case Testing (mandatory for feature-tdd)
- Always test: zero capacity, zero rates, boundary conditions, burst scenarios, window edges
- For rate limiters: test exact boundary (capacity exhaustion), refill timing, concurrent requests
- For all concepts: test degenerate inputs that expose off-by-one errors

### Input Bounds
- Every input field must have max length/value validation
- Guard against unbounded values (cap rates, capacities, window sizes)
- Display clear error message when input exceeds bounds

### Visualization UX
- If spec promises a visualization feature, it MUST be implemented — not just the algorithm
- Test UX with extreme cases: minimum AND maximum values — does the layout work for both?
- Use `textContent` not `innerHTML` for user-visible text (XSS prevention)
- Clean up timers on reset/page unload (prevent memory leaks)
- Timer cleanup accuracy: use `clearTimeout` for `setTimeout` timers, `clearInterval` for `setInterval` timers — they are not interchangeable

### Style Consistency
- Algorithm files: IIFE pattern, `var` for broad compatibility
- UI files: IIFE pattern, `const`/`let`
- CSS: prefix concept-specific classes (e.g., `rl-` for rate-limiter) to avoid collisions with shared styles

### Bugfix Regression Tests
- Regression tests MUST exercise the actual fixed code path — not simulate the fix manually in test setup
- If the fix is in a UI file (e.g., `pubsub.js`), the test must call through that UI code or extract the fixable logic to a testable module
- A valid regression test FAILS on the unfixed code and PASSES on the fixed code — if it passes either way, it proves nothing

### Nav Links
- When adding a new page, update nav in ALL existing `.html` files — not just index.html

### CSS Prefix Verification
- After implementing CSS, grep for unprefixed class names — self-reported "prefixed" is insufficient without exhaustive check
- Run: `grep -P 'class="(?!concept-prefix-)' [concept]-style.css` to verify all classes use the feature prefix

### Display Values
- Never derive user-visible counts (request count, token count) from array.length — compute from explicit state
- If any operation mutates user input, disclose the transformation in the UI

### TDD Test Quality
- Every test assertion must be falsifiable — disjunctions that accept any outcome are invalid (e.g., `assert(A || B)` where one is always true)
- Before marking a RED test task complete, confirm the test actually FAILS without the implementation

## Adding a New Design Concept

1. Create `[concept]-algorithm.js` with pure functions (no DOM, IIFE, exports via global)
2. Create `[concept]-algorithm.test.js` with `module.exports = { runTests }` — test edge cases
3. Create `[concept].html` (include `[concept]-algorithm.js` via script tag BEFORE `[concept].js`)
4. Create `[concept].js` — UI calls functions from algorithm module, no logic duplication
5. Create `[concept]-style.css` with prefixed class names
6. Add nav link to ALL existing `.html` files
7. Update `package.json` lint script with new globals
8. Run `npm test && npm run lint` before committing
