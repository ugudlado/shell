/**
 * Connection Pool UI — visualization + controls
 *
 * Calls ConnPoolAlgorithm functions for all logic (no duplicated algorithm code).
 * Uses textContent for all user-visible text.
 * Cleans up timers on reset and beforeunload.
 */
(function () {
  "use strict";

  // --- State ---
  let pool = null;
  let autoTickIntervalId = null;
  let autoTickOn = false;
  let clientNextId = 1;
  let simTime = 0;
  let connTimerIntervalId = null;
  let lastEventIndex = 0;
  let flashTimeoutIds = [];

  // --- DOM refs ---
  const inputPoolSize = document.getElementById("inputPoolSize");
  const inputConnTimeout = document.getElementById("inputConnTimeout");
  const inputIdleTimeout = document.getElementById("inputIdleTimeout");
  const inputMaxQueue = document.getElementById("inputMaxQueue");
  const selectPreset = document.getElementById("selectPreset");
  const inputClientId = document.getElementById("inputClientId");
  const errorMsg = document.getElementById("errorMsg");
  const infoMsg = document.getElementById("infoMsg");
  const btnApply = document.getElementById("btnApply");
  const btnAcquire = document.getElementById("btnAcquire");
  const btnFlood = document.getElementById("btnFlood");
  const btnAutoTick = document.getElementById("btnAutoTick");
  const btnReset = document.getElementById("btnReset");

  // Visualization
  const poolGrid = document.getElementById("poolGrid");
  const queueCount = document.getElementById("queueCount");
  const queueFill = document.getElementById("queueFill");
  const queueList = document.getElementById("queueList");

  // Stats
  const statActive = document.getElementById("statActive");
  const statIdle = document.getElementById("statIdle");
  const statQueued = document.getElementById("statQueued");
  const statAcquired = document.getElementById("statAcquired");
  const statReleased = document.getElementById("statReleased");
  const statTimedOut = document.getElementById("statTimedOut");
  const statIdleCleaned = document.getElementById("statIdleCleaned");
  const statRejected = document.getElementById("statRejected");

  // Log
  const eventLog = document.getElementById("eventLog");

  // --- Presets ---
  var PRESETS = {
    "pgbouncer-small": {
      poolSize: 5,
      connectionTimeout: 30,
      idleTimeout: 60,
      maxQueueSize: 10,
    },
    "pgbouncer-large": {
      poolSize: 20,
      connectionTimeout: 60,
      idleTimeout: 120,
      maxQueueSize: 50,
    },
    stress: {
      poolSize: 2,
      connectionTimeout: 3,
      idleTimeout: 5,
      maxQueueSize: 3,
    },
  };

  // --- Input validation ---
  function validateInputs() {
    const poolSize = Number(inputPoolSize.value);
    const connTimeout = Number(inputConnTimeout.value);
    const idleTimeout = Number(inputIdleTimeout.value);
    const maxQueue = Number(inputMaxQueue.value);

    const errors = [];

    if (
      isNaN(poolSize) ||
      poolSize < 1 ||
      poolSize > 50 ||
      !Number.isInteger(poolSize)
    ) {
      errors.push("Pool Size must be an integer 1-50");
    }
    if (
      isNaN(connTimeout) ||
      connTimeout < 1 ||
      connTimeout > 120 ||
      !Number.isInteger(connTimeout)
    ) {
      errors.push("Conn Timeout must be an integer 1-120");
    }
    if (
      isNaN(idleTimeout) ||
      idleTimeout < 1 ||
      idleTimeout > 300 ||
      !Number.isInteger(idleTimeout)
    ) {
      errors.push("Idle Timeout must be an integer 1-300");
    }
    if (
      isNaN(maxQueue) ||
      maxQueue < 1 ||
      maxQueue > 100 ||
      !Number.isInteger(maxQueue)
    ) {
      errors.push("Max Queue must be an integer 1-100");
    }

    if (errors.length > 0) {
      showError(errors.join(". "));
      return null;
    }

    hideError();
    return {
      poolSize: poolSize,
      connectionTimeout: connTimeout,
      idleTimeout: idleTimeout,
      maxQueueSize: maxQueue,
    };
  }

  function validateClientId() {
    const raw = inputClientId.value.trim();
    if (raw.length === 0) {
      return "client-" + clientNextId++;
    }
    if (raw.length > 20) {
      showError("Client ID must be 20 characters or fewer");
      return null;
    }
    return raw;
  }

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.remove("hidden");
  }

  function hideError() {
    errorMsg.textContent = "";
    errorMsg.classList.add("hidden");
  }

  function showInfo(msg) {
    infoMsg.textContent = msg;
  }

  // --- Timer cleanup ---
  function clearAllTimers() {
    if (autoTickIntervalId !== null) {
      clearInterval(autoTickIntervalId);
      autoTickIntervalId = null;
    }
    if (connTimerIntervalId !== null) {
      clearInterval(connTimerIntervalId);
      connTimerIntervalId = null;
    }
    for (let i = 0; i < flashTimeoutIds.length; i++) {
      clearTimeout(flashTimeoutIds[i]);
    }
    flashTimeoutIds = [];
    autoTickOn = false;
    btnAutoTick.textContent = "Auto Tick: Off";
  }

  // --- Rendering ---
  function renderPool() {
    if (!pool) return;

    // Render connections grid
    poolGrid.innerHTML = "";
    for (let i = 0; i < pool.connections.length; i++) {
      const conn = pool.connections[i];
      const el = document.createElement("div");
      el.className = "cp-conn";

      if (conn.status === "active") {
        el.classList.add("cp-conn--active");
      } else {
        el.classList.add("cp-conn--idle");
      }

      const idEl = document.createElement("div");
      idEl.className = "cp-conn-id";
      idEl.textContent = "#" + conn.id;
      el.appendChild(idEl);

      const statusEl = document.createElement("div");
      statusEl.className = "cp-conn-status";
      statusEl.textContent = conn.status;
      el.appendChild(statusEl);

      if (conn.clientId) {
        const clientEl = document.createElement("div");
        clientEl.className = "cp-conn-client";
        clientEl.textContent = conn.clientId;
        el.appendChild(clientEl);
      }

      if (conn.status === "active" && conn.acquiredAt !== null) {
        const timerEl = document.createElement("div");
        timerEl.className = "cp-conn-timer";
        const held = ((simTime - conn.acquiredAt) / 1000).toFixed(1);
        timerEl.textContent = held + "s";
        el.appendChild(timerEl);
      }

      // Click to release active connections
      if (conn.status === "active") {
        el.dataset.connId = i;
        el.addEventListener("click", handleConnClick);
        el.title = "Click to release connection #" + i;
      }

      poolGrid.appendChild(el);
    }

    // Render queue
    const stats = ConnPoolAlgorithm.getStats(pool);
    queueCount.textContent =
      stats.queueLength + " / " + stats.maxQueueSize;
    const pct =
      stats.maxQueueSize > 0
        ? (stats.queueLength / stats.maxQueueSize) * 100
        : 0;
    queueFill.style.width = pct + "%";

    queueList.innerHTML = "";
    for (let j = 0; j < pool.queue.length; j++) {
      const item = document.createElement("span");
      item.className = "cp-queue-item";
      const waitSec = ((simTime - pool.queue[j].queuedAt) / 1000).toFixed(1);
      item.textContent = pool.queue[j].clientId + " (" + waitSec + "s)";
      queueList.appendChild(item);
    }

    // Update stats
    statActive.textContent = stats.activeConnections;
    statIdle.textContent = stats.idleConnections;
    statQueued.textContent = stats.queueLength;
    statAcquired.textContent = stats.totalAcquired;
    statReleased.textContent = stats.totalReleased;
    statTimedOut.textContent = stats.totalTimedOut;
    statIdleCleaned.textContent = stats.totalIdleCleaned;
    statRejected.textContent = stats.totalQueueRejected;
  }

  function renderNewEvents() {
    if (!pool) return;

    while (lastEventIndex < pool.events.length) {
      const evt = pool.events[lastEventIndex];
      const entry = document.createElement("div");
      entry.className = "cp-log-entry cp-log-entry--" + evt.type;

      let text = "";
      const timeSec = (evt.timestamp / 1000).toFixed(1) + "s";

      switch (evt.type) {
        case "acquire":
          text =
            "[" +
            timeSec +
            "] " +
            evt.clientId +
            " acquired conn #" +
            evt.connectionId;
          break;
        case "release":
          text =
            "[" +
            timeSec +
            "] conn #" +
            evt.connectionId +
            " released (held " +
            (evt.holdTime / 1000).toFixed(1) +
            "s)";
          break;
        case "queued":
          text =
            "[" +
            timeSec +
            "] " +
            evt.clientId +
            " queued at position " +
            evt.queuePosition;
          break;
        case "dequeued":
          text =
            "[" +
            timeSec +
            "] " +
            evt.clientId +
            " dequeued -> conn #" +
            evt.connectionId +
            " (waited " +
            (evt.waitTime / 1000).toFixed(1) +
            "s)";
          break;
        case "timeout":
          text =
            "[" +
            timeSec +
            "] conn #" +
            evt.connectionId +
            " TIMED OUT (" +
            evt.clientId +
            ", held " +
            (evt.holdTime / 1000).toFixed(1) +
            "s)";
          break;
        case "rejected":
          text =
            "[" + timeSec + "] " + evt.clientId + " REJECTED (queue full)";
          break;
        case "idle-cleanup":
          text =
            "[" +
            timeSec +
            "] conn #" +
            evt.connectionId +
            " idle-cleaned (idle " +
            (evt.idleTime / 1000).toFixed(1) +
            "s)";
          break;
        default:
          text = "[" + timeSec + "] " + evt.type;
      }

      entry.textContent = text;
      eventLog.appendChild(entry);
      lastEventIndex++;
    }

    // Auto-scroll
    eventLog.scrollTop = eventLog.scrollHeight;
  }

  function handleConnClick(e) {
    const connId = Number(e.currentTarget.dataset.connId);
    const result = ConnPoolAlgorithm.release(pool, connId, simTime);
    if (result.released) {
      const assigned = ConnPoolAlgorithm.processQueue(pool, simTime);
      showInfo(
        result.reason +
          (assigned.length > 0
            ? " " + assigned.length + " queued client(s) assigned."
            : "")
      );
    } else {
      showInfo(result.reason);
    }
    renderNewEvents();
    renderPool();
  }

  // --- Actions ---
  function applyConfig() {
    const config = validateInputs();
    if (!config) return;

    clearAllTimers();
    pool = ConnPoolAlgorithm.createPool(config);
    simTime = 0;
    clientNextId = 1;
    lastEventIndex = 0;
    eventLog.innerHTML = "";
    hideError();
    showInfo(
      "Pool created: " +
        config.poolSize +
        " connections, " +
        config.connectionTimeout +
        "s timeout, " +
        config.idleTimeout +
        "s idle, queue max " +
        config.maxQueueSize
    );
    renderPool();
    startConnTimer();
  }

  function doAcquire() {
    if (!pool) {
      showError("Apply config first");
      return;
    }

    const clientId = validateClientId();
    if (!clientId) return;

    hideError();
    simTime += 500; // advance 0.5s per action
    const result = ConnPoolAlgorithm.acquire(pool, clientId, simTime);
    showInfo(result.reason);

    renderNewEvents();
    renderPool();
    inputClientId.value = "";
  }

  function doFlood() {
    if (!pool) {
      showError("Apply config first");
      return;
    }

    hideError();
    for (let i = 0; i < 5; i++) {
      simTime += 200;
      const cid = "flood-" + clientNextId++;
      ConnPoolAlgorithm.acquire(pool, cid, simTime);
    }
    showInfo("Flooded 5 requests into pool.");

    renderNewEvents();
    renderPool();
  }

  function toggleAutoTick() {
    if (!pool) {
      showError("Apply config first");
      return;
    }

    if (autoTickOn) {
      clearInterval(autoTickIntervalId);
      autoTickIntervalId = null;
      autoTickOn = false;
      btnAutoTick.textContent = "Auto Tick: Off";
    } else {
      autoTickOn = true;
      btnAutoTick.textContent = "Auto Tick: On";
      autoTickIntervalId = setInterval(function () {
        simTime += 1000; // advance 1s per tick
        var result = ConnPoolAlgorithm.tick(pool, simTime);

        var msgs = [];
        if (result.timedOut.length > 0) {
          msgs.push(result.timedOut.length + " timed out");
          // Flash timeout animation
          result.timedOut.forEach(function (t) {
            var el = poolGrid.children[t.connectionId];
            if (el) {
              el.classList.remove("cp-conn--active", "cp-conn--idle");
              el.classList.add("cp-conn--timeout");
              flashTimeoutIds.push(setTimeout(function () {
                el.classList.remove("cp-conn--timeout");
              }, 500));
            }
          });
        }
        if (result.idleCleaned.length > 0) {
          msgs.push(result.idleCleaned.length + " idle-cleaned");
          result.idleCleaned.forEach(function (c) {
            var el = poolGrid.children[c.connectionId];
            if (el) {
              el.classList.add("cp-conn--cleaned");
              flashTimeoutIds.push(setTimeout(function () {
                el.classList.remove("cp-conn--cleaned");
              }, 500));
            }
          });
        }
        if (result.assigned.length > 0) {
          msgs.push(result.assigned.length + " dequeued");
        }

        if (msgs.length > 0) {
          showInfo(
            "Tick @" +
              (simTime / 1000).toFixed(1) +
              "s: " +
              msgs.join(", ")
          );
        } else {
          showInfo("Tick @" + (simTime / 1000).toFixed(1) + "s: no changes");
        }

        renderNewEvents();
        renderPool();
      }, 1000);
    }
  }

  function doReset() {
    clearAllTimers();
    if (pool) {
      var config = {
        poolSize: pool.poolSize,
        connectionTimeout: pool.connectionTimeout,
        idleTimeout: pool.idleTimeout,
        maxQueueSize: pool.maxQueueSize,
      };
      pool = ConnPoolAlgorithm.reset(config);
    }
    simTime = 0;
    clientNextId = 1;
    lastEventIndex = 0;
    eventLog.innerHTML = "";
    hideError();
    showInfo("Pool reset.");
    renderPool();
    if (pool) {
      startConnTimer();
    }
  }

  function startConnTimer() {
    if (connTimerIntervalId !== null) {
      clearInterval(connTimerIntervalId);
    }
    connTimerIntervalId = setInterval(function () {
      renderPool();
    }, 500);
  }

  // --- Preset handling ---
  selectPreset.addEventListener("change", function () {
    var preset = PRESETS[selectPreset.value];
    if (preset) {
      inputPoolSize.value = preset.poolSize;
      inputConnTimeout.value = preset.connectionTimeout;
      inputIdleTimeout.value = preset.idleTimeout;
      inputMaxQueue.value = preset.maxQueueSize;
    }
  });

  // --- Wire buttons ---
  btnApply.addEventListener("click", applyConfig);
  btnAcquire.addEventListener("click", doAcquire);
  btnFlood.addEventListener("click", doFlood);
  btnAutoTick.addEventListener("click", toggleAutoTick);
  btnReset.addEventListener("click", doReset);

  // --- Cleanup on unload ---
  window.addEventListener("beforeunload", clearAllTimers);

  // --- Init ---
  applyConfig();
})();
