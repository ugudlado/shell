# Diagnosis: Levenshtein Traceback Info Panel Not Updated

## Bug Description

The Levenshtein Distance traceback animation does not update the info text panel during traceback steps. Users see the traceback path highlighted on the matrix but get no explanation of which operation (match/substitute/insert/delete) was chosen at each cell. The info panel stays stuck on the last fill-step message.

## Reproduction Steps

1. Open `index.html` in a browser
2. Enter source "kitten" and target "sitting" (or use defaults)
3. Click "Visualize", then click "Play" or step through all cells
4. Once the matrix is fully filled, the traceback path highlights on the matrix
5. **Observe**: The info panel (`#info`) still shows the last fill-step message (e.g., "Step 56/56 -- Cell (6,7): ...")
6. **Expected**: The info panel should describe each traceback cell's operation

## Root Cause Analysis

In `script.js`, the `showTraceback()` function (lines 215-223):

```javascript
function showTraceback() {
    clearTraceback();
    for (const c of traceback) {
      cells[c.i][c.j].classList.add("traceback");
    }
    const dist = dp[source.length][target.length];
    resultEl.textContent = "Edit distance: " + dist;
    resultEl.classList.remove("hidden");
}
```

This function:
1. Adds the `traceback` CSS class to each cell on the optimal path -- correct
2. Shows the final edit distance in the result element -- correct
3. Does **NOT** update `infoEl` with any traceback-specific information -- **the bug**

The traceback is displayed as a single batch operation (all cells highlighted at once). There is no step-by-step traceback animation, and crucially, no info text explains which operation was chosen at each traceback cell.

The `ops[i][j]` array already stores the operation for each cell (match/substitute/insert/delete), so the data is available -- it's just not surfaced in the info panel during traceback.

## Affected Code

- `script.js`: `showTraceback()` function (line 215-223)
- The `ops` array and `steps` array both contain per-cell operation data that could be used

## Severity

Low -- cosmetic/educational quality issue. The visualization still works correctly; users just miss the educational explanation of the traceback path.
