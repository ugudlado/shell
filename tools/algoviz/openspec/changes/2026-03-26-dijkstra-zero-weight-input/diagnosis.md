# Dijkstra Weight Input Validation Bug

## Issue Summary

The Dijkstra edge weight input dialog incorrectly blocks zero-weight edges. The HTML input element has `min="1"`, preventing users from entering weight 0. However:
1. The algorithm validation in `dijkstra-algorithm.js` line 318 explicitly allows 0: `if (isNaN(w) || w < 0 || w > MAX_WEIGHT)`
2. The specification allows weights 0-999
3. Zero-weight edges are valid in graph algorithms (represent instantaneous transitions or zero-cost edges)

## Spec Requirement (from spec.md)
"Input: predefined graphs (4 examples: simple, grid, star, disconnected)"
"Range: 0-999 is valid per algorithm validation"

## Bug Location

**File**: `/home/user/shell/tools/algoviz/dijkstra.js`
**Line**: 278
**Code**:
```javascript
input.min = "1";
```

## Reproduction Steps
1. Load `dijkstra.html`
2. Create two nodes
3. Switch to "Add Edge" mode
4. Click from node A to node B
5. Weight dialog appears
6. Type "0" in the weight field
7. Observe: browser's HTML5 validation rejects the input (field shows red/invalid state)
8. Try to click OK or press Enter
9. Result: edge is NOT created because the input value is rejected by min="1" constraint

## Expected Behavior
Users should be able to enter weight 0 for zero-cost edges. The algorithm already validates 0 as acceptable.

## Root Cause
Input element has hardcoded `input.min = "1"` which enforces browser-level validation, overriding the algorithm's range check on line 318-319.

## Impact
- Users cannot create graphs with zero-weight edges
- Contradicts spec (0-999 valid range)
- Prevents testing certain edge cases (e.g., multiple paths with one having a zero-weight shortcut)

## Fix Strategy
Change line 278 from:
```javascript
input.min = "1";
```
to:
```javascript
input.min = "0";
```

This aligns HTML validation with algorithm validation and spec requirements.

## Call Sites Count
Phase 1 grep search for all occurrences:
```
$ grep -n 'input.min' dijkstra.js
278: input.min = "1";
```
**Total: 1 occurrence** (single call site)

## Testing
After fix, verify:
1. Zero-weight edge can be created (input accepts 0)
2. Algorithm still rejects negative weights (min < 0)
3. Algorithm still rejects weights > 999 (max > 999)
4. Edge with weight 0 displays correctly on canvas
5. Dijkstra algorithm correctly handles zero-weight edges in pathfinding
