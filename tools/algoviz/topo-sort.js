/* Topological Sort Visualization — AlgoViz */
(() => {
  "use strict";

  // --- State ---
  let nodes = [];
  let edges = [];
  let snapshots = [];
  let currentStep = -1;
  let playing = false;
  let playTimer = null;
  let explicitStepCount = 0;
  let nodePositions = {}; // { nodeId: { x, y } }

  // --- DOM refs ---
  const nodeInput = document.getElementById("topo-nodeInput");
  const btnAddNode = document.getElementById("topo-btnAddNode");
  const edgeFrom = document.getElementById("topo-edgeFrom");
  const edgeTo = document.getElementById("topo-edgeTo");
  const btnAddEdge = document.getElementById("topo-btnAddEdge");
  const presetSelect = document.getElementById("topo-presetSelect");
  const btnRun = document.getElementById("topo-btnRun");
  const btnReset = document.getElementById("topo-btnReset");
  const btnClear = document.getElementById("topo-btnClear");
  const playbackEl = document.getElementById("topo-playback");
  const btnStepBack = document.getElementById("topo-btnStepBack");
  const btnPlay = document.getElementById("topo-btnPlay");
  const btnPause = document.getElementById("topo-btnPause");
  const btnStep = document.getElementById("topo-btnStep");
  const speedSlider = document.getElementById("topo-speed");
  const infoEl = document.getElementById("topo-info");
  const errorEl = document.getElementById("topo-error");
  const svg = document.getElementById("topo-svg");
  const indegreesEl = document.getElementById("topo-indegrees");
  const queueEl = document.getElementById("topo-queue");
  const orderEl = document.getElementById("topo-order");
  const stepCountEl = document.getElementById("topo-stepCount");
  const nodeCountEl = document.getElementById("topo-nodeCount");
  const edgeCountEl = document.getElementById("topo-edgeCount");

  // --- Helpers ---
  function getDelay() {
    return 600 - (speedSlider.value - 1) * 55;
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.remove("hidden");
    setTimeout(() => errorEl.classList.add("hidden"), 3000);
  }

  function clearError() {
    errorEl.textContent = "";
    errorEl.classList.add("hidden");
  }

  function updateStats() {
    stepCountEl.textContent = String(explicitStepCount);
    nodeCountEl.textContent = String(nodes.length);
    edgeCountEl.textContent = String(edges.length);
  }

  // --- Select dropdowns ---
  function updateSelects() {
    const fromVal = edgeFrom.value;
    const toVal = edgeTo.value;

    edgeFrom.innerHTML = '<option value="">--</option>';
    edgeTo.innerHTML = '<option value="">--</option>';

    for (let i = 0; i < nodes.length; i++) {
      const opt1 = document.createElement("option");
      opt1.value = nodes[i];
      opt1.textContent = nodes[i];
      edgeFrom.appendChild(opt1);

      const opt2 = document.createElement("option");
      opt2.value = nodes[i];
      opt2.textContent = nodes[i];
      edgeTo.appendChild(opt2);
    }

    if (fromVal && nodes.indexOf(fromVal) >= 0) edgeFrom.value = fromVal;
    if (toVal && nodes.indexOf(toVal) >= 0) edgeTo.value = toVal;
  }

  // --- Node layout (force-directed simple) ---
  function computeLayout() {
    if (nodes.length === 0) {
      nodePositions = {};
      return;
    }

    const svgRect = svg.getBoundingClientRect();
    const w = svgRect.width || 600;
    const h = svgRect.height || 400;
    const padding = 40;
    const radius = 22;

    // Use topological layers for layout if possible
    const inDeg = {};
    const adj = {};
    for (let i = 0; i < nodes.length; i++) {
      inDeg[nodes[i]] = 0;
      adj[nodes[i]] = [];
    }
    for (let i = 0; i < edges.length; i++) {
      adj[edges[i].from].push(edges[i].to);
      inDeg[edges[i].to]++;
    }

    // BFS layering (longest path from sources)
    const layer = {};
    const queue = [];
    for (let i = 0; i < nodes.length; i++) {
      if (inDeg[nodes[i]] === 0) {
        queue.push(nodes[i]);
        layer[nodes[i]] = 0;
      }
    }

    let maxLayer = 0;
    let qi = 0;
    while (qi < queue.length) {
      const n = queue[qi++];
      const neighbors = adj[n] || [];
      for (let j = 0; j < neighbors.length; j++) {
        const nb = neighbors[j];
        const nl = (layer[n] || 0) + 1;
        if (layer[nb] === undefined || nl > layer[nb]) {
          layer[nb] = nl;
        }
        if (nl > maxLayer) maxLayer = nl;
        // Only enqueue once all in-edges are visited (approximate)
        inDeg[nb]--;
        if (inDeg[nb] === 0) {
          queue.push(nb);
        }
      }
    }

    // Assign unvisited nodes (cycle members) to a final layer
    for (let i = 0; i < nodes.length; i++) {
      if (layer[nodes[i]] === undefined) {
        layer[nodes[i]] = maxLayer + 1;
      }
    }
    if (maxLayer < (layer[nodes[nodes.length - 1]] || 0)) {
      maxLayer = layer[nodes[nodes.length - 1]] || 0;
    }
    // Recompute maxLayer
    maxLayer = 0;
    for (let i = 0; i < nodes.length; i++) {
      if (layer[nodes[i]] > maxLayer) maxLayer = layer[nodes[i]];
    }

    // Group nodes by layer
    const layers = {};
    for (let i = 0; i < nodes.length; i++) {
      const l = layer[nodes[i]];
      if (!layers[l]) layers[l] = [];
      layers[l].push(nodes[i]);
    }

    const numLayers = maxLayer + 1;
    const layerWidth = (w - 2 * padding) / Math.max(numLayers, 1);

    nodePositions = {};
    for (let l = 0; l <= maxLayer; l++) {
      const nodesInLayer = layers[l] || [];
      const layerHeight = (h - 2 * padding) / Math.max(nodesInLayer.length, 1);
      for (let j = 0; j < nodesInLayer.length; j++) {
        nodePositions[nodesInLayer[j]] = {
          x: padding + radius + l * layerWidth,
          y: padding + radius + j * layerHeight,
        };
      }
    }
  }

  // --- SVG Rendering ---
  const SVG_NS = "http://www.w3.org/2000/svg";

  function createSvgElement(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const k in attrs) {
      if (attrs.hasOwnProperty(k)) {
        el.setAttribute(k, attrs[k]);
      }
    }
    return el;
  }

  function renderGraph(snapshot) {
    // Clear SVG
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    // Arrow marker definition
    const defs = createSvgElement("defs", {});
    const marker = createSvgElement("marker", {
      id: "topo-arrowhead",
      markerWidth: "10",
      markerHeight: "7",
      refX: "10",
      refY: "3.5",
      orient: "auto",
    });
    const polygon = createSvgElement("polygon", {
      points: "0 0, 10 3.5, 0 7",
      fill: "#30363d",
    });
    marker.appendChild(polygon);
    defs.appendChild(marker);
    svg.appendChild(defs);

    if (nodes.length === 0) return;

    const radius = 22;

    // Determine node states from snapshot
    const nodeState = {};
    for (let i = 0; i < nodes.length; i++) {
      nodeState[nodes[i]] = "default";
    }

    if (snapshot) {
      // Completed nodes (in order)
      for (let i = 0; i < snapshot.order.length; i++) {
        nodeState[snapshot.order[i]] = "completed";
      }
      // Queued nodes
      for (let i = 0; i < snapshot.queue.length; i++) {
        nodeState[snapshot.queue[i]] = "queued";
      }
      // Currently processing node
      if (snapshot.currentNode) {
        nodeState[snapshot.currentNode] = "processing";
      }
      // Cycle nodes (from final result)
      if (snapshot.action === "cycle-detected" && currentStep === snapshots.length - 1) {
        const result = TopoSortAlgorithm.run({ nodes, edges });
        for (let i = 0; i < result.cycleNodes.length; i++) {
          nodeState[result.cycleNodes[i]] = "cycle";
        }
      }
    }

    // Draw edges
    for (let i = 0; i < edges.length; i++) {
      const from = nodePositions[edges[i].from];
      const to = nodePositions[edges[i].to];
      if (!from || !to) continue;

      // Shorten line to stop at node radius
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1) continue;

      const startX = from.x + (dx / dist) * radius;
      const startY = from.y + (dy / dist) * radius;
      const endX = to.x - (dx / dist) * (radius + 8);
      const endY = to.y - (dy / dist) * (radius + 8);

      let edgeClass = "topo-edge";
      if (snapshot && snapshot.currentNode === edges[i].from) {
        edgeClass += " topo-edge-active";
      }
      if (snapshot && nodeState[edges[i].from] === "completed" && nodeState[edges[i].to] === "completed") {
        edgeClass += " topo-edge-completed";
      }

      const line = createSvgElement("line", {
        x1: String(startX),
        y1: String(startY),
        x2: String(endX),
        y2: String(endY),
        class: edgeClass,
      });
      svg.appendChild(line);
    }

    // Draw nodes
    for (let i = 0; i < nodes.length; i++) {
      const pos = nodePositions[nodes[i]];
      if (!pos) continue;

      const state = nodeState[nodes[i]];
      const circle = createSvgElement("circle", {
        cx: String(pos.x),
        cy: String(pos.y),
        r: String(radius),
        class: "topo-node topo-node-" + state,
      });
      svg.appendChild(circle);

      // Node label
      const label = createSvgElement("text", {
        x: String(pos.x),
        y: String(pos.y),
        class: "topo-node-label",
      });
      label.textContent = nodes[i];
      svg.appendChild(label);

      // In-degree badge
      if (snapshot && snapshot.inDegrees && snapshot.inDegrees[nodes[i]] !== undefined) {
        const deg = snapshot.inDegrees[nodes[i]];
        const badge = createSvgElement("text", {
          x: String(pos.x),
          y: String(pos.y - radius - 6),
          class: "topo-node-degree",
        });
        badge.textContent = String(deg);
        svg.appendChild(badge);
      }
    }
  }

  // --- Side panels ---
  function renderInDegrees(snapshot) {
    indegreesEl.innerHTML = "";
    if (!snapshot || !snapshot.inDegrees) return;

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const deg = snapshot.inDegrees[n];
      if (deg === undefined) continue;

      const item = document.createElement("div");
      item.className = "topo-indegree-item";

      const inOrder = snapshot.order.indexOf(n) >= 0;
      const isCycle = snapshot.action === "cycle-detected" && !inOrder && deg > 0;

      if (isCycle) {
        item.classList.add("topo-degree-cycle");
      } else if (inOrder) {
        item.classList.add("topo-degree-done");
      } else if (deg === 0) {
        item.classList.add("topo-degree-zero");
      }

      const nameSpan = document.createElement("span");
      nameSpan.className = "topo-indegree-name";
      nameSpan.textContent = n;

      const valSpan = document.createElement("span");
      valSpan.className = "topo-indegree-value";
      valSpan.textContent = inOrder ? "\u2713" : String(deg);

      item.appendChild(nameSpan);
      item.appendChild(valSpan);
      indegreesEl.appendChild(item);
    }
  }

  function renderQueue(snapshot) {
    queueEl.innerHTML = "";
    if (!snapshot) return;

    for (let i = 0; i < snapshot.queue.length; i++) {
      const item = document.createElement("span");
      item.className = "topo-queue-item";
      item.textContent = snapshot.queue[i];
      queueEl.appendChild(item);
    }
  }

  function renderOrder(snapshot) {
    orderEl.innerHTML = "";
    if (!snapshot) return;

    for (let i = 0; i < snapshot.order.length; i++) {
      const item = document.createElement("span");
      item.className = "topo-order-item";
      item.textContent = snapshot.order[i];
      orderEl.appendChild(item);
    }
  }

  // --- Render full state at current step ---
  function renderCurrentStep() {
    const snapshot = currentStep >= 0 && currentStep < snapshots.length ? snapshots[currentStep] : null;
    renderGraph(snapshot);
    renderInDegrees(snapshot);
    renderQueue(snapshot);
    renderOrder(snapshot);

    if (snapshot) {
      let actionText = "";
      switch (snapshot.action) {
        case "init":
          actionText = "Initialized: enqueued nodes with in-degree 0.";
          break;
        case "dequeue":
          actionText = "Dequeued " + snapshot.currentNode + " — added to sorted order.";
          break;
        case "update-neighbors":
          actionText = "Updated neighbors of " + snapshot.currentNode + " — decremented in-degrees.";
          break;
        case "cycle-detected":
          actionText = "Cycle detected! Remaining nodes cannot be sorted.";
          break;
        default:
          actionText = "Step " + (currentStep + 1);
      }
      infoEl.textContent = actionText;
    }
    updateStats();
  }

  // --- Playback controls ---
  function stopPlayback() {
    playing = false;
    if (playTimer !== null) {
      clearTimeout(playTimer);
      playTimer = null;
    }
    btnPlay.disabled = false;
    btnPause.disabled = true;
  }

  function stepForward() {
    if (currentStep < snapshots.length - 1) {
      currentStep++;
      explicitStepCount = currentStep + 1;
      renderCurrentStep();
    }
    if (currentStep >= snapshots.length - 1) {
      stopPlayback();
    }
  }

  function stepBack() {
    if (currentStep > 0) {
      currentStep--;
      explicitStepCount = currentStep + 1;
      renderCurrentStep();
    }
  }

  function play() {
    if (currentStep >= snapshots.length - 1) return;
    playing = true;
    btnPlay.disabled = true;
    btnPause.disabled = false;

    function tick() {
      if (!playing) return;
      stepForward();
      if (playing && currentStep < snapshots.length - 1) {
        playTimer = setTimeout(tick, getDelay());
      } else {
        stopPlayback();
      }
    }
    tick();
  }

  // --- Add node ---
  function addNode() {
    const name = nodeInput.value.trim();
    if (!name) {
      showError("Please enter a node name.");
      return;
    }
    if (name.length > 12) {
      showError("Node name must be 12 characters or less.");
      return;
    }
    if (nodes.indexOf(name) >= 0) {
      showError("Node '" + name + "' already exists.");
      return;
    }
    if (nodes.length >= TopoSortAlgorithm.MAX_NODES) {
      showError("Maximum " + TopoSortAlgorithm.MAX_NODES + " nodes allowed.");
      return;
    }
    clearError();
    nodes.push(name);
    nodeInput.value = "";
    updateSelects();
    computeLayout();
    renderGraph(null);
    updateStats();
    infoEl.textContent = "Added node '" + name + "'. Total: " + nodes.length + " nodes.";
  }

  // --- Add edge ---
  function addEdge() {
    const from = edgeFrom.value;
    const to = edgeTo.value;
    if (!from || !to) {
      showError("Select both 'from' and 'to' nodes.");
      return;
    }
    // Check duplicate
    for (let i = 0; i < edges.length; i++) {
      if (edges[i].from === from && edges[i].to === to) {
        showError("Edge " + from + " \u2192 " + to + " already exists.");
        return;
      }
    }
    clearError();
    edges.push({ from, to });
    computeLayout();
    renderGraph(null);
    updateStats();
    infoEl.textContent = "Added edge " + from + " \u2192 " + to + ". Total: " + edges.length + " edges.";
  }

  // --- Load preset ---
  function loadPreset() {
    const key = presetSelect.value;
    if (!key) return;

    const preset = TopoSortAlgorithm.presets[key];
    if (!preset) return;

    nodes = preset.nodes.slice();
    edges = preset.edges.map(function (e) { return { from: e.from, to: e.to }; });
    snapshots = [];
    currentStep = -1;
    explicitStepCount = 0;
    stopPlayback();
    playbackEl.classList.add("hidden");

    updateSelects();
    computeLayout();
    renderGraph(null);
    updateStats();
    infoEl.textContent = "Loaded preset: " + preset.name + " (" + nodes.length + " nodes, " + edges.length + " edges).";
  }

  // --- Run algorithm ---
  function runAlgorithm() {
    if (nodes.length === 0) {
      showError("Add at least one node before running.");
      return;
    }
    clearError();

    const result = TopoSortAlgorithm.run({ nodes, edges });
    snapshots = result.snapshots;
    currentStep = -1;
    explicitStepCount = 0;

    if (snapshots.length === 0) {
      infoEl.textContent = "No steps to visualize.";
      return;
    }

    playbackEl.classList.remove("hidden");
    currentStep = 0;
    explicitStepCount = 1;
    renderCurrentStep();

    if (result.hasCycle) {
      infoEl.textContent = "Cycle detected! " + result.cycleNodes.length + " node(s) are stuck. Use step controls to see the algorithm progress.";
    } else {
      infoEl.textContent = "Algorithm ready. Order: " + result.order.join(" \u2192 ") + ". Use controls to step through.";
    }
  }

  // --- Reset (back to step 0) ---
  function reset() {
    stopPlayback();
    currentStep = -1;
    explicitStepCount = 0;
    playbackEl.classList.add("hidden");
    renderGraph(null);
    indegreesEl.innerHTML = "";
    queueEl.innerHTML = "";
    orderEl.innerHTML = "";
    updateStats();
    infoEl.textContent = "Reset. Press 'Run Kahn\u2019s' to visualize again.";
  }

  // --- Clear graph ---
  function clearGraph() {
    stopPlayback();
    nodes = [];
    edges = [];
    snapshots = [];
    currentStep = -1;
    explicitStepCount = 0;
    nodePositions = {};
    presetSelect.value = "";

    updateSelects();
    renderGraph(null);
    indegreesEl.innerHTML = "";
    queueEl.innerHTML = "";
    orderEl.innerHTML = "";
    updateStats();
    playbackEl.classList.add("hidden");
    infoEl.textContent = "Graph cleared. Add nodes and edges to start.";
  }

  // --- Event listeners ---
  btnAddNode.addEventListener("click", addNode);
  nodeInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") addNode();
  });
  btnAddEdge.addEventListener("click", addEdge);
  presetSelect.addEventListener("change", loadPreset);
  btnRun.addEventListener("click", runAlgorithm);
  btnReset.addEventListener("click", reset);
  btnClear.addEventListener("click", clearGraph);
  btnStepBack.addEventListener("click", stepBack);
  btnPlay.addEventListener("click", play);
  btnPause.addEventListener("click", stopPlayback);
  btnStep.addEventListener("click", stepForward);

  // --- Cleanup on page unload ---
  window.addEventListener("beforeunload", function () {
    stopPlayback();
  });

  // --- Initial render ---
  computeLayout();
  renderGraph(null);
  updateStats();
})();
