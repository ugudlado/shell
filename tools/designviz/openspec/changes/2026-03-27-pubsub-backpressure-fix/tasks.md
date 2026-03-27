# Tasks: Pub/Sub Backpressure Queue Depth Counter Fix

## Phase 1: Investigate
- [x] 1.1 Read pubsub.js and pubsub-algorithm.js completely
  - **Why**: Understand the processing interval and queue drain logic
  - **Files**: pubsub.js, pubsub-algorithm.js
  - **Verify**: Root cause identified and documented in diagnosis.md

## Phase 2: Regression Test
- [x] 2.1 Add test proving _tickCount is not reset on queue drain
  - **Why**: Prove the bug exists — after queue drains and refills, processing should resume immediately from tick 0
  - **Files**: pubsub-algorithm.test.js
  - **Verify**: Test FAILS before fix (demonstrates stale _tickCount behavior), PASSES after fix

## Phase 3: Fix
- [ ] 3.1 Reset _tickCount when queue drains to 0 in startProcessing callback
  - **Why**: Fix-plan item 1 — ensure consistent processing timing after subscriber catchup
  - **Files**: pubsub.js (1 call site, line 443)
  - **Verify**: Regression test passes, `npm test` passes, `npm run lint` passes
