/**
 * Rate Limiter UI — visualization + controls
 *
 * Calls RateLimiterAlgorithm functions for all logic (no duplicated algorithm code).
 * Uses textContent for all user-visible text.
 * Cleans up timers on beforeunload.
 */
(function () {
  "use strict";

  // --- State ---
  let tokenBucket = null;
  let slidingWindow = null;
  let refillIntervalId = null;
  let windowUpdateIntervalId = null;
  let requestCounter = 0;

  // --- DOM refs ---
  const inputCapacity = document.getElementById("inputCapacity");
  const inputRefillRate = document.getElementById("inputRefillRate");
  const inputWindowSize = document.getElementById("inputWindowSize");
  const inputMaxRequests = document.getElementById("inputMaxRequests");
  const selectPreset = document.getElementById("selectPreset");
  const inputFloodCount = document.getElementById("inputFloodCount");
  const errorMsg = document.getElementById("errorMsg");
  const infoMsg = document.getElementById("infoMsg");
  const btnApply = document.getElementById("btnApply");
  const btnSendRequest = document.getElementById("btnSendRequest");
  const btnFlood = document.getElementById("btnFlood");
  const btnReset = document.getElementById("btnReset");

  // Bucket visual
  const bucketFill = document.getElementById("bucketFill");
  const bucketLabel = document.getElementById("bucketLabel");
  const statTokens = document.getElementById("statTokens");
  const statBucketAccepted = document.getElementById("statBucketAccepted");
  const statBucketRejected = document.getElementById("statBucketRejected");
  const statBucketTotal = document.getElementById("statBucketTotal");
  const bucketLog = document.getElementById("bucketLog");

  // Window visual
  const windowFill = document.getElementById("windowFill");
  const windowLabel = document.getElementById("windowLabel");
  const statWindowCount = document.getElementById("statWindowCount");
  const statWindowAccepted = document.getElementById("statWindowAccepted");
  const statWindowRejected = document.getElementById("statWindowRejected");
  const statWindowTotal = document.getElementById("statWindowTotal");
  const windowLog = document.getElementById("windowLog");

  // --- Input validation ---
  function validateInputs() {
    const capacity = Number(inputCapacity.value);
    const refillRate = Number(inputRefillRate.value);
    const windowSize = Number(inputWindowSize.value);
    const maxRequests = Number(inputMaxRequests.value);
    const floodCount = Number(inputFloodCount.value);

    const errors = [];

    if (isNaN(capacity) || capacity < 0 || capacity > 1000) {
      errors.push("Capacity must be 0-1000");
    }
    if (isNaN(refillRate) || refillRate < 0 || refillRate > 100) {
      errors.push("Refill rate must be 0-100");
    }
    if (isNaN(windowSize) || windowSize < 1 || windowSize > 3600) {
      errors.push("Window size must be 1-3600");
    }
    if (isNaN(maxRequests) || maxRequests < 1 || maxRequests > 10000) {
      errors.push("Max requests must be 1-10000");
    }
    if (isNaN(floodCount) || floodCount < 1 || floodCount > 100) {
      errors.push("Flood count must be 1-100");
    }

    if (errors.length > 0) {
      showError(errors.join(". "));
      return null;
    }

    hideError();
    return { capacity, refillRate, windowSize, maxRequests, floodCount };
  }

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.remove("hidden");
  }

  function hideError() {
    errorMsg.textContent = "";
    errorMsg.classList.add("hidden");
  }

  // --- Timer management ---
  function clearTimers() {
    if (refillIntervalId !== null) {
      clearInterval(refillIntervalId);
      refillIntervalId = null;
    }
    if (windowUpdateIntervalId !== null) {
      clearInterval(windowUpdateIntervalId);
      windowUpdateIntervalId = null;
    }
  }

  function startTimers() {
    clearTimers();

    // Refill token bucket every 100ms
    refillIntervalId = setInterval(function () {
      if (tokenBucket) {
        RateLimiterAlgorithm.refillTokens(tokenBucket, Date.now());
        updateBucketVisual();
      }
    }, 100);

    // Update sliding window display every 200ms (to show expiring requests)
    windowUpdateIntervalId = setInterval(function () {
      if (slidingWindow) {
        updateWindowVisual();
      }
    }, 200);
  }

  // --- Visual updates ---
  function updateBucketVisual() {
    if (!tokenBucket) return;
    const pct =
      tokenBucket.capacity > 0
        ? (tokenBucket.tokens / tokenBucket.capacity) * 100
        : 0;
    bucketFill.style.height = pct + "%";
    bucketLabel.textContent =
      Math.floor(tokenBucket.tokens) + " / " + tokenBucket.capacity;
    statTokens.textContent = Math.floor(tokenBucket.tokens);
    statBucketAccepted.textContent = tokenBucket.acceptedRequests;
    statBucketRejected.textContent = tokenBucket.rejectedRequests;
    statBucketTotal.textContent = tokenBucket.totalRequests;
  }

  function updateWindowVisual() {
    if (!slidingWindow) return;
    const count = RateLimiterAlgorithm.getWindowRequestCount(
      slidingWindow,
      Date.now(),
    );
    const pct =
      slidingWindow.maxRequests > 0
        ? (count / slidingWindow.maxRequests) * 100
        : 0;
    windowFill.style.width = Math.min(pct, 100) + "%";
    windowLabel.textContent = count + " / " + slidingWindow.maxRequests;
    statWindowCount.textContent = count;
    statWindowAccepted.textContent = slidingWindow.acceptedRequests;
    statWindowRejected.textContent = slidingWindow.rejectedRequests;
    statWindowTotal.textContent = slidingWindow.totalRequests;
  }

  // --- Log entry ---
  function addLogEntry(logEl, result, reqNum) {
    const entry = document.createElement("div");
    entry.className =
      "rl-log-entry " +
      (result.allowed ? "rl-log-entry-allowed" : "rl-log-entry-rejected");

    const timeSpan = document.createElement("span");
    timeSpan.className = "rl-log-entry-time";
    timeSpan.textContent = "#" + reqNum;

    const statusSpan = document.createElement("span");
    statusSpan.className = "rl-log-entry-status";
    statusSpan.textContent = result.status;

    const detailSpan = document.createElement("span");
    detailSpan.className = "rl-log-entry-detail";
    detailSpan.textContent = result.reason;

    entry.appendChild(timeSpan);
    entry.appendChild(statusSpan);
    entry.appendChild(detailSpan);

    // Insert at top (most recent first)
    if (logEl.firstChild) {
      logEl.insertBefore(entry, logEl.firstChild);
    } else {
      logEl.appendChild(entry);
    }

    // Cap log entries at 50
    while (logEl.children.length > 50) {
      logEl.removeChild(logEl.lastChild);
    }
  }

  // --- Actions ---
  function applyConfig() {
    const vals = validateInputs();
    if (!vals) return;

    clearTimers();

    tokenBucket = RateLimiterAlgorithm.createTokenBucket(
      vals.capacity,
      vals.refillRate,
    );
    tokenBucket.lastRefillTime = Date.now();

    slidingWindow = RateLimiterAlgorithm.createSlidingWindow(
      vals.windowSize,
      vals.maxRequests,
    );

    requestCounter = 0;
    bucketLog.textContent = "";
    windowLog.textContent = "";

    updateBucketVisual();
    updateWindowVisual();
    startTimers();

    infoMsg.textContent =
      "Config applied. Bucket: " +
      vals.capacity +
      " tokens, " +
      vals.refillRate +
      "/s refill. Window: " +
      vals.maxRequests +
      " req/" +
      vals.windowSize +
      "s.";
  }

  function sendRequest() {
    if (!tokenBucket || !slidingWindow) {
      showError("Apply config first.");
      return;
    }
    hideError();

    requestCounter++;
    const now = Date.now();

    // Refill bucket before handling request
    RateLimiterAlgorithm.refillTokens(tokenBucket, now);

    const bucketResult = RateLimiterAlgorithm.handleRequest(tokenBucket, now);
    const windowResult = RateLimiterAlgorithm.handleRequest(slidingWindow, now);

    addLogEntry(bucketLog, bucketResult, requestCounter);
    addLogEntry(windowLog, windowResult, requestCounter);

    updateBucketVisual();
    updateWindowVisual();

    // Info message
    const bucketStatus = bucketResult.allowed ? "200 OK" : "429 Rejected";
    const windowStatus = windowResult.allowed ? "200 OK" : "429 Rejected";
    infoMsg.textContent =
      "Request #" +
      requestCounter +
      " — Bucket: " +
      bucketStatus +
      " | Window: " +
      windowStatus;
  }

  function flood() {
    const vals = validateInputs();
    if (!vals) return;
    if (!tokenBucket || !slidingWindow) {
      showError("Apply config first.");
      return;
    }
    hideError();

    const count = vals.floodCount;
    for (let i = 0; i < count; i++) {
      sendRequest();
    }

    infoMsg.textContent = "Flood: sent " + count + " requests.";
  }

  function reset() {
    clearTimers();
    tokenBucket = null;
    slidingWindow = null;
    requestCounter = 0;

    bucketFill.style.height = "100%";
    bucketLabel.textContent = "— / —";
    statTokens.textContent = "—";
    statBucketAccepted.textContent = "0";
    statBucketRejected.textContent = "0";
    statBucketTotal.textContent = "0";
    bucketLog.textContent = "";

    windowFill.style.width = "0%";
    windowLabel.textContent = "— / —";
    statWindowCount.textContent = "—";
    statWindowAccepted.textContent = "0";
    statWindowRejected.textContent = "0";
    statWindowTotal.textContent = "0";
    windowLog.textContent = "";

    hideError();
    infoMsg.textContent =
      "Configure rate limiter parameters and send requests to compare Token Bucket vs Sliding Window.";
    selectPreset.value = "";
  }

  // --- Preset handling ---
  function applyPreset() {
    const presetName = selectPreset.value;
    if (!presetName) return;

    const preset = RateLimiterAlgorithm.createPreset(presetName);
    if (!preset) return;

    inputCapacity.value = preset.tokenBucket.capacity;
    inputRefillRate.value = Math.round(preset.tokenBucket.refillRate * 100) / 100;
    inputWindowSize.value = preset.slidingWindow.windowSize;
    inputMaxRequests.value = preset.slidingWindow.maxRequests;

    applyConfig();
  }

  // --- Event listeners ---
  btnApply.addEventListener("click", applyConfig);
  btnSendRequest.addEventListener("click", sendRequest);
  btnFlood.addEventListener("click", flood);
  btnReset.addEventListener("click", reset);
  selectPreset.addEventListener("change", applyPreset);

  // --- Timer cleanup on page unload ---
  window.addEventListener("beforeunload", clearTimers);

  // --- Initialize with default config ---
  applyConfig();
})();
