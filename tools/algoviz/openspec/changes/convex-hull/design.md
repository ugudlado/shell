# Convex Hull — Technical Design

## Files

| File | Purpose |
|------|---------|
| `convex-hull-algorithm.js` | Pure Graham Scan algorithm (IIFE, `var`, no DOM) |
| `convex-hull-algorithm.test.js` | Node.js tests for algorithm correctness |
| `convex-hull.html` | Page structure, canvas, controls, nav |
| `convex-hull.js` | UI logic, canvas rendering, animation, calls algorithm module |
| `convex-hull-style.css` | Styles with `hull-` prefix |

## Algorithm Module API

```js
var ConvexHullAlgorithm = (() => {
  function grahamScan(points) {
    // Returns { steps, hull, pivot, sortedPoints }
    // steps: array of step objects for animation
    // hull: final hull points in order
    // pivot: the starting point (lowest y, leftmost)
    // sortedPoints: points after polar sort
  }
  return { grahamScan };
})();
```

### Step Types
1. **pivot**: Identifies the pivot point (lowest y)
2. **sort**: Shows the polar-sorted order of points
3. **test**: Tests a point — includes current stack, the point being tested, and whether it passes (left turn) or fails (right/collinear turn)
4. **push**: Point added to hull stack
5. **pop**: Point removed from hull stack (failed left-turn test)
6. **done**: Final hull complete

### Step Object Shape
```js
{
  type: "pivot" | "sort" | "test" | "push" | "pop" | "done",
  stack: [...],           // current hull stack (array of point indices)
  currentPoint: index,    // point being processed
  discarded: [...],       // indices of points popped from stack
  explanation: "string",  // human-readable step description
  pointsProcessed: N,     // count of points processed so far
  hullSize: N             // current size of hull stack
}
```

## Canvas Visualization

- Dark background canvas (matches AlgoViz theme)
- Points rendered as circles with index labels
- Pivot point highlighted in distinct color
- Hull edges drawn as lines connecting stack points
- Current test point highlighted
- Discarded points shown in muted/red color
- Sorted order shown with connecting lines during sort phase

## Edge Cases

| Case | Behavior |
|------|----------|
| 0 points | Display message: "Click on canvas to place points" |
| 1 point | Show single point, hull = that point |
| 2 points | Show line segment between points |
| 3+ collinear | Hull = the two extreme endpoints |
| All same point | Hull = single point |
| 50+ points | Works correctly, canvas auto-scales |

## CSS Prefix
All classes use `hull-` prefix to avoid collisions.

## Nav Integration
Add `<a href="convex-hull.html">Convex Hull</a>` to nav in all 16 HTML files (15 existing + new page).
