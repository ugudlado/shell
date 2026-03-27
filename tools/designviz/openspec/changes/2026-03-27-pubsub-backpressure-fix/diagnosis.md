# Diagnosis: Pub/Sub Backpressure Queue Depth Counter Freeze

## Symptoms

When a slow subscriber's queue fills up during auto-publish and then catches up (queue drains to 0), the queue depth counter in the canvas visualization and processing behavior become inconsistent on subsequent publish bursts:

1. The `_tickCount` processing state on subscriber objects is never reset when the queue drains to empty
2. When new messages arrive after a drain, processing timing is unpredictable — the subscriber may process the first message immediately or after a stale partial tick count expires
3. The `startProcessing()` function is called only once during broker initialization and has no mechanism to recover if the interval is disrupted

## Root Cause

In `pubsub.js`, the `startProcessing()` interval callback (lines 438-455) tracks per-subscriber tick counts via `sub._tickCount` to simulate variable processing speeds. When a subscriber's queue drains to 0:

```javascript
if (!sub || sub.queue.length === 0) return;  // early return — _tickCount NOT reset
```

The early return skips the `_tickCount` logic entirely. The stale `_tickCount` value persists. When new messages arrive, the tick counter resumes from its stale position rather than starting fresh, causing:
- Inconsistent processing delay for the first message after catchup
- The queue depth counter appears to "freeze" because the first message sits unprocessed for a variable number of ticks

Additionally, `startProcessing()` is only called from `addTopic()` when the broker is first created (line 472). There is no mechanism to restart processing if it were ever interrupted.

## Affected Files

| File | Lines | Issue |
|------|-------|-------|
| `pubsub.js` | 443 | `_tickCount` not reset when queue drains to 0 |
| `pubsub.js` | 434-456 | `startProcessing()` called only once, no restart mechanism |

## Severity

Medium — visual glitch that causes queue animation to show incorrect timing after subscriber catchup. No data loss, but misleading visualization.
