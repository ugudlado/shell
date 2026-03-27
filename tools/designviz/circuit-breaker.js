/**
 * Circuit Breaker UI — visualization + controls
 *
 * Calls CircuitBreakerAlgorithm functions for all logic (no duplicated algorithm code).
 * Uses textContent for all user-visible text.
 * Cleans up timers on reset and beforeunload.
 */
(function () {
  "use strict";

  // --- State ---
  let breaker = null;
  let config = null;
  let autoSendIntervalId = null;
  let timeoutCountdownId = null;
  let requestCounter = 0;
  let autoSendOn = false;
  let flowAnimationTimeoutId = null;

  // --- DOM refs ---
  const inputFailureRate = document.getElementById("inputFailureRate");
  const failureRateDisplay = document.getElementById("failureRateDisplay");
  const inputThreshold = document.getElementById("inputThreshold");
  const inputTimeout = document.getElementById("inputTimeout");
  const errorMsg = document.getElementById("errorMsg");
  const infoMsg = document.getElementById("infoMsg");
  const btnApply = document.getElementById("btnApply");
  const btnSendRequest = document.getElementById("btnSendRequest");
  const btnAutoSend = document.getElementById("btnAutoSend");
  const btnReset = document.getElementById("btnReset");

  // State diagram
  const stateClosed = document.getElementById("stateClosed");
  const stateOpen = document.getElementById("stateOpen");
  const stateHalfOpen = document.getElementById("stateHalfOpen");
  const timeoutDisplay = document.getElementById("timeoutDisplay");
  const arrowClosedOpen = document.getElementById("arrowClosedOpen");
  const arrowHalfOpenClosed = document.getElementById("arrowHalfOpenClosed");
  const arrowHalfOpenOpen = document.getElementById("arrowHalfOpenOpen");
  const arrowOpenHalfOpen = document.getElementById("arrowOpenHalfOpen");

  // Request flow
  const flowBreaker = document.getElementById("flowBreaker");
  const flowDependency = document.getElementById("flowDependency");
  const flowDot = document.getElementById("flowDot");
  const flowDot2 = document.getElementById("flowDot2");
  const flowStatus = document.getElementById("flowStatus");

  // Stats
  const statState = document.getElementById("statState");
  const statFailures = document.getElementById("statFailures");
  const statTimeout = document.getElementById("statTimeout");
  const statTotal = document.getElementById("statTotal");
  const statSuccess = document.getElementById("statSuccess");
  const statFailed = document.getElementById("statFailed");
  const statRejected = document.getElementById("statRejected");

  // Log
  const requestLog = document.getElementById("requestLog");

  // --- Input validation ---
  function validateInputs() {
    const failureRate = Number(inputFailureRate.value);
    const threshold = Number(inputThreshold.value);
    const timeout = Number(inputTimeout.value);

    const errors = [];

    if (isNaN(failureRate) || failureRate < 0 || failureRate > 100) {
      errors.push("Failure rate must be 0-100");
    }
    if (isNaN(threshold) || threshold < 1 || threshold > 50 || !Number.isInteger(threshold)) {
      errors.push("Threshold must be 1-50 (integer)");
    }
    if (isNaN(timeout) || timeout < 1 || timeout > 60 || !Number.isInteger(timeout)) {
      errors.push("Timeout must be 1-60 (integer)");
    }

    if (errors.length > 0) {
      showError(errors.join(". "));
      return null;
    }

    hideError();
    return { failureRate: failureRate, threshold: threshold, timeout: timeout };
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
    if (autoSendIntervalId !== null) {
      clearInterval(autoSendIntervalId);
      autoSendIntervalId = null;
    }
    if (timeoutCountdownId !== null) {
      clearInterval(timeoutCountdownId);
      timeoutCountdownId = null;
    }
    if (flowAnimationTimeoutId !== null) {
      clearTimeout(flowAnimationTimeoutId);
      flowAnimationTimeoutId = null;
    }
  }

  function startCountdownTimer() {
    if (timeoutCountdownId !== null) {
      clearInterval(timeoutCountdownId);
    }
    timeoutCountdownId = setInterval(function () {
      if (!breaker) return;

      // Check timeout transition
      var now = Date.now();
      var result = CircuitBreakerAlgorithm.checkTimeout(breaker, now);
      if (result.transitioned) {
        updateStateDiagram(result.newState, result.oldState);
        addTransitionLogEntry(result.oldState, result.newState);
        updateMetrics();
        infoMsg.textContent = "Timeout expired — state: " + result.newState;
        flashArrow(arrowOpenHalfOpen);
      }

      // Update countdown display
      updateTimeoutCountdown();
      updateMetrics();
    }, 100);
  }

  // --- State diagram updates ---
  function updateStateDiagram(newState, oldState) {
    // Remove active from all
    stateClosed.classList.remove("cb-state-active");
    stateOpen.classList.remove("cb-state-active");
    stateHalfOpen.classList.remove("cb-state-active");

    // Add active to current
    if (newState === CircuitBreakerAlgorithm.STATES.CLOSED) {
      stateClosed.classList.add("cb-state-active");
    } else if (newState === CircuitBreakerAlgorithm.STATES.OPEN) {
      stateOpen.classList.add("cb-state-active");
    } else if (newState === CircuitBreakerAlgorithm.STATES.HALF_OPEN) {
      stateHalfOpen.classList.add("cb-state-active");
    }

    // Update breaker flow node
    flowBreaker.classList.remove("cb-flow-breaker-open", "cb-flow-breaker-half-open");
    if (newState === CircuitBreakerAlgorithm.STATES.OPEN) {
      flowBreaker.classList.add("cb-flow-breaker-open");
    } else if (newState === CircuitBreakerAlgorithm.STATES.HALF_OPEN) {
      flowBreaker.classList.add("cb-flow-breaker-half-open");
    }

    // Flash transition arrow
    if (oldState && newState !== oldState) {
      if (oldState === "CLOSED" && newState === "OPEN") {
        flashArrow(arrowClosedOpen);
      } else if (oldState === "HALF-OPEN" && newState === "CLOSED") {
        flashArrow(arrowHalfOpenClosed);
      } else if (oldState === "HALF-OPEN" && newState === "OPEN") {
        flashArrow(arrowHalfOpenOpen);
      }
    }
  }

  function flashArrow(arrowEl) {
    arrowEl.classList.add("cb-arrow-flash");
    setTimeout(function () {
      arrowEl.classList.remove("cb-arrow-flash");
    }, 600);
  }

  function updateTimeoutCountdown() {
    if (!breaker || breaker.state !== CircuitBreakerAlgorithm.STATES.OPEN || breaker.openedAt === null) {
      timeoutDisplay.textContent = "";
      statTimeout.textContent = "--";
      return;
    }
    var elapsed = (Date.now() - breaker.openedAt) / 1000;
    var remaining = Math.max(0, breaker.openTimeout - elapsed);
    timeoutDisplay.textContent = remaining.toFixed(1) + "s";
    statTimeout.textContent = remaining.toFixed(1) + "s";
  }

  // --- Request flow animation ---
  function animateRequestFlow(result) {
    // Clear previous animation
    if (flowAnimationTimeoutId !== null) {
      clearTimeout(flowAnimationTimeoutId);
      flowAnimationTimeoutId = null;
    }
    flowDot.classList.remove("cb-flow-dot-animate", "cb-flow-dot-success", "cb-flow-dot-failure", "cb-flow-dot-rejected");
    flowDot2.classList.remove("cb-flow-dot-animate", "cb-flow-dot-success", "cb-flow-dot-failure", "cb-flow-dot-rejected");
    flowDependency.classList.remove("cb-flow-dependency-success", "cb-flow-dependency-failure");

    // Force reflow to restart animation
    void flowDot.offsetWidth;
    void flowDot2.offsetWidth;

    if (!result.allowed) {
      // Rejected at breaker
      flowDot.classList.add("cb-flow-dot-rejected", "cb-flow-dot-animate");
      flowStatus.textContent = "REJECTED — breaker is OPEN";
    } else if (result.success) {
      // Success: animate through to dependency
      flowDot.classList.add("cb-flow-dot-success", "cb-flow-dot-animate");
      flowAnimationTimeoutId = setTimeout(function () {
        flowDot2.classList.add("cb-flow-dot-success", "cb-flow-dot-animate");
        flowDependency.classList.add("cb-flow-dependency-success");
        flowAnimationTimeoutId = null;
      }, 400);
      flowStatus.textContent = "SUCCESS — request passed through";
    } else {
      // Failure: animate through then show failure at dependency
      flowDot.classList.add("cb-flow-dot-failure", "cb-flow-dot-animate");
      flowAnimationTimeoutId = setTimeout(function () {
        flowDot2.classList.add("cb-flow-dot-failure", "cb-flow-dot-animate");
        flowDependency.classList.add("cb-flow-dependency-failure");
        flowAnimationTimeoutId = null;
      }, 400);
      flowStatus.textContent = "FAILURE — downstream dependency failed";
    }
  }

  // --- Metrics ---
  function updateMetrics() {
    if (!breaker) return;
    var stats = CircuitBreakerAlgorithm.getStats(breaker);
    statState.textContent = stats.state;
    statFailures.textContent = stats.failureCount + "/" + stats.failureThreshold;
    statTotal.textContent = stats.totalRequests;
    statSuccess.textContent = stats.successfulRequests;
    statFailed.textContent = stats.failedRequests;
    statRejected.textContent = stats.rejectedRequests;
  }

  // --- Log ---
  function addLogEntry(result, reqNum) {
    var entry = document.createElement("div");
    var entryClass = "cb-log-entry ";
    if (!result.allowed) {
      entryClass += "cb-log-entry-rejected";
    } else if (result.success) {
      entryClass += "cb-log-entry-success";
    } else {
      entryClass += "cb-log-entry-failure";
    }
    entry.className = entryClass;

    var numSpan = document.createElement("span");
    numSpan.className = "cb-log-entry-num";
    numSpan.textContent = "#" + reqNum;

    var statusSpan = document.createElement("span");
    statusSpan.className = "cb-log-entry-status";
    if (!result.allowed) {
      statusSpan.textContent = "REJECTED";
    } else if (result.success) {
      statusSpan.textContent = "200";
    } else {
      statusSpan.textContent = "500";
    }

    var detailSpan = document.createElement("span");
    detailSpan.className = "cb-log-entry-detail";
    detailSpan.textContent = result.reason;

    entry.appendChild(numSpan);
    entry.appendChild(statusSpan);
    entry.appendChild(detailSpan);

    if (requestLog.firstChild) {
      requestLog.insertBefore(entry, requestLog.firstChild);
    } else {
      requestLog.appendChild(entry);
    }

    // Cap at 50 entries
    while (requestLog.children.length > 50) {
      requestLog.removeChild(requestLog.lastChild);
    }
  }

  function addTransitionLogEntry(from, to) {
    var entry = document.createElement("div");
    entry.className = "cb-log-entry cb-log-entry-transition";

    var numSpan = document.createElement("span");
    numSpan.className = "cb-log-entry-num";
    numSpan.textContent = "---";

    var statusSpan = document.createElement("span");
    statusSpan.className = "cb-log-entry-status";
    statusSpan.textContent = "TRANSITION";

    var detailSpan = document.createElement("span");
    detailSpan.className = "cb-log-entry-detail";
    detailSpan.textContent = from + " -> " + to;

    entry.appendChild(numSpan);
    entry.appendChild(statusSpan);
    entry.appendChild(detailSpan);

    if (requestLog.firstChild) {
      requestLog.insertBefore(entry, requestLog.firstChild);
    } else {
      requestLog.appendChild(entry);
    }
  }

  // --- Actions ---
  function applyConfig() {
    var vals = validateInputs();
    if (!vals) return;

    clearTimers();
    autoSendOn = false;
    btnAutoSend.textContent = "Auto-Send: OFF";

    config = { failureThreshold: vals.threshold, openTimeout: vals.timeout };
    breaker = CircuitBreakerAlgorithm.createBreaker(config);
    requestCounter = 0;
    requestLog.textContent = "";

    updateStateDiagram(CircuitBreakerAlgorithm.STATES.CLOSED, null);
    updateMetrics();
    updateTimeoutCountdown();

    // Reset flow visuals
    flowDependency.classList.remove("cb-flow-dependency-success", "cb-flow-dependency-failure");
    flowDot.classList.remove("cb-flow-dot-animate", "cb-flow-dot-success", "cb-flow-dot-failure", "cb-flow-dot-rejected");
    flowDot2.classList.remove("cb-flow-dot-animate", "cb-flow-dot-success", "cb-flow-dot-failure", "cb-flow-dot-rejected");
    flowStatus.textContent = "Idle";

    startCountdownTimer();

    infoMsg.textContent = "Config applied. Threshold: " + vals.threshold + " failures, Timeout: " + vals.timeout + "s. Failure rate: " + vals.failureRate + "%.";
  }

  function sendRequest() {
    if (!breaker) {
      showError("Apply config first.");
      return;
    }
    hideError();

    requestCounter++;
    var now = Date.now();
    var failureRate = Number(inputFailureRate.value);

    // Check timeout before handling request
    var timeoutResult = CircuitBreakerAlgorithm.checkTimeout(breaker, now);
    if (timeoutResult.transitioned) {
      updateStateDiagram(timeoutResult.newState, timeoutResult.oldState);
      addTransitionLogEntry(timeoutResult.oldState, timeoutResult.newState);
    }

    // Determine if downstream succeeds (random based on failure rate)
    var downstreamSuccess = Math.random() * 100 >= failureRate;

    var result = CircuitBreakerAlgorithm.handleRequest(breaker, now, downstreamSuccess);

    // Animate flow
    animateRequestFlow(result);

    // If state transitioned, update diagram
    if (result.transition) {
      updateStateDiagram(result.state, result.transition.from);
      addTransitionLogEntry(result.transition.from, result.transition.to);
    }

    // Log + metrics
    addLogEntry(result, requestCounter);
    updateMetrics();
    updateTimeoutCountdown();

    // Info message
    var statusText = !result.allowed ? "REJECTED" : (result.success ? "200 OK" : "500 FAIL");
    infoMsg.textContent = "Request #" + requestCounter + " — " + statusText + " | State: " + result.state;
  }

  function toggleAutoSend() {
    if (!breaker) {
      showError("Apply config first.");
      return;
    }
    hideError();

    autoSendOn = !autoSendOn;
    if (autoSendOn) {
      btnAutoSend.textContent = "Auto-Send: ON";
      autoSendIntervalId = setInterval(sendRequest, 500);
    } else {
      btnAutoSend.textContent = "Auto-Send: OFF";
      if (autoSendIntervalId !== null) {
        clearInterval(autoSendIntervalId);
        autoSendIntervalId = null;
      }
    }
  }

  function reset() {
    clearTimers();
    breaker = null;
    config = null;
    requestCounter = 0;
    autoSendOn = false;

    btnAutoSend.textContent = "Auto-Send: OFF";

    // Reset state diagram
    updateStateDiagram(CircuitBreakerAlgorithm.STATES.CLOSED, null);
    timeoutDisplay.textContent = "";

    // Reset flow
    flowBreaker.classList.remove("cb-flow-breaker-open", "cb-flow-breaker-half-open");
    flowDependency.classList.remove("cb-flow-dependency-success", "cb-flow-dependency-failure");
    flowDot.classList.remove("cb-flow-dot-animate", "cb-flow-dot-success", "cb-flow-dot-failure", "cb-flow-dot-rejected");
    flowDot2.classList.remove("cb-flow-dot-animate", "cb-flow-dot-success", "cb-flow-dot-failure", "cb-flow-dot-rejected");
    flowStatus.textContent = "Idle";

    // Reset stats
    statState.textContent = "CLOSED";
    statFailures.textContent = "0/5";
    statTimeout.textContent = "--";
    statTotal.textContent = "0";
    statSuccess.textContent = "0";
    statFailed.textContent = "0";
    statRejected.textContent = "0";

    requestLog.textContent = "";

    hideError();
    infoMsg.textContent = "Configure the circuit breaker and send requests. Increase failure rate to watch the breaker trip.";
  }

  // --- Failure rate display ---
  function updateFailureRateDisplay() {
    failureRateDisplay.textContent = inputFailureRate.value + "%";
  }

  // --- Event listeners ---
  btnApply.addEventListener("click", applyConfig);
  btnSendRequest.addEventListener("click", sendRequest);
  btnAutoSend.addEventListener("click", toggleAutoSend);
  btnReset.addEventListener("click", reset);
  inputFailureRate.addEventListener("input", updateFailureRateDisplay);

  // --- Timer cleanup on page unload ---
  window.addEventListener("beforeunload", clearTimers);

  // --- Initialize with default config ---
  applyConfig();
})();
