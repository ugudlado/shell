# Convex Hull — Technical Design

## Architecture

Follows the standard AlgoViz pattern:

| File | Purpose |
|------|---------|
| `convex-hull-algorithm.js` | Pure Graham Scan algorithm, IIFE with `var`, exports `ConvexHullAlgorithm` |
| `convex-hull-algorithm.test.js` | Node.js tests via `runTests()` |
| `convex-hull.html` | Page structure, nav, canvas, controls |
| `convex-hull.js` | UI logic, canvas rendering, animation, calls algorithm module |
| `convex-hull-style.css` | Styles with `hull-` prefix |

## Algorithm Design

### Graham Scan Steps
1. **Find pivot**: Lowest y-coordinate point (leftmost if tie)
2. **Polar sort**: Sort remaining points by polar angle from pivot (collinear → by distance)
3. **Build hull**: Initialize stack with pivot + first sorted point, iterate remaining:
   - While top two stack points and current point make a clockwise (right) turn, pop
   - Push current point onto stack
4. **Result**: Stack contains hull vertices in counter-clockwise order

### Step Recording
The algorithm records steps for animation:
- `type: 'pivot'` — pivot selection
- `type: 'sort'` — polar sort result with angles
- `type: 'push'` — point pushed onto hull stack
- `type: 'test'` — left-turn test (pass/fail)
- `type: 'pop'` — point popped (concave, eliminated)
- `type: 'done'` — hull complete

Each step includes: `{ type, stack, currentPoint, testedPoint, eliminated, hull, explanation }`

### Edge Cases
- 0 points: return empty hull
- 1 point: return single point as hull
- 2 points: return both points as hull (line segment)
- Collinear: all points on a line — hull is the two endpoints
- All same point: hull is single point
- 50+ points: algorithm handles efficiently (O(n log n))

## Canvas Design

- HTML5 `<canvas>` element, 700x500px (responsive)
- Dark background (#161b22) matching project theme
- Click-to-place: mousedown handler adds point at click coordinates
- Points rendered as circles (6px radius)
- Hull edges rendered as lines between stack points
- Color scheme:
  - Default points: #8b949e (gray)
  - Pivot: #f0883e (orange)
  - Current test point: #388bfd (blue)
  - Hull vertex: #2ea043 (green)
  - Eliminated/interior: #f85149 (red, smaller)
  - Hull edges: #58a6ff (bright blue)
  - Sort fan lines: #d29922 (yellow, during polar sort phase)

## UI Layout
```
[Nav bar]
[Title: AlgoViz — Convex Hull]
[Controls: Point Count input | Random | Clear | Build Hull]
[Playback: Reset | Step Back | Play | Pause | Step Forward | Speed]
[Info panel]
[Legend]
[Canvas]
[Stats: Steps | Hull Size | Points]
[Real-world note about rubber band]
```
