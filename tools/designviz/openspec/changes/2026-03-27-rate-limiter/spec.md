# Rate Limiter Visualization

## Motivation

Rate limiting is a critical API design concept that developers encounter daily (Stripe API: 100 req/s, GitHub API: 5000 req/hr). Understanding token bucket vs sliding window algorithms requires seeing them in action — watching tokens drain, requests get rejected (429), and buckets refill over time.

## Requirements

### Functional
1. **Token Bucket algorithm** — configurable capacity and refill rate; tokens consumed per request; 429 rejection when empty
2. **Sliding Window algorithm** — configurable window size and max requests; request tracking with timestamps; 429 rejection when window full
3. **Side-by-side comparison** — both algorithms visible simultaneously with identical request streams
4. **Single request** — user sends one request, sees accept/reject decision with reason
5. **Flood mode** — burst of N requests to demonstrate rate limiting under load
6. **Real-time refill** — token bucket visually refills tokens at the configured rate
7. **Request log** — scrolling list of recent requests with timestamp, status (200/429), and algorithm state
8. **Real-world presets** — Stripe API (100 req/s, bucket=100) and GitHub API (5000 req/hr, window=3600s)

### Non-Functional
- Pure algorithm logic separated from UI (testable in Node.js)
- All user inputs bounded (capacity: 1-1000, refill rate: 0-100/s, window: 1-3600s)
- Timer cleanup on page unload
- CSS prefixed with `rl-`
- textContent for all user-visible text

## Acceptance Criteria

1. Token bucket correctly accepts requests when tokens > 0, rejects (429) when tokens == 0
2. Token bucket refills at configured rate, never exceeds capacity
3. Sliding window correctly counts requests within window, rejects when count >= max
4. Sliding window expires old requests as time passes
5. Side-by-side view shows both algorithms processing the same request stream
6. Flood mode sends N requests rapidly, showing mixed accept/reject results
7. All inputs validated with bounds, error shown for invalid input
8. Presets correctly configure both algorithms (Stripe, GitHub)
9. Request log shows timestamped entries with status codes
10. Timer cleanup on beforeunload — no leaked intervals

## Test Strategy

- **Test file**: `rate-limiter-algorithm.test.js`
- **Coverage target**: >= 90% of algorithm functions
- **Key scenarios**:
  - Token bucket: accept when tokens available, reject when empty, refill timing, capacity cap, zero capacity, zero refill rate
  - Sliding window: accept within limit, reject at limit, window expiry, window boundary edge cases
  - Edge cases: 0 capacity, 0 refill rate, burst at exact boundary, single-request window
- **Coverage tool**: Manual count (pure JS, no build tool)
