/* Dijkstra's Shortest Path Visualization — AlgoViz */
(() => {
  "use strict";

  // --- Constants ---
  const MAX_NODES = 15;
  const MAX_WEIGHT = DijkstraAlgorithm.MAX_WEIGHT;
  const NODE_RADIUS = 20;
  const NODE_NAMES = "ABCDEFGHIJKLMNO";

  // --- State ---
  let nodes = []; // { id: string, x: number, y: number }
  let edges = []; // { from: string, to: string, weight: number }
  let sourceNode = null; // node id
  let mode = "NODE"; // NODE | EDGE | SOURCE
  let edgeStart = null; // node id for edge creation
  let snapshots = [];
  let currentStep = -1;
  let playing = false;
  let playTimer = null;
  let draggingNode = null;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let shortestPathEdges = null; // Set of "from->to" keys for final path display

  // --- DOM refs ---
  const graphContainer = document.getElementById("dijk-graph-container");
  const pqList = document.getElementById("dijk-pq-list");
  const infoEl = document.getElementById("dijk-info");
  const playbackEl = document.getElementById("dijk-playback");
  const stepCountEl = document.getElementById("dijk-stepCount");
  const visitedCountEl = document.getElementById("dijk-visitedCount");
  const pqSizeEl = document.getElementById("dijk-pqSize");
  const distRows = document.getElementById("dijk-dist-rows");

  const btnModeNode = document.getElementById("dijk-btnModeNode");
  const btnModeEdge = document.getElementById("dijk-btnModeEdge");
  const btnModeSource = document.getElementById("dijk-btnModeSource");
  const btnPreset = document.getElementById("dijk-btnPreset");
  const btnClear = document.getElementById("dijk-btnClear");
  const btnRun = document.getElementById("dijk-btnRun");
  const btnReset = document.getElementById("dijk-btnReset");
  const btnStepBack = document.getElementById("dijk-btnStepBack");
  const btnPlay = document.getElementById("dijk-btnPlay");
  const btnPause = document.getElementById("dijk-btnPause");
  const btnStep = document.getElementById("dijk-btnStep");
  const speedSlider = document.getElementById("dijk-speed");

  // --- Helpers ---
  function getDelay() {
    return 800 - (speedSlider.value - 1) * 75;
  }

  function nodeAt(x, y) {
    for (let i = 0; i < nodes.length; i++) {
      const dx = nodes[i].x - x;
      const dy = nodes[i].y - y;
      if (dx * dx + dy * dy <= NODE_RADIUS * NODE_RADIUS * 1.5) {
        return nodes[i];
      }
    }
    return null;
  }

  function edgeKey(from, to) {
    return from + "->" + to;
  }

  function hasEdge(from, to) {
    for (let i = 0; i < edges.length; i++) {
      if (edges[i].from === from && edges[i].to === to) return true;
    }
    return false;
  }

  // --- Rendering ---
  function render() {
    // Clear container
    while (graphContainer.firstChild) {
      graphContainer.removeChild(graphContainer.firstChild);
    }

    // SVG for edges
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("dijk-edge-svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");

    // Arrow marker
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const defaultMarker = createArrowMarker("dijk-arrow-default", "#30363d");
    const relaxedMarker = createArrowMarker("dijk-arrow-relaxed", "#bc8cff");
    const shortestMarker = createArrowMarker("dijk-arrow-shortest", "#3fb950");
    defs.appendChild(defaultMarker);
    defs.appendChild(relaxedMarker);
    defs.appendChild(shortestMarker);
    svg.appendChild(defs);

    // Draw edges
    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      const fromNode = findNode(edge.from);
      const toNode = findNode(edge.to);
      if (!fromNode || !toNode) continue;

      const dx = toNode.x - fromNode.x;
      const dy = toNode.y - fromNode.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist === 0) continue;

      // Offset endpoints to node borders
      const ux = dx / dist;
      const uy = dy / dist;
      const x1 = fromNode.x + ux * NODE_RADIUS;
      const y1 = fromNode.y + uy * NODE_RADIUS;
      const x2 = toNode.x - ux * (NODE_RADIUS + 6);
      const y2 = toNode.y - uy * (NODE_RADIUS + 6);

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", x1);
      line.setAttribute("y1", y1);
      line.setAttribute("x2", x2);
      line.setAttribute("y2", y2);
      line.classList.add("dijk-edge-line");

      const ek = edgeKey(edge.from, edge.to);
      if (shortestPathEdges && shortestPathEdges.has(ek)) {
        line.classList.add("dijk-edge-shortest");
        line.setAttribute("marker-end", "url(#dijk-arrow-shortest)");
      } else {
        line.setAttribute("marker-end", "url(#dijk-arrow-default)");
      }

      svg.appendChild(line);

      // Weight label
      const mx = (fromNode.x + toNode.x) / 2;
      const my = (fromNode.y + toNode.y) / 2;
      // Offset label perpendicular to edge
      const px = -uy * 12;
      const py = ux * 12;

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", mx + px);
      text.setAttribute("y", my + py);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "middle");
      text.classList.add("dijk-edge-weight");

      if (shortestPathEdges && shortestPathEdges.has(ek)) {
        text.classList.add("dijk-edge-shortest");
      }

      text.textContent = String(edge.weight);
      svg.appendChild(text);
    }

    graphContainer.appendChild(svg);

    // Draw nodes
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const el = document.createElement("div");
      el.className = "dijk-node";
      el.style.left = (node.x - NODE_RADIUS) + "px";
      el.style.top = (node.y - NODE_RADIUS) + "px";
      el.dataset.id = node.id;
      el.textContent = node.id;

      if (node.id === sourceNode) {
        el.classList.add("dijk-node-source");
      }
      if (node.id === edgeStart) {
        el.classList.add("dijk-node-selected");
      }

      // Distance label (during animation)
      if (node._dist !== undefined) {
        const distLabel = document.createElement("div");
        distLabel.className = "dijk-dist-label";
        distLabel.textContent = node._dist === Infinity ? "\u221E" : String(node._dist);
        el.appendChild(distLabel);
      }

      // Node drag
      el.addEventListener("mousedown", (e) => {
        if (snapshots.length > 0) return;
        if (mode === "EDGE") {
          handleEdgeClick(node.id);
          e.stopPropagation();
          return;
        }
        if (mode === "SOURCE") {
          sourceNode = node.id;
          infoEl.textContent = "Source set to " + node.id + ". Click Run Dijkstra.";
          render();
          e.stopPropagation();
          return;
        }
        // Drag
        draggingNode = node;
        const rect = graphContainer.getBoundingClientRect();
        dragOffsetX = e.clientX - rect.left - node.x;
        dragOffsetY = e.clientY - rect.top - node.y;
        e.stopPropagation();
      });

      graphContainer.appendChild(el);
    }

    // Edge mode cursor
    graphContainer.classList.toggle("dijk-edge-mode", mode === "EDGE" || mode === "SOURCE");
  }

  function createArrowMarker(id, color) {
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    marker.setAttribute("id", id);
    marker.setAttribute("viewBox", "0 0 10 10");
    marker.setAttribute("refX", "9");
    marker.setAttribute("refY", "5");
    marker.setAttribute("markerWidth", "8");
    marker.setAttribute("markerHeight", "8");
    marker.setAttribute("orient", "auto-start-reverse");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
    path.setAttribute("fill", color);
    marker.appendChild(path);
    return marker;
  }

  function findNode(id) {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].id === id) return nodes[i];
    }
    return null;
  }

  // --- Edge creation ---
  function handleEdgeClick(nodeId) {
    if (edgeStart === null) {
      edgeStart = nodeId;
      infoEl.textContent = "Now click the destination node for the edge from " + nodeId + ".";
      render();
    } else {
      if (edgeStart === nodeId) {
        infoEl.textContent = "Self-loops not allowed. Click a different node.";
        edgeStart = null;
        render();
        return;
      }
      if (hasEdge(edgeStart, nodeId)) {
        infoEl.textContent = "Edge from " + edgeStart + " to " + nodeId + " already exists.";
        edgeStart = null;
        render();
        return;
      }
      promptWeight(edgeStart, nodeId);
    }
  }

  function promptWeight(from, to) {
    // Remove any existing dialog
    removeWeightDialog();

    const fromNode = findNode(from);
    const toNode = findNode(to);
    const mx = (fromNode.x + toNode.x) / 2;
    const my = (fromNode.y + toNode.y) / 2;

    const dialog = document.createElement("div");
    dialog.className = "dijk-weight-dialog";
    dialog.id = "dijk-weight-dialog";
    dialog.style.left = mx + "px";
    dialog.style.top = my + "px";

    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.max = String(MAX_WEIGHT);
    input.value = "1";
    input.id = "dijk-weight-input";

    const okBtn = document.createElement("button");
    okBtn.textContent = "OK";
    okBtn.addEventListener("click", () => {
      addEdgeWithWeight(from, to, input.value);
    });

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "X";
    cancelBtn.addEventListener("click", () => {
      edgeStart = null;
      removeWeightDialog();
      render();
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        addEdgeWithWeight(from, to, input.value);
      }
      if (e.key === "Escape") {
        edgeStart = null;
        removeWeightDialog();
        render();
      }
    });

    dialog.appendChild(input);
    dialog.appendChild(okBtn);
    dialog.appendChild(cancelBtn);
    graphContainer.appendChild(dialog);
    input.focus();
    input.select();
  }

  function addEdgeWithWeight(from, to, rawValue) {
    const w = parseInt(rawValue, 10);
    if (isNaN(w) || w < 0 || w > MAX_WEIGHT) {
      infoEl.textContent = "Weight must be 0-" + MAX_WEIGHT + ". Try again.";
      removeWeightDialog();
      edgeStart = null;
      render();
      return;
    }
    edges.push({ from: from, to: to, weight: w });
    edgeStart = null;
    removeWeightDialog();
    infoEl.textContent = "Edge " + from + " \u2192 " + to + " (weight " + w + ") added.";
    render();
  }

  function removeWeightDialog() {
    const existing = document.getElementById("dijk-weight-dialog");
    if (existing) existing.parentNode.removeChild(existing);
  }

  // --- Graph container click (add node) ---
  graphContainer.addEventListener("mousedown", (e) => {
    if (snapshots.length > 0) return;
    if (draggingNode) return;

    if (mode === "NODE") {
      if (nodes.length >= MAX_NODES) {
        infoEl.textContent = "Maximum " + MAX_NODES + " nodes reached.";
        return;
      }
      const rect = graphContainer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Don't place too close to existing node
      if (nodeAt(x, y)) return;

      const id = NODE_NAMES[nodes.length];
      nodes.push({ id: id, x: x, y: y });
      infoEl.textContent = "Node " + id + " added. Add more or switch to Edge mode.";
      render();
    }
  });

  // --- Drag handling ---
  document.addEventListener("mousemove", (e) => {
    if (!draggingNode) return;
    const rect = graphContainer.getBoundingClientRect();
    let x = e.clientX - rect.left - dragOffsetX;
    let y = e.clientY - rect.top - dragOffsetY;
    // Clamp
    x = Math.max(NODE_RADIUS, Math.min(rect.width - NODE_RADIUS, x));
    y = Math.max(NODE_RADIUS, Math.min(rect.height - NODE_RADIUS, y));
    draggingNode.x = x;
    draggingNode.y = y;
    render();
  });

  document.addEventListener("mouseup", () => {
    draggingNode = null;
  });

  // --- Run Dijkstra ---
  function runDijkstra() {
    if (nodes.length === 0) {
      infoEl.textContent = "Add some nodes first.";
      return;
    }
    if (!sourceNode) {
      infoEl.textContent = "Set a source node first (switch to Source mode and click a node).";
      return;
    }

    const nodeIds = nodes.map((n) => n.id);
    const result = DijkstraAlgorithm.run({
      nodes: nodeIds,
      edges: edges,
      source: sourceNode,
    });

    if (result.error) {
      infoEl.textContent = "Error: " + result.error;
      return;
    }

    snapshots = result.snapshots;
    currentStep = -1;
    shortestPathEdges = null;
    playbackEl.style.display = "flex";

    // Clear animation state
    for (let i = 0; i < nodes.length; i++) {
      delete nodes[i]._dist;
      delete nodes[i]._state;
    }

    // Compute shortest path edges for final display
    const spEdges = new Set();
    for (let i = 0; i < nodeIds.length; i++) {
      const target = nodeIds[i];
      if (target === sourceNode) continue;
      const p = result.path(target);
      if (p && p.length > 1) {
        for (let j = 0; j < p.length - 1; j++) {
          spEdges.add(edgeKey(p[j], p[j + 1]));
        }
      }
    }
    shortestPathEdges = spEdges;

    infoEl.textContent =
      "Dijkstra complete! " +
      snapshots.length +
      " steps. Use playback to animate.";
    render();
    resetPQSidebar();
  }

  // --- Snapshot rendering ---
  function renderSnapshot(stepIdx) {
    if (stepIdx < 0 || stepIdx >= snapshots.length) return;

    const snap = snapshots[stepIdx];

    // Update node visual states
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      node._dist = snap.distances[node.id];
      node._state = "unvisited";

      if (snap.visited.indexOf(node.id) >= 0) {
        node._state = "visited";
      }
      if (node.id === snap.current) {
        node._state = "current";
      }
      if (snap.relaxedEdge && node.id === snap.relaxedEdge.to) {
        node._state = "relaxed";
      }
    }

    // Don't show shortest-path edges during animation
    const savedSP = shortestPathEdges;
    shortestPathEdges = null;

    // If last step, show shortest path
    if (stepIdx === snapshots.length - 1) {
      shortestPathEdges = savedSP;
    }

    render();
    shortestPathEdges = savedSP;

    // Apply CSS states
    const nodeEls = graphContainer.querySelectorAll(".dijk-node");
    nodeEls.forEach((el) => {
      const node = findNode(el.dataset.id);
      if (!node) return;
      el.classList.remove(
        "dijk-node-visited",
        "dijk-node-current",
        "dijk-node-relaxed",
      );
      if (node._state === "visited") el.classList.add("dijk-node-visited");
      if (node._state === "current") el.classList.add("dijk-node-current");
      if (node._state === "relaxed") el.classList.add("dijk-node-relaxed");
    });

    // Highlight relaxed edge
    if (snap.relaxedEdge) {
      const svg = graphContainer.querySelector(".dijk-edge-svg");
      if (svg) {
        const lines = svg.querySelectorAll(".dijk-edge-line");
        const texts = svg.querySelectorAll(".dijk-edge-weight");
        for (let i = 0; i < edges.length; i++) {
          if (
            edges[i].from === snap.relaxedEdge.from &&
            edges[i].to === snap.relaxedEdge.to
          ) {
            if (lines[i]) {
              lines[i].classList.add("dijk-edge-relaxed");
              lines[i].setAttribute("marker-end", "url(#dijk-arrow-relaxed)");
            }
            if (texts[i]) {
              texts[i].classList.add("dijk-edge-relaxed");
            }
          }
        }
      }
    }

    // Update PQ sidebar
    renderPQ(snap.priorityQueue);

    // Update stats
    stepCountEl.textContent = String(stepIdx + 1);
    visitedCountEl.textContent = String(snap.visited.length);
    pqSizeEl.textContent = String(snap.priorityQueue.length);

    // Update distance table
    renderDistTable(snap.distances);

    // Update info
    if (snap.relaxedEdge) {
      const newDist = snap.distances[snap.relaxedEdge.to];
      infoEl.textContent =
        "Step " +
        (stepIdx + 1) +
        "/" +
        snapshots.length +
        ": Relaxed edge " +
        snap.relaxedEdge.from +
        " \u2192 " +
        snap.relaxedEdge.to +
        ", new distance = " +
        (newDist === Infinity ? "\u221E" : newDist);
    } else {
      infoEl.textContent =
        "Step " +
        (stepIdx + 1) +
        "/" +
        snapshots.length +
        ": Processing node " +
        snap.current +
        " (distance " +
        (snap.distances[snap.current] === Infinity
          ? "\u221E"
          : snap.distances[snap.current]) +
        ")";
    }

    if (stepIdx === snapshots.length - 1) {
      infoEl.textContent =
        "Complete! All reachable nodes have shortest distances. Green edges show the shortest path tree.";
    }
  }

  function renderPQ(pq) {
    while (pqList.firstChild) {
      pqList.removeChild(pqList.firstChild);
    }

    if (pq.length === 0) {
      const empty = document.createElement("div");
      empty.className = "dijk-pq-empty";
      empty.textContent = "Queue is empty";
      pqList.appendChild(empty);
      return;
    }

    for (let i = 0; i < pq.length && i < 30; i++) {
      const item = document.createElement("div");
      item.className = "dijk-pq-item";
      if (i === 0) item.classList.add("dijk-pq-top");

      const nameSpan = document.createElement("span");
      nameSpan.textContent = pq[i].node;

      const distSpan = document.createElement("span");
      distSpan.className = "dijk-pq-item-dist";
      distSpan.textContent = pq[i].distance === Infinity ? "\u221E" : String(pq[i].distance);

      item.appendChild(nameSpan);
      item.appendChild(distSpan);
      pqList.appendChild(item);
    }

    if (pq.length > 30) {
      const more = document.createElement("div");
      more.className = "dijk-pq-empty";
      more.textContent = "... and " + (pq.length - 30) + " more";
      pqList.appendChild(more);
    }
  }

  function renderDistTable(distances) {
    while (distRows.firstChild) {
      distRows.removeChild(distRows.firstChild);
    }

    for (let i = 0; i < nodes.length; i++) {
      const row = document.createElement("div");
      row.className = "dijk-dist-row";

      const nameEl = document.createElement("span");
      nameEl.textContent = nodes[i].id;

      const valEl = document.createElement("span");
      valEl.className = "dijk-dist-row-val";
      const d = distances[nodes[i].id];
      valEl.textContent = d === undefined || d === Infinity ? "\u221E" : String(d);

      row.appendChild(nameEl);
      row.appendChild(valEl);
      distRows.appendChild(row);
    }
  }

  function resetPQSidebar() {
    while (pqList.firstChild) {
      pqList.removeChild(pqList.firstChild);
    }
    const empty = document.createElement("div");
    empty.className = "dijk-pq-empty";
    empty.textContent = "Run Dijkstra to see the queue";
    pqList.appendChild(empty);
    stepCountEl.textContent = "0";
    visitedCountEl.textContent = "0";
    pqSizeEl.textContent = "0";
  }

  // --- Playback Controls ---
  function stepForward() {
    if (currentStep < snapshots.length - 1) {
      currentStep++;
      renderSnapshot(currentStep);
    } else {
      stopPlayback();
    }
  }

  function stepBackward() {
    if (currentStep > 0) {
      currentStep--;
      renderSnapshot(currentStep);
    }
  }

  function startPlayback() {
    if (currentStep >= snapshots.length - 1) {
      currentStep = -1;
      for (let i = 0; i < nodes.length; i++) {
        delete nodes[i]._dist;
        delete nodes[i]._state;
      }
      render();
      resetPQSidebar();
    }
    playing = true;
    btnPlay.disabled = true;
    btnPause.disabled = false;
    tick();
  }

  function tick() {
    if (!playing) return;
    stepForward();
    if (currentStep < snapshots.length - 1) {
      playTimer = setTimeout(tick, getDelay());
    } else {
      stopPlayback();
    }
  }

  function stopPlayback() {
    playing = false;
    clearTimeout(playTimer);
    playTimer = null;
    btnPlay.disabled = false;
    btnPause.disabled = true;
  }

  function resetVisualization() {
    stopPlayback();
    snapshots = [];
    currentStep = -1;
    shortestPathEdges = null;
    playbackEl.style.display = "none";

    for (let i = 0; i < nodes.length; i++) {
      delete nodes[i]._dist;
      delete nodes[i]._state;
    }

    render();
    resetPQSidebar();
    while (distRows.firstChild) {
      distRows.removeChild(distRows.firstChild);
    }
    infoEl.textContent =
      "Click the canvas to add nodes (max " +
      MAX_NODES +
      "). Switch to Edge mode to connect them.";
  }

  // --- Mode Switching ---
  function setMode(newMode) {
    mode = newMode;
    edgeStart = null;
    removeWeightDialog();
    btnModeNode.classList.toggle("dijk-active-mode", mode === "NODE");
    btnModeEdge.classList.toggle("dijk-active-mode", mode === "EDGE");
    btnModeSource.classList.toggle("dijk-active-mode", mode === "SOURCE");
    render();

    if (mode === "NODE") {
      infoEl.textContent = "Click the canvas to add nodes (max " + MAX_NODES + ").";
    } else if (mode === "EDGE") {
      infoEl.textContent = "Click a source node, then a destination node to create a directed edge.";
    } else {
      infoEl.textContent = "Click a node to set it as the source for Dijkstra.";
    }
  }

  // --- Preset Graph (GPS cities example) ---
  function loadPreset() {
    nodes = [
      { id: "A", x: 80, y: 80 },
      { id: "B", x: 250, y: 50 },
      { id: "C", x: 420, y: 80 },
      { id: "D", x: 100, y: 230 },
      { id: "E", x: 300, y: 200 },
      { id: "F", x: 500, y: 220 },
      { id: "G", x: 200, y: 370 },
      { id: "H", x: 420, y: 370 },
    ];
    edges = [
      { from: "A", to: "B", weight: 4 },
      { from: "A", to: "D", weight: 8 },
      { from: "B", to: "C", weight: 3 },
      { from: "B", to: "E", weight: 5 },
      { from: "C", to: "F", weight: 2 },
      { from: "D", to: "E", weight: 2 },
      { from: "D", to: "G", weight: 7 },
      { from: "E", to: "F", weight: 6 },
      { from: "E", to: "H", weight: 3 },
      { from: "F", to: "H", weight: 1 },
      { from: "G", to: "H", weight: 4 },
      { from: "B", to: "A", weight: 4 },
      { from: "E", to: "D", weight: 2 },
    ];
    sourceNode = "A";
    edgeStart = null;
    snapshots = [];
    currentStep = -1;
    shortestPathEdges = null;
    playbackEl.style.display = "none";

    infoEl.textContent =
      "Preset loaded: 8 cities with weighted roads. Source is A. Click Run Dijkstra!";
    render();
    resetPQSidebar();
    while (distRows.firstChild) {
      distRows.removeChild(distRows.firstChild);
    }
  }

  // --- Clear All ---
  function clearAll() {
    stopPlayback();
    nodes = [];
    edges = [];
    sourceNode = null;
    edgeStart = null;
    snapshots = [];
    currentStep = -1;
    shortestPathEdges = null;
    playbackEl.style.display = "none";

    render();
    resetPQSidebar();
    while (distRows.firstChild) {
      distRows.removeChild(distRows.firstChild);
    }
    infoEl.textContent =
      "Click the canvas to add nodes (max " +
      MAX_NODES +
      "). Switch to Edge mode to connect them.";
  }

  // --- Event Listeners ---
  btnModeNode.addEventListener("click", () => setMode("NODE"));
  btnModeEdge.addEventListener("click", () => setMode("EDGE"));
  btnModeSource.addEventListener("click", () => setMode("SOURCE"));

  btnPreset.addEventListener("click", loadPreset);
  btnClear.addEventListener("click", clearAll);

  btnRun.addEventListener("click", () => {
    if (snapshots.length > 0) {
      resetVisualization();
    }
    runDijkstra();
  });

  btnReset.addEventListener("click", resetVisualization);
  btnStepBack.addEventListener("click", stepBackward);
  btnPlay.addEventListener("click", startPlayback);
  btnPause.addEventListener("click", stopPlayback);
  btnStep.addEventListener("click", stepForward);

  // Cleanup timer on page unload
  window.addEventListener("beforeunload", () => {
    stopPlayback();
  });

  // --- Init ---
  render();
})();
