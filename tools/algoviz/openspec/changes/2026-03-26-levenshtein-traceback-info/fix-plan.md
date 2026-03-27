# Fix Plan: Levenshtein Traceback Info Panel

## Fix Approach

### 1. Implement `tracebackDescription()` in `levenshtein-algorithm.js`

Walk the traceback array and for each consecutive pair of cells, determine the operation from the `ops` matrix. Build a human-readable string describing each step.

### 2. Update `showTraceback()` in `script.js` to set info panel text

After highlighting traceback cells, build a traceback summary and update `infoEl`.

## Affected Files

| File | Change | Risk |
|------|--------|------|
| `levenshtein-algorithm.js` | Implement `tracebackDescription()` body | Low |
| `script.js` | Add info panel update in `showTraceback()` | Low |

## Risk Assessment

- **Low risk**: Both changes are additive. Traceback highlighting and distance display remain unchanged.
- No changes to algorithm computation or matrix fill logic.
- The `tracebackDescription()` function signature already exists and is already exported.
