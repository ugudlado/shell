# Circuit Breaker Visualization — Design

## Architecture

Follows DesignViz pattern: algorithm module + UI module + CSS.

### Files

| File | Purpose |
|------|---------|
| `circuit-breaker-algorithm.js` | Pure state machine — IIFE, `var`, exports via global `CircuitBreakerAlgorithm` |
| `circuit-breaker-algorithm.test.js` | Node.js tests for state transitions, thresholds, edge cases |
| `circuit-breaker.html` | Page structure with nav, state diagram, controls, metrics |
| `circuit-breaker.js` | UI — IIFE, `const`/`let`, calls algorithm module only |
| `circuit-breaker-style.css` | All classes prefixed `cb-` |

### Algorithm Module API

```js
CircuitBreakerAlgorithm.createBreaker(config)
// config: { failureThreshold, openTimeout }
// returns: { state, failureCount, successCount, ... }

CircuitBreakerAlgorithm.handleRequest(breaker, timestamp, downstreamSuccess)
// returns: { allowed, success, state, transition, reason, stats }

CircuitBreakerAlgorithm.checkTimeout(breaker, timestamp)
// returns: { transitioned, oldState, newState }

CircuitBreakerAlgorithm.reset(breaker)
// returns fresh breaker state

CircuitBreakerAlgorithm.getStats(breaker)
// returns: { state, failureCount, threshold, ... }
```

### State Machine

```
CLOSED --[failures >= threshold]--> OPEN
OPEN --[timeout expires]--> HALF-OPEN
HALF-OPEN --[probe success]--> CLOSED
HALF-OPEN --[probe failure]--> OPEN
```

### UI Layout

```
[Nav: Rate Limiter | Circuit Breaker (active)]

[h1: Circuit Breaker]

[Controls Row]
  Failure Rate: [====slider====] 30%
  Threshold: [input] | Timeout: [input]s
  [Send Request] [Auto-Send: toggle] [Reset]

[Error message area]
[Info message area]

[State Diagram]          [Request Flow]
  CLOSED <-> OPEN          Service -> [Breaker] -> Dependency
  OPEN <-> HALF-OPEN       (animated arrows/dots)

[Metrics Panel]
  State: CLOSED | Failures: 0/5 | Timeout: --
  Total: 0 | Success: 0 | Failed: 0 | Rejected: 0

[Request Log]
  #N  200/500/REJECTED  reason
```

### CSS Prefix

All concept-specific classes use `cb-` prefix. Shared classes from style.css (controls, buttons, inputs, info, error, legend, stats) are reused without prefix.

### Timer Management

- `autoSendIntervalId` — auto-send request stream (clearInterval)
- `timeoutCountdownId` — countdown display update (clearInterval)
- All cleared on reset() and beforeunload
