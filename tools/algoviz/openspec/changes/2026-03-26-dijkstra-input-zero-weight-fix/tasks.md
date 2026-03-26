# Dijkstra Zero-Weight Edge Bug — Task Breakdown

**Feature Type:** bugfix

**Estimated Time:** 10-15 minutes

**Scope:** Single targeted fix

## Task Overview

Fix the input validation that incorrectly blocks zero-weight edges in Dijkstra edge creation dialog.

---

## Task 1: Apply Fix
**Time: 1-2 minutes**

### Task 1.1: Modify dijkstra.js
- [ ] Open `/home/user/shell/tools/algoviz/dijkstra.js`
- [ ] Navigate to line 278
- [ ] Change:
  ```javascript
  // FROM:
  input.min = "1";

  // TO:
  input.min = "0";
  ```
- [ ] Save file
- [ ] Verify change was applied correctly (re-open file, check line 278)

### Verification
- [ ] Grep confirms only 1 occurrence of `input.min` in dijkstra.js:
  ```bash
  grep -n 'input.min' /home/user/shell/tools/algoviz/dijkstra.js
  ```
  Should return: `278: input.min = "0";` (with "0", not "1")

---

## Task 2: Code Quality
**Time: 3-5 minutes**

### Task 2.1: Lint Check
- [ ] Run `npm run lint` in `/home/user/shell/tools/algoviz/`
- [ ] Expected: No new warnings
- [ ] If warnings appear in dijkstra.js: Fix them (likely indentation or formatting)

### Task 2.2: Format Check
- [ ] Run `npm run format:check`
- [ ] Expected: Pass (no format violations)
- [ ] If fails: Run `npm run format` to auto-fix, then re-check

### Task 2.3: Verify No Side Effects
- [ ] Visual inspection: No other changes to dijkstra.js
- [ ] Visual inspection: dijkstra-algorithm.js unchanged
- [ ] Confirm: Only line 278 was modified

---

## Task 3: Unit Testing
**Time: 5-10 minutes (optional but recommended)**

### Task 3.1: Check if Zero-Weight Test Exists
- [ ] Open `/home/user/shell/tools/algoviz/dijkstra-algorithm.test.js`
- [ ] Search for "zero" in the test file
- [ ] If zero-weight test exists:
  - [ ] Run `npm test` to verify it passes
  - [ ] It should now confirm algorithm handles zero-weight correctly
- [ ] If NO zero-weight test exists:
  - [ ] This is acceptable for bugfix (no test requirement)
  - [ ] But recommended to add if time permits:
    ```javascript
    function testZeroWeightEdge() {
      // Setup graph with zero-weight edge
      var edges = [
        { from: 0, to: 1, weight: 0 },  // Zero-weight shortcut
        { from: 0, to: 2, weight: 5 },  // Longer route
        { from: 2, to: 1, weight: 1 }   // Another path
      ];
      var result = runDijkstra(nodes, edges, 0, 1);
      // Shortest path to node 1 should use zero-weight edge
      assert(result.distance === 0, 'Zero-weight edge should be shortest');
      assert(result.path[1] === 1, 'Direct path via zero-weight edge');
    }
    ```

### Task 3.2: Run Full Test Suite
- [ ] Run `npm test` in algoviz directory
- [ ] Expected: All tests pass
- [ ] If any test fails: Debug and fix (should be rare for this change)

---

## Task 4: Integration Testing (UI)
**Time: 5-10 minutes**

### Test Setup
- [ ] Open `dijkstra.html` in browser (run local server if needed)
- [ ] Open browser DevTools console (F12)
- [ ] Watch for any errors

### Test 4.1: Zero-Weight Input Acceptance
**Goal: Verify input field accepts 0**

1. [ ] Load `dijkstra.html`
2. [ ] Click "Create New Graph" (if available) or use graph creation mode
3. [ ] Create two nodes:
   - [ ] Click canvas at position (100, 100), name it "A"
   - [ ] Click canvas at position (200, 100), name it "B"
4. [ ] Switch to "Add Edge" mode
5. [ ] Click edge creation: from A to B
6. [ ] Weight dialog appears
7. [ ] Clear any default value in the weight field
8. [ ] Type "0"
9. [ ] **Expected**: Field shows "0" (no red invalid indicator)
10. [ ] Click OK button or press Enter
11. [ ] **Expected**:
    - [ ] No error dialog
    - [ ] Edge appears on canvas
    - [ ] Edge label shows "0"

**If it fails:**
- [ ] Check browser console for errors (F12)
- [ ] Verify fix was applied (grep line 278)
- [ ] Verify browser cached the page (hard refresh: Ctrl+Shift+R)

### Test 4.2: Zero-Weight Edge Display
**Goal: Verify edge displays correctly**

1. [ ] From Test 4.1, edge A→B with weight 0 should exist
2. [ ] [ ] Visually inspect canvas: edge appears between A and B
3. [ ] [ ] Inspect edge label: displays "0" (not "1", not blank)
4. [ ] [ ] Hover over edge or check edge list: weight shows as "0"

### Test 4.3: Zero-Weight Path Selection
**Goal: Verify Dijkstra uses zero-weight edge**

1. [ ] Keep graph from Test 4.1 (nodes A, B with zero-weight edge)
2. [ ] Add a third node C at (100, 200)
3. [ ] Add edge A→C with weight 1
4. [ ] Add edge C→B with weight 1
5. [ ] Now graph is:
   ```
   A →(0)→ B
   A →(1)→ C →(1)→ B
   ```
6. [ ] Click "Run Dijkstra" or "Find Shortest Path"
7. [ ] Select start node: A
8. [ ] Select end node: B
9. [ ] **Expected**:
   - [ ] Dijkstra completes
   - [ ] Path shown: A → B (direct zero-weight edge)
   - [ ] Distance shown: 0
   - [ ] NOT A → C → B (would be distance 2)

**If it fails:**
- [ ] Check console for algorithm errors
- [ ] Verify dijkstra-algorithm.js is processing zero weights correctly
- [ ] Try with weight 1 instead to confirm algorithm works for positive weights

### Test 4.4: Boundary Validation
**Goal: Verify validation still works for invalid weights**

1. [ ] From any graph, try to create edge with invalid weights:
2. [ ] [ ] Weight -1:
   - Try to enter "-1"
   - **Expected**: Either input field rejects it, or algorithm rejects it with error message
   - **Not expected**: Edge created with negative weight
3. [ ] [ ] Weight 0: (should now work)
   - Try to enter "0"
   - **Expected**: Accepted, edge created
4. [ ] [ ] Weight 999:
   - Try to enter "999"
   - **Expected**: Accepted, edge created
5. [ ] [ ] Weight 1000:
   - Try to enter "1000"
   - **Expected**: Rejected (exceeds MAX_WEIGHT typically defined as 999)
   - **Expected**: Error message shown

### Test 4.5: Regression — Positive Weights Still Work
**Goal: Ensure fix didn't break existing functionality**

1. [ ] Create new graph with only positive weights:
   ```
   A →(5)→ B →(3)→ C
   A →(7)→ C
   ```
2. [ ] Run Dijkstra from A to C
3. [ ] **Expected**:
   - [ ] Shortest path: A → B → C (distance 8)
   - [ ] NOT A → C direct (distance 7... wait, that's shorter!)
   - [ ] **Correction**: A → C direct should be shortest (distance 7)
4. [ ] Verify results match pre-fix behavior (no regressions)

---

## Task 5: Final Verification
**Time: 2-3 minutes**

### Pre-Ship Checklist

- [ ] Fix applied: Line 278 shows `input.min = "0"`
- [ ] Only 1 call site modified (verified via grep)
- [ ] No other changes to dijkstra.js
- [ ] No changes to dijkstra-algorithm.js
- [ ] `npm run lint` passes (no warnings)
- [ ] `npm run format:check` passes
- [ ] `npm test` passes (all tests)
- [ ] Test 4.1 passed: Can input weight 0
- [ ] Test 4.2 passed: Edge displays "0" on canvas
- [ ] Test 4.3 passed: Zero-weight path selected correctly
- [ ] Test 4.4 passed: Boundary validation works (-1 rejected, 999 accepted, 1000 rejected)
- [ ] Test 4.5 passed: Positive weights still work (no regressions)
- [ ] Console clean: No errors in DevTools when loading dijkstra.html

### Documentation
- [ ] No doc updates needed (this is a bugfix, not a feature)
- [ ] Code comment update? (optional, not required)
  - Could add: `// Allow zero-weight edges per spec (0-999 valid range)`

### Ready to Ship
- [ ] All checks passed
- [ ] Create git commit:
  ```bash
  git add dijkstra.js
  git commit -m "fix: Allow zero-weight edges in Dijkstra input validation

  - Change input.min from '1' to '0' to allow zero-weight edges
  - Aligns HTML validation with algorithm validation and spec (0-999)
  - Enables edge cases: zero-cost paths, instantaneous transitions
  - Backward compatible: existing graphs unaffected
  - Fixes issue where UI blocked valid user input

  Fixes: Dijkstra zero-weight edge input bug"
  ```

---

## Troubleshooting

### Problem: Change shows in editor but test still fails
**Solution:**
- Hard refresh browser: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Close and reopen browser
- Check browser console for caching errors

### Problem: Lint or format fails after change
**Solution:**
- Run `npm run format` to auto-fix formatting
- Run `npm run lint` to see specific issue
- Common issues: indentation, trailing whitespace
- Check line 278 context (spacing around `input.min`)

### Problem: Zero-weight input still rejected in browser
**Solution:**
- Verify grep shows `input.min = "0"` (not "1")
- Check file was saved correctly
- Check you're editing the right file (`/home/user/shell/tools/algoviz/dijkstra.js`)
- Verify server picked up the change (restart local server if needed)

### Problem: Test 4.3 fails (Dijkstra doesn't use zero-weight edge)
**Solution:**
- Check dijkstra-algorithm.js line 318 for weight validation
- Check algorithm handles zero correctly (not `weight > 0`, but `weight >= 0`)
- Debug: Log the algorithm steps to see why zero-weight edge wasn't selected
- This would indicate a bug in the algorithm itself (beyond scope of this fix)

---

## Success Criteria

✅ Ship when:
1. Fix applied (1 line changed)
2. Lint/format passes
3. Tests pass
4. All 4 integration tests pass (zero accepted, displays correctly, used by algorithm, validation boundaries work)
5. Regression test confirms positive weights still work
6. No console errors

**Estimated time to success: 10-15 minutes**

**If problems: Time estimate increases to 20-30 minutes**
