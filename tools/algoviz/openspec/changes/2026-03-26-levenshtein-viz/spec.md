# Interactive Levenshtein Distance Visualization

**Feature ID**: 2026-03-26-levenshtein-viz
**Schema**: feature-rapid
**Status**: Draft

## Motivation

The Levenshtein (edit distance) algorithm is fundamental to computer science but hard to understand from code alone. Students and developers benefit from seeing the dynamic programming matrix being filled step-by-step, with each cell's operation visually distinguished. Existing visualizers are often static or lack operation-level color coding.

AlgoViz needs an interactive, animated visualization that makes the algorithm intuitive by showing:
- How the DP matrix is constructed cell by cell
- Which operation (insert, delete, substitute, match) each cell represents
- Playback controls for self-paced learning
- The final edit distance result

## Requirements

### Functional

1. **String Input**: Two text input fields for source and target strings, with sensible defaults
2. **Matrix Display**: Render the full (m+1) x (n+1) DP matrix as an HTML table
3. **Step-by-Step Playback**: Fill cells one at a time (row-major order), animating the current cell
4. **Color-Coded Operations**: Each cell colored by its operation:
   - Green = match (characters equal, diagonal, no cost)
   - Yellow = substitute (diagonal, cost +1)
   - Blue = insert (from above, cost +1)
   - Red = delete (from left, cost +1)
5. **Playback Controls**: Play, Pause, Step Forward, Step Backward, Reset, Speed slider
6. **Operation Display**: Show the current operation description (e.g., "Substituting 'a' -> 'b', cost = 3")
7. **Final Result**: Display the edit distance prominently when complete
8. **Traceback Path**: Highlight the optimal alignment path after completion

### Non-Functional

1. Pure HTML/CSS/JS -- no build tools, no dependencies
2. Works in modern browsers (Chrome, Firefox, Safari, Edge)
3. Responsive layout for different screen sizes
4. Accessible color scheme with text labels (not just color)

## Acceptance Criteria

- [ ] Entering two strings and clicking "Visualize" shows the empty matrix
- [ ] Clicking "Play" fills the matrix cell by cell with animation
- [ ] Each cell is color-coded by operation type
- [ ] Step forward/backward moves one cell at a time
- [ ] Speed slider controls animation speed
- [ ] Current operation is described in text
- [ ] Final edit distance is displayed when complete
- [ ] Traceback path is highlighted after completion
- [ ] Works with empty strings, single characters, and strings up to 20 chars
