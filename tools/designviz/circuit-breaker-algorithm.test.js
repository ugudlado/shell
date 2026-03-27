/**
 * Circuit Breaker Algorithm Tests — Node.js runner compatible
 * Exports runTests() for run-tests.js harness
 *
 * Tests cover: creation, CLOSED->OPEN transition, OPEN rejection, OPEN->HALF-OPEN timeout,
 * HALF-OPEN->CLOSED on success, HALF-OPEN->OPEN on failure, reset, stats,
 * edge cases (threshold=1, consecutive success resets count, boundary timing).
 */

function runTests({ assert, assertEqual, assertApprox }) {
  var passed = 0;
  var failed = 0;
  var failures = [];

  var CB = require("./circuit-breaker-algorithm.js");

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
  // CREATION
  // ===========================

  check(function () {
    var breaker = CB.createBreaker({ failureThreshold: 5, openTimeout: 10 });
    assertEqual(breaker.state, "CLOSED", "initial state is CLOSED");
    assertEqual(breaker.failureThreshold, 5, "threshold is 5");
    assertEqual(breaker.openTimeout, 10, "timeout is 10");
    assertEqual(breaker.failureCount, 0, "failure count starts at 0");
    assertEqual(breaker.totalRequests, 0, "total starts at 0");
    assertEqual(breaker.successfulRequests, 0, "successful starts at 0");
    assertEqual(breaker.failedRequests, 0, "failed starts at 0");
    assertEqual(breaker.rejectedRequests, 0, "rejected starts at 0");
    assertEqual(breaker.openedAt, null, "openedAt is null");
  }, "createBreaker returns correct initial state");

  check(function () {
    var breaker = CB.createBreaker({ failureThreshold: 1, openTimeout: 1 });
    assertEqual(breaker.failureThreshold, 1, "threshold is 1");
    assertEqual(breaker.openTimeout, 1, "timeout is 1");
  }, "createBreaker with minimum config");

  // ===========================
  // CLOSED — Success
  // ===========================

  check(function () {
    var breaker = CB.createBreaker({ failureThreshold: 3, openTimeout: 5 });
    var result = CB.handleRequest(breaker, 1000, true);
    assertEqual(result.allowed, true, "request allowed");
    assertEqual(result.success, true, "request succeeded");
    assertEqual(result.state, "CLOSED", "still CLOSED");
    assertEqual(result.transition, null, "no transition");
    assertEqual(breaker.successfulRequests, 1, "1 success");
    assertEqual(breaker.failureCount, 0, "failure count is 0");
  }, "CLOSED state: successful request stays CLOSED");

  // ===========================
  // CLOSED — Failure below threshold
  // ===========================

  check(function () {
    var breaker = CB.createBreaker({ failureThreshold: 3, openTimeout: 5 });
    var r1 = CB.handleRequest(breaker, 1000, false);
    assertEqual(r1.allowed, true, "request forwarded");
    assertEqual(r1.success, false, "request failed");
    assertEqual(r1.state, "CLOSED", "still CLOSED");
    assertEqual(breaker.failureCount, 1, "failure count is 1");
    assertEqual(r1.transition, null, "no transition");
  }, "CLOSED state: failure below threshold stays CLOSED");

  // ===========================
  // CLOSED -> OPEN (threshold reached)
  // ===========================

  check(function () {
    var breaker = CB.createBreaker({ failureThreshold: 3, openTimeout: 5 });
    CB.handleRequest(breaker, 1000, false); // failure 1
    CB.handleRequest(breaker, 1001, false); // failure 2
    var r3 = CB.handleRequest(breaker, 1002, false); // failure 3 = threshold
    assertEqual(r3.state, "OPEN", "transitions to OPEN");
    assertEqual(r3.transition.from, "CLOSED", "from CLOSED");
    assertEqual(r3.transition.to, "OPEN", "to OPEN");
    assertEqual(breaker.failureCount, 3, "failure count is 3");
    assertEqual(breaker.openedAt, 1002, "openedAt set");
    assertEqual(breaker.failedRequests, 3, "3 failed requests");
  }, "CLOSED -> OPEN: consecutive failures reach threshold");

  // ===========================
  // Success resets failure count
  // ===========================

  check(function () {
    var breaker = CB.createBreaker({ failureThreshold: 3, openTimeout: 5 });
    CB.handleRequest(breaker, 1000, false); // failure 1
    CB.handleRequest(breaker, 1001, false); // failure 2
    CB.handleRequest(breaker, 1002, true); // success resets
    assertEqual(breaker.failureCount, 0, "failure count reset on success");
    CB.handleRequest(breaker, 1003, false); // failure 1 again
    assertEqual(breaker.failureCount, 1, "failure count is 1 after reset");
    assertEqual(breaker.state, "CLOSED", "still CLOSED");
  }, "success in CLOSED resets consecutive failure count");

  // ===========================
  // OPEN — Rejects requests
  // ===========================

  check(function () {
    var breaker = CB.createBreaker({ failureThreshold: 2, openTimeout: 5 });
    CB.handleRequest(breaker, 1000, false);
    CB.handleRequest(breaker, 1001, false); // trips to OPEN
    assertEqual(breaker.state, "OPEN", "breaker is OPEN");

    var r = CB.handleRequest(breaker, 1002, true);
    assertEqual(r.allowed, false, "request rejected");
    assertEqual(r.success, false, "not successful");
    assertEqual(r.state, "OPEN", "still OPEN");
    assertEqual(r.transition, null, "no transition");
    assertEqual(breaker.rejectedRequests, 1, "1 rejected");
    // downstream success doesn't matter — request never reaches downstream
  }, "OPEN state: requests rejected immediately");

  check(function () {
    var breaker = CB.createBreaker({ failureThreshold: 1, openTimeout: 5 });
    CB.handleRequest(breaker, 1000, false); // trips immediately
    assertEqual(breaker.state, "OPEN", "OPEN after 1 failure");

    // Multiple rejections
    for (var i = 0; i < 5; i++) {
      CB.handleRequest(breaker, 1001 + i, true);
    }
    assertEqual(breaker.rejectedRequests, 5, "5 rejected");
    assertEqual(breaker.totalRequests, 6, "6 total (1 failed + 5 rejected)");
    assertEqual(breaker.state, "OPEN", "still OPEN");
  }, "OPEN state: multiple rejections counted correctly");

  // ===========================
  // OPEN -> HALF-OPEN (timeout)
  // ===========================

  check(function () {
    var breaker = CB.createBreaker({ failureThreshold: 2, openTimeout: 5 });
    CB.handleRequest(breaker, 1000, false);
    CB.handleRequest(breaker, 1001, false); // OPEN at 1001
    assertEqual(breaker.state, "OPEN", "breaker is OPEN");

    // Before timeout
    var before = CB.checkTimeout(breaker, 4000); // 2.999s elapsed
    assertEqual(before.transitioned, false, "not yet");
    assertEqual(breaker.state, "OPEN", "still OPEN before timeout");

    // At exact timeout (1001 + 5000 = 6001)
    var atTimeout = CB.checkTimeout(breaker, 6001);
    assertEqual(atTimeout.transitioned, true, "transitioned");
    assertEqual(atTimeout.oldState, "OPEN", "from OPEN");
    assertEqual(atTimeout.newState, "HALF-OPEN", "to HALF-OPEN");
    assertEqual(breaker.state, "HALF-OPEN", "breaker is HALF-OPEN");
  }, "OPEN -> HALF-OPEN: timeout triggers transition");

  check(function () {
    var breaker = CB.createBreaker({ failureThreshold: 2, openTimeout: 5 });
    CB.handleRequest(breaker, 1000, false);
    CB.handleRequest(breaker, 1001, false); // OPEN at 1001

    // Exactly at boundary: 1001 + 5000 = 6001
    var atBoundary = CB.checkTimeout(breaker, 6001);
    assertEqual(atBoundary.transitioned, true, "transitions at exactly timeout");
  }, "checkTimeout transitions at exact boundary");

  check(function () {
    var breaker = CB.createBreaker({ failureThreshold: 2, openTimeout: 5 });
    CB.handleRequest(breaker, 1000, false);
    CB.handleRequest(breaker, 1001, false); // OPEN at 1001

    // 1ms before boundary: 1001 + 4999 = 6000
    var justBefore = CB.checkTimeout(breaker, 6000);
    assertEqual(justBefore.transitioned, false, "does not transition 1ms early");
    assertEqual(breaker.state, "OPEN", "still OPEN");
  }, "checkTimeout does NOT transition 1ms before boundary");

  // ===========================
  // HALF-OPEN -> CLOSED (probe success)
  // ===========================

  check(function () {
    var breaker = CB.createBreaker({ failureThreshold: 2, openTimeout: 5 });
    CB.handleRequest(breaker, 1000, false);
    CB.handleRequest(breaker, 1001, false); // OPEN
    CB.checkTimeout(breaker, 7000); // HALF-OPEN
    assertEqual(breaker.state, "HALF-OPEN", "is HALF-OPEN");

    var result = CB.handleRequest(breaker, 7001, true);
    assertEqual(result.allowed, true, "probe allowed");
    assertEqual(result.success, true, "probe succeeded");
    assertEqual(result.state, "CLOSED", "transitions to CLOSED");
    assertEqual(result.transition.from, "HALF-OPEN", "from HALF-OPEN");
    assertEqual(result.transition.to, "CLOSED", "to CLOSED");
    assertEqual(breaker.failureCount, 0, "failure count reset");
    assertEqual(breaker.openedAt, null, "openedAt cleared");
  }, "HALF-OPEN -> CLOSED: probe success closes breaker");

  // ===========================
  // HALF-OPEN -> OPEN (probe failure)
  // ===========================

  check(function () {
    var breaker = CB.createBreaker({ failureThreshold: 2, openTimeout: 5 });
    CB.handleRequest(breaker, 1000, false);
    CB.handleRequest(breaker, 1001, false); // OPEN
    CB.checkTimeout(breaker, 7000); // HALF-OPEN
    assertEqual(breaker.state, "HALF-OPEN", "is HALF-OPEN");

    var result = CB.handleRequest(breaker, 7001, false);
    assertEqual(result.allowed, true, "probe allowed (sent to downstream)");
    assertEqual(result.success, false, "probe failed");
    assertEqual(result.state, "OPEN", "transitions back to OPEN");
    assertEqual(result.transition.from, "HALF-OPEN", "from HALF-OPEN");
    assertEqual(result.transition.to, "OPEN", "to OPEN");
    assertEqual(breaker.openedAt, 7001, "openedAt reset to now");
  }, "HALF-OPEN -> OPEN: probe failure reopens breaker");

  // ===========================
  // Full lifecycle
  // ===========================

  check(function () {
    var breaker = CB.createBreaker({ failureThreshold: 2, openTimeout: 3 });

    // 1. CLOSED: 2 failures -> OPEN
    CB.handleRequest(breaker, 1000, false);
    CB.handleRequest(breaker, 1001, false);
    assertEqual(breaker.state, "OPEN", "step 1: OPEN");

    // 2. OPEN: rejected
    var r = CB.handleRequest(breaker, 1500, true);
    assertEqual(r.allowed, false, "step 2: rejected");

    // 3. Timeout -> HALF-OPEN
    CB.checkTimeout(breaker, 5000); // 1001 + 3000 = 4001, 5000 > 4001
    assertEqual(breaker.state, "HALF-OPEN", "step 3: HALF-OPEN");

    // 4. Probe fails -> OPEN again
    CB.handleRequest(breaker, 5001, false);
    assertEqual(breaker.state, "OPEN", "step 4: OPEN again");

    // 5. Timeout -> HALF-OPEN again
    CB.checkTimeout(breaker, 9000); // 5001 + 3000 = 8001, 9000 > 8001
    assertEqual(breaker.state, "HALF-OPEN", "step 5: HALF-OPEN again");

    // 6. Probe succeeds -> CLOSED
    CB.handleRequest(breaker, 9001, true);
    assertEqual(breaker.state, "CLOSED", "step 6: CLOSED");
    assertEqual(breaker.failureCount, 0, "failure count reset");
  }, "full lifecycle: CLOSED->OPEN->HALF-OPEN->OPEN->HALF-OPEN->CLOSED");

  // ===========================
  // Edge: threshold = 1
  // ===========================

  check(function () {
    var breaker = CB.createBreaker({ failureThreshold: 1, openTimeout: 5 });
    var result = CB.handleRequest(breaker, 1000, false);
    assertEqual(result.state, "OPEN", "trips immediately on first failure");
    assertEqual(breaker.failureCount, 1, "failure count is 1");
  }, "threshold=1: single failure trips breaker");

  // ===========================
  // Edge: checkTimeout on non-OPEN state
  // ===========================

  check(function () {
    var breaker = CB.createBreaker({ failureThreshold: 3, openTimeout: 5 });
    var result = CB.checkTimeout(breaker, 100000);
    assertEqual(result.transitioned, false, "no transition on CLOSED");
    assertEqual(breaker.state, "CLOSED", "still CLOSED");
  }, "checkTimeout on CLOSED state does nothing");

  check(function () {
    var breaker = CB.createBreaker({ failureThreshold: 2, openTimeout: 5 });
    CB.handleRequest(breaker, 1000, false);
    CB.handleRequest(breaker, 1001, false); // OPEN
    CB.checkTimeout(breaker, 7000); // HALF-OPEN
    var result = CB.checkTimeout(breaker, 100000);
    assertEqual(result.transitioned, false, "no transition on HALF-OPEN");
    assertEqual(breaker.state, "HALF-OPEN", "still HALF-OPEN");
  }, "checkTimeout on HALF-OPEN state does nothing");

  // ===========================
  // Reset
  // ===========================

  check(function () {
    var config = { failureThreshold: 5, openTimeout: 10 };
    var breaker = CB.createBreaker(config);
    CB.handleRequest(breaker, 1000, false);
    CB.handleRequest(breaker, 1001, false);
    assertEqual(breaker.failureCount, 2, "has failures");

    var fresh = CB.reset(config);
    assertEqual(fresh.state, "CLOSED", "reset to CLOSED");
    assertEqual(fresh.failureCount, 0, "failure count is 0");
    assertEqual(fresh.totalRequests, 0, "total is 0");
    assertEqual(fresh.openedAt, null, "openedAt is null");
  }, "reset creates fresh breaker with same config");

  // ===========================
  // getStats
  // ===========================

  check(function () {
    var breaker = CB.createBreaker({ failureThreshold: 3, openTimeout: 10 });
    CB.handleRequest(breaker, 1000, true);
    CB.handleRequest(breaker, 1001, false);
    var stats = CB.getStats(breaker);
    assertEqual(stats.state, "CLOSED", "state");
    assertEqual(stats.failureCount, 1, "failureCount");
    assertEqual(stats.failureThreshold, 3, "failureThreshold");
    assertEqual(stats.openTimeout, 10, "openTimeout");
    assertEqual(stats.totalRequests, 2, "totalRequests");
    assertEqual(stats.successfulRequests, 1, "successfulRequests");
    assertEqual(stats.failedRequests, 1, "failedRequests");
    assertEqual(stats.rejectedRequests, 0, "rejectedRequests");
  }, "getStats returns correct snapshot");

  // ===========================
  // STATES constants
  // ===========================

  check(function () {
    assertEqual(CB.STATES.CLOSED, "CLOSED", "CLOSED constant");
    assertEqual(CB.STATES.OPEN, "OPEN", "OPEN constant");
    assertEqual(CB.STATES.HALF_OPEN, "HALF-OPEN", "HALF_OPEN constant");
  }, "STATES constants are correct");

  // ===========================
  // Edge: rapid transitions
  // ===========================

  check(function () {
    var breaker = CB.createBreaker({ failureThreshold: 2, openTimeout: 1 });
    // Trip breaker
    CB.handleRequest(breaker, 1000, false);
    CB.handleRequest(breaker, 1001, false);
    assertEqual(breaker.state, "OPEN", "OPEN");

    // Rapid timeout check + probe success
    CB.checkTimeout(breaker, 2002); // 1001 + 1000 = 2001
    assertEqual(breaker.state, "HALF-OPEN", "HALF-OPEN");
    CB.handleRequest(breaker, 2003, true);
    assertEqual(breaker.state, "CLOSED", "CLOSED after probe");

    // Trip again immediately
    CB.handleRequest(breaker, 2004, false);
    CB.handleRequest(breaker, 2005, false);
    assertEqual(breaker.state, "OPEN", "OPEN again");
    assertEqual(breaker.openedAt, 2005, "openedAt updated");
  }, "rapid state cycling works correctly");

  // ===========================
  // Edge: request counts across states
  // ===========================

  check(function () {
    var breaker = CB.createBreaker({ failureThreshold: 1, openTimeout: 1 });
    CB.handleRequest(breaker, 1000, true); // success
    CB.handleRequest(breaker, 1001, false); // fail -> OPEN
    CB.handleRequest(breaker, 1002, true); // rejected (OPEN)
    CB.handleRequest(breaker, 1003, true); // rejected (OPEN)
    CB.checkTimeout(breaker, 2002); // HALF-OPEN
    CB.handleRequest(breaker, 2003, true); // probe success -> CLOSED

    assertEqual(breaker.totalRequests, 5, "5 total");
    assertEqual(breaker.successfulRequests, 2, "2 successful (initial + probe)");
    assertEqual(breaker.failedRequests, 1, "1 failed");
    assertEqual(breaker.rejectedRequests, 2, "2 rejected");
  }, "request counts accurate across all states");

  return { passed: passed, failed: failed, failures: failures };
}

module.exports = { runTests };
