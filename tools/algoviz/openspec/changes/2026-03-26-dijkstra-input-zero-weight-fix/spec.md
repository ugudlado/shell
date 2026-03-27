# Dijkstra's Algorithm — Zero-Weight Edge Input Bug Fix

**Feature Type:** bugfix

**Issue Date:** 2026-03-26

## Problem Summary

The Dijkstra edge weight input validation blocks zero-weight edges via an HTML5 constraint, contradicting both the algorithm validation and the specification.

**Contradiction:**
- **Specification** (from existing spec.md): Allows weights 0-999
- **Algorithm validation** (dijkstra-algorithm.js line 318): Accepts 0 as valid minimum
- **HTML Input** (dijkstra.js line 278): Rejects 0 with `input.min = "1"`

**Impact:**
- Users cannot create graphs with zero-weight edges (valid use case: instantaneous transitions, zero-cost edges)
- Prevents testing edge cases where a zero-weight shortcut exists
- Inconsistent user experience: algorithm says yes, UI says no

## Real-World Scenario

Consider a navigation graph where:
- Two routes from A to B
- Route 1: Normal path with cost 5
- Route 2: Special zero-cost path (e.g., teleport, instant transfer, subsidized corridor)

**Current behavior:** Cannot create Route 2 because UI rejects weight 0
**Expected behavior:** Accept weight 0, run Dijkstra, shortest path uses zero-cost route

## Root Cause

**File:** `/home/user/shell/tools/algoviz/dijkstra.js`
**Line:** 278
**Code:**
```javascript
input.min = "1";  // Incorrectly blocks zero-weight edges
```

This enforces browser-level validation, preventing users from entering 0 despite the algorithm supporting it.

## Specification Requirement

From the Dijkstra spec:
```
Input range: edge weights 0-999 (inclusive)
Algorithm validation allows 0-999
Users should be able to create any graph within these bounds
```

## Expected Behavior

1. **User enters weight 0**: Browser input accepts it (passes HTML5 validation)
2. **Algorithm processes it**: Dijkstra treats zero-weight edges normally (zero cost)
3. **Shortest path uses it**: If a zero-weight edge is shorter, it's selected
4. **UI displays it**: Edge renders with label "0"

## Fix

**Single line change in `dijkstra.js` at line 278:**

**Before:**
```javascript
input.min = "1";
```

**After:**
```javascript
input.min = "0";
```

**Rationale:**
- Aligns HTML5 validation with algorithm validation
- Matches specification (0-999 valid)
- No logic changes required
- Backward compatible (existing graphs unaffected)

## Affected Files

1. **dijkstra.js** — 1 change (line 278)

**Verification (Phase 1 grep):**
```bash
$ grep -n 'input.min' dijkstra.js
278: input.min = "1";
```
**Total call sites: 1**

## Testing Strategy

### Unit Tests (dijkstra-algorithm.test.js)

#### Test: Zero-weight edge handling
- **Setup**: Graph with edges including weight 0
- **Action**: Run Dijkstra from source to destination via zero-weight edge
- **Expected**: Path selected uses zero-weight edge, distance is correct
- **Verify**:
  - No negative distances
  - Path is shortest (prefers zero-weight option when available)

Example test graph:
```
A →(0)→ B
A →(5)→ C →(1)→ B
```
From A to B: shortest is A → B (distance 0), not A → C → B (distance 6)

### Integration Tests (UI Manual)

#### Test 1: Zero-weight input acceptance
1. Load `dijkstra.html`
2. Create two nodes (A, B)
3. Switch to "Add Edge" mode
4. Click from A to B
5. Weight dialog appears
6. Type "0" in weight field
7. **Expected**: Input accepts 0 (field shows as valid)
8. Click OK or press Enter
9. **Expected**: Edge created successfully with weight 0

#### Test 2: Zero-weight edge display
1. Create edge with weight 0 (from Test 1)
2. **Expected**: Edge renders on canvas
3. **Expected**: Edge label displays "0" (not blank, not "1")

#### Test 3: Zero-weight path selection
1. Create graph:
   ```
   Node A at (100, 100)
   Node B at (300, 100)
   Edge A→B weight 0
   Edge A→B via C: A→(cost 1)→C→(cost 1)→B
   ```
2. Click "Run Dijkstra"
3. Select start node: A
4. Select end node: B
5. **Expected**: Shortest path is A → B (direct zero-weight edge)
6. **Expected**: Distance displayed is 0
7. **Expected**: Path is highlighted correctly

#### Test 4: Validation boundaries (edge cases)
1. Create edge, weight field appears
2. Try to enter weight -1:
   - **Expected**: Rejected by algorithm validation or HTML5 (shows error)
3. Try to enter weight 0:
   - **Expected**: Accepted (after fix)
4. Try to enter weight 999:
   - **Expected**: Accepted
5. Try to enter weight 1000:
   - **Expected**: Rejected (exceeds MAX_WEIGHT)

### Regression Tests

Verify that existing positive-weight graphs still work:
1. Load an existing example graph (if available)
2. Run Dijkstra
3. **Expected**: Same results as before the fix

## Success Criteria

- [ ] Fix applied: `dijkstra.js` line 278 changed from `"1"` to `"0"`
- [ ] Lint passes: `npm run lint` produces no warnings
- [ ] Format passes: `npm run format:check` passes
- [ ] Unit test passes: Zero-weight edge algorithm test (if added)
- [ ] Integration Test 1 passes: Zero-weight input accepted
- [ ] Integration Test 2 passes: Edge displays "0" on canvas
- [ ] Integration Test 3 passes: Shortest path uses zero-weight edge
- [ ] Integration Test 4 passes: Boundary validation correct
- [ ] Regression: Existing graphs still work with positive weights

## Impact Assessment

**Breaking change?** No
- This relaxes a restriction, does not change existing functionality
- Existing graphs with positive weights remain valid
- No API or logic changes

**Backward compatible?** Yes
- All existing graphs continue to work
- This is purely additive (enables previously-blocked use case)

**Side effects?** None
- Change is isolated to input constraint
- Algorithm handles zero-weight edges correctly
- No ripple effects to other code

**User impact:** Positive
- Users can now create zero-weight edges as documented in spec
- Enables important edge case testing
- Aligns UI promise with algorithm capability

## Time Estimate

- Fix: 1 minute (single line change)
- Unit test (optional): 5 minutes
- Integration testing: 10-15 minutes
- Total: 10-15 minutes (with testing)

## Verification Checklist

### Pre-Fix
- [ ] Confirmed: `dijkstra.js` line 278 has `input.min = "1"`
- [ ] Confirmed: `dijkstra-algorithm.js` allows weight 0
- [ ] Confirmed: Spec says 0-999 valid range

### Fix Applied
- [ ] Changed line 278 to `input.min = "0"`
- [ ] No other changes to dijkstra.js
- [ ] No changes to dijkstra-algorithm.js

### Code Quality
- [ ] `npm run lint` passes
- [ ] `npm run format:check` passes
- [ ] No new warnings introduced

### Testing
- [ ] Manual test: Can input weight 0
- [ ] Manual test: Edge displays "0" on canvas
- [ ] Manual test: Zero-weight path selected correctly
- [ ] Boundary test: -1 rejected, 0 accepted, 999 accepted, 1000 rejected
- [ ] Regression test: Positive-weight graphs still work

### Documentation
- [ ] No doc changes needed (fix is self-explanatory)

## Related Issues

**None** — This is a standalone input validation bug with no dependencies.

## Notes for Reviewer

This is a straightforward 1-line bugfix that removes an artificial restriction:
- The spec already allows 0
- The algorithm already supports 0
- Only the UI was blocking it

The fix is isolated, has no side effects, and enables important edge cases (zero-cost edges in graphs, pathfinding shortcuts, etc.).
