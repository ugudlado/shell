# Fix Plan: Levenshtein Traceback Info Panel

## Fix Approach

Update `showTraceback()` in `script.js` to set the info panel text with a summary of the traceback path operations. Since the traceback is displayed as a batch (all cells highlighted at once, not animated step-by-step), the info panel should show a summary describing the traceback path.

The fix will:
1. Build a description string listing each step on the traceback path with its operation
2. Set `infoEl.textContent` to this traceback summary when `showTraceback()` is called

## Affected Files

- `script.js` -- modify `showTraceback()` to update `infoEl`

## Risk Assessment

**Very low risk**:
- Single function modification
- No changes to algorithm logic, matrix computation, or cell rendering
- The `ops[i][j]` data is already computed and available
- No new DOM elements needed -- reuses existing `#info` element
