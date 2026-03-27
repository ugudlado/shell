# Circuit Breaker Visualization — Design

## Architecture

Following DesignViz conventions: algorithm module (pure, testable) + UI module (DOM) + CSS (cb- prefix).

### Files

| File | Purpose |
|------|---------|
| `circuit-breaker-algorithm.js` | Pure state machine: CLOSED/OPEN/HALF-OPEN, failure counting, timeout logic |
| `circuit-breaker-algorithm.test.js` | Tests for state transitions, thresholds, half-open probe |
| `circuit-breaker.html` | Page with nav, state diagram, controls, stats |
| `circuit-breaker.js` | UI: state diagram rendering, request animation, failure rate dial |
| `circuit-breaker-style.css` | Styles with `cb-` prefix |

### Algorithm Module API

```js
var CircuitBreakerAlgorithm = (function() {
  // createCircuitBreaker(options) -> state object
  // sendRequest(breaker, timestamp) -> { allowed, success, state, reason }
  // checkTimeout(breaker, timestamp) -> { transitioned, newState }
  // reset(breaker) -> fresh state
  // getStats(breaker) -> { failures, successes, state, ... }
})();
```

### State Machine

```
CLOSED --[failure count >= threshold]--> OPEN
OPEN --[timeout expires]--> HALF-OPEN
HALF-OPEN --[probe success]--> CLOSED
HALF-OPEN --[probe failure]--> OPEN
CLOSED --[success]--> CLOSED (reset failure count)
```

### State Object

```js
{
  state: "CLOSED" | "OPEN" | "HALF_OPEN",
  failureCount: 0,        // consecutive failures in CLOSED
  successCount: 0,         // total successes
  totalRequests: 0,
  failureThreshold: 5,     // trips to OPEN after this many consecutive failures
  timeout: 5000,           // ms before OPEN -> HALF_OPEN
  openedAt: null,          // timestamp when entered OPEN
  stateHistory: [],        // [{state, timestamp}]
  failureRate: 50,         // 0-100, probability of downstream failure
}
```

### UI Layout

```
[Nav: Rate Limiter | Circuit Breaker (active)]

[Title: Circuit Breaker — State Machine Pattern]

[Controls: Failure Rate slider | Threshold input | Timeout input | Auto-send toggle + interval]
[Buttons: Send Request | Reset]

[State Diagram (SVG/CSS)]     [Request Animation Panel]
  CLOSED -> OPEN -> HALF-OPEN    Service -> [request flow] -> Dependency

[Stats Panel: State, Failures, Successes, Total, Timer Countdown]
[State History Log]
```

### Request Flow

1. User clicks "Send Request" (or auto-send fires)
2. UI calls `CircuitBreakerAlgorithm.sendRequest(breaker, timestamp)`
3. Algorithm checks state:
   - CLOSED: send request, simulate success/failure based on failureRate
   - OPEN: reject immediately (breaker is open)
   - HALF_OPEN: send probe request
4. Algorithm returns result; UI animates the request flow and updates state diagram
5. UI calls `checkTimeout` periodically to handle OPEN -> HALF_OPEN transition

### Timer Management

- `checkTimeout` runs on setInterval (100ms) to detect OPEN -> HALF_OPEN
- Auto-send runs on separate setInterval (user-configurable rate)
- All timers cleaned up on reset and beforeunload
