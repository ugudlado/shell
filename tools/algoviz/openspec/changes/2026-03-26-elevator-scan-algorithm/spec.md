# Spec: Elevator (SCAN Disk Scheduling) Algorithm Visualization

## Motivation

AlgoViz currently only visualizes Levenshtein Distance. Adding SCAN disk scheduling (elevator algorithm) visualization expands the tool's scope and teaches a fundamentally different algorithm category — disk/elevator scheduling — with animated movement that makes the algorithm's behavior intuitive.

## Requirements

### Functional Requirements

1. **SCAN Algorithm Implementation**: Implement the SCAN (elevator) disk scheduling algorithm correctly:
   - Accept a list of floor/track requests and an initial position
   - Accept an initial direction (up or down)
   - Service requests in the current direction first, then reverse
   - When reaching the boundary (top floor or bottom floor), reverse direction
   - Calculate total distance (seek time) traveled

2. **Visual Elevator Shaft**: Display a vertical shaft with numbered floors (0 to max floor)
   - Elevator car that visually moves between floors
   - Direction indicator (arrow showing up/down)
   - Highlight the current floor being serviced

3. **Request Queue Display**: Show pending, current, and completed requests
   - Color-coded status: pending (gray), current (blue), completed (green)
   - Show the order in which requests will be serviced

4. **Step-by-Step Execution**:
   - Play/Pause/Step controls (matching existing Levenshtein UI pattern)
   - Speed control slider
   - Reset button
   - Step backward support
   - Info panel explaining each step

5. **Statistics**: Display total distance traveled, requests serviced count

6. **Navigation**: Add navigation between algorithms (Levenshtein <-> Elevator)

### Non-Functional Requirements

- Pure HTML/CSS/JS (no frameworks) — consistent with existing codebase
- Dark theme matching existing style
- Responsive layout
- Algorithm module must be pure functions (no DOM dependency) for testability

## Architecture

### File Structure
```
tools/algoviz/
  index.html          -- updated: add nav links
  elevator.html       -- new: elevator visualization page
  elevator-style.css  -- new: elevator-specific styles
  elevator.js         -- new: UI/animation logic
  scan-algorithm.js   -- new: pure SCAN algorithm (testable)
  scan-algorithm.test.html -- new: test runner page
  style.css           -- existing: shared base styles
  script.js           -- existing: Levenshtein (unchanged)
```

### Module Separation
- `scan-algorithm.js` exports pure functions (no DOM) — the algorithm logic
- `elevator.js` handles DOM, animation, and UI — consumes the algorithm module

## Acceptance Criteria

1. User can enter floor requests, initial position, initial direction, and max floor
2. Clicking "Visualize" shows the elevator shaft with all floors
3. Step/Play shows the elevator moving to each request in SCAN order
4. Direction reversal is visually clear (arrow changes)
5. Total distance counter updates with each move
6. Request queue shows pending/active/completed status
7. Navigation links between Levenshtein and Elevator pages work
8. All algorithm tests pass

## Test Strategy

### Test Files
- `tools/algoviz/scan-algorithm.test.html` — browser-based test runner with assertions

### Key Test Scenarios
1. Basic SCAN going up: requests [2, 9, 6, 4, 1], start=5, direction=up, maxFloor=10 => order: [6, 9, 4, 2, 1]
2. Basic SCAN going down: requests [2, 9, 6, 4, 1], start=5, direction=down, maxFloor=10 => order: [4, 2, 1, 6, 9]
3. Edge case: no requests => empty result, distance=0
4. Edge case: single request => services immediately, correct distance
5. Edge case: all requests in one direction => no reversal needed
6. Distance calculation: verify total seek distance is correct
7. Boundary behavior: request at floor 0 and max floor
8. Duplicate requests: handled correctly
9. Start position equals a request position

### Coverage Approach
- Console-based assertions in test.html (no external test framework needed)
- Tests run in browser, report pass/fail counts
- Target: 100% of algorithm logic paths covered
