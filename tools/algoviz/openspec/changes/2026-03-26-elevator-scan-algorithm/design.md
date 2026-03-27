# Design: Elevator (SCAN) Algorithm Visualization

## Component Breakdown

### 1. Algorithm Module (`scan-algorithm.js`)

Pure functions, no DOM dependency. Exported via global object for browser compatibility.

```js
ScanAlgorithm = {
  solve(requests, startPosition, direction, maxFloor) -> { order, distances, totalDistance, steps }
  // Returns:
  //   order: [floor, ...] — the sequence of floors serviced
  //   distances: [dist, ...] — distance traveled to reach each floor
  //   totalDistance: number — sum of all distances
  //   steps: [{position, target, direction, action, distanceSoFar}, ...] — per-step state for animation
}
```

**Algorithm Logic:**
1. Split requests into `above` (>= start) and `below` (< start) relative to start position
2. Sort `above` ascending, `below` descending
3. If direction is "up": service `above` first, then reverse, service `below`
4. If direction is "down": service `below` first, then reverse, service `above`
5. Track cumulative distance at each step

### 2. Animation/UI Module (`elevator.js`)

Handles all DOM interaction, animation, and playback state.

**State:**
- `steps[]` — from algorithm solve result
- `stepIdx` — current step index (-1 = initial)
- `isPlaying`, `timer` — playback state

**UI Components:**
- Elevator shaft (vertical div stack of floors)
- Elevator car (positioned absolutely, animated via CSS transform)
- Request queue panel (list of request badges)
- Info panel (step description)
- Stats panel (distance, serviced count)
- Playback controls (reuses button pattern from Levenshtein)

**Animation approach:**
- CSS transitions on the elevator car's `transform: translateY()`
- Transition duration adjusts based on distance to travel and speed setting
- Floor highlighting via class toggling

### 3. Elevator Page (`elevator.html`)

HTML structure:
- Nav bar (links to index.html and elevator.html)
- Input controls: requests input, start position, direction select, max floor, Visualize button
- Playback controls (Play, Pause, Step, Step Back, Reset, Speed)
- Info panel
- Legend
- Main visualization area: shaft + queue side by side
- Stats/result area

### 4. Styles (`elevator-style.css`)

Imports shared variables from style.css approach (colors, fonts).
Elevator-specific:
- `.shaft` — vertical container with relative positioning
- `.floor` — horizontal row with floor number
- `.elevator-car` — positioned element with CSS transition
- `.request-badge` — inline badge with status colors
- `.queue-panel` — sidebar showing request order

## Data Flow

```
User Input → ScanAlgorithm.solve() → steps[] → Playback Engine → DOM Updates
                                                                   ↓
                                                          Elevator car position
                                                          Floor highlights
                                                          Queue badge states
                                                          Distance counter
                                                          Info text
```

## Navigation Pattern

Both index.html and elevator.html get a top nav bar:
```html
<nav class="algo-nav">
  <a href="index.html">Levenshtein Distance</a>
  <a href="elevator.html" class="active">Elevator (SCAN)</a>
</nav>
```
