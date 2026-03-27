# Fix Plan: Pub/Sub Backpressure Queue Depth Counter Freeze

## Fix Strategy

Minimal fix targeting the root cause: reset `_tickCount` when subscriber queue drains to 0 so processing timing is consistent after catchup.

## Changes

### 1. Reset `_tickCount` on queue drain (pubsub.js)

In the `startProcessing()` interval callback, when `sub.queue.length === 0`, reset `sub._tickCount = 0` before returning. This ensures the next message after catchup starts a fresh processing cycle.

**Call sites**: 1 location in `pubsub.js` — the `startProcessing()` interval callback, line 443.

### 2. No other files affected

The `_tickCount` property is only read/written inside the `startProcessing()` interval callback in `pubsub.js`. No other files reference it.

## Risk Assessment

- **Low risk**: Single-line change in UI processing logic
- **No algorithm changes**: `pubsub-algorithm.js` is untouched — the bug is in the UI timer management
- **No API changes**: No function signatures modified
- **Backward compatible**: Resetting a counter to 0 on empty queue is strictly safer than leaving it stale

## Verification

1. Regression test: fill queue, drain completely, refill — verify queue drains again with correct timing
2. Existing tests continue to pass (algorithm module unchanged)
3. Lint passes
