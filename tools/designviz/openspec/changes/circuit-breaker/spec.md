# Circuit Breaker Visualization — Spec

## Schema: feature-rapid

## Motivation

Circuit Breaker is a fundamental resilience pattern in distributed systems. When a downstream dependency fails, the breaker "trips" to prevent cascading failures — allowing the system to fail fast rather than hang. This visualization teaches the three-state machine (CLOSED, OPEN, HALF-OPEN), failure thresholds, timeout timers, and recovery probes through an interactive, animated experience.

**Real-world example**: Netflix Hystrix protecting streaming service from failing recommendation service.

## Requirements

### Functional

1. **State Machine**: Implement CLOSED, OPEN, HALF-OPEN states with correct transitions:
   - CLOSED -> OPEN: when consecutive failure count >= threshold
   - OPEN -> HALF-OPEN: when timeout timer expires
   - HALF-OPEN -> CLOSED: when probe request succeeds
   - HALF-OPEN -> OPEN: when probe request fails (reset timeout)

2. **Service Simulation**: A "service" calls a "downstream dependency". Users control:
   - Failure rate (0-100%) via slider/dial
   - Failure threshold (consecutive failures to trip breaker)
   - Open timeout duration (seconds before half-open probe)

3. **Visual State Diagram**: Animated state machine showing:
   - Current state highlighted (CLOSED=green, OPEN=red, HALF-OPEN=yellow)
   - Transition arrows with labels
   - Active transition animated on state change

4. **Request Animation**: Visual flow of requests from service to dependency:
   - Success: green flow through
   - Failure: red X at dependency
   - Rejected (breaker open): red block at breaker, never reaches dependency

5. **Real-time Metrics**:
   - Current state
   - Consecutive failure count / threshold
   - Timeout countdown (when OPEN)
   - Total requests, successful, failed, rejected counts

6. **Controls**:
   - Failure rate dial/slider (0-100%)
   - Failure threshold input (1-50)
   - Open timeout input (1-60 seconds)
   - Auto-send toggle (continuous request stream)
   - Send single request button
   - Reset button

### Non-Functional

- Dark theme matching existing DesignViz pages
- CSS classes prefixed with `cb-`
- Algorithm in pure JS module (no DOM), UI separate
- Nav links updated on all pages
- textContent for all user-visible text
- Timer cleanup on reset/unload

## Acceptance Criteria

1. State machine transitions correctly: CLOSED->OPEN on threshold, OPEN->HALF-OPEN on timeout, HALF-OPEN->CLOSED on success, HALF-OPEN->OPEN on failure
2. Failure rate slider controls probability of downstream failure
3. Visual state diagram highlights current state with animation
4. Request flow animation shows success/failure/rejected visually
5. Timeout countdown visible when breaker is OPEN
6. All inputs bounded and validated
7. Timer cleanup on reset and page unload
8. Nav updated on index.html and circuit-breaker.html
9. Algorithm tests pass for all state transitions and edge cases
10. npm test && npm run lint pass clean
