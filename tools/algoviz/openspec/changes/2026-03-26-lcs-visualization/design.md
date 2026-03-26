# LCS Visualization — Design

## Architecture

Follows the standard AlgoViz pattern (5 files):

| File | Purpose |
|------|---------|
| `lcs-algorithm.js` | Pure LCS algorithm (IIFE, `var`, no DOM) |
| `lcs-algorithm.test.js` | Node.js tests for algorithm correctness |
| `lcs.html` | Page structure with nav |
| `lcs.js` | UI/visualization logic (IIFE, calls algorithm module) |
| `lcs-style.css` | Styles prefixed with `lcs-` |

## Algorithm Module API

```js
LCSAlgorithm.solve(strA, strB)
// Returns: { dp, steps, traceback, lcsString }
```

- `dp`: 2D array of LCS lengths
- `steps`: Array of { row, col, value, isMatch, explanation }
- `traceback`: { path: [{row, col}], lcsString }
- `lcsString`: The actual longest common subsequence

## DP Table Logic

For strings A (length m) and B (length n):
- Table is (m+1) x (n+1)
- dp[0][j] = 0, dp[i][0] = 0 (base cases)
- If A[i-1] === B[j-1]: dp[i][j] = dp[i-1][j-1] + 1 (match, diagonal)
- Else: dp[i][j] = max(dp[i-1][j], dp[i][j-1]) (non-match, take max)

## Traceback

Start at dp[m][n], walk back:
- If A[i-1] === B[j-1]: character is part of LCS, go diagonal (i-1, j-1)
- Else if dp[i-1][j] >= dp[i][j-1]: go up (i-1, j)
- Else: go left (i, j-1)

## Color Scheme

| State | Color | Meaning |
|-------|-------|---------|
| Match | Green (#2ea043) | Characters equal, diagonal move |
| Non-match | Default/gray | Max of left/above |
| Current | White outline | Currently computing |
| Traceback | Purple (#bc8cff) | Part of optimal path |

## Nav Integration

Add `<a href="lcs.html">LCS</a>` to nav in all 9 existing HTML files.
