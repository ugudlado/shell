# Tasks

## Phase 1: Investigate
- [x] Run lint on algorithm files and capture exact warnings with file:line

## Phase 2: Regression Test
- [ ] Write verification that confirms the 2 lint warnings currently exist

## Phase 3: Fix
- [ ] Remove unused `prev` variable in levenshtein-algorithm.js
- [ ] Remove unused `maxFloor` parameter in scan-algorithm.js and update callers
- [ ] Verify lint now produces 0 substantive warnings and all 121+ tests pass
