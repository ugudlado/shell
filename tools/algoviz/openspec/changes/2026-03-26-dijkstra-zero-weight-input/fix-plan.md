# Dijkstra Zero-Weight Edge Input Fix Plan

## Issue
Edge weight input dialog blocks zero-weight edges due to HTML `input.min="1"` constraint, contradicting the algorithm validation which allows 0-999.

## Fix
Single line change in `dijkstra.js` at line 278:

**Before**:
```javascript
input.min = "1";
```

**After**:
```javascript
input.min = "0";
```

## Rationale
- Algorithm validation (`dijkstra-algorithm.js` line 318) allows `0 <= weight <= MAX_WEIGHT`
- Spec defines valid range as 0-999
- Browser-level input constraint was unnecessarily restrictive
- Fix aligns HTML validation with algorithm specification

## Affected Files
1. `dijkstra.js` (1 change)

## Testing Strategy

### Unit Test (regression test)
In `dijkstra-algorithm.test.js`, verify:
- [ ] **Test: zero-weight edge handling**
  - Input: graph with edges including weight=0
  - Expected: algorithm processes zero-weight edges correctly, shortest path accounts for them
  - Verify: no negative results, path calculation is correct

### Integration Test (UI)
Manual testing on `dijkstra.html`:
- [ ] **Test: zero-weight input accepted**
  - Create two nodes A and B
  - Switch to "Add Edge" mode
  - Set weight to 0
  - Verify: edge is created with weight 0
  - Verify: edge displays "0" on canvas

- [ ] **Test: zero-weight path selection**
  - Create graph: A →(0)→ B, A →(1)→ B
  - Run Dijkstra from A to B
  - Verify: shortest path is A → B via the 0-weight edge
  - Verify: distance shown is 0

- [ ] **Test: validation boundaries**
  - Attempt weight -1: should be rejected (algorithm validation)
  - Attempt weight 0: should be accepted
  - Attempt weight 999: should be accepted (MAX_WEIGHT)
  - Attempt weight 1000: should be rejected (exceeds MAX_WEIGHT)

## Impact Assessment
- **Breaking change?** No — relaxes an artificial restriction
- **Backward compatible?** Yes — existing graphs remain valid
- **Side effects?** None — fix is isolated to input constraint

## Call Sites Verified
From Phase 1 diagnosis:
- `dijkstra.js` line 278: **1 occurrence only**

No other input elements use hardcoded `min="1"` in Dijkstra code.

## Post-Fix Verification Checklist
- [ ] Fix applied correctly (line 278 changed)
- [ ] Lint passes: `npm run lint` (no warnings in dijkstra.js)
- [ ] Format passes: `npm run format:check`
- [ ] Manual UI test: zero-weight edge creatable
- [ ] Manual UI test: zero-weight path selection correct
- [ ] Algorithm tests pass: `npm test` (including zero-weight edge cases)
- [ ] No regressions: existing graphs with positive weights still work

## Time Estimate
5-10 minutes for fix + testing

## Documentation Update
None required — change is self-explanatory and bug fix, not new feature.
