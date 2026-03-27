/**
 * Rate Limiter Algorithm Tests — Node.js runner compatible
 * Exports runTests() for run-tests.js harness
 *
 * Tests cover: Token Bucket (create, accept, reject, refill, capacity cap, zero capacity,
 * zero refill), Sliding Window (create, accept, reject, expiry, boundary),
 * edge cases, presets (Stripe, GitHub).
 */

function runTests({ assert, assertEqual, assertApprox }) {
  var passed = 0;
  var failed = 0;
  var failures = [];

  var RateLimiterAlgorithm = require("./rate-limiter-algorithm.js");

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
  // TOKEN BUCKET — Creation
  // ===========================

  check(function () {
    var bucket = RateLimiterAlgorithm.createTokenBucket(10, 2);
    assertEqual(bucket.capacity, 10, "capacity is 10");
    assertEqual(bucket.tokens, 10, "starts full");
    assertEqual(bucket.refillRate, 2, "refill rate is 2");
    assertEqual(bucket.type, "token-bucket", "type is token-bucket");
    assertEqual(bucket.totalRequests, 0, "total starts at 0");
    assertEqual(bucket.acceptedRequests, 0, "accepted starts at 0");
    assertEqual(bucket.rejectedRequests, 0, "rejected starts at 0");
  }, "createTokenBucket returns correct initial state");

  check(function () {
    var bucket = RateLimiterAlgorithm.createTokenBucket(1, 0.5);
    assertEqual(bucket.capacity, 1, "capacity is 1");
    assertEqual(bucket.tokens, 1, "starts full with capacity 1");
    assertEqual(bucket.refillRate, 0.5, "refill rate is 0.5");
  }, "createTokenBucket with minimum capacity");

  // ===========================
  // TOKEN BUCKET — Accept/Reject
  // ===========================

  check(function () {
    var bucket = RateLimiterAlgorithm.createTokenBucket(5, 1);
    var result = RateLimiterAlgorithm.handleRequest(bucket, 1000);
    assertEqual(result.allowed, true, "request allowed");
    assertEqual(result.status, 200, "status 200");
    assertEqual(bucket.tokens, 4, "tokens decremented to 4");
    assertEqual(bucket.totalRequests, 1, "total is 1");
    assertEqual(bucket.acceptedRequests, 1, "accepted is 1");
  }, "token bucket accepts request when tokens available");

  check(function () {
    var bucket = RateLimiterAlgorithm.createTokenBucket(2, 1);
    RateLimiterAlgorithm.handleRequest(bucket, 1000);
    RateLimiterAlgorithm.handleRequest(bucket, 1001);
    // Now 0 tokens
    var result = RateLimiterAlgorithm.handleRequest(bucket, 1002);
    assertEqual(result.allowed, false, "request rejected");
    assertEqual(result.status, 429, "status 429");
    assertEqual(bucket.tokens, 0, "tokens stay at 0");
    assertEqual(bucket.rejectedRequests, 1, "rejected is 1");
    assertEqual(bucket.totalRequests, 3, "total is 3");
    assertEqual(bucket.acceptedRequests, 2, "accepted is 2");
  }, "token bucket rejects request when tokens exhausted");

  check(function () {
    var bucket = RateLimiterAlgorithm.createTokenBucket(3, 1);
    // Drain all tokens
    RateLimiterAlgorithm.handleRequest(bucket, 1000);
    RateLimiterAlgorithm.handleRequest(bucket, 1000);
    RateLimiterAlgorithm.handleRequest(bucket, 1000);
    assertEqual(bucket.tokens, 0, "all tokens consumed");
    // Multiple rejections
    var r1 = RateLimiterAlgorithm.handleRequest(bucket, 1000);
    var r2 = RateLimiterAlgorithm.handleRequest(bucket, 1000);
    assertEqual(r1.allowed, false, "r1 rejected");
    assertEqual(r2.allowed, false, "r2 rejected");
    assertEqual(bucket.rejectedRequests, 2, "two rejections");
    assertEqual(bucket.tokens, 0, "tokens never go negative");
  }, "token bucket tokens never go negative");

  // ===========================
  // TOKEN BUCKET — Refill
  // ===========================

  check(function () {
    var bucket = RateLimiterAlgorithm.createTokenBucket(10, 2);
    bucket.tokens = 5;
    bucket.lastRefillTime = 1000;
    RateLimiterAlgorithm.refillTokens(bucket, 2000); // 1 second later, rate=2
    assertEqual(bucket.tokens, 7, "refilled 2 tokens after 1s at rate 2/s");
  }, "refillTokens adds correct amount based on elapsed time");

  check(function () {
    var bucket = RateLimiterAlgorithm.createTokenBucket(10, 5);
    bucket.tokens = 8;
    bucket.lastRefillTime = 1000;
    RateLimiterAlgorithm.refillTokens(bucket, 2000); // 1s later, rate=5, would be 13
    assertEqual(bucket.tokens, 10, "tokens capped at capacity");
  }, "refillTokens caps tokens at capacity");

  check(function () {
    var bucket = RateLimiterAlgorithm.createTokenBucket(10, 2);
    bucket.tokens = 0;
    bucket.lastRefillTime = 1000;
    RateLimiterAlgorithm.refillTokens(bucket, 1500); // 0.5s later, rate=2
    assertEqual(bucket.tokens, 1, "refilled 1 token after 0.5s at rate 2/s");
  }, "refillTokens handles fractional seconds");

  check(function () {
    var bucket = RateLimiterAlgorithm.createTokenBucket(10, 2);
    bucket.tokens = 10;
    bucket.lastRefillTime = 1000;
    RateLimiterAlgorithm.refillTokens(bucket, 2000);
    assertEqual(bucket.tokens, 10, "already full, stays at capacity");
  }, "refillTokens does not exceed capacity when already full");

  // ===========================
  // TOKEN BUCKET — Zero capacity
  // ===========================

  check(function () {
    var bucket = RateLimiterAlgorithm.createTokenBucket(0, 5);
    assertEqual(bucket.capacity, 0, "capacity is 0");
    assertEqual(bucket.tokens, 0, "starts with 0 tokens");
    var result = RateLimiterAlgorithm.handleRequest(bucket, 1000);
    assertEqual(result.allowed, false, "immediately rejected");
    assertEqual(result.status, 429, "status 429");
  }, "zero capacity bucket rejects all requests");

  // ===========================
  // TOKEN BUCKET — Zero refill rate
  // ===========================

  check(function () {
    var bucket = RateLimiterAlgorithm.createTokenBucket(2, 0);
    RateLimiterAlgorithm.handleRequest(bucket, 1000);
    RateLimiterAlgorithm.handleRequest(bucket, 1001);
    assertEqual(bucket.tokens, 0, "tokens exhausted");
    bucket.lastRefillTime = 1000;
    RateLimiterAlgorithm.refillTokens(bucket, 5000); // 4 seconds later
    assertEqual(bucket.tokens, 0, "zero refill rate means no refill");
    var result = RateLimiterAlgorithm.handleRequest(bucket, 5001);
    assertEqual(result.allowed, false, "still rejected after time passes");
  }, "zero refill rate never refills");

  // ===========================
  // SLIDING WINDOW — Creation
  // ===========================

  check(function () {
    var win = RateLimiterAlgorithm.createSlidingWindow(60, 100);
    assertEqual(win.windowSize, 60, "window size is 60");
    assertEqual(win.maxRequests, 100, "max requests is 100");
    assertEqual(win.requests.length, 0, "starts with no requests");
    assertEqual(win.type, "sliding-window", "type is sliding-window");
    assertEqual(win.totalRequests, 0, "total starts at 0");
    assertEqual(win.acceptedRequests, 0, "accepted starts at 0");
    assertEqual(win.rejectedRequests, 0, "rejected starts at 0");
  }, "createSlidingWindow returns correct initial state");

  // ===========================
  // SLIDING WINDOW — Accept/Reject
  // ===========================

  check(function () {
    var win = RateLimiterAlgorithm.createSlidingWindow(10, 3);
    var r1 = RateLimiterAlgorithm.handleRequest(win, 1000);
    assertEqual(r1.allowed, true, "first request allowed");
    assertEqual(r1.status, 200, "status 200");
    assertEqual(win.requests.length, 1, "one request recorded");
    assertEqual(win.acceptedRequests, 1, "accepted is 1");
  }, "sliding window accepts request within limit");

  check(function () {
    var win = RateLimiterAlgorithm.createSlidingWindow(10, 2);
    RateLimiterAlgorithm.handleRequest(win, 1000);
    RateLimiterAlgorithm.handleRequest(win, 1001);
    var result = RateLimiterAlgorithm.handleRequest(win, 1002);
    assertEqual(result.allowed, false, "third request rejected");
    assertEqual(result.status, 429, "status 429");
    assertEqual(win.rejectedRequests, 1, "rejected is 1");
    assertEqual(win.totalRequests, 3, "total is 3");
    assertEqual(win.acceptedRequests, 2, "accepted is 2");
  }, "sliding window rejects when max requests reached");

  // ===========================
  // SLIDING WINDOW — Expiry
  // ===========================

  check(function () {
    var win = RateLimiterAlgorithm.createSlidingWindow(5, 2);
    RateLimiterAlgorithm.handleRequest(win, 1000);
    RateLimiterAlgorithm.handleRequest(win, 1001);
    // Window is full (2 requests in 5s window)
    var r3 = RateLimiterAlgorithm.handleRequest(win, 1002);
    assertEqual(r3.allowed, false, "rejected at 1002");
    // After window expires (1000 + 5000 = 6000)
    var r4 = RateLimiterAlgorithm.handleRequest(win, 6001);
    assertEqual(r4.allowed, true, "accepted after first request expired");
  }, "sliding window expires old requests outside window");

  check(function () {
    var win = RateLimiterAlgorithm.createSlidingWindow(5, 2);
    RateLimiterAlgorithm.handleRequest(win, 1000);
    RateLimiterAlgorithm.handleRequest(win, 3000);
    // First request expires at 6000, second at 8000
    // At 5999, first still in window
    var count5999 = RateLimiterAlgorithm.getWindowRequestCount(win, 5999);
    assertEqual(count5999, 2, "both requests in window at 5999");
    // At 6001, first expired
    var count6001 = RateLimiterAlgorithm.getWindowRequestCount(win, 6001);
    assertEqual(count6001, 1, "first request expired at 6001");
  }, "getWindowRequestCount correctly counts requests in window");

  // ===========================
  // SLIDING WINDOW — Boundary
  // ===========================

  check(function () {
    var win = RateLimiterAlgorithm.createSlidingWindow(5, 1);
    RateLimiterAlgorithm.handleRequest(win, 1000);
    // Exactly at boundary: 1000 + 5000 = 6000
    var atBoundary = RateLimiterAlgorithm.handleRequest(win, 6000);
    // Request at exactly windowSize after first should still see old request in window
    // (window is [current - windowSize*1000, current], inclusive)
    assertEqual(atBoundary.allowed, false, "at exact boundary, old request still in window");
    // One ms after boundary
    var afterBoundary = RateLimiterAlgorithm.handleRequest(win, 6001);
    assertEqual(afterBoundary.allowed, true, "one ms after boundary, old request expired");
  }, "sliding window boundary precision — exact edge");

  // ===========================
  // SLIDING WINDOW — Single request window
  // ===========================

  check(function () {
    var win = RateLimiterAlgorithm.createSlidingWindow(1, 1);
    var r1 = RateLimiterAlgorithm.handleRequest(win, 1000);
    assertEqual(r1.allowed, true, "first request allowed");
    var r2 = RateLimiterAlgorithm.handleRequest(win, 1500);
    assertEqual(r2.allowed, false, "second request within 1s rejected");
    var r3 = RateLimiterAlgorithm.handleRequest(win, 2001);
    assertEqual(r3.allowed, true, "after 1s window, request allowed");
  }, "single-request window size=1s");

  // ===========================
  // PRESETS
  // ===========================

  check(function () {
    var preset = RateLimiterAlgorithm.createPreset("stripe");
    assertEqual(preset.tokenBucket.capacity, 100, "Stripe bucket capacity 100");
    assertEqual(preset.tokenBucket.refillRate, 100, "Stripe refill rate 100/s");
    assertEqual(preset.slidingWindow.windowSize, 1, "Stripe window 1s");
    assertEqual(preset.slidingWindow.maxRequests, 100, "Stripe max 100 req/window");
  }, "Stripe preset has correct values");

  check(function () {
    var preset = RateLimiterAlgorithm.createPreset("github");
    assertEqual(preset.tokenBucket.capacity, 5000, "GitHub bucket capacity 5000");
    assertApprox(preset.tokenBucket.refillRate, 5000 / 3600, 0.01, "GitHub refill ~1.39/s");
    assertEqual(preset.slidingWindow.windowSize, 3600, "GitHub window 3600s");
    assertEqual(preset.slidingWindow.maxRequests, 5000, "GitHub max 5000 req/window");
  }, "GitHub preset has correct values");

  check(function () {
    var preset = RateLimiterAlgorithm.createPreset("unknown");
    assertEqual(preset, null, "unknown preset returns null");
  }, "unknown preset returns null");

  // ===========================
  // EDGE: handleRequest returns state snapshot
  // ===========================

  check(function () {
    var bucket = RateLimiterAlgorithm.createTokenBucket(5, 1);
    var result = RateLimiterAlgorithm.handleRequest(bucket, 1000);
    assert(result.state !== undefined, "result has state");
    assertEqual(result.state.tokens, 4, "state shows tokens after request");
    assert(typeof result.reason === "string", "result has reason string");
  }, "handleRequest returns state snapshot and reason (token bucket)");

  check(function () {
    var win = RateLimiterAlgorithm.createSlidingWindow(10, 5);
    var result = RateLimiterAlgorithm.handleRequest(win, 1000);
    assert(result.state !== undefined, "result has state");
    assertEqual(result.state.requestCount, 1, "state shows request count");
    assert(typeof result.reason === "string", "result has reason string");
  }, "handleRequest returns state snapshot and reason (sliding window)");

  // ===========================
  // EDGE: Burst at capacity boundary
  // ===========================

  check(function () {
    var bucket = RateLimiterAlgorithm.createTokenBucket(5, 0);
    var results = [];
    for (var i = 0; i < 8; i++) {
      results.push(RateLimiterAlgorithm.handleRequest(bucket, 1000 + i));
    }
    var accepted = results.filter(function (r) { return r.allowed; }).length;
    var rejected = results.filter(function (r) { return !r.allowed; }).length;
    assertEqual(accepted, 5, "exactly 5 accepted (capacity)");
    assertEqual(rejected, 3, "exactly 3 rejected");
    assertEqual(bucket.tokens, 0, "tokens at 0");
  }, "burst of 8 on capacity-5 bucket: exactly 5 accepted, 3 rejected");

  check(function () {
    var win = RateLimiterAlgorithm.createSlidingWindow(10, 3);
    var results = [];
    for (var i = 0; i < 6; i++) {
      results.push(RateLimiterAlgorithm.handleRequest(win, 1000 + i));
    }
    var accepted = results.filter(function (r) { return r.allowed; }).length;
    var rejected = results.filter(function (r) { return !r.allowed; }).length;
    assertEqual(accepted, 3, "exactly 3 accepted (max)");
    assertEqual(rejected, 3, "exactly 3 rejected");
  }, "burst of 6 on window max-3: exactly 3 accepted, 3 rejected");

  return { passed: passed, failed: failed, failures: failures };
}

module.exports = { runTests };
