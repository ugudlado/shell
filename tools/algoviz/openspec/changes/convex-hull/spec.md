# Convex Hull Visualization (Graham Scan)

## Motivation
Add a Convex Hull visualization to AlgoViz using the Graham Scan algorithm. Users click to place points on a 2D canvas, then watch the algorithm build the convex hull step-by-step. This is a geometry algorithm not yet represented in AlgoViz.

## Real-World Analogy
A rubber band stretched around nails on a board — the hull is the shape the rubber band forms.

## Acceptance Criteria

1. **Click-to-place**: Users click on a canvas to place points; each click adds a point
2. **Random generator**: Button generates N random points (configurable, 5-50, default 20)
3. **Polar sort animation**: After clicking "Visualize", animate the polar sort phase — points fan out from the pivot (lowest-y point) showing angular ordering
4. **Hull building animation**: Animate the stack-based left-turn test, showing each point being tested and either added to or rejected from the hull
5. **Evolving hull outline**: Draw the growing hull outline as edges are added/removed
6. **Discarded points**: Interior points that fail the left-turn test are visually highlighted as discarded
7. **Playback controls**: Play, Pause, Step Forward, Step Back, Reset, Speed slider (consistent with other AlgoViz pages)
8. **Stats panel**: Show current step count, points on hull, points processed
9. **Edge cases handled**: 0 points (message), 1 point (single dot), 2 points (line segment), collinear points (handled correctly), all same point, 50+ points
10. **Nav integration**: Page linked from ALL 15 existing pages and index
11. **Algorithm module**: Pure algorithm in `convex-hull-algorithm.js`, tested in `convex-hull-algorithm.test.js`, called by `convex-hull.js` (no logic duplication)

## Schema
feature-rapid (--rapid)
