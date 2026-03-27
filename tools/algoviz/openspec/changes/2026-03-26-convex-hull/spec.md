# Convex Hull — Graham Scan Visualization

## Motivation
Add an interactive convex hull visualization using the Graham Scan algorithm. Users click to place points on a 2D canvas, then watch the algorithm build the convex hull step-by-step. The visualization animates the polar sort phase (points fanning from the pivot) and the stack-based left-turn test (eliminating concave points one by one). Interior points are visually distinguished from hull vertices.

Real-world analogy: a rubber band stretched around nails on a board.

## Requirements

### Functional
1. **Click-to-place points**: Users click on a canvas to place points; each click adds a point at that position
2. **Random points generator**: Button generates N random points (configurable count, default 10, max 50)
3. **Graham Scan algorithm**: Correct implementation with polar-angle sorting from lowest-y pivot
4. **Polar sort animation**: Animate the sorting phase showing points fanning from pivot in angular order
5. **Hull building animation**: Step through the stack-based algorithm, showing the left-turn test and elimination of concave points
6. **Hull outline**: Draw the evolving hull outline as edges are added/removed
7. **Interior points**: Discarded interior points are visually highlighted differently from hull vertices
8. **Playback controls**: Play, Pause, Step Forward, Step Back, Reset, Speed slider
9. **Edge cases**: Handle 0, 1, 2, collinear, duplicate, and large (50+) point sets gracefully
10. **Stats display**: Show current step count, hull size, points processed

### Non-Functional
- Pure algorithm module (no DOM) for testability
- CSS prefix `hull-` for all algorithm-specific classes
- `textContent` for all user-visible text (no innerHTML)
- Timer cleanup on reset/page unload
- Nav links updated in ALL 15 existing pages

## Acceptance Criteria
- [ ] Canvas accepts click input to place points
- [ ] Random button generates N points within canvas bounds
- [ ] Graham Scan produces correct convex hull for all edge cases
- [ ] Polar sort phase is animated with visual fan effect
- [ ] Hull building phase animates stack pushes/pops with left-turn test
- [ ] Hull outline rendered as connected edges
- [ ] Interior points visually distinct from hull vertices
- [ ] All playback controls functional (play/pause/step/reset/speed)
- [ ] Edge cases handled: 0, 1, 2, collinear, all-same, 50+ points
- [ ] Nav link added to all 15 existing pages + new page has full nav
- [ ] `npm test && npm run lint` passes
- [ ] Algorithm module is the single source of truth (UI calls it, no duplication)
