/**
 * Retry with Exponential Backoff Algorithm Tests — Node.js runner compatible
 * Exports runTests() for run-tests.js harness
 *
 * Tests cover:
 *   - Config creation with defaults and custom values
 *   - Input clamping and bounds
 *   - computeBackoff for naive (always 0) and exponential strategies
 *   - Exponential growth: 2^n pattern
 *   - Max delay cap
 *   - Jitter calculation with deterministic randomValue
 *   - Jitter factor 0 produces no jitter
 *   - Simulation creation, enqueue, processAttempt
 *   - Request lifecycle: pending -> success, pending -> waiting -> pending -> success
 *   - Max retries exhaustion (gave up)
 *   - advanceTime transitions waiting to pending
 *   - getPendingRequests
 *   - getStats
 *   - reset
 *   - Edge cases: maxRetries=0, 100% failure rate, 0% failure rate, jitter=0
 */

function runTests({ assert, assertEqual, assertApprox }) {
  var passed = 0;
  var failed = 0;
  var failures = [];

  var Retry = require("./retry-algorithm.js");

  function check(fn, name) {
    try {
      fn();
      passed++;
      console.log("  PASS: " + name);
    } catch (e) {
      failed++;
      failures.push({ name: name, message: e.message });
      console.log("  FAIL: " + name + " — " + e.message);
    }
  }

  // ===========================
  // CONFIG CREATION
  // ===========================

  check(function () {
    var config = Retry.createRetryConfig({});
    assertEqual(config.strategy, "exponential", "default strategy");
    assertEqual(config.baseDelay, 1000, "default baseDelay");
    assertEqual(config.maxDelay, 32000, "default maxDelay");
    assertEqual(config.maxRetries, 5, "default maxRetries");
    assertApprox(config.jitterFactor, 0.5, 0.001, "default jitterFactor");
    assertApprox(config.failureRate, 0.5, 0.001, "default failureRate");
  }, "createRetryConfig with defaults");

  check(function () {
    var config = Retry.createRetryConfig({
      strategy: "naive",
      baseDelay: 500,
      maxDelay: 10000,
      maxRetries: 3,
      jitterFactor: 0.2,
      failureRate: 0.8,
    });
    assertEqual(config.strategy, "naive", "naive strategy");
    assertEqual(config.baseDelay, 500, "custom baseDelay");
    assertEqual(config.maxDelay, 10000, "custom maxDelay");
    assertEqual(config.maxRetries, 3, "custom maxRetries");
    assertApprox(config.jitterFactor, 0.2, 0.001, "custom jitterFactor");
    assertApprox(config.failureRate, 0.8, 0.001, "custom failureRate");
  }, "createRetryConfig with custom values");

  check(function () {
    var config = Retry.createRetryConfig({
      baseDelay: -100,
      maxDelay: 999999,
      maxRetries: -5,
      jitterFactor: 2.0,
      failureRate: -0.5,
    });
    assertEqual(config.baseDelay, 1, "baseDelay clamped to min 1");
    assertEqual(config.maxDelay, Retry.LIMITS.MAX_MAX_DELAY, "maxDelay clamped to max");
    assertEqual(config.maxRetries, 0, "maxRetries clamped to min 0");
    assertApprox(config.jitterFactor, 1.0, 0.001, "jitterFactor clamped to max 1");
    assertApprox(config.failureRate, 0.0, 0.001, "failureRate clamped to min 0");
  }, "createRetryConfig clamps out-of-range values");

  check(function () {
    var config = Retry.createRetryConfig({
      baseDelay: 100000,
      maxRetries: 50,
    });
    assertEqual(config.baseDelay, Retry.LIMITS.MAX_BASE_DELAY, "baseDelay clamped to MAX_BASE_DELAY");
    assertEqual(config.maxRetries, Retry.LIMITS.MAX_MAX_RETRIES, "maxRetries clamped to MAX_MAX_RETRIES");
  }, "createRetryConfig clamps high values to limits");

  check(function () {
    var config = Retry.createRetryConfig({ strategy: "invalid" });
    assertEqual(config.strategy, "exponential", "invalid strategy defaults to exponential");
  }, "createRetryConfig invalid strategy defaults to exponential");

  // ===========================
  // COMPUTE BACKOFF
  // ===========================

  check(function () {
    var config = Retry.createRetryConfig({ strategy: "naive" });
    assertEqual(Retry.computeBackoff(config, 0), 0, "naive attempt 0");
    assertEqual(Retry.computeBackoff(config, 1), 0, "naive attempt 1");
    assertEqual(Retry.computeBackoff(config, 5), 0, "naive attempt 5");
    assertEqual(Retry.computeBackoff(config, 10), 0, "naive attempt 10");
  }, "computeBackoff naive strategy always returns 0");

  check(function () {
    var config = Retry.createRetryConfig({
      strategy: "exponential",
      baseDelay: 1000,
      maxDelay: 32000,
      jitterFactor: 0,
    });
    assertEqual(Retry.computeBackoff(config, 0), 1000, "attempt 0: 1000 * 2^0 = 1000");
    assertEqual(Retry.computeBackoff(config, 1), 2000, "attempt 1: 1000 * 2^1 = 2000");
    assertEqual(Retry.computeBackoff(config, 2), 4000, "attempt 2: 1000 * 2^2 = 4000");
    assertEqual(Retry.computeBackoff(config, 3), 8000, "attempt 3: 1000 * 2^3 = 8000");
    assertEqual(Retry.computeBackoff(config, 4), 16000, "attempt 4: 1000 * 2^4 = 16000");
    assertEqual(Retry.computeBackoff(config, 5), 32000, "attempt 5: capped at maxDelay");
  }, "computeBackoff exponential with no jitter follows 2^n pattern");

  check(function () {
    var config = Retry.createRetryConfig({
      strategy: "exponential",
      baseDelay: 1000,
      maxDelay: 32000,
      jitterFactor: 0,
    });
    // attempt 6 would be 64000 but capped at 32000
    assertEqual(Retry.computeBackoff(config, 6), 32000, "attempt 6 capped");
    assertEqual(Retry.computeBackoff(config, 10), 32000, "attempt 10 capped");
    assertEqual(Retry.computeBackoff(config, 20), 32000, "attempt 20 capped");
  }, "computeBackoff caps at maxDelay");

  check(function () {
    var config = Retry.createRetryConfig({
      strategy: "exponential",
      baseDelay: 1000,
      maxDelay: 32000,
      jitterFactor: 0.5,
    });
    // With randomValue=0.5 -> rand*2-1 = 0 -> jitter = 0 -> delay = cappedDelay
    var delay = Retry.computeBackoff(config, 0, 0.5);
    assertEqual(delay, 1000, "jitter with randomValue=0.5 gives zero jitter");
  }, "computeBackoff jitter with randomValue 0.5 produces no jitter");

  check(function () {
    var config = Retry.createRetryConfig({
      strategy: "exponential",
      baseDelay: 1000,
      maxDelay: 32000,
      jitterFactor: 0.5,
    });
    // randomValue=1 -> rand*2-1=1 -> jitter = cappedDelay * 0.5 * 1 = 500 -> delay = 1500
    var delay = Retry.computeBackoff(config, 0, 1.0);
    assertEqual(delay, 1500, "max positive jitter at attempt 0");

    // randomValue=0 -> rand*2-1=-1 -> jitter = cappedDelay * 0.5 * (-1) = -500 -> delay = 500
    var delayMin = Retry.computeBackoff(config, 0, 0.0);
    assertEqual(delayMin, 500, "max negative jitter at attempt 0");
  }, "computeBackoff jitter range with extreme randomValue");

  check(function () {
    var config = Retry.createRetryConfig({
      strategy: "exponential",
      baseDelay: 100,
      maxDelay: 32000,
      jitterFactor: 1.0,
    });
    // randomValue=0 -> rand*2-1=-1 -> jitter = 100*1.0*(-1) = -100 -> delay = max(0, 0) = 0
    var delay = Retry.computeBackoff(config, 0, 0.0);
    assertEqual(delay, 0, "full negative jitter clamps to 0");
  }, "computeBackoff full jitter does not go negative");

  // ===========================
  // SIMULATION CREATION
  // ===========================

  check(function () {
    var config = Retry.createRetryConfig({});
    var sim = Retry.createSimulation(config);
    assertEqual(sim.clock, 0, "clock starts at 0");
    assertEqual(sim.requests.length, 0, "no requests initially");
    assertEqual(sim.nextRequestId, 1, "first ID is 1");
    assertEqual(sim.totalAttempts, 0, "totalAttempts 0");
    assertEqual(sim.totalSuccesses, 0, "totalSuccesses 0");
    assertEqual(sim.totalFailures, 0, "totalFailures 0");
    assertEqual(sim.totalGaveUp, 0, "totalGaveUp 0");
    assertEqual(sim.totalBackoffTime, 0, "totalBackoffTime 0");
  }, "createSimulation returns correct initial state");

  // ===========================
  // ENQUEUE REQUEST
  // ===========================

  check(function () {
    var config = Retry.createRetryConfig({});
    var sim = Retry.createSimulation(config);
    var req = Retry.enqueueRequest(sim);
    assertEqual(req.id, 1, "first request id=1");
    assertEqual(req.status, "pending", "initial status pending");
    assertEqual(req.attempt, 0, "attempt starts at 0");
    assertEqual(req.attempts.length, 0, "no attempts yet");
    assertEqual(sim.requests.length, 1, "simulation has 1 request");

    var req2 = Retry.enqueueRequest(sim);
    assertEqual(req2.id, 2, "second request id=2");
    assertEqual(sim.requests.length, 2, "simulation has 2 requests");
  }, "enqueueRequest creates requests with incrementing IDs");

  // ===========================
  // PROCESS ATTEMPT — SUCCESS
  // ===========================

  check(function () {
    var config = Retry.createRetryConfig({ strategy: "exponential" });
    var sim = Retry.createSimulation(config);
    var req = Retry.enqueueRequest(sim);

    var result = Retry.processAttempt(sim, req.id, true);
    assertEqual(result.request.status, "success", "request succeeds");
    assertEqual(result.attemptResult.succeeded, true, "attempt succeeded");
    assertEqual(result.attemptResult.attempt, 0, "attempt number 0");
    assertEqual(sim.totalAttempts, 1, "total attempts incremented");
    assertEqual(sim.totalSuccesses, 1, "total successes incremented");
  }, "processAttempt success on first try");

  // ===========================
  // PROCESS ATTEMPT — FAILURE WITH RETRY
  // ===========================

  check(function () {
    var config = Retry.createRetryConfig({
      strategy: "exponential",
      baseDelay: 1000,
      maxDelay: 32000,
      maxRetries: 3,
      jitterFactor: 0,
    });
    var sim = Retry.createSimulation(config);
    var req = Retry.enqueueRequest(sim);

    // First attempt fails
    var r1 = Retry.processAttempt(sim, req.id, false, 0.5);
    assertEqual(r1.request.status, "waiting", "status is waiting after failure");
    assertEqual(r1.attemptResult.succeeded, false, "attempt failed");
    assertEqual(r1.attemptResult.delay, 1000, "backoff delay = 1000ms");
    assertEqual(r1.attemptResult.gaveUp, false, "did not give up");
    assertEqual(sim.totalFailures, 1, "one failure recorded");

    // Advance time so request becomes pending
    Retry.advanceTime(sim, 1000);
    var pending = Retry.getPendingRequests(sim);
    assertEqual(pending.length, 1, "request is now pending");

    // Second attempt fails
    var r2 = Retry.processAttempt(sim, req.id, false, 0.5);
    assertEqual(r2.attemptResult.delay, 2000, "second backoff = 2000ms");

    // Advance time
    Retry.advanceTime(sim, 2000);

    // Third attempt fails
    var r3 = Retry.processAttempt(sim, req.id, false, 0.5);
    assertEqual(r3.attemptResult.delay, 4000, "third backoff = 4000ms");

    // Advance time
    Retry.advanceTime(sim, 4000);

    // Fourth attempt succeeds (this is the 4th attempt, within maxRetries=3 retries after initial)
    var r4 = Retry.processAttempt(sim, req.id, true);
    assertEqual(r4.request.status, "success", "eventually succeeds");
    assertEqual(sim.totalSuccesses, 1, "one success total");
  }, "processAttempt failure-retry-success lifecycle with exponential backoff");

  // ===========================
  // MAX RETRIES EXHAUSTION
  // ===========================

  check(function () {
    var config = Retry.createRetryConfig({
      strategy: "exponential",
      baseDelay: 100,
      maxRetries: 2,
      jitterFactor: 0,
    });
    var sim = Retry.createSimulation(config);
    var req = Retry.enqueueRequest(sim);

    // Initial attempt fails (attempt 0)
    var r1 = Retry.processAttempt(sim, req.id, false, 0.5);
    assertEqual(r1.request.status, "waiting", "waiting after first failure");
    assertEqual(r1.attemptResult.gaveUp, false, "not gave up yet");

    Retry.advanceTime(sim, 200);

    // Retry 1 fails (attempt 1)
    var r2 = Retry.processAttempt(sim, req.id, false, 0.5);
    assertEqual(r2.request.status, "waiting", "waiting after second failure");
    assertEqual(r2.attemptResult.gaveUp, false, "not gave up yet");

    Retry.advanceTime(sim, 400);

    // Retry 2 fails (attempt 2) — this is the last allowed retry
    var r3 = Retry.processAttempt(sim, req.id, false, 0.5);
    assertEqual(r3.request.status, "failed", "request failed after max retries");
    assertEqual(r3.attemptResult.gaveUp, true, "gave up");
    assertEqual(sim.totalGaveUp, 1, "totalGaveUp incremented");
  }, "processAttempt gives up after maxRetries exhausted");

  // ===========================
  // EDGE CASE: maxRetries=0
  // ===========================

  check(function () {
    var config = Retry.createRetryConfig({
      strategy: "exponential",
      maxRetries: 0,
      jitterFactor: 0,
    });
    var sim = Retry.createSimulation(config);
    var req = Retry.enqueueRequest(sim);

    // Only one attempt allowed, no retries
    var r1 = Retry.processAttempt(sim, req.id, false, 0.5);
    assertEqual(r1.request.status, "failed", "immediately failed with maxRetries=0");
    assertEqual(r1.attemptResult.gaveUp, true, "gave up immediately");
    assertEqual(sim.totalGaveUp, 1, "totalGaveUp is 1");
  }, "maxRetries=0 means no retries — first failure is final");

  check(function () {
    var config = Retry.createRetryConfig({
      strategy: "exponential",
      maxRetries: 0,
    });
    var sim = Retry.createSimulation(config);
    var req = Retry.enqueueRequest(sim);

    // Success on first try still works
    var r1 = Retry.processAttempt(sim, req.id, true);
    assertEqual(r1.request.status, "success", "success still works with maxRetries=0");
  }, "maxRetries=0 still allows first attempt to succeed");

  // ===========================
  // NAIVE STRATEGY — INSTANT RETRY
  // ===========================

  check(function () {
    var config = Retry.createRetryConfig({
      strategy: "naive",
      maxRetries: 3,
    });
    var sim = Retry.createSimulation(config);
    var req = Retry.enqueueRequest(sim);

    var r1 = Retry.processAttempt(sim, req.id, false, 0.5);
    assertEqual(r1.attemptResult.delay, 0, "naive delay is always 0");
    assertEqual(r1.request.status, "waiting", "still goes to waiting state");
  }, "naive strategy uses 0 delay");

  // ===========================
  // ADVANCE TIME
  // ===========================

  check(function () {
    var config = Retry.createRetryConfig({
      strategy: "exponential",
      baseDelay: 1000,
      maxRetries: 5,
      jitterFactor: 0,
    });
    var sim = Retry.createSimulation(config);
    var req = Retry.enqueueRequest(sim);

    Retry.processAttempt(sim, req.id, false, 0.5);
    // Request is now waiting, next attempt at clock 0 + 1000 = 1000

    // Advance less than backoff
    Retry.advanceTime(sim, 500);
    var pending = Retry.getPendingRequests(sim);
    assertEqual(pending.length, 0, "not yet pending at 500ms");

    // Advance to exact backoff time
    Retry.advanceTime(sim, 500);
    pending = Retry.getPendingRequests(sim);
    assertEqual(pending.length, 1, "pending at exactly 1000ms");
  }, "advanceTime transitions waiting to pending at correct threshold");

  check(function () {
    var config = Retry.createRetryConfig({
      strategy: "exponential",
      baseDelay: 1000,
      maxRetries: 5,
      jitterFactor: 0,
    });
    var sim = Retry.createSimulation(config);
    var req = Retry.enqueueRequest(sim);

    Retry.processAttempt(sim, req.id, false, 0.5);
    // Advance well past backoff
    Retry.advanceTime(sim, 5000);
    var pending = Retry.getPendingRequests(sim);
    assertEqual(pending.length, 1, "pending after overshoot");
    assertEqual(sim.clock, 5000, "clock advanced to 5000");
  }, "advanceTime works with overshoot");

  // ===========================
  // GET STATS
  // ===========================

  check(function () {
    var config = Retry.createRetryConfig({
      strategy: "exponential",
      baseDelay: 1000,
      maxRetries: 3,
      jitterFactor: 0,
    });
    var sim = Retry.createSimulation(config);

    var stats = Retry.getStats(sim);
    assertEqual(stats.totalRequests, 0, "no requests");
    assertEqual(stats.totalAttempts, 0, "no attempts");
    assertEqual(stats.totalSuccesses, 0, "no successes");
    assertEqual(stats.totalFailures, 0, "no failures");
    assertEqual(stats.totalGaveUp, 0, "no gave up");
    assertEqual(stats.totalBackoffTime, 0, "no backoff time");
    assertEqual(stats.averageBackoff, 0, "average backoff 0 with no attempts");
    assertEqual(stats.clock, 0, "clock 0");
  }, "getStats returns zeroes for empty simulation");

  check(function () {
    var config = Retry.createRetryConfig({
      strategy: "exponential",
      baseDelay: 1000,
      maxRetries: 3,
      jitterFactor: 0,
    });
    var sim = Retry.createSimulation(config);

    var req1 = Retry.enqueueRequest(sim);
    Retry.processAttempt(sim, req1.id, true);

    var req2 = Retry.enqueueRequest(sim);
    Retry.processAttempt(sim, req2.id, false, 0.5);
    Retry.advanceTime(sim, 1000);
    Retry.processAttempt(sim, req2.id, true);

    var stats = Retry.getStats(sim);
    assertEqual(stats.totalRequests, 2, "2 requests");
    assertEqual(stats.totalAttempts, 3, "3 total attempts");
    assertEqual(stats.totalSuccesses, 2, "2 successes");
    assertEqual(stats.totalFailures, 1, "1 failure");
    assertEqual(stats.totalGaveUp, 0, "none gave up");
    assertEqual(stats.totalBackoffTime, 1000, "1000ms total backoff");
  }, "getStats reflects accumulated state");

  // ===========================
  // RESET
  // ===========================

  check(function () {
    var config = Retry.createRetryConfig({ maxRetries: 3 });
    var sim = Retry.createSimulation(config);
    var req = Retry.enqueueRequest(sim);
    Retry.processAttempt(sim, req.id, true);

    var fresh = Retry.reset(config);
    assertEqual(fresh.requests.length, 0, "reset clears requests");
    assertEqual(fresh.totalAttempts, 0, "reset clears attempts");
    assertEqual(fresh.clock, 0, "reset clears clock");
  }, "reset creates fresh simulation");

  // ===========================
  // PROCESS ATTEMPT ON COMPLETED REQUEST
  // ===========================

  check(function () {
    var config = Retry.createRetryConfig({});
    var sim = Retry.createSimulation(config);
    var req = Retry.enqueueRequest(sim);
    Retry.processAttempt(sim, req.id, true);

    // Trying to process a completed request returns null
    var result = Retry.processAttempt(sim, req.id, false);
    assertEqual(result, null, "processAttempt on completed request returns null");
  }, "processAttempt ignores already-completed requests");

  check(function () {
    var config = Retry.createRetryConfig({});
    var sim = Retry.createSimulation(config);

    // Non-existent request ID
    var result = Retry.processAttempt(sim, 999, true);
    assertEqual(result, null, "processAttempt on non-existent request returns null");
  }, "processAttempt returns null for non-existent request ID");

  // ===========================
  // MULTIPLE CONCURRENT REQUESTS
  // ===========================

  check(function () {
    var config = Retry.createRetryConfig({
      strategy: "exponential",
      baseDelay: 1000,
      maxRetries: 2,
      jitterFactor: 0,
    });
    var sim = Retry.createSimulation(config);

    var req1 = Retry.enqueueRequest(sim);
    var req2 = Retry.enqueueRequest(sim);
    var req3 = Retry.enqueueRequest(sim);

    // req1 succeeds immediately
    Retry.processAttempt(sim, req1.id, true);
    // req2 and req3 fail
    Retry.processAttempt(sim, req2.id, false, 0.5);
    Retry.processAttempt(sim, req3.id, false, 0.5);

    var pending = Retry.getPendingRequests(sim);
    assertEqual(pending.length, 0, "both waiting, not yet pending");

    Retry.advanceTime(sim, 1000);
    pending = Retry.getPendingRequests(sim);
    assertEqual(pending.length, 2, "both now pending for retry");

    Retry.processAttempt(sim, req2.id, true);
    Retry.processAttempt(sim, req3.id, true);

    var stats = Retry.getStats(sim);
    assertEqual(stats.totalRequests, 3, "3 requests tracked");
    assertEqual(stats.totalSuccesses, 3, "all eventually succeeded");
  }, "multiple concurrent requests tracked independently");

  // ===========================
  // BACKOFF TIME ACCUMULATION
  // ===========================

  check(function () {
    var config = Retry.createRetryConfig({
      strategy: "exponential",
      baseDelay: 100,
      maxDelay: 32000,
      maxRetries: 5,
      jitterFactor: 0,
    });
    var sim = Retry.createSimulation(config);
    var req = Retry.enqueueRequest(sim);

    // Fail 3 times: backoffs = 100, 200, 400
    Retry.processAttempt(sim, req.id, false, 0.5);
    Retry.advanceTime(sim, 100);
    Retry.processAttempt(sim, req.id, false, 0.5);
    Retry.advanceTime(sim, 200);
    Retry.processAttempt(sim, req.id, false, 0.5);
    Retry.advanceTime(sim, 400);
    Retry.processAttempt(sim, req.id, true);

    var stats = Retry.getStats(sim);
    assertEqual(stats.totalBackoffTime, 700, "total backoff = 100+200+400 = 700");
  }, "backoff time accumulates correctly across retries");

  // ===========================
  // CONSTANTS EXPOSED
  // ===========================

  check(function () {
    assert(Retry.STRATEGIES.NAIVE === "naive", "NAIVE constant");
    assert(Retry.STRATEGIES.EXPONENTIAL === "exponential", "EXPONENTIAL constant");
    assert(Retry.LIMITS.MAX_BASE_DELAY === 60000, "MAX_BASE_DELAY");
    assert(Retry.LIMITS.MAX_MAX_DELAY === 120000, "MAX_MAX_DELAY");
    assert(Retry.LIMITS.MAX_MAX_RETRIES === 20, "MAX_MAX_RETRIES");
  }, "STRATEGIES and LIMITS constants are exposed");

  return { passed: passed, failed: failed, failures: failures };
}

module.exports = { runTests };
