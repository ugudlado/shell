/**
 * Circuit Breaker Algorithm
 *
 * Pure functions — no DOM dependency.
 * Implements the Circuit Breaker pattern state machine:
 *   CLOSED -> OPEN (on consecutive failures >= threshold)
 *   OPEN -> HALF-OPEN (on timeout expiry)
 *   HALF-OPEN -> CLOSED (on probe success)
 *   HALF-OPEN -> OPEN (on probe failure)
 *
 * Functions:
 *   createBreaker(config) — create a circuit breaker with given config
 *   handleRequest(breaker, timestamp, downstreamSuccess) — process a request
 *   checkTimeout(breaker, timestamp) — check if OPEN timeout has expired
 *   reset(config) — create a fresh breaker with same config
 *   getStats(breaker) — return current stats snapshot
 */
var CircuitBreakerAlgorithm = (function () {
  "use strict";

  var STATE_CLOSED = "CLOSED";
  var STATE_OPEN = "OPEN";
  var STATE_HALF_OPEN = "HALF-OPEN";

  /**
   * Create a circuit breaker.
   * @param {object} config
   * @param {number} config.failureThreshold — consecutive failures to trip (1-50)
   * @param {number} config.openTimeout — seconds before OPEN -> HALF-OPEN (1-60)
   * @returns {object} breaker state
   */
  function createBreaker(config) {
    var threshold = config.failureThreshold;
    var timeout = config.openTimeout;

    return {
      state: STATE_CLOSED,
      failureThreshold: threshold,
      openTimeout: timeout,
      failureCount: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rejectedRequests: 0,
      openedAt: null,
      lastTransition: null,
    };
  }

  /**
   * Handle a request through the circuit breaker.
   * @param {object} breaker — breaker state (mutated in place)
   * @param {number} timestamp — current time in ms
   * @param {boolean} downstreamSuccess — whether the downstream call succeeded
   * @returns {object} { allowed, success, state, transition, reason, stats }
   */
  function handleRequest(breaker, timestamp, downstreamSuccess) {
    breaker.totalRequests++;

    // OPEN state: reject immediately (don't reach downstream)
    if (breaker.state === STATE_OPEN) {
      breaker.rejectedRequests++;
      return {
        allowed: false,
        success: false,
        state: breaker.state,
        transition: null,
        reason:
          "Circuit OPEN — request rejected. Waiting for timeout (" +
          breaker.openTimeout +
          "s).",
        stats: getStats(breaker),
      };
    }

    // HALF-OPEN state: allow probe request
    if (breaker.state === STATE_HALF_OPEN) {
      if (downstreamSuccess) {
        // Probe succeeded — close the breaker
        breaker.successfulRequests++;
        breaker.failureCount = 0;
        var oldState = breaker.state;
        breaker.state = STATE_CLOSED;
        breaker.openedAt = null;
        breaker.lastTransition = {
          from: oldState,
          to: STATE_CLOSED,
          timestamp: timestamp,
        };
        return {
          allowed: true,
          success: true,
          state: breaker.state,
          transition: { from: oldState, to: STATE_CLOSED },
          reason:
            "HALF-OPEN probe succeeded — circuit CLOSED. Failure count reset.",
          stats: getStats(breaker),
        };
      } else {
        // Probe failed — reopen the breaker
        breaker.failedRequests++;
        breaker.failureCount++;
        var oldStateHO = breaker.state;
        breaker.state = STATE_OPEN;
        breaker.openedAt = timestamp;
        breaker.lastTransition = {
          from: oldStateHO,
          to: STATE_OPEN,
          timestamp: timestamp,
        };
        return {
          allowed: true,
          success: false,
          state: breaker.state,
          transition: { from: oldStateHO, to: STATE_OPEN },
          reason:
            "HALF-OPEN probe failed — circuit re-OPENED. Timeout restarted.",
          stats: getStats(breaker),
        };
      }
    }

    // CLOSED state: forward request to downstream
    if (downstreamSuccess) {
      breaker.successfulRequests++;
      breaker.failureCount = 0;
      return {
        allowed: true,
        success: true,
        state: breaker.state,
        transition: null,
        reason:
          "Request succeeded. Failure count reset to 0/" +
          breaker.failureThreshold +
          ".",
        stats: getStats(breaker),
      };
    } else {
      breaker.failedRequests++;
      breaker.failureCount++;

      // Check if threshold reached
      if (breaker.failureCount >= breaker.failureThreshold) {
        var oldStateClosed = breaker.state;
        breaker.state = STATE_OPEN;
        breaker.openedAt = timestamp;
        breaker.lastTransition = {
          from: oldStateClosed,
          to: STATE_OPEN,
          timestamp: timestamp,
        };
        return {
          allowed: true,
          success: false,
          state: breaker.state,
          transition: { from: oldStateClosed, to: STATE_OPEN },
          reason:
            "Failure " +
            breaker.failureCount +
            "/" +
            breaker.failureThreshold +
            " — threshold reached! Circuit OPENED.",
          stats: getStats(breaker),
        };
      }

      return {
        allowed: true,
        success: false,
        state: breaker.state,
        transition: null,
        reason:
          "Request failed. Failures: " +
          breaker.failureCount +
          "/" +
          breaker.failureThreshold +
          ".",
        stats: getStats(breaker),
      };
    }
  }

  /**
   * Check if the OPEN timeout has expired and transition to HALF-OPEN.
   * @param {object} breaker — breaker state (mutated in place)
   * @param {number} timestamp — current time in ms
   * @returns {object} { transitioned, oldState, newState }
   */
  function checkTimeout(breaker, timestamp) {
    if (breaker.state !== STATE_OPEN || breaker.openedAt === null) {
      return { transitioned: false, oldState: breaker.state, newState: breaker.state };
    }

    var elapsed = (timestamp - breaker.openedAt) / 1000;
    if (elapsed >= breaker.openTimeout) {
      var oldState = breaker.state;
      breaker.state = STATE_HALF_OPEN;
      breaker.lastTransition = {
        from: oldState,
        to: STATE_HALF_OPEN,
        timestamp: timestamp,
      };
      return { transitioned: true, oldState: oldState, newState: STATE_HALF_OPEN };
    }

    return { transitioned: false, oldState: breaker.state, newState: breaker.state };
  }

  /**
   * Create a fresh breaker with the same config.
   * @param {object} config — { failureThreshold, openTimeout }
   * @returns {object} fresh breaker state
   */
  function resetBreaker(config) {
    return createBreaker(config);
  }

  /**
   * Get a stats snapshot of the breaker.
   * @param {object} breaker
   * @returns {object} stats snapshot
   */
  function getStats(breaker) {
    return {
      state: breaker.state,
      failureCount: breaker.failureCount,
      failureThreshold: breaker.failureThreshold,
      openTimeout: breaker.openTimeout,
      openedAt: breaker.openedAt,
      totalRequests: breaker.totalRequests,
      successfulRequests: breaker.successfulRequests,
      failedRequests: breaker.failedRequests,
      rejectedRequests: breaker.rejectedRequests,
    };
  }

  // --- Constants ---
  var STATES = {
    CLOSED: STATE_CLOSED,
    OPEN: STATE_OPEN,
    HALF_OPEN: STATE_HALF_OPEN,
  };

  // --- Exports ---
  var exports = {
    createBreaker: createBreaker,
    handleRequest: handleRequest,
    checkTimeout: checkTimeout,
    reset: resetBreaker,
    getStats: getStats,
    STATES: STATES,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = exports;
  }
  return exports;
})();
