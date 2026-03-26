# Tasks: Interactive Levenshtein Distance Visualization

## Phase 1: Core Algorithm & Matrix Rendering

### Task 1.1: HTML structure and CSS styling
- **Why**: Foundation for the entire visualization -- layout, inputs, matrix container, controls, legend
- **Files**: `tools/algoviz/index.html`, `tools/algoviz/style.css`
- **Verify**: Open index.html in browser -- input fields, empty matrix area, control buttons, and legend are visible and properly styled

### Task 1.2: Levenshtein algorithm with step recording
- **Why**: Core computation that produces the DP matrix, operations, step sequence, and traceback path
- **Files**: `tools/algoviz/script.js`
- **Verify**: Call `computeLevenshtein("kitten", "sitting")` in console -- returns matrix with value 3 at [7][7], steps array has (7+1)*(7+1)=64 entries, traceback path exists

### Task 1.3: Matrix rendering and cell coloring
- **Why**: Visual representation of the DP matrix with color-coded operations
- **Files**: `tools/algoviz/script.js`, `tools/algoviz/style.css`
- **Verify**: After computing, renderMatrix() creates a table with correct dimensions, filled cells show correct colors and operation labels

## Phase 2: Playback Controls & Polish

### Task 2.1: Step-by-step playback engine
- **Why**: Enables animated step-through of the algorithm -- play, pause, step forward/backward, reset
- **Files**: `tools/algoviz/script.js`
- **Verify**: Play fills cells with animation, pause stops it, step forward/backward moves one cell, reset clears all

### Task 2.2: Speed control and operation info display
- **Why**: User controls pacing and sees what operation is happening at each step
- **Files**: `tools/algoviz/script.js`, `tools/algoviz/index.html`
- **Verify**: Speed slider changes animation rate, info panel shows operation description at each step

### Task 2.3: Traceback path highlighting and final result
- **Why**: Shows the optimal alignment and the final edit distance
- **Files**: `tools/algoviz/script.js`, `tools/algoviz/style.css`
- **Verify**: After all steps complete, traceback cells are highlighted with distinct styling, edit distance number displayed prominently
