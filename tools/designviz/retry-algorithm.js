/**
 * Retry with Exponential Backoff Algorithm
 *
 * Pure functions — no DOM dependency.
 * Implements retry logic with exponential backoff and optional jitter:
 *   backoff = min(baseDelay * 2^attempt, maxDelay) + jitter
 *
 * Two strategies compared:
 *   1. Naive instant retry — retries immediately on failure
 *   2. Exponential backoff — increasing delay between retries with optional jitter
 *
 * Real-world scenario: AWS SDK retrying throttled DynamoDB requests.
 *
 * Functions:
 *   createRetryConfig(options) — create a retry configuration
 *   computeBackoff(config, attempt) — compute delay for a given attempt
 *   createSimulation(config) — create a simulation state
 *   processRequest(simulation, requestId, succeeded) — process a request outcome
 *   advanceTime(simulation, deltaMs) — advance simulation clock
 *   getStats(simulation) — return stats snapshot
 *   reset(config) — create a fresh simulation
 */
var RetryAlgorithm = (function () {
  "use strict";

  var DEFAULT_BASE_DELAY = 1000;
  var DEFAULT_MAX_DELAY = 32000;
  var DEFAULT_MAX_RETRIES = 5;
  var DEFAULT_JITTER_FACTOR = 0.5;

  var MAX_BASE_DELAY = 60000;
  var MAX_MAX_DELAY = 120000;
  var MAX_MAX_RETRIES = 20;

  var STRATEGY_NAIVE = "naive";
  var STRATEGY_EXPONENTIAL = "exponential";

  /**
   * Create a retry configuration.
   * @param {object} options
   * @param {string} options.strategy — "naive" or "exponential"
   * @param {number} options.baseDelay — base delay in ms (1-60000)
   * @param {number} options.maxDelay — max delay cap in ms (1-120000)
   * @param {number} options.maxRetries — max retry attempts (0-20)
   * @param {number} options.jitterFactor — jitter factor 0-1 (0 = no jitter)
   * @param {number} options.failureRate — probability of failure 0-1
   * @returns {object} config
   */
  function createRetryConfig(options) {
    var opts = options || {};
    var strategy = opts.strategy === STRATEGY_NAIVE ? STRATEGY_NAIVE : STRATEGY_EXPONENTIAL;
    var baseDelay = clamp(opts.baseDelay != null ? opts.baseDelay : DEFAULT_BASE_DELAY, 1, MAX_BASE_DELAY);
    var maxDelay = clamp(opts.maxDelay != null ? opts.maxDelay : DEFAULT_MAX_DELAY, 1, MAX_MAX_DELAY);
    var maxRetries = clamp(opts.maxRetries != null ? opts.maxRetries : DEFAULT_MAX_RETRIES, 0, MAX_MAX_RETRIES);
    var jitterFactor = clamp(opts.jitterFactor != null ? opts.jitterFactor : DEFAULT_JITTER_FACTOR, 0, 1);
    var failureRate = clamp(opts.failureRate != null ? opts.failureRate : 0.5, 0, 1);

    return {
      strategy: strategy,
      baseDelay: baseDelay,
      maxDelay: maxDelay,
      maxRetries: maxRetries,
      jitterFactor: jitterFactor,
      failureRate: failureRate,
    };
  }

  /**
   * Compute backoff delay for a given attempt number.
   * For naive strategy: always 0 (instant retry).
   * For exponential: min(baseDelay * 2^attempt, maxDelay) + jitter.
   * @param {object} config — retry config
   * @param {number} attempt — attempt number (0-indexed, 0 = first retry)
   * @param {number} [randomValue] — optional random value 0-1 for deterministic testing
   * @returns {number} delay in ms
   */
  function computeBackoff(config, attempt, randomValue) {
    if (config.strategy === STRATEGY_NAIVE) {
      return 0;
    }

    var exponentialDelay = config.baseDelay * Math.pow(2, attempt);
    var cappedDelay = Math.min(exponentialDelay, config.maxDelay);

    if (config.jitterFactor <= 0) {
      return cappedDelay;
    }

    var rand = randomValue != null ? randomValue : Math.random();
    var jitterRange = cappedDelay * config.jitterFactor;
    var jitter = jitterRange * (rand * 2 - 1);
    var finalDelay = Math.max(0, cappedDelay + jitter);

    return Math.round(finalDelay);
  }

  /**
   * Create a simulation state for tracking multiple requests.
   * @param {object} config — retry config
   * @returns {object} simulation state
   */
  function createSimulation(config) {
    return {
      config: config,
      clock: 0,
      requests: [],
      nextRequestId: 1,
      totalAttempts: 0,
      totalSuccesses: 0,
      totalFailures: 0,
      totalGaveUp: 0,
      totalBackoffTime: 0,
    };
  }

  /**
   * Enqueue a new request into the simulation.
   * @param {object} simulation — simulation state (mutated)
   * @returns {object} the new request object
   */
  function enqueueRequest(simulation) {
    var request = {
      id: simulation.nextRequestId++,
      attempt: 0,
      status: "pending",
      startedAt: simulation.clock,
      completedAt: null,
      attempts: [],
      totalBackoff: 0,
    };
    simulation.requests.push(request);
    return request;
  }

  /**
   * Process an attempt for a specific request.
   * @param {object} simulation — simulation state (mutated)
   * @param {number} requestId — request ID
   * @param {boolean} succeeded — whether this attempt succeeded
   * @param {number} [randomValue] — optional random for jitter
   * @returns {object} { request, attemptResult }
   */
  function processAttempt(simulation, requestId, succeeded, randomValue) {
    var request = findRequest(simulation, requestId);
    if (!request || request.status === "success" || request.status === "failed") {
      return null;
    }

    simulation.totalAttempts++;
    var attemptNum = request.attempt;

    if (succeeded) {
      request.status = "success";
      request.completedAt = simulation.clock;
      simulation.totalSuccesses++;
      var attemptResult = {
        attempt: attemptNum,
        succeeded: true,
        delay: 0,
        timestamp: simulation.clock,
      };
      request.attempts.push(attemptResult);
      return { request: copyRequest(request), attemptResult: attemptResult };
    }

    // Failed
    simulation.totalFailures++;
    request.attempt++;

    if (request.attempt > simulation.config.maxRetries) {
      request.status = "failed";
      request.completedAt = simulation.clock;
      simulation.totalGaveUp++;
      var failResult = {
        attempt: attemptNum,
        succeeded: false,
        delay: 0,
        timestamp: simulation.clock,
        gaveUp: true,
      };
      request.attempts.push(failResult);
      return { request: copyRequest(request), attemptResult: failResult };
    }

    // Compute next backoff
    var delay = computeBackoff(simulation.config, attemptNum, randomValue);
    request.totalBackoff += delay;
    simulation.totalBackoffTime += delay;
    request.status = "waiting";

    var retryResult = {
      attempt: attemptNum,
      succeeded: false,
      delay: delay,
      nextAttemptAt: simulation.clock + delay,
      timestamp: simulation.clock,
      gaveUp: false,
    };
    request.attempts.push(retryResult);

    return { request: copyRequest(request), attemptResult: retryResult };
  }

  /**
   * Advance simulation clock.
   * @param {object} simulation — simulation state (mutated)
   * @param {number} deltaMs — time to advance in ms
   */
  function advanceTime(simulation, deltaMs) {
    simulation.clock += deltaMs;
    // Transition waiting requests to pending if their backoff expired
    for (var i = 0; i < simulation.requests.length; i++) {
      var req = simulation.requests[i];
      if (req.status === "waiting") {
        var lastAttempt = req.attempts[req.attempts.length - 1];
        if (lastAttempt && lastAttempt.nextAttemptAt != null && simulation.clock >= lastAttempt.nextAttemptAt) {
          req.status = "pending";
        }
      }
    }
  }

  /**
   * Get pending requests ready for retry.
   * @param {object} simulation
   * @returns {Array} array of request objects that are pending
   */
  function getPendingRequests(simulation) {
    var pending = [];
    for (var i = 0; i < simulation.requests.length; i++) {
      if (simulation.requests[i].status === "pending") {
        pending.push(copyRequest(simulation.requests[i]));
      }
    }
    return pending;
  }

  /**
   * Get stats snapshot.
   * @param {object} simulation
   * @returns {object} stats
   */
  function getStats(simulation) {
    return {
      totalRequests: simulation.requests.length,
      totalAttempts: simulation.totalAttempts,
      totalSuccesses: simulation.totalSuccesses,
      totalFailures: simulation.totalFailures,
      totalGaveUp: simulation.totalGaveUp,
      totalBackoffTime: simulation.totalBackoffTime,
      averageBackoff: simulation.totalAttempts > 0 ? simulation.totalBackoffTime / simulation.totalAttempts : 0,
      clock: simulation.clock,
    };
  }

  /**
   * Reset simulation with same config.
   * @param {object} config
   * @returns {object} fresh simulation
   */
  function reset(config) {
    return createSimulation(config);
  }

  // --- Helpers ---
  function clamp(value, min, max) {
    if (value < min) return min;
    if (value > max) return max;
    return value;
  }

  function findRequest(simulation, requestId) {
    for (var i = 0; i < simulation.requests.length; i++) {
      if (simulation.requests[i].id === requestId) {
        return simulation.requests[i];
      }
    }
    return null;
  }

  function copyRequest(req) {
    return {
      id: req.id,
      attempt: req.attempt,
      status: req.status,
      startedAt: req.startedAt,
      completedAt: req.completedAt,
      attempts: req.attempts.slice(),
      totalBackoff: req.totalBackoff,
    };
  }

  // --- Constants ---
  var STRATEGIES = {
    NAIVE: STRATEGY_NAIVE,
    EXPONENTIAL: STRATEGY_EXPONENTIAL,
  };

  var LIMITS = {
    MAX_BASE_DELAY: MAX_BASE_DELAY,
    MAX_MAX_DELAY: MAX_MAX_DELAY,
    MAX_MAX_RETRIES: MAX_MAX_RETRIES,
  };

  // --- Exports ---
  var exports = {
    createRetryConfig: createRetryConfig,
    computeBackoff: computeBackoff,
    createSimulation: createSimulation,
    enqueueRequest: enqueueRequest,
    processAttempt: processAttempt,
    advanceTime: advanceTime,
    getPendingRequests: getPendingRequests,
    getStats: getStats,
    reset: reset,
    STRATEGIES: STRATEGIES,
    LIMITS: LIMITS,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = exports;
  }
  return exports;
})();
