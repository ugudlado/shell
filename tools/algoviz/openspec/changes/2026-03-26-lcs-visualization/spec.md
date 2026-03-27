# LCS (Longest Common Subsequence) Visualization

## Motivation
Add a Longest Common Subsequence visualization to AlgoViz. LCS is a foundational DP algorithm used in Git diff, DNA sequence alignment, and file comparison tools. Visualizing the DP table being filled step-by-step makes the algorithm intuitive.

## Real-World Context
Git diff uses LCS to find matching lines between file versions — the LCS of two files tells Git which lines are unchanged, and everything else is an insertion or deletion.

## Requirements

### Functional
1. User enters two strings (String A and String B)
2. DP table is built step-by-step, showing each cell computation
3. Color-code cells: match (diagonal, characters equal) vs non-match (take max of left/above)
4. After table is filled, traceback highlights the actual LCS path
5. Display the resulting LCS string
6. Standard playback controls: Play, Pause, Step forward/back, Reset, Speed slider
7. Random example button with preset string pairs

### Input Validation
- Max string length: 15 characters each (prevents oversized tables)
- Non-empty validation on both strings
- Clear error messages

### Acceptance Criteria
- [ ] DP table fills cell-by-cell with step explanations
- [ ] Matches are color-coded differently from non-matches
- [ ] Traceback path is highlighted after table completion
- [ ] LCS string is displayed in result
- [ ] All playback controls work (play, pause, step, back, reset, speed)
- [ ] Input validation enforces max length and non-empty
- [ ] Algorithm module is pure (no DOM), tested, and called from UI module
- [ ] CSS classes prefixed with `lcs-`
- [ ] Nav links added to ALL existing HTML pages
- [ ] npm test && npm run lint pass
