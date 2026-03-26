# Dijkstra Zero-Weight Edge Input Fix Tasks

## Bugfix: Zero-Weight Edge Input Validation

### Phase 1: Problem Diagnosis (COMPLETED)
- [x] Identified issue: `input.min = "1"` in dijkstra.js line 278
- [x] Root cause: HTML5 validation contradicts algorithm specification (0-999 valid)
- [x] Verified single call site: only 1 occurrence in dijkstra.js
- [x] Confirmed impact: blocks valid zero-weight edges

### Phase 2: Fix Implementation
- [ ] **Task 2.1**: Apply fix to dijkstra.js
  - File: `/home/user/shell/tools/algoviz/dijkstra.js`
  - Line 278: Change `input.min = "1";` to `input.min = "0";`
  - Verify: no other changes needed

- [ ] **Task 2.2**: Verify lint passes
  - Run: `npm run lint`
  - Expected: no new warnings in dijkstra.js

- [ ] **Task 2.3**: Verify format passes
  - Run: `npm run format:check`
  - Expected: no formatting issues

### Phase 3: Regression Testing
- [ ] **Task 3.1**: Test zero-weight edge creation (UI)
  - Open `dijkstra.html` in browser
  - Create two nodes A, B
  - Switch to "Add Edge" mode
  - Click A → B
  - Enter weight "0" in dialog
  - Click OK
  - Expected: Edge A→B with weight 0 appears on canvas
  - Verify: edge label shows "0"

- [ ] **Task 3.2**: Test zero-weight in pathfinding
  - Setup: create graph A →(0)→ B, A →(5)→ C, B →(3)→ C
  - Set source: A
  - Run Dijkstra to C
  - Expected shortest path: A → B → C (distance 3)
  - NOT A → C (distance 5)
  - Verify: distance table shows A=0, B=0, C=3

- [ ] **Task 3.3**: Test input validation boundaries
  - Attempt weight -1:
    - Expected: rejection message "Weight must be 0-999"
  - Attempt weight 0:
    - Expected: edge created successfully ✓
  - Attempt weight 999:
    - Expected: edge created successfully
  - Attempt weight 1000:
    - Expected: rejection message "Weight must be 0-999"

- [ ] **Task 3.4**: Test backward compatibility
  - Load a preset graph (has positive weights only)
  - Run Dijkstra
  - Expected: works exactly as before (no behavior change)
  - Verify: all paths and distances correct

- [ ] **Task 3.5**: Test algorithm correctly rejects invalid inputs
  - Run existing algorithm tests: `npm test`
  - Expected: all tests pass (including zero-weight edge tests if present)
  - Verify: no regression in algorithm validation

### Phase 4: Validation Checklist
- [ ] Code change is minimal (1 line)
- [ ] Lint: `npm run lint` passes with no warnings
- [ ] Format: `npm run format:check` passes
- [ ] Zero-weight edge UI test passes
- [ ] Zero-weight pathfinding test passes
- [ ] Input boundary tests pass (reject <0, accept 0-999, reject >999)
- [ ] Backward compatibility verified (existing graphs still work)
- [ ] Algorithm tests pass

## Expected Time: 10-15 minutes

## Rollback Plan
If regression detected:
1. Revert dijkstra.js line 278 to `input.min = "1";`
2. Rerun tests
3. Investigate root cause if tests still fail

## Success Criteria
- Zero-weight edges can be created and used in Dijkstra
- All existing functionality remains unchanged
- No lint or format warnings introduced
- Algorithm correctly handles zero-weight edges in shortest-path calculation

## Notes
- This is a BUGFIX, not a feature
- Change resolves contradiction between spec and implementation
- No documentation update needed
- No new test code required (algorithm already has zero-weight tests or should handle them correctly)
