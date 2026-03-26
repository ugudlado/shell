# Diagnosis: Levenshtein Traceback Info Panel Not Updating

## Bug Summary

The Levenshtein Distance traceback animation does not update the info text panel during traceback steps. Users see the traceback path highlighted on the matrix but get no explanation of which operation (match/substitute/insert/delete) was chosen at each cell. The info panel stays stuck on the last fill-step message.

## Reproduction Steps

1. Open `index.html` in a browser
2. Enter source "kitten" and target "sitting"
3. Click "Visualize", then "Play" (or step through manually)
4. Observe the info panel updates correctly during matrix fill steps
5. After the matrix is fully filled, the traceback path highlights cells in green
6. **Bug**: The info panel stays on the last fill-step message instead of describing the traceback operations

## Root Cause Analysis

Two issues contribute to this bug:

### 1. `showTraceback()` in `script.js` never updates `infoEl`

The `showTraceback()` function (lines 215-223) only:
- Adds `.traceback` CSS class to highlight cells
- Sets `resultEl` text to "Edit distance: N"

It does **not** update `infoEl` with any traceback description.

### 2. `tracebackDescription()` in `levenshtein-algorithm.js` is a stub

The pure algorithm module has a `tracebackDescription()` function (lines 72-76) that returns `""`. Even if `showTraceback()` tried to call it, it would produce no text.

### Data flow gap

- During fill: `stepForward()` -> `updateInfo()` -> writes to `infoEl` using `steps[stepIdx].desc`
- During traceback: `showTraceback()` -> highlights cells, shows distance in `resultEl`, but never writes to `infoEl`

The `traceback` array and `ops` matrix both contain the necessary data — the code just never uses them.

## Affected Files

- `levenshtein-algorithm.js` — `tracebackDescription()` stub needs implementation
- `script.js` — `showTraceback()` needs to update `infoEl`
