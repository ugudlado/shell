/**
 * Load Balancer UI — visualization + controls
 *
 * Calls LoadBalancerAlgorithm functions for all logic (no duplicated algorithm code).
 * Uses textContent for all user-visible text.
 * Cleans up timers on reset and beforeunload.
 */
(function () {
  "use strict";

  // --- State ---
  let pool = null;
  let autoSendIntervalId = null;
  let requestCounter = 0;
  let autoSendOn = false;
  let selectedServerName = null;
  let serverNextId = 1;
  let packetAnimationTimeoutId = null;
  let serverHitTimeoutIds = {};
  let slowServers = {};

  // --- DOM refs ---
  const selectAlgorithm = document.getElementById("selectAlgorithm");
  const inputServerName = document.getElementById("inputServerName");
  const inputServerWeight = document.getElementById("inputServerWeight");
  const errorMsg = document.getElementById("errorMsg");
  const infoMsg = document.getElementById("infoMsg");
  const btnAddServer = document.getElementById("btnAddServer");
  const btnRemoveServer = document.getElementById("btnRemoveServer");
  const btnSendRequest = document.getElementById("btnSendRequest");
  const btnAutoSend = document.getElementById("btnAutoSend");
  const btnReset = document.getElementById("btnReset");

  // Visualization
  const serverPoolEl = document.getElementById("serverPool");
  const poolEmpty = document.getElementById("poolEmpty");
  const packetLeft = document.getElementById("packetLeft");
  const packetRight = document.getElementById("packetRight");
  const algoLabel = document.getElementById("algoLabel");

  // Stats
  const statsBody = document.getElementById("statsBody");
  const statTotal = document.getElementById("statTotal");
  const statServers = document.getElementById("statServers");
  const statAlgo = document.getElementById("statAlgo");

  // Log
  const requestLog = document.getElementById("requestLog");

  // --- Input validation ---
  function validateServerInputs() {
    const name = inputServerName.value.trim();
    const weight = Number(inputServerWeight.value);

    const errors = [];

    if (name.length === 0) {
      errors.push("Server name is required");
    }
    if (name.length > 20) {
      errors.push("Server name must be 20 characters or fewer");
    }
    if (pool && pool.servers.some(function (s) { return s.name === name; })) {
      errors.push("Server name '" + name + "' already exists");
    }
    if (isNaN(weight) || weight < 0 || weight > 100 || !Number.isInteger(weight)) {
      errors.push("Weight must be an integer 0-100");
    }

    if (errors.length > 0) {
      showError(errors.join(". "));
      return null;
    }

    hideError();
    return { name: name, weight: weight };
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
    if (packetAnimationTimeoutId !== null) {
      clearTimeout(packetAnimationTimeoutId);
      packetAnimationTimeoutId = null;
    }
    // Clear all server hit timeouts
    var keys = Object.keys(serverHitTimeoutIds);
    for (var i = 0; i < keys.length; i++) {
      clearTimeout(serverHitTimeoutIds[keys[i]]);
    }
    serverHitTimeoutIds = {};
  }

  // --- Pool initialization ---
  function initPool() {
    pool = LoadBalancerAlgorithm.createPool();
    requestCounter = 0;
    selectedServerName = null;
    serverNextId = 1;
    slowServers = {};
  }

  // --- Server pool visualization ---
  function renderServerPool() {
    // Clear existing server nodes (not the empty placeholder)
    var existingNodes = serverPoolEl.querySelectorAll(".lb-server-node");
    for (var i = 0; i < existingNodes.length; i++) {
      serverPoolEl.removeChild(existingNodes[i]);
    }

    if (!pool || pool.servers.length === 0) {
      poolEmpty.style.display = "";
      return;
    }

    poolEmpty.style.display = "none";

    for (var j = 0; j < pool.servers.length; j++) {
      var s = pool.servers[j];
      var node = document.createElement("div");
      node.className = "lb-server-node";
      if (s.isUp) {
        node.classList.add("lb-server-up");
      } else {
        node.classList.add("lb-server-down");
      }
      if (slowServers[s.name]) {
        node.classList.add("lb-server-slow");
      }
      if (selectedServerName === s.name) {
        node.classList.add("lb-server-selected");
      }
      node.dataset.serverName = s.name;

      var dot = document.createElement("span");
      dot.className = "lb-server-status-dot " + (s.isUp ? "lb-dot-up" : "lb-dot-down");

      var nameSpan = document.createElement("span");
      nameSpan.className = "lb-server-name";
      nameSpan.textContent = s.name;

      var connsSpan = document.createElement("span");
      connsSpan.className = "lb-server-conns";
      connsSpan.textContent = "(" + s.connections + " conn)";

      node.appendChild(dot);
      node.appendChild(nameSpan);
      node.appendChild(connsSpan);

      node.addEventListener("click", (function (serverName) {
        return function () {
          selectServer(serverName);
        };
      })(s.name));

      serverPoolEl.appendChild(node);
    }
  }

  function selectServer(name) {
    selectedServerName = (selectedServerName === name) ? null : name;
    renderServerPool();
  }

  function highlightServer(name) {
    var nodes = serverPoolEl.querySelectorAll(".lb-server-node");
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].dataset.serverName === name) {
        nodes[i].classList.add("lb-server-hit");
        // Clear previous timeout for this server
        if (serverHitTimeoutIds[name]) {
          clearTimeout(serverHitTimeoutIds[name]);
        }
        serverHitTimeoutIds[name] = setTimeout((function (n) {
          return function () {
            var el = serverPoolEl.querySelector("[data-server-name='" + n + "']");
            if (el) {
              el.classList.remove("lb-server-hit");
            }
            delete serverHitTimeoutIds[n];
          };
        })(name), 500);
        break;
      }
    }
  }

  // --- Stats table ---
  function renderStatsTable() {
    // Clear rows
    while (statsBody.firstChild) {
      statsBody.removeChild(statsBody.firstChild);
    }

    if (!pool) return;

    for (var i = 0; i < pool.servers.length; i++) {
      var s = pool.servers[i];
      var tr = document.createElement("tr");

      var tdName = document.createElement("td");
      tdName.textContent = s.name;

      var tdStatus = document.createElement("td");
      tdStatus.textContent = s.isUp ? "UP" : "DOWN";
      tdStatus.className = s.isUp ? "lb-status-up" : "lb-status-down";

      var tdWeight = document.createElement("td");
      tdWeight.textContent = s.weight;

      var tdConns = document.createElement("td");
      tdConns.textContent = s.connections;

      var tdReqs = document.createElement("td");
      tdReqs.textContent = s.totalRequests;

      var tdResp = document.createElement("td");
      tdResp.textContent = s.avgResponseTime > 0 ? s.avgResponseTime.toFixed(0) + " ms" : "--";

      var tdActions = document.createElement("td");

      var btnToggle = document.createElement("button");
      btnToggle.className = "lb-btn-toggle";
      btnToggle.textContent = s.isUp ? "Down" : "Up";
      btnToggle.addEventListener("click", (function (serverName, isCurrentlyUp) {
        return function () {
          LoadBalancerAlgorithm.setServerStatus(pool, serverName, !isCurrentlyUp);
          renderAll();
        };
      })(s.name, s.isUp));

      var btnSlow = document.createElement("button");
      btnSlow.className = "lb-btn-slow";
      btnSlow.textContent = slowServers[s.name] ? "Normal" : "Slow";
      btnSlow.addEventListener("click", (function (serverName) {
        return function () {
          slowServers[serverName] = !slowServers[serverName];
          renderAll();
        };
      })(s.name));

      tdActions.appendChild(btnToggle);
      tdActions.appendChild(btnSlow);

      tr.appendChild(tdName);
      tr.appendChild(tdStatus);
      tr.appendChild(tdWeight);
      tr.appendChild(tdConns);
      tr.appendChild(tdReqs);
      tr.appendChild(tdResp);
      tr.appendChild(tdActions);

      statsBody.appendChild(tr);
    }
  }

  // --- Metrics ---
  function updateMetrics() {
    if (!pool) return;
    var stats = LoadBalancerAlgorithm.getPoolStats(pool);
    statTotal.textContent = stats.totalRequests;
    statServers.textContent = stats.serverCount;
    statAlgo.textContent = formatAlgorithmName(stats.algorithm);
  }

  function formatAlgorithmName(algo) {
    if (algo === "round-robin") return "Round Robin";
    if (algo === "least-connections") return "Least Connections";
    if (algo === "weighted") return "Weighted";
    return algo;
  }

  // --- Packet animation ---
  function animatePacket(result) {
    // Clear previous
    if (packetAnimationTimeoutId !== null) {
      clearTimeout(packetAnimationTimeoutId);
      packetAnimationTimeoutId = null;
    }
    packetLeft.classList.remove("lb-packet-animate", "lb-packet-success", "lb-packet-failure");
    packetRight.classList.remove("lb-packet-animate", "lb-packet-success", "lb-packet-failure");
    void packetLeft.offsetWidth;
    void packetRight.offsetWidth;

    if (result.routed) {
      packetLeft.classList.add("lb-packet-success", "lb-packet-animate");
      packetAnimationTimeoutId = setTimeout(function () {
        packetRight.classList.add("lb-packet-success", "lb-packet-animate");
        packetAnimationTimeoutId = null;
      }, 350);
    } else {
      packetLeft.classList.add("lb-packet-failure", "lb-packet-animate");
    }
  }

  // --- Log ---
  function addLogEntry(result, reqNum) {
    var entry = document.createElement("div");
    entry.className = "lb-log-entry " + (result.routed ? "lb-log-entry-routed" : "lb-log-entry-failed");

    var numSpan = document.createElement("span");
    numSpan.className = "lb-log-entry-num";
    numSpan.textContent = "#" + reqNum;

    var serverSpan = document.createElement("span");
    serverSpan.className = "lb-log-entry-server";
    serverSpan.textContent = result.routed ? result.server.name : "NONE";

    var detailSpan = document.createElement("span");
    detailSpan.className = "lb-log-entry-detail";
    detailSpan.textContent = result.reason;

    entry.appendChild(numSpan);
    entry.appendChild(serverSpan);
    entry.appendChild(detailSpan);

    if (requestLog.firstChild) {
      requestLog.insertBefore(entry, requestLog.firstChild);
    } else {
      requestLog.appendChild(entry);
    }

    while (requestLog.children.length > 50) {
      requestLog.removeChild(requestLog.lastChild);
    }
  }

  // --- Render all ---
  function renderAll() {
    renderServerPool();
    renderStatsTable();
    updateMetrics();
    algoLabel.textContent = formatAlgorithmName(pool ? pool.algorithm : "round-robin");
  }

  // --- Actions ---
  function addServer() {
    if (!pool) {
      initPool();
    }

    // Auto-generate name if empty
    if (inputServerName.value.trim() === "") {
      inputServerName.value = "srv-" + serverNextId;
    }

    var vals = validateServerInputs();
    if (!vals) return;

    LoadBalancerAlgorithm.addServer(pool, { name: vals.name, weight: vals.weight });
    serverNextId++;
    inputServerName.value = "";

    renderAll();
    hideError();
    infoMsg.textContent = "Added server '" + vals.name + "' (weight: " + vals.weight + "). Total servers: " + pool.servers.length + ".";
  }

  function removeSelectedServer() {
    if (!pool || !selectedServerName) {
      showError("Select a server to remove (click on it in the pool).");
      return;
    }

    var name = selectedServerName;
    var removed = LoadBalancerAlgorithm.removeServer(pool, name);
    if (removed) {
      selectedServerName = null;
      delete slowServers[name];
      renderAll();
      hideError();
      infoMsg.textContent = "Removed server '" + name + "'. Servers remaining: " + pool.servers.length + ".";
    }
  }

  function sendRequest() {
    if (!pool || pool.servers.length === 0) {
      showError("Add at least one server before sending requests.");
      return;
    }
    hideError();

    requestCounter++;
    var result = LoadBalancerAlgorithm.routeRequest(pool);

    // Animate
    animatePacket(result);

    // Simulate response time + release connection
    if (result.routed) {
      var serverName = result.server.name;
      highlightServer(serverName);

      var baseTime = 50 + Math.random() * 100;
      var responseTime = slowServers[serverName] ? baseTime + 500 + Math.random() * 500 : baseTime;

      LoadBalancerAlgorithm.recordResponseTime(pool, serverName, responseTime);

      // Release connection after simulated response time (capped for UI)
      var releaseDelay = Math.min(responseTime, 300);
      setTimeout(function () {
        if (pool) {
          LoadBalancerAlgorithm.releaseConnection(pool, serverName);
          renderAll();
        }
      }, releaseDelay);
    }

    addLogEntry(result, requestCounter);
    renderAll();

    var statusText = result.routed
      ? "Routed to " + result.server.name
      : result.reason;
    infoMsg.textContent = "Request #" + requestCounter + " -- " + statusText;
  }

  function toggleAutoSend() {
    if (!pool || pool.servers.length === 0) {
      showError("Add at least one server before auto-sending.");
      return;
    }
    hideError();

    autoSendOn = !autoSendOn;
    if (autoSendOn) {
      btnAutoSend.textContent = "Auto-Send: ON";
      autoSendIntervalId = setInterval(sendRequest, 400);
    } else {
      btnAutoSend.textContent = "Auto-Send: OFF";
      if (autoSendIntervalId !== null) {
        clearInterval(autoSendIntervalId);
        autoSendIntervalId = null;
      }
    }
  }

  function switchAlgorithm() {
    if (!pool) {
      initPool();
    }
    var algo = selectAlgorithm.value;
    LoadBalancerAlgorithm.setAlgorithm(pool, algo);
    renderAll();
    hideError();
    infoMsg.textContent = "Switched to " + formatAlgorithmName(algo) + " algorithm.";
  }

  function reset() {
    clearTimers();
    pool = null;
    requestCounter = 0;
    autoSendOn = false;
    selectedServerName = null;
    serverNextId = 1;
    slowServers = {};

    btnAutoSend.textContent = "Auto-Send: OFF";
    selectAlgorithm.value = "round-robin";

    // Reset viz
    packetLeft.classList.remove("lb-packet-animate", "lb-packet-success", "lb-packet-failure");
    packetRight.classList.remove("lb-packet-animate", "lb-packet-success", "lb-packet-failure");

    // Clear stats
    statTotal.textContent = "0";
    statServers.textContent = "0";
    statAlgo.textContent = "Round Robin";

    // Clear log
    requestLog.textContent = "";

    // Clear table
    while (statsBody.firstChild) {
      statsBody.removeChild(statsBody.firstChild);
    }

    // Reset pool display
    var existingNodes = serverPoolEl.querySelectorAll(".lb-server-node");
    for (var i = 0; i < existingNodes.length; i++) {
      serverPoolEl.removeChild(existingNodes[i]);
    }
    poolEmpty.style.display = "";

    hideError();
    infoMsg.textContent = "Add servers to the pool, then send requests to see load balancing in action. Switch algorithms at runtime.";
  }

  // --- Event listeners ---
  btnAddServer.addEventListener("click", addServer);
  btnRemoveServer.addEventListener("click", removeSelectedServer);
  btnSendRequest.addEventListener("click", sendRequest);
  btnAutoSend.addEventListener("click", toggleAutoSend);
  btnReset.addEventListener("click", reset);
  selectAlgorithm.addEventListener("change", switchAlgorithm);

  // --- Timer cleanup on page unload ---
  window.addEventListener("beforeunload", clearTimers);

  // --- Initialize ---
  initPool();
})();
