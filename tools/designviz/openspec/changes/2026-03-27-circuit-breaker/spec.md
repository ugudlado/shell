# Circuit Breaker Visualization — Spec

## Motivation

Circuit breakers are a critical resilience pattern in distributed systems. Netflix Hystrix popularized the pattern to protect streaming services from cascading failures when downstream dependencies (e.g., recommendations service) fail. This visualization teaches the three-state machine (CLOSED, OPEN, HALF-OPEN) interactively.

## Requirements

### Functional

1. **State Machine**: Implement CLOSED, OPEN, HALF-OPEN states with correct transitions
2. **Service Simulation**: A "service" sends requests to a "downstream dependency"; users control the failure rate via a slider/dial (0-100%)
3. **Failure Threshold**: Configurable consecutive failure count to trip the breaker (default: 5)
4. **Timeout Timer**: Configurable timeout (seconds) before OPEN transitions to HALF-OPEN (default: 5s)
5. **Half-Open Probe**: In HALF-OPEN, one probe request is sent — success resets to CLOSED, failure returns to OPEN
6. **Visual State Diagram**: Animated SVG/CSS state machine showing current state highlighted, transitions animated
7. **Request Animation**: Visual flow of requests from service to dependency, showing success/failure
8. **Real-Time Stats**: Failure count, success count, state history, current state, timer countdown
9. **Auto-Send Mode**: Toggle to automatically send requests at a configurable interval
10. **Reset**: Clear all state, timers, counters back to initial CLOSED state

### Non-Functional

- Pure algorithm module (no DOM) with IIFE + `var` pattern
- UI module with IIFE + `const`/`let` pattern
- CSS prefixed with `cb-` to avoid collisions
- `textContent` for all user-visible text (no innerHTML)
- Timer cleanup on reset and beforeunload
- Input bounds enforced on all user inputs

## Acceptance Criteria

- [ ] State diagram shows all 3 states with current state highlighted
- [ ] Failure rate slider controls probability of downstream failure (0-100%)
- [ ] Breaker trips from CLOSED to OPEN after N consecutive failures
- [ ] Timer counts down in OPEN state, transitions to HALF-OPEN on expiry
- [ ] Half-open probe success resets to CLOSED; failure returns to OPEN
- [ ] Request animation shows flow from service to dependency
- [ ] Stats panel shows failure count, success count, state, timer
- [ ] Auto-send mode sends requests at configurable interval
- [ ] Reset clears all state and timers
- [ ] Nav links updated in all HTML files

## Real-World Context

Netflix Hystrix: When the recommendations service starts failing, the circuit breaker OPENS to stop sending requests, returning cached/fallback recommendations instead. After a timeout, it enters HALF-OPEN and sends a single probe. If the probe succeeds, the breaker CLOSES and normal traffic resumes. This prevents cascading failures across the streaming platform.
