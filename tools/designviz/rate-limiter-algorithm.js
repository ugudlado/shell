/**
 * Rate Limiter Algorithm
 *
 * Pure functions — no DOM dependency.
 * Implements two rate limiting strategies:
 *   1. Token Bucket — tokens consumed per request, refilled at a constant rate
 *   2. Sliding Window — counts requests within a rolling time window
 *
 * Functions:
 *   createTokenBucket(capacity, refillRate) — create a token bucket limiter
 *   createSlidingWindow(windowSize, maxRequests) — create a sliding window limiter
 *   handleRequest(limiter, timestamp) — process a request, returns { allowed, status, reason, state }
 *   refillTokens(bucket, currentTime) — refill tokens based on elapsed time
 *   getWindowRequestCount(window, currentTime) — count requests in current window
 *   createPreset(name) — return preset configs for known APIs
 */
var RateLimiterAlgorithm = (function () {
  "use strict";

  /**
   * Create a token bucket rate limiter.
   * @param {number} capacity — max tokens (bucket size)
   * @param {number} refillRate — tokens added per second
   * @returns {object} token bucket state
   */
  function createTokenBucket(capacity, refillRate) {
    return {
      type: "token-bucket",
      capacity: capacity,
      tokens: capacity,
      refillRate: refillRate,
      lastRefillTime: 0,
      totalRequests: 0,
      acceptedRequests: 0,
      rejectedRequests: 0,
    };
  }

  /**
   * Create a sliding window rate limiter.
   * @param {number} windowSize — window duration in seconds
   * @param {number} maxRequests — max requests allowed per window
   * @returns {object} sliding window state
   */
  function createSlidingWindow(windowSize, maxRequests) {
    return {
      type: "sliding-window",
      windowSize: windowSize,
      maxRequests: maxRequests,
      requests: [],
      totalRequests: 0,
      acceptedRequests: 0,
      rejectedRequests: 0,
    };
  }

  /**
   * Refill tokens in a token bucket based on elapsed time.
   * Tokens are capped at capacity.
   * @param {object} bucket — token bucket state (mutated in place)
   * @param {number} currentTime — current timestamp in ms
   * @returns {object} the bucket (same reference)
   */
  function refillTokens(bucket, currentTime) {
    if (bucket.refillRate <= 0) {
      bucket.lastRefillTime = currentTime;
      return bucket;
    }
    var elapsed = (currentTime - bucket.lastRefillTime) / 1000; // seconds
    if (elapsed <= 0) {
      return bucket;
    }
    var tokensToAdd = elapsed * bucket.refillRate;
    bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefillTime = currentTime;
    return bucket;
  }

  /**
   * Count requests within the current sliding window.
   * Removes expired requests from the array.
   * @param {object} win — sliding window state
   * @param {number} currentTime — current timestamp in ms
   * @returns {number} count of requests in window
   */
  function getWindowRequestCount(win, currentTime) {
    var cutoff = currentTime - win.windowSize * 1000;
    // Remove expired requests
    win.requests = win.requests.filter(function (ts) {
      return ts >= cutoff;
    });
    return win.requests.length;
  }

  /**
   * Handle a request against a rate limiter (token bucket or sliding window).
   * @param {object} limiter — either token bucket or sliding window state
   * @param {number} timestamp — request timestamp in ms
   * @returns {object} { allowed, status, reason, state }
   */
  function handleRequest(limiter, timestamp) {
    limiter.totalRequests++;

    if (limiter.type === "token-bucket") {
      return handleTokenBucketRequest(limiter, timestamp);
    } else if (limiter.type === "sliding-window") {
      return handleSlidingWindowRequest(limiter, timestamp);
    }
    return { allowed: false, status: 500, reason: "Unknown limiter type", state: {} };
  }

  /**
   * Handle request for token bucket.
   */
  function handleTokenBucketRequest(bucket, timestamp) {
    if (bucket.tokens >= 1) {
      bucket.tokens--;
      bucket.acceptedRequests++;
      return {
        allowed: true,
        status: 200,
        reason: "Token consumed. " + bucket.tokens + "/" + bucket.capacity + " remaining.",
        state: {
          tokens: bucket.tokens,
          capacity: bucket.capacity,
          refillRate: bucket.refillRate,
        },
      };
    } else {
      bucket.rejectedRequests++;
      return {
        allowed: false,
        status: 429,
        reason: "No tokens available. Bucket empty (0/" + bucket.capacity + ").",
        state: {
          tokens: 0,
          capacity: bucket.capacity,
          refillRate: bucket.refillRate,
        },
      };
    }
  }

  /**
   * Handle request for sliding window.
   */
  function handleSlidingWindowRequest(win, timestamp) {
    var count = getWindowRequestCount(win, timestamp);

    if (count < win.maxRequests) {
      win.requests.push(timestamp);
      win.acceptedRequests++;
      return {
        allowed: true,
        status: 200,
        reason: "Request allowed. " + (count + 1) + "/" + win.maxRequests + " in window.",
        state: {
          requestCount: count + 1,
          maxRequests: win.maxRequests,
          windowSize: win.windowSize,
        },
      };
    } else {
      win.rejectedRequests++;
      return {
        allowed: false,
        status: 429,
        reason: "Window full. " + count + "/" + win.maxRequests + " requests in " + win.windowSize + "s window.",
        state: {
          requestCount: count,
          maxRequests: win.maxRequests,
          windowSize: win.windowSize,
        },
      };
    }
  }

  /**
   * Create preset configurations for known APIs.
   * @param {string} name — preset name ("stripe" or "github")
   * @returns {object|null} { tokenBucket: {...}, slidingWindow: {...} } or null
   */
  function createPreset(name) {
    var presets = {
      stripe: {
        tokenBucket: { capacity: 100, refillRate: 100 },
        slidingWindow: { windowSize: 1, maxRequests: 100 },
      },
      github: {
        tokenBucket: { capacity: 5000, refillRate: 5000 / 3600 },
        slidingWindow: { windowSize: 3600, maxRequests: 5000 },
      },
    };
    return presets[name] || null;
  }

  // --- Exports ---
  var exports = {
    createTokenBucket: createTokenBucket,
    createSlidingWindow: createSlidingWindow,
    handleRequest: handleRequest,
    refillTokens: refillTokens,
    getWindowRequestCount: getWindowRequestCount,
    createPreset: createPreset,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = exports;
  }
  return exports;
})();
