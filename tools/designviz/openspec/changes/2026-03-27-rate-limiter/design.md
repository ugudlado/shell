# Rate Limiter — Technical Design

## Architecture

### Files
| File | Purpose |
|------|---------|
| `rate-limiter-algorithm.js` | Pure algorithm logic (IIFE, `var`, no DOM) — Token Bucket + Sliding Window |
| `rate-limiter-algorithm.test.js` | Node.js tests for algorithm correctness |
| `index.html` | Page structure, nav, side-by-side layout |
| `rate-limiter.js` | UI logic — visualization, request animation, controls |
| `rate-limiter-style.css` | Styles prefixed with `rl-` |

### Algorithm Module (`RateLimiterAlgorithm`)

Exported functions:

```
createTokenBucket(capacity, refillRate) -> { type, capacity, tokens, refillRate, lastRefillTime }
createSlidingWindow(windowSize, maxRequests) -> { type, windowSize, maxRequests, requests[] }
handleRequest(limiter, timestamp) -> { allowed: bool, status: 200|429, reason: string, state: {...} }
refillTokens(bucket, currentTime) -> bucket (mutated, tokens capped at capacity)
getWindowRequestCount(window, currentTime) -> number
createPreset(name) -> { tokenBucket: {...}, slidingWindow: {...} }
```

### State Model

**Token Bucket**:
- `tokens`: current available tokens (float, 0..capacity)
- `capacity`: max tokens
- `refillRate`: tokens per second
- `lastRefillTime`: timestamp of last refill calculation
- `totalRequests`, `acceptedRequests`, `rejectedRequests`: counters

**Sliding Window**:
- `requests[]`: array of timestamps within current window
- `windowSize`: window duration in seconds
- `maxRequests`: max requests per window
- `totalRequests`, `acceptedRequests`, `rejectedRequests`: counters

### UI Layout

```
[Nav Bar]
[Title: Rate Limiter — Token Bucket vs Sliding Window]
[Controls: capacity, refill rate, window size, max requests | Presets: Stripe, GitHub]
[Error message area]
[Buttons: Send Request | Flood (10) | Reset]
[Side-by-side: Token Bucket Panel | Sliding Window Panel]
  Each panel:
    - Visual bucket/window indicator
    - Stats: tokens/count, accepted, rejected, total
    - Request log (scrolling, most recent first)
```

### Timer Management

- Single `setInterval` for token refill (updates every 100ms)
- `beforeunload` event listener clears all intervals
- Reset button clears and restarts intervals
