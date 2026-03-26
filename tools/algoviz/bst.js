(() => {
  "use strict";

  // --- DOM refs ---
  const valueInput = document.getElementById("valueInput");
  const bulkInput = document.getElementById("bulkInput");
  const sizeInput = document.getElementById("sizeInput");
  const btnInsert = document.getElementById("btnInsert");
  const btnBulk = document.getElementById("btnBulk");
  const btnRandom = document.getElementById("btnRandom");
  const btnClear = document.getElementById("btnClear");
  const traversalType = document.getElementById("traversalType");
  const btnTraverse = document.getElementById("btnTraverse");
  const playbackDiv = document.getElementById("playback");
  const btnReset = document.getElementById("btnReset");
  const btnStepBack = document.getElementById("btnStepBack");
  const btnPlay = document.getElementById("btnPlay");
  const btnPause = document.getElementById("btnPause");
  const btnStep = document.getElementById("btnStep");
  const speedSlider = document.getElementById("speed");
  const infoEl = document.getElementById("info");
  const resultEl = document.getElementById("result");
  const treeSvg = document.getElementById("treeSvg");
  const nodesStat = document.getElementById("nodesStat");
  const stepStat = document.getElementById("stepStat");
  const visitedStat = document.getElementById("visitedStat");

  // --- State ---
  let tree = BSTAlgorithm.createTree();
  let traversalResult = null;
  let steps = [];
  let stepIdx = -1;
  let timer = null;
  let isPlaying = false;

  const NODE_RADIUS = 18;
  const SVG_WIDTH = 600;
  const SVG_HEIGHT = 400;
  const VERTICAL_SPACING = 60;

  // --- Render the tree to SVG ---
  function renderTree(visitedValues, currentNode) {
    visitedValues = visitedValues || [];
    currentNode = currentNode === undefined ? null : currentNode;

    treeSvg.innerHTML = "";

    const layout = BSTAlgorithm.getLayout(tree, SVG_WIDTH, VERTICAL_SPACING);
    if (layout.nodes.length === 0) return;

    // Draw edges first (behind nodes)
    for (let i = 0; i < layout.edges.length; i++) {
      const e = layout.edges[i];
      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line",
      );
      line.setAttribute("x1", e.fromX);
      line.setAttribute("y1", e.fromY);
      line.setAttribute("x2", e.toX);
      line.setAttribute("y2", e.toY);
      line.setAttribute("class", "bst-edge");
      treeSvg.appendChild(line);
    }

    // Draw nodes
    for (let i = 0; i < layout.nodes.length; i++) {
      const n = layout.nodes[i];
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

      // Determine state
      const isCurrentNode = n.value === currentNode;
      const visitIndex = visitedValues.indexOf(n.value);
      const isVisited = visitIndex >= 0 && !isCurrentNode;

      if (isCurrentNode) {
        g.setAttribute("class", "bst-node bst-node-current");
      } else if (isVisited) {
        g.setAttribute("class", "bst-node bst-node-visited");
      } else {
        g.setAttribute("class", "bst-node");
      }

      // Circle
      const circle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle",
      );
      circle.setAttribute("cx", n.x);
      circle.setAttribute("cy", n.y);
      circle.setAttribute("r", NODE_RADIUS);
      circle.setAttribute("class", "bst-node-circle");
      g.appendChild(circle);

      // Value label
      const label = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text",
      );
      label.setAttribute("x", n.x);
      label.setAttribute("y", n.y);
      label.setAttribute("class", "bst-node-label");
      label.textContent = n.value;
      g.appendChild(label);

      // Visit order badge (shown for visited and current nodes)
      if (isVisited || isCurrentNode) {
        const badgeIdx = isCurrentNode
          ? visitedValues.length
          : visitIndex + 1;
        const badge = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text",
        );
        badge.setAttribute("x", n.x + NODE_RADIUS - 2);
        badge.setAttribute("y", n.y - NODE_RADIUS + 2);
        badge.setAttribute("class", "bst-node-badge");
        badge.textContent = badgeIdx;
        g.appendChild(badge);
      }

      treeSvg.appendChild(g);
    }

    // Adjust SVG height based on tree depth
    const maxY = Math.max.apply(
      null,
      layout.nodes.map((n) => n.y),
    );
    treeSvg.setAttribute("height", Math.max(SVG_HEIGHT, maxY + 50));
  }

  // --- Update stats ---
  function updateStats() {
    nodesStat.textContent = BSTAlgorithm.size(tree);

    if (stepIdx < 0 || !traversalResult) {
      stepStat.textContent = "0 / " + steps.length;
      visitedStat.textContent = "0";
      return;
    }

    const step = steps[stepIdx];
    stepStat.textContent = stepIdx + 1 + " / " + steps.length;
    visitedStat.textContent = step.visitedValues.length;
  }

  // --- Update info ---
  function updateInfo() {
    if (BSTAlgorithm.size(tree) === 0) {
      infoEl.innerHTML =
        "Insert values to build a BST, then choose a traversal type.";
      return;
    }
    if (stepIdx < 0) {
      infoEl.innerHTML =
        'Click <strong>Play</strong> or <strong>Step &rarr;</strong> to start the traversal.';
      return;
    }
    const step = steps[stepIdx];
    infoEl.textContent = step.explanation;
  }

  // --- Playback controls ---
  function getDelay() {
    const spd = parseInt(speedSlider.value, 10);
    return Math.round(800 / spd);
  }

  function updateButtons() {
    const hasTraversal = traversalResult !== null;
    const atEnd = stepIdx >= steps.length - 1;
    const atStart = stepIdx < 0;

    btnPlay.disabled = isPlaying || !hasTraversal;
    btnPause.disabled = !isPlaying;
    btnStep.disabled = isPlaying || atEnd || !hasTraversal;
    btnStepBack.disabled = isPlaying || atStart;
    btnReset.disabled = isPlaying;
  }

  function stepForward() {
    if (stepIdx >= steps.length - 1) {
      stopPlay();
      showResult();
      return;
    }

    stepIdx++;
    const step = steps[stepIdx];

    // Build list of previously visited values (before current)
    const prevVisited =
      step.visitedNode !== null
        ? step.visitedValues.slice(0, -1)
        : step.visitedValues;

    renderTree(prevVisited, step.currentNode);
    updateStats();
    updateInfo();
    updateButtons();

    if (stepIdx === steps.length - 1) {
      setTimeout(() => {
        showResult();
        stopPlay();
        updateButtons();
      }, getDelay());
    }
  }

  function stepBackward() {
    if (stepIdx < 0) return;

    stepIdx--;

    if (stepIdx < 0) {
      renderTree([], null);
    } else {
      const step = steps[stepIdx];
      const prevVisited =
        step.visitedNode !== null
          ? step.visitedValues.slice(0, -1)
          : step.visitedValues;
      renderTree(prevVisited, step.currentNode);
    }

    resultEl.classList.add("hidden");
    updateStats();
    updateInfo();
    updateButtons();
  }

  function startPlay() {
    if (stepIdx >= steps.length - 1) {
      resetTraversal();
    }
    isPlaying = true;
    updateButtons();
    tick();
  }

  function tick() {
    if (!isPlaying) return;
    if (stepIdx >= steps.length - 1) {
      stopPlay();
      return;
    }
    stepForward();
    if (stepIdx < steps.length - 1) {
      timer = setTimeout(tick, getDelay());
    }
  }

  function stopPlay() {
    isPlaying = false;
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    updateButtons();
  }

  function resetTraversal() {
    stopPlay();
    stepIdx = -1;
    renderTree([], null);
    resultEl.classList.add("hidden");
    updateStats();
    updateInfo();
    updateButtons();
  }

  function showResult() {
    if (!traversalResult) return;
    resultEl.textContent =
      "Traversal complete! Order: [" +
      traversalResult.result.join(", ") +
      "]";
    resultEl.classList.remove("hidden");
    // Show final state with all nodes visited
    renderTree(traversalResult.result, null);
  }

  // --- Insert a value ---
  function insertValue() {
    const val = parseInt(valueInput.value, 10);
    if (isNaN(val)) {
      infoEl.textContent = "Error: Enter a valid number.";
      return;
    }
    BSTAlgorithm.insert(tree, val);
    traversalResult = null;
    steps = [];
    stepIdx = -1;
    playbackDiv.classList.add("hidden");
    resultEl.classList.add("hidden");
    renderTree([], null);
    updateStats();
    infoEl.textContent = "Inserted " + val + ". Tree has " + BSTAlgorithm.size(tree) + " node(s).";
    valueInput.value = "";
    valueInput.focus();
  }

  // --- Bulk insert ---
  function bulkInsertValues() {
    const raw = bulkInput.value.trim();
    if (raw.length === 0) {
      infoEl.textContent = "Error: Enter comma-separated values.";
      return;
    }
    const values = raw
      .split(/[,\s]+/)
      .map(Number)
      .filter((n) => !isNaN(n) && isFinite(n));
    if (values.length === 0) {
      infoEl.textContent = "Error: No valid numbers found.";
      return;
    }
    BSTAlgorithm.bulkInsert(tree, values);
    traversalResult = null;
    steps = [];
    stepIdx = -1;
    playbackDiv.classList.add("hidden");
    resultEl.classList.add("hidden");
    renderTree([], null);
    updateStats();
    infoEl.textContent =
      "Inserted " + values.length + " value(s). Tree has " + BSTAlgorithm.size(tree) + " node(s).";
    bulkInput.value = "";
  }

  // --- Generate random tree ---
  function generateRandom() {
    const size = Math.max(1, Math.min(31, parseInt(sizeInput.value, 10) || 7));
    tree = BSTAlgorithm.createTree();
    const values = [];
    for (let i = 0; i < size; i++) {
      values.push(Math.floor(Math.random() * 99) + 1);
    }
    BSTAlgorithm.bulkInsert(tree, values);
    traversalResult = null;
    steps = [];
    stepIdx = -1;
    playbackDiv.classList.add("hidden");
    resultEl.classList.add("hidden");
    renderTree([], null);
    updateStats();
    infoEl.textContent =
      "Random tree with " + size + " node(s): [" + values.join(", ") + "]";
  }

  // --- Clear tree ---
  function clearTree() {
    stopPlay();
    tree = BSTAlgorithm.createTree();
    traversalResult = null;
    steps = [];
    stepIdx = -1;
    playbackDiv.classList.add("hidden");
    resultEl.classList.add("hidden");
    renderTree([], null);
    updateStats();
    updateInfo();
  }

  // --- Start traversal ---
  function startTraversal() {
    if (BSTAlgorithm.size(tree) === 0) {
      infoEl.textContent = "Error: Insert some values first.";
      return;
    }

    stopPlay();
    const type = traversalType.value;

    if (type === "inorder") {
      traversalResult = BSTAlgorithm.inorder(tree);
    } else if (type === "preorder") {
      traversalResult = BSTAlgorithm.preorder(tree);
    } else {
      traversalResult = BSTAlgorithm.postorder(tree);
    }

    steps = traversalResult.steps;
    stepIdx = -1;

    renderTree([], null);
    playbackDiv.classList.remove("hidden");
    resultEl.classList.add("hidden");
    updateStats();
    updateInfo();
    updateButtons();
  }

  // --- Event listeners ---
  btnInsert.addEventListener("click", insertValue);
  btnBulk.addEventListener("click", bulkInsertValues);
  btnRandom.addEventListener("click", generateRandom);
  btnClear.addEventListener("click", clearTree);
  btnTraverse.addEventListener("click", startTraversal);
  btnPlay.addEventListener("click", startPlay);
  btnPause.addEventListener("click", stopPlay);
  btnStep.addEventListener("click", () => {
    stopPlay();
    stepForward();
  });
  btnStepBack.addEventListener("click", () => {
    stopPlay();
    stepBackward();
  });
  btnReset.addEventListener("click", resetTraversal);

  speedSlider.addEventListener("input", () => {
    if (isPlaying) {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      timer = setTimeout(tick, getDelay());
    }
  });

  // Enter key triggers insert
  valueInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") insertValue();
  });
  bulkInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") bulkInsertValues();
  });

  // Auto-init with sample tree
  BSTAlgorithm.bulkInsert(tree, [5, 3, 7, 1, 4, 6, 8]);
  renderTree([], null);
  updateStats();
  infoEl.textContent =
    "Sample tree loaded: [5, 3, 7, 1, 4, 6, 8]. Choose a traversal type and click Traverse.";
})();
