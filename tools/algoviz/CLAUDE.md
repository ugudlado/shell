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

## Adding a New Algorithm

1. Create `[algo]-algorithm.js` with pure functions (no DOM)
2. Create `[algo]-algorithm.test.js` with `module.exports = { runTests }`
3. Create `[algo].html`, `[algo].js`, `[algo]-style.css`
4. Add nav link to all existing `.html` files
