/**
 * Consistent Hashing UI — visualization + controls
 *
 * Calls ConsistentHashAlgorithm functions for all logic (no duplicated algorithm code).
 * Uses textContent for all user-visible text.
 * Cleans up timers on reset and beforeunload.
 */
(function () {
  "use strict";

  // --- Server colors for visualization ---
  const SERVER_COLORS = [
    "#58a6ff", "#3fb950", "#f85149", "#d29922", "#bc8cff",
    "#f778ba", "#79c0ff", "#7ee787", "#ffa198", "#e3b341",
    "#a5d6ff", "#56d364", "#ff7b72", "#f0b232", "#d2a8ff",
  ];

  // --- State ---
  let ring = null;
  let keys = [];
  let serverCounter = 0;
  let lastRedist = null;
  let animationFrameId = null;

  // --- DOM refs ---
  const inputVNodes = document.getElementById("inputVNodes");
  const inputKeyCount = document.getElementById("inputKeyCount");
  const inputKeyPrefix = document.getElementById("inputKeyPrefix");
  const errorMsg = document.getElementById("errorMsg");
  const infoMsg = document.getElementById("infoMsg");
  const btnApply = document.getElementById("btnApply");
  const btnAddServer = document.getElementById("btnAddServer");
  const btnRemoveServer = document.getElementById("btnRemoveServer");
  const btnReset = document.getElementById("btnReset");
  const ringCanvas = document.getElementById("ringCanvas");
  const ringLegend = document.getElementById("ringLegend");
  const distBars = document.getElementById("distBars");
  const barConsistent = document.getElementById("barConsistent");
  const barModulo = document.getElementById("barModulo");
  const pctConsistent = document.getElementById("pctConsistent");
  const pctModulo = document.getElementById("pctModulo");
  const redistDetail = document.getElementById("redistDetail");
  const statServers = document.getElementById("statServers");
  const statVNodes = document.getElementById("statVNodes");
  const statKeys = document.getElementById("statKeys");
  const statStdDev = document.getElementById("statStdDev");
  const eventLog = document.getElementById("eventLog");

  const ctx = ringCanvas.getContext("2d");

  // --- Input validation ---
  function validateInputs() {
    const vNodes = Number(inputVNodes.value);
    const keyCount = Number(inputKeyCount.value);
    const prefix = inputKeyPrefix.value.trim();

    const errors = [];

    if (isNaN(vNodes) || vNodes < 1 || vNodes > 20 || !Number.isInteger(vNodes)) {
      errors.push("Virtual nodes must be 1-20 (integer)");
    }
    if (isNaN(keyCount) || keyCount < 1 || keyCount > 500 || !Number.isInteger(keyCount)) {
      errors.push("Key count must be 1-500 (integer)");
    }
    if (prefix.length === 0 || prefix.length > 20) {
      errors.push("Key prefix must be 1-20 characters");
    }

    if (errors.length > 0) {
      showError(errors.join(". "));
      return null;
    }

    hideError();
    return { vNodes: vNodes, keyCount: keyCount, prefix: prefix };
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
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  // --- Generate keys ---
  function generateKeys(prefix, count) {
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(prefix + i);
    }
    return result;
  }

  // --- Get server color ---
  function getServerColor(serverId) {
    if (!ring) return "#8b949e";
    const colorIdx = ring.serverColors[serverId];
    if (colorIdx === undefined) return "#8b949e";
    return SERVER_COLORS[colorIdx % SERVER_COLORS.length];
  }

  // --- Draw hash ring on canvas ---
  function drawRing() {
    const w = ringCanvas.width;
    const h = ringCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(cx, cy) - 40;

    ctx.clearRect(0, 0, w, h);

    // Draw ring circle
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "#30363d";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw degree markers
    for (let deg = 0; deg < 360; deg += 30) {
      const angle = (deg - 90) * (Math.PI / 180);
      const x1 = cx + (radius - 5) * Math.cos(angle);
      const y1 = cy + (radius - 5) * Math.sin(angle);
      const x2 = cx + (radius + 5) * Math.cos(angle);
      const y2 = cy + (radius + 5) * Math.sin(angle);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = "#21262d";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    if (!ring) return;

    const ringSize = ConsistentHashAlgorithm.RING_SIZE;

    // Draw key assignments (lines from key position to server node)
    if (ring.servers.length > 0) {
      const assignments = ConsistentHashAlgorithm.assignAllKeys(ring, keys);
      for (let i = 0; i < assignments.assignments.length; i++) {
        const a = assignments.assignments[i];
        if (a.serverId === null) continue;

        const keyAngle = ((a.keyPosition / ringSize) * 360 - 90) * (Math.PI / 180);
        const keyX = cx + radius * Math.cos(keyAngle);
        const keyY = cy + radius * Math.sin(keyAngle);

        // Draw key dot on ring
        ctx.beginPath();
        ctx.arc(keyX, keyY, 2, 0, Math.PI * 2);
        ctx.fillStyle = "#d2992260";
        ctx.fill();
      }
    }

    // Draw virtual nodes on ring
    const positions = ConsistentHashAlgorithm.getRingPositions(ring);
    for (let i = 0; i < positions.length; i++) {
      const p = positions[i];
      const angle = ((p.position / ringSize) * 360 - 90) * (Math.PI / 180);
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      const color = getServerColor(p.serverId);

      // Draw node marker
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = p.vnodeIndex === 0 ? 1.0 : 0.5;
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // Draw border for primary nodes
      if (p.vnodeIndex === 0) {
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.strokeStyle = "#ffffff40";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // Draw center label
    ctx.fillStyle = "#8b949e";
    ctx.font = "11px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (ring.servers.length === 0) {
      ctx.fillText("Add servers", cx, cy);
    } else {
      ctx.fillText(ring.servers.length + " servers", cx, cy - 8);
      ctx.fillText(ring.ring.length + " vnodes", cx, cy + 8);
    }
  }

  // --- Update distribution bars ---
  function updateDistribution() {
    // Clear existing bars
    while (distBars.firstChild) {
      distBars.removeChild(distBars.firstChild);
    }

    if (!ring || ring.servers.length === 0) {
      const empty = document.createElement("div");
      empty.className = "ch-redist-detail";
      empty.textContent = "No servers — add servers to see distribution.";
      distBars.appendChild(empty);
      return;
    }

    const dist = ConsistentHashAlgorithm.getDistribution(ring, keys);
    const totalKeys = keys.length;

    for (let i = 0; i < ring.servers.length; i++) {
      const serverId = ring.servers[i];
      const count = dist[serverId] || 0;
      const pct = totalKeys > 0 ? (count / totalKeys) * 100 : 0;
      const color = getServerColor(serverId);

      const row = document.createElement("div");
      row.className = "ch-dist-row";

      const label = document.createElement("span");
      label.className = "ch-dist-label";
      label.style.color = color;
      label.textContent = serverId;

      const track = document.createElement("div");
      track.className = "ch-dist-bar-track";

      const fill = document.createElement("div");
      fill.className = "ch-dist-bar-fill";
      fill.style.width = pct + "%";
      fill.style.background = color;
      track.appendChild(fill);

      const countSpan = document.createElement("span");
      countSpan.className = "ch-dist-count";
      countSpan.textContent = count + " (" + Math.round(pct) + "%)";

      row.appendChild(label);
      row.appendChild(track);
      row.appendChild(countSpan);
      distBars.appendChild(row);
    }
  }

  // --- Update ring legend ---
  function updateLegend() {
    while (ringLegend.firstChild) {
      ringLegend.removeChild(ringLegend.firstChild);
    }

    if (!ring) return;

    for (let i = 0; i < ring.servers.length; i++) {
      const serverId = ring.servers[i];
      const color = getServerColor(serverId);

      const item = document.createElement("span");
      item.className = "ch-legend-item";

      const dot = document.createElement("span");
      dot.className = "ch-legend-dot";
      dot.style.background = color;

      const text = document.createElement("span");
      text.textContent = serverId;

      item.appendChild(dot);
      item.appendChild(text);
      ringLegend.appendChild(item);
    }
  }

  // --- Update stats ---
  function updateStats() {
    if (!ring) {
      statServers.textContent = "0";
      statVNodes.textContent = "0";
      statKeys.textContent = "0";
      statStdDev.textContent = "--";
      return;
    }

    statServers.textContent = String(ring.servers.length);
    statVNodes.textContent = String(ring.ring.length);
    statKeys.textContent = String(keys.length);

    if (ring.servers.length > 0 && keys.length > 0) {
      const dist = ConsistentHashAlgorithm.getDistribution(ring, keys);
      const counts = [];
      for (let i = 0; i < ring.servers.length; i++) {
        counts.push(dist[ring.servers[i]] || 0);
      }
      const mean = keys.length / ring.servers.length;
      let variance = 0;
      for (let j = 0; j < counts.length; j++) {
        variance += (counts[j] - mean) * (counts[j] - mean);
      }
      variance /= counts.length;
      statStdDev.textContent = Math.sqrt(variance).toFixed(1);
    } else {
      statStdDev.textContent = "--";
    }
  }

  // --- Update redistribution panel ---
  function updateRedistribution(action, serverId) {
    if (!ring || keys.length === 0 || ring.servers.length === 0) {
      barConsistent.style.width = "0%";
      barModulo.style.width = "0%";
      pctConsistent.textContent = "0%";
      pctModulo.textContent = "0%";
      redistDetail.textContent = "Add or remove a server to compare redistribution.";
      return;
    }

    if (lastRedist) {
      barConsistent.style.width = lastRedist.consistentPct + "%";
      barModulo.style.width = lastRedist.moduloPct + "%";
      pctConsistent.textContent = lastRedist.consistentPct + "%";
      pctModulo.textContent = lastRedist.moduloPct + "%";
      redistDetail.textContent =
        "On " + action + " " + serverId + ": consistent moved " +
        lastRedist.consistentMoved + "/" + lastRedist.totalKeys +
        " keys, modulo moved " + lastRedist.moduloMoved + "/" + lastRedist.totalKeys + " keys.";
    }
  }

  // --- Add log entry ---
  function addLogEntry(type, detail) {
    const entry = document.createElement("div");
    let entryClass = "ch-log-entry ";
    if (type === "ADD") {
      entryClass += "ch-log-entry-add";
    } else if (type === "REMOVE") {
      entryClass += "ch-log-entry-remove";
    } else {
      entryClass += "ch-log-entry-info";
    }
    entry.className = entryClass;

    const typeSpan = document.createElement("span");
    typeSpan.className = "ch-log-entry-type";
    typeSpan.textContent = type;

    const detailSpan = document.createElement("span");
    detailSpan.className = "ch-log-entry-detail";
    detailSpan.textContent = detail;

    entry.appendChild(typeSpan);
    entry.appendChild(detailSpan);

    if (eventLog.firstChild) {
      eventLog.insertBefore(entry, eventLog.firstChild);
    } else {
      eventLog.appendChild(entry);
    }

    // Cap at 50 entries
    while (eventLog.children.length > 50) {
      eventLog.removeChild(eventLog.lastChild);
    }
  }

  // --- Refresh all visuals ---
  function refreshAll() {
    drawRing();
    updateDistribution();
    updateLegend();
    updateStats();
  }

  // --- Actions ---
  function applyConfig() {
    const vals = validateInputs();
    if (!vals) return;

    clearTimers();

    ring = ConsistentHashAlgorithm.createRing({ virtualNodes: vals.vNodes });
    keys = generateKeys(vals.prefix, vals.keyCount);
    serverCounter = 0;
    lastRedist = null;

    eventLog.textContent = "";

    refreshAll();
    updateRedistribution(null, null);

    infoMsg.textContent =
      "Ring created with " + vals.vNodes + " virtual nodes per server, " +
      vals.keyCount + " keys. Add servers to see distribution.";
    addLogEntry("CONFIG", "Ring created: " + vals.vNodes + " vnodes/server, " + vals.keyCount + " keys");
  }

  function addServer() {
    if (!ring) {
      showError("Apply config first.");
      return;
    }
    hideError();

    if (ring.servers.length >= 15) {
      showError("Maximum 15 servers reached.");
      return;
    }

    serverCounter++;
    const serverId = "S" + serverCounter;

    // Compute redistribution BEFORE adding
    if (ring.servers.length > 0) {
      lastRedist = ConsistentHashAlgorithm.compareRedistribution(ring, keys, "add", serverId);
    }

    const result = ConsistentHashAlgorithm.addServer(ring, serverId);
    if (!result.added) {
      showError(result.error);
      return;
    }

    refreshAll();
    updateRedistribution("add", serverId);

    const dist = ConsistentHashAlgorithm.getDistribution(ring, keys);
    const count = dist[serverId] || 0;
    infoMsg.textContent =
      "Added " + serverId + " with " + ring.virtualNodesPerServer +
      " virtual nodes. " + serverId + " now holds " + count + " keys.";
    addLogEntry("ADD", serverId + " added — holds " + count + "/" + keys.length + " keys" +
      (lastRedist ? " (consistent moved " + lastRedist.consistentMoved + ", modulo moved " + lastRedist.moduloMoved + ")" : ""));
  }

  function removeLastServer() {
    if (!ring) {
      showError("Apply config first.");
      return;
    }
    hideError();

    if (ring.servers.length === 0) {
      showError("No servers to remove.");
      return;
    }

    const serverId = ring.servers[ring.servers.length - 1];

    // Compute redistribution BEFORE removing
    if (ring.servers.length > 1) {
      lastRedist = ConsistentHashAlgorithm.compareRedistribution(ring, keys, "remove", serverId);
    } else {
      lastRedist = null;
    }

    const result = ConsistentHashAlgorithm.removeServer(ring, serverId);
    if (!result.removed) {
      showError(result.error);
      return;
    }

    refreshAll();
    updateRedistribution("remove", serverId);

    infoMsg.textContent =
      "Removed " + serverId + ". " + ring.servers.length + " servers remaining.";
    addLogEntry("REMOVE", serverId + " removed — " + ring.servers.length + " servers remain" +
      (lastRedist ? " (consistent moved " + lastRedist.consistentMoved + ", modulo moved " + lastRedist.moduloMoved + ")" : ""));
  }

  function reset() {
    clearTimers();
    ring = null;
    keys = [];
    serverCounter = 0;
    lastRedist = null;

    eventLog.textContent = "";

    barConsistent.style.width = "0%";
    barModulo.style.width = "0%";
    pctConsistent.textContent = "0%";
    pctModulo.textContent = "0%";
    redistDetail.textContent = "Add or remove a server to compare redistribution.";

    refreshAll();

    hideError();
    infoMsg.textContent = "Configure virtual nodes and keys, then add servers to see consistent hashing in action.";
  }

  // --- Event listeners ---
  btnApply.addEventListener("click", applyConfig);
  btnAddServer.addEventListener("click", addServer);
  btnRemoveServer.addEventListener("click", removeLastServer);
  btnReset.addEventListener("click", reset);

  // --- Timer cleanup on page unload ---
  window.addEventListener("beforeunload", clearTimers);

  // --- Initialize ---
  drawRing();
})();
