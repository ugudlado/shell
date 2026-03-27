/**
 * Retry with Exponential Backoff UI — visualization + controls
 *
 * Calls RetryAlgorithm functions for all logic (no duplicated algorithm code).
 * Uses textContent for all user-visible text.
 * Cleans up timers on reset and beforeunload.
 */
(function () {
  "use strict";

  // --- State ---
  let naiveSim = null;
  let backoffSim = null;
  let simulationTimers = [];
  let isRunning = false;

  // --- DOM refs ---
  const inputBaseDelay = document.getElementById("inputBaseDelay");
  const inputMaxDelay = document.getElementById("inputMaxDelay");
  const inputMaxRetries = document.getElementById("inputMaxRetries");
  const inputJitter = document.getElementById("inputJitter");
  const jitterDisplay = document.getElementById("jitterDisplay");
  const inputFailureRate = document.getElementById("inputFailureRate");
  const failureRateDisplay = document.getElementById("failureRateDisplay");
  const inputRequestCount = document.getElementById("inputRequestCount");
  const errorMsg = document.getElementById("errorMsg");
  const infoMsg = document.getElementById("infoMsg");
  const btnStart = document.getElementById("btnStart");
  const btnReset = document.getElementById("btnReset");

  // Naive panel
  const naiveTimeline = document.getElementById("naiveTimeline");
  const naiveLog = document.getElementById("naiveLog");
  const statNaiveAttempts = document.getElementById("statNaiveAttempts");
  const statNaiveSuccess = document.getElementById("statNaiveSuccess");
  const statNaiveGaveUp = document.getElementById("statNaiveGaveUp");
  const statNaiveBackoff = document.getElementById("statNaiveBackoff");

  // Backoff panel
  const backoffTimeline = document.getElementById("backoffTimeline");
  const backoffLog = document.getElementById("backoffLog");
  const statBackoffAttempts = document.getElementById("statBackoffAttempts");
  const statBackoffSuccess = document.getElementById("statBackoffSuccess");
  const statBackoffGaveUp = document.getElementById("statBackoffGaveUp");
  const statBackoffBackoff = document.getElementById("statBackoffBackoff");

  // --- Input validation ---
  function validateInputs() {
    const baseDelay = Number(inputBaseDelay.value);
    const maxDelay = Number(inputMaxDelay.value);
    const maxRetries = Number(inputMaxRetries.value);
    const jitterFactor = Number(inputJitter.value);
    const failureRate = Number(inputFailureRate.value);
    const requestCount = Number(inputRequestCount.value);

    const errors = [];

    if (isNaN(baseDelay) || baseDelay < 1 || baseDelay > 60000) {
      errors.push("Base delay must be 1-60000 ms");
    }
    if (isNaN(maxDelay) || maxDelay < 1 || maxDelay > 120000) {
      errors.push("Max delay must be 1-120000 ms");
    }
    if (isNaN(maxRetries) || maxRetries < 0 || maxRetries > 20 || !Number.isInteger(maxRetries)) {
      errors.push("Max retries must be 0-20 (integer)");
    }
    if (isNaN(jitterFactor) || jitterFactor < 0 || jitterFactor > 1) {
      errors.push("Jitter factor must be 0-1");
    }
    if (isNaN(failureRate) || failureRate < 0 || failureRate > 100) {
      errors.push("Failure rate must be 0-100");
    }
    if (isNaN(requestCount) || requestCount < 1 || requestCount > 20 || !Number.isInteger(requestCount)) {
      errors.push("Request count must be 1-20 (integer)");
    }

    if (errors.length > 0) {
      showError(errors.join(". "));
      return null;
    }

    hideError();
    return {
      baseDelay: baseDelay,
      maxDelay: maxDelay,
      maxRetries: maxRetries,
      jitterFactor: jitterFactor,
      failureRate: failureRate / 100,
      requestCount: requestCount,
    };
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
    for (let i = 0; i < simulationTimers.length; i++) {
      clearTimeout(simulationTimers[i]);
    }
    simulationTimers = [];
  }

  // --- Stats update ---
  function updateStats(sim, attemptsEl, successEl, gaveUpEl, backoffEl) {
    const stats = RetryAlgorithm.getStats(sim);
    attemptsEl.textContent = String(stats.totalAttempts);
    successEl.textContent = String(stats.totalSuccesses);
    gaveUpEl.textContent = String(stats.totalGaveUp);
    backoffEl.textContent = stats.totalBackoffTime + "ms";
  }

  // --- Log entry ---
  function addLogEntry(logEl, reqId, attemptNum, succeeded, delay, gaveUp) {
    const entry = document.createElement("div");
    let entryClass = "retry-log-entry ";

    if (gaveUp) {
      entryClass += "retry-log-entry-gaveup";
    } else if (succeeded) {
      entryClass += "retry-log-entry-success";
    } else if (delay > 0) {
      entryClass += "retry-log-entry-waiting";
    } else {
      entryClass += "retry-log-entry-failure";
    }
    entry.className = entryClass;

    const numSpan = document.createElement("span");
    numSpan.className = "retry-log-entry-num";
    numSpan.textContent = "R" + reqId;

    const statusSpan = document.createElement("span");
    statusSpan.className = "retry-log-entry-status";
    if (gaveUp) {
      statusSpan.textContent = "GAVE UP";
    } else if (succeeded) {
      statusSpan.textContent = "200";
    } else {
      statusSpan.textContent = "429";
    }

    const detailSpan = document.createElement("span");
    detailSpan.className = "retry-log-entry-detail";
    if (gaveUp) {
      detailSpan.textContent = "attempt " + attemptNum + " — max retries exceeded";
    } else if (succeeded) {
      detailSpan.textContent = "attempt " + attemptNum + " — success";
    } else {
      detailSpan.textContent = "attempt " + attemptNum + " — retry in " + delay + "ms";
    }

    entry.appendChild(numSpan);
    entry.appendChild(statusSpan);
    entry.appendChild(detailSpan);

    if (logEl.firstChild) {
      logEl.insertBefore(entry, logEl.firstChild);
    } else {
      logEl.appendChild(entry);
    }

    // Cap at 100 entries
    while (logEl.children.length > 100) {
      logEl.removeChild(logEl.lastChild);
    }
  }

  // --- Timeline rendering ---
  function renderTimeline(timelineEl, sim, maxTime) {
    timelineEl.textContent = "";

    if (sim.requests.length === 0) return;

    // Use at least 1ms to avoid division by zero
    const totalTime = Math.max(maxTime, 1);

    for (let i = 0; i < sim.requests.length; i++) {
      const req = sim.requests[i];
      const row = document.createElement("div");
      row.className = "retry-timeline-row";

      const label = document.createElement("div");
      label.className = "retry-timeline-label";
      label.textContent = "R" + req.id;

      const bar = document.createElement("div");
      bar.className = "retry-timeline-bar";

      for (let j = 0; j < req.attempts.length; j++) {
        const att = req.attempts[j];

        // Attempt segment
        const attemptSeg = document.createElement("div");
        attemptSeg.className = "retry-timeline-segment retry-timeline-segment-attempt";
        if (att.succeeded) {
          attemptSeg.classList.add("retry-segment-success");
        }
        if (att.gaveUp) {
          attemptSeg.className = "retry-timeline-segment retry-timeline-segment-gaveup";
        }

        // Width based on a fixed attempt duration (visual only)
        const attemptWidth = Math.max(2, (200 / totalTime) * 100);
        attemptSeg.style.width = attemptWidth + "%";
        attemptSeg.textContent = att.succeeded ? "OK" : att.gaveUp ? "X" : att.attempt.toString();

        bar.appendChild(attemptSeg);

        // Wait segment (if there's a delay)
        if (att.delay > 0 && !att.gaveUp) {
          const waitSeg = document.createElement("div");
          waitSeg.className = "retry-timeline-segment retry-timeline-segment-wait";
          const waitWidth = Math.max(1, (att.delay / totalTime) * 100);
          waitSeg.style.width = waitWidth + "%";
          waitSeg.textContent = att.delay >= 1000 ? (att.delay / 1000).toFixed(1) + "s" : att.delay + "ms";
          bar.appendChild(waitSeg);
        }
      }

      row.appendChild(label);
      row.appendChild(bar);
      timelineEl.appendChild(row);
    }
  }

  // --- Simulation runner ---
  function runSimulation(sim, logEl, timelineEl, attemptsEl, successEl, gaveUpEl, backoffEl, failureRate, onComplete) {
    const pendingRequestIds = [];

    // Enqueue all requests
    for (let i = 0; i < sim.requests.length; i++) {
      pendingRequestIds.push(sim.requests[i].id);
    }

    // Process all active request IDs (also count to track progress only)
    let activeCount = pendingRequestIds.length;

    function processRequest(reqId) {
      // Check if request is still active
      const req = findReqInSim(sim, reqId);
      if (!req || req.status === "success" || req.status === "failed") {
        activeCount--;
        if (activeCount <= 0 && onComplete) {
          onComplete();
        }
        return;
      }

      // Determine success/failure
      const succeeded = Math.random() >= failureRate;
      const result = RetryAlgorithm.processAttempt(sim, reqId, succeeded);

      if (!result) {
        activeCount--;
        if (activeCount <= 0 && onComplete) {
          onComplete();
        }
        return;
      }

      // Log this attempt
      addLogEntry(
        logEl,
        reqId,
        result.attemptResult.attempt,
        result.attemptResult.succeeded,
        result.attemptResult.delay || 0,
        result.attemptResult.gaveUp || false,
      );

      // Update stats
      updateStats(sim, attemptsEl, successEl, gaveUpEl, backoffEl);

      // Compute max time for timeline scaling
      const maxTime = computeMaxTime(sim);
      renderTimeline(timelineEl, sim, maxTime);

      if (result.request.status === "success" || result.request.status === "failed") {
        activeCount--;
        if (activeCount <= 0 && onComplete) {
          onComplete();
        }
        return;
      }

      // Schedule retry after delay
      const delay = result.attemptResult.delay || 0;
      // Use scaled time for UI: 1000ms real = 500ms visual (speed up)
      const visualDelay = Math.max(50, delay / 2);
      const timerId = setTimeout(function () {
        RetryAlgorithm.advanceTime(sim, delay);
        processRequest(reqId);
      }, visualDelay);
      simulationTimers.push(timerId);
    }

    // Start all requests with slight stagger
    for (let i = 0; i < pendingRequestIds.length; i++) {
      const reqId = pendingRequestIds[i];
      const staggerDelay = i * 100;
      const timerId = setTimeout(function () {
        processRequest(reqId);
      }, staggerDelay);
      simulationTimers.push(timerId);
    }
  }

  function findReqInSim(sim, reqId) {
    for (let i = 0; i < sim.requests.length; i++) {
      if (sim.requests[i].id === reqId) {
        return sim.requests[i];
      }
    }
    return null;
  }

  function computeMaxTime(sim) {
    let maxTime = 0;
    for (let i = 0; i < sim.requests.length; i++) {
      const req = sim.requests[i];
      let t = 0;
      for (let j = 0; j < req.attempts.length; j++) {
        t += 200; // visual attempt time
        if (req.attempts[j].delay) {
          t += req.attempts[j].delay;
        }
      }
      if (t > maxTime) maxTime = t;
    }
    return maxTime;
  }

  // --- Actions ---
  function startSimulation() {
    if (isRunning) return;

    const vals = validateInputs();
    if (!vals) return;

    isRunning = true;
    btnStart.disabled = true;
    clearTimers();

    // Create naive config
    const naiveConfig = RetryAlgorithm.createRetryConfig({
      strategy: RetryAlgorithm.STRATEGIES.NAIVE,
      baseDelay: vals.baseDelay,
      maxDelay: vals.maxDelay,
      maxRetries: vals.maxRetries,
      jitterFactor: 0,
      failureRate: vals.failureRate,
    });

    // Create exponential backoff config
    const backoffConfig = RetryAlgorithm.createRetryConfig({
      strategy: RetryAlgorithm.STRATEGIES.EXPONENTIAL,
      baseDelay: vals.baseDelay,
      maxDelay: vals.maxDelay,
      maxRetries: vals.maxRetries,
      jitterFactor: vals.jitterFactor,
      failureRate: vals.failureRate,
    });

    naiveSim = RetryAlgorithm.createSimulation(naiveConfig);
    backoffSim = RetryAlgorithm.createSimulation(backoffConfig);

    // Enqueue requests
    for (let i = 0; i < vals.requestCount; i++) {
      RetryAlgorithm.enqueueRequest(naiveSim);
      RetryAlgorithm.enqueueRequest(backoffSim);
    }

    // Clear logs and timelines
    naiveLog.textContent = "";
    backoffLog.textContent = "";
    naiveTimeline.textContent = "";
    backoffTimeline.textContent = "";

    // Reset stats
    updateStats(naiveSim, statNaiveAttempts, statNaiveSuccess, statNaiveGaveUp, statNaiveBackoff);
    updateStats(backoffSim, statBackoffAttempts, statBackoffSuccess, statBackoffGaveUp, statBackoffBackoff);

    infoMsg.textContent =
      "Running simulation: " +
      vals.requestCount +
      " requests, " +
      Math.round(vals.failureRate * 100) +
      "% failure rate, max " +
      vals.maxRetries +
      " retries...";

    let completedPanels = 0;

    function onPanelComplete() {
      completedPanels++;
      if (completedPanels >= 2) {
        isRunning = false;
        btnStart.disabled = false;

        const naiveStats = RetryAlgorithm.getStats(naiveSim);
        const backoffStats = RetryAlgorithm.getStats(backoffSim);

        infoMsg.textContent =
          "Simulation complete. Naive: " +
          naiveStats.totalAttempts +
          " attempts, " +
          naiveStats.totalBackoffTime +
          "ms backoff. Backoff: " +
          backoffStats.totalAttempts +
          " attempts, " +
          backoffStats.totalBackoffTime +
          "ms backoff.";
      }
    }

    // Run both simulations
    runSimulation(
      naiveSim,
      naiveLog,
      naiveTimeline,
      statNaiveAttempts,
      statNaiveSuccess,
      statNaiveGaveUp,
      statNaiveBackoff,
      vals.failureRate,
      onPanelComplete,
    );

    runSimulation(
      backoffSim,
      backoffLog,
      backoffTimeline,
      statBackoffAttempts,
      statBackoffSuccess,
      statBackoffGaveUp,
      statBackoffBackoff,
      vals.failureRate,
      onPanelComplete,
    );
  }

  function resetUI() {
    clearTimers();
    isRunning = false;
    btnStart.disabled = false;
    naiveSim = null;
    backoffSim = null;

    // Clear logs and timelines
    naiveLog.textContent = "";
    backoffLog.textContent = "";
    naiveTimeline.textContent = "";
    backoffTimeline.textContent = "";

    // Reset stats
    statNaiveAttempts.textContent = "0";
    statNaiveSuccess.textContent = "0";
    statNaiveGaveUp.textContent = "0";
    statNaiveBackoff.textContent = "0ms";
    statBackoffAttempts.textContent = "0";
    statBackoffSuccess.textContent = "0";
    statBackoffGaveUp.textContent = "0";
    statBackoffBackoff.textContent = "0ms";

    hideError();
    infoMsg.textContent =
      "Configure parameters and start a simulation to compare naive instant retry vs exponential backoff with jitter.";
  }

  // --- Display updates ---
  function updateJitterDisplay() {
    jitterDisplay.textContent = Number(inputJitter.value).toFixed(2);
  }

  function updateFailureRateDisplay() {
    failureRateDisplay.textContent = inputFailureRate.value + "%";
  }

  // --- Event listeners ---
  btnStart.addEventListener("click", startSimulation);
  btnReset.addEventListener("click", resetUI);
  inputJitter.addEventListener("input", updateJitterDisplay);
  inputFailureRate.addEventListener("input", updateFailureRateDisplay);

  // --- Timer cleanup on page unload ---
  window.addEventListener("beforeunload", clearTimers);
})();
