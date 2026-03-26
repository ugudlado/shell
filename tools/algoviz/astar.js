/* A* Pathfinding Visualization — AlgoViz */
(() => {
  "use strict";

  // --- State ---
  let gridSize = 10;
  let walls = new Set(); // "r,c" keys
  let startPos = [1, 1];
  let endPos = null;
  let mode = "WALL"; // WALL | START | END
  let heuristic = "manhattan";
  let snapshots = [];
  let bfsSnapshots = [];
  let currentStep = -1;
  let playing = false;
  let playTimer = null;
  let isDragging = false;
  let compareMode = false;
  let astarResult = null;
  let bfsResult = null;

  // Explicit state counters (not derived from array.length)
  let explicitStepCount = 0;
  let explicitOpenSize = 0;
  let explicitClosedSize = 0;
  let explicitBfsExplored = 0;

  // --- DOM refs ---
  const mainContainer = document.getElementById("astar-main-container");
  const infoEl = document.getElementById("astar-info");
  const playbackEl = document.getElementById("astar-playback");
  const speedSlider = document.getElementById("astar-speed");
  const gridSizeSelect = document.getElementById("astar-gridSize");

  const btnModeWall = document.getElementById("astar-btnModeWall");
  const btnModeStart = document.getElementById("astar-btnModeStart");
  const btnModeEnd = document.getElementById("astar-btnModeEnd");
  const btnClearWalls = document.getElementById("astar-btnClearWalls");
  const btnClearAll = document.getElementById("astar-btnClearAll");
  const btnRun = document.getElementById("astar-btnRun");
  const btnCompare = document.getElementById("astar-btnCompare");
  const btnReset = document.getElementById("astar-btnReset");
  const btnStepBack = document.getElementById("astar-btnStepBack");
  const btnPlay = document.getElementById("astar-btnPlay");
  const btnPause = document.getElementById("astar-btnPause");
  const btnStep = document.getElementById("astar-btnStep");
  const btnManhattan = document.getElementById("astar-btnManhattan");
  const btnEuclidean = document.getElementById("astar-btnEuclidean");

  // --- Helpers ---
  function k(r, c) {
    return r + "," + c;
  }
  function getDelay() {
    return 600 - (speedSlider.value - 1) * 55;
  }

  // --- Build params for algorithm ---
  function buildParams() {
    const wallArr = [];
    walls.forEach((wk) => {
      const parts = wk.split(",");
      wallArr.push([parseInt(parts[0], 10), parseInt(parts[1], 10)]);
    });
    return {
      grid: { rows: gridSize, cols: gridSize, walls: wallArr },
      start: startPos ? [startPos[0], startPos[1]] : [0, 0],
      end: endPos ? [endPos[0], endPos[1]] : [gridSize - 1, gridSize - 1],
      heuristic: heuristic,
    };
  }

  // --- Grid Init ---
  function initGrid() {
    stopPlayback();
    snapshots = [];
    bfsSnapshots = [];
    currentStep = -1;
    astarResult = null;
    bfsResult = null;
    compareMode = false;
    playbackEl.style.display = "none";
    explicitStepCount = 0;
    explicitOpenSize = 0;
    explicitClosedSize = 0;
    explicitBfsExplored = 0;

    walls = new Set();
    startPos = [1, 1];
    endPos = [gridSize - 2, gridSize - 2];
    if (gridSize < 3) {
      startPos = [0, 0];
      endPos = [gridSize - 1, gridSize - 1];
    }

    renderLayout();
    updateInfo(
      "Click cells to place walls, set start & end points, then click Run A*."
    );
  }

  // --- Render layout (single or comparison) ---
  function renderLayout() {
    mainContainer.textContent = "";

    if (compareMode && astarResult && bfsResult) {
      renderComparisonLayout();
    } else {
      renderSingleLayout();
    }
  }

  function renderSingleLayout() {
    const layout = document.createElement("div");
    layout.className = "astar-layout";

    const gridEl = createGridElement("astar-grid-main", true);
    layout.appendChild(gridEl);

    const sidebar = createSidebar("astar-sidebar-main");
    layout.appendChild(sidebar);

    mainContainer.appendChild(layout);
  }

  function renderComparisonLayout() {
    const layout = document.createElement("div");
    layout.className = "astar-comparison-layout";

    // A* panel
    const astarPanel = document.createElement("div");
    astarPanel.className = "astar-panel";
    const astarTitle = document.createElement("div");
    astarTitle.className = "astar-panel-title";
    astarTitle.textContent = "A* (" + heuristic + ")";
    astarPanel.appendChild(astarTitle);

    const astarGrid = createGridElement("astar-grid-main", false);
    astarPanel.appendChild(astarGrid);

    const astarStats = document.createElement("div");
    astarStats.className = "astar-panel-stats";
    astarStats.id = "astar-panel-stats-astar";
    astarStats.textContent = "Explored: 0";
    astarPanel.appendChild(astarStats);

    layout.appendChild(astarPanel);

    // BFS panel
    const bfsPanel = document.createElement("div");
    bfsPanel.className = "astar-panel";
    const bfsTitle = document.createElement("div");
    bfsTitle.className = "astar-panel-title";
    bfsTitle.textContent = "BFS (no heuristic)";
    bfsPanel.appendChild(bfsTitle);

    const bfsGrid = createGridElement("astar-grid-bfs", false);
    bfsPanel.appendChild(bfsGrid);

    const bfsStats = document.createElement("div");
    bfsStats.className = "astar-panel-stats";
    bfsStats.id = "astar-panel-stats-bfs";
    bfsStats.textContent = "Explored: 0";
    bfsPanel.appendChild(bfsStats);

    layout.appendChild(bfsPanel);

    mainContainer.appendChild(layout);
  }

  function createGridElement(id, interactive) {
    const container = document.createElement("div");
    container.className = "astar-grid-container";
    container.id = id;
    if (gridSize >= 20) container.classList.add("astar-grid-large");
    if (gridSize === 20) container.classList.add("astar-grid-20");
    if (gridSize === 25) container.classList.add("astar-grid-25");

    container.style.gridTemplateColumns = "repeat(" + gridSize + ", 1fr)";

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const cell = document.createElement("div");
        cell.className = "astar-cell";
        cell.dataset.row = r;
        cell.dataset.col = c;

        if (startPos && r === startPos[0] && c === startPos[1]) {
          cell.classList.add("astar-cell-start");
        }
        if (endPos && r === endPos[0] && c === endPos[1]) {
          cell.classList.add("astar-cell-end");
        }
        if (walls.has(k(r, c))) {
          cell.classList.add("astar-cell-wall");
        }

        if (interactive) {
          cell.addEventListener("mousedown", (e) => {
            e.preventDefault();
            isDragging = true;
            handleCellClick(r, c);
          });
          cell.addEventListener("mouseenter", () => {
            if (isDragging && mode === "WALL") {
              handleCellClick(r, c);
            }
          });
        }

        container.appendChild(cell);
      }
    }

    return container;
  }

  function createSidebar(id) {
    const sidebar = document.createElement("div");
    sidebar.className = "astar-sidebar";
    sidebar.id = id;

    const h3 = document.createElement("h3");
    h3.textContent = "Open Set (Priority Queue)";
    sidebar.appendChild(h3);

    const openList = document.createElement("div");
    openList.className = "astar-open-list";
    openList.id = id + "-open-list";
    const emptyMsg = document.createElement("div");
    emptyMsg.className = "astar-open-empty";
    emptyMsg.textContent = "Run A* to see the open set";
    openList.appendChild(emptyMsg);
    sidebar.appendChild(openList);

    const stats = document.createElement("div");
    stats.className = "astar-stats";
    stats.id = id + "-stats";
    stats.innerHTML = "";

    const stepDiv = document.createElement("div");
    stepDiv.textContent = "Step: ";
    const stepSpan = document.createElement("span");
    stepSpan.id = id + "-stepCount";
    stepSpan.textContent = "0";
    stepDiv.appendChild(stepSpan);
    stats.appendChild(stepDiv);

    const openDiv = document.createElement("div");
    openDiv.textContent = "Open set: ";
    const openSpan = document.createElement("span");
    openSpan.id = id + "-openSize";
    openSpan.textContent = "0";
    openDiv.appendChild(openSpan);
    stats.appendChild(openDiv);

    const closedDiv = document.createElement("div");
    closedDiv.textContent = "Closed set: ";
    const closedSpan = document.createElement("span");
    closedSpan.id = id + "-closedSize";
    closedSpan.textContent = "0";
    closedDiv.appendChild(closedSpan);
    stats.appendChild(closedDiv);

    const pathDiv = document.createElement("div");
    pathDiv.textContent = "Path length: ";
    const pathSpan = document.createElement("span");
    pathSpan.id = id + "-pathLength";
    pathSpan.textContent = "-";
    pathDiv.appendChild(pathSpan);
    stats.appendChild(pathDiv);

    sidebar.appendChild(stats);

    // Cost detail
    const costDetail = document.createElement("div");
    costDetail.className = "astar-cost-detail";
    costDetail.id = id + "-cost-detail";
    const h4 = document.createElement("h4");
    h4.textContent = "Current Cell Costs";
    costDetail.appendChild(h4);
    const costRows = document.createElement("div");
    costRows.id = id + "-cost-rows";
    const emptyRow = document.createElement("div");
    emptyRow.className = "astar-cost-row";
    emptyRow.textContent = "Hover a cell to see costs";
    costRows.appendChild(emptyRow);
    costDetail.appendChild(costRows);
    sidebar.appendChild(costDetail);

    return sidebar;
  }

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });

  function handleCellClick(r, c) {
    if (snapshots.length > 0) return;

    if (mode === "WALL") {
      if (startPos && r === startPos[0] && c === startPos[1]) return;
      if (endPos && r === endPos[0] && c === endPos[1]) return;
      const wk = k(r, c);
      if (walls.has(wk)) {
        walls.delete(wk);
      } else {
        walls.add(wk);
      }
    } else if (mode === "START") {
      walls.delete(k(r, c));
      startPos = [r, c];
      if (endPos && r === endPos[0] && c === endPos[1]) {
        endPos = null;
      }
    } else if (mode === "END") {
      walls.delete(k(r, c));
      endPos = [r, c];
      if (startPos && r === startPos[0] && c === startPos[1]) {
        startPos = null;
      }
    }
    renderLayout();
  }

  // --- Run A* ---
  function runAStar() {
    if (!startPos || !endPos) {
      updateInfo(
        "Please set both a start and end point before running A*."
      );
      return;
    }

    if (startPos[0] === endPos[0] && startPos[1] === endPos[1]) {
      updateInfo("Start and end are the same cell - already there!");
      return;
    }

    const params = buildParams();
    astarResult = AStarAlgorithm.run(params);
    snapshots = astarResult.snapshots;

    if (compareMode) {
      bfsResult = AStarAlgorithm.runBFS(params);
      bfsSnapshots = bfsResult.snapshots;
    }

    currentStep = -1;
    explicitStepCount = 0;
    playbackEl.style.display = "flex";
    renderLayout();

    if (astarResult.path) {
      updateInfo(
        "A* complete — path length: " +
          astarResult.pathLength +
          " steps, explored: " +
          astarResult.explored +
          " cells. Use playback to animate."
      );
    } else {
      updateInfo("A* complete — no path found! The end is unreachable.");
    }
  }

  // --- Run comparison ---
  function runComparison() {
    compareMode = true;
    runAStar();
  }

  // --- Render snapshot ---
  function renderSnapshot(stepIdx) {
    if (stepIdx < 0 || stepIdx >= snapshots.length) return;

    const snap = snapshots[stepIdx];
    renderSnapshotOnGrid("astar-grid-main", snap, astarResult);

    // Update explicit state counters
    explicitStepCount = stepIdx + 1;
    explicitOpenSize = snap.openSet.length;
    explicitClosedSize = snap.closedSet.length;

    // Update stats
    updateStats(
      "astar-sidebar-main",
      explicitStepCount,
      explicitOpenSize,
      explicitClosedSize,
      astarResult
    );

    // Update open set list
    renderOpenSetList("astar-sidebar-main-open-list", snap);

    // Comparison mode: render BFS
    if (compareMode && bfsSnapshots.length > 0) {
      const bfsIdx = Math.min(stepIdx, bfsSnapshots.length - 1);
      const bfsSnap = bfsSnapshots[bfsIdx];
      renderSnapshotOnGrid("astar-grid-bfs", bfsSnap, bfsResult);
      explicitBfsExplored = bfsSnap.closedSet.length;

      const astarStatsEl = document.getElementById(
        "astar-panel-stats-astar"
      );
      const bfsStatsEl = document.getElementById("astar-panel-stats-bfs");
      if (astarStatsEl) {
        astarStatsEl.textContent =
          "Explored: " + explicitClosedSize + " cells";
      }
      if (bfsStatsEl) {
        bfsStatsEl.textContent =
          "Explored: " + explicitBfsExplored + " cells";
      }
    }

    // Info
    if (
      stepIdx === snapshots.length - 1 &&
      astarResult &&
      astarResult.path
    ) {
      updateInfo(
        "Path found! Length: " +
          astarResult.pathLength +
          " steps. A* explored " +
          astarResult.explored +
          " cells." +
          (compareMode && bfsResult
            ? " BFS explored " + bfsResult.explored + " cells."
            : "")
      );
    } else {
      updateInfo(
        "Step " +
          explicitStepCount +
          "/" +
          snapshots.length +
          ": expanding (" +
          snap.current[0] +
          "," +
          snap.current[1] +
          ")..."
      );
    }
  }

  function renderSnapshotOnGrid(gridId, snap, result) {
    const gridEl = document.getElementById(gridId);
    if (!gridEl) return;

    const openKeys = new Set();
    for (let i = 0; i < snap.openSet.length; i++) {
      openKeys.add(k(snap.openSet[i][0], snap.openSet[i][1]));
    }
    const closedKeys = new Set();
    for (let i = 0; i < snap.closedSet.length; i++) {
      closedKeys.add(k(snap.closedSet[i][0], snap.closedSet[i][1]));
    }
    const currentKey = k(snap.current[0], snap.current[1]);

    const pathKeys = new Set();
    if (
      result &&
      result.path &&
      currentStep === snapshots.length - 1
    ) {
      for (let i = 0; i < result.path.length; i++) {
        pathKeys.add(k(result.path[i][0], result.path[i][1]));
      }
    }

    const showCosts = gridSize <= 15;
    const cells = gridEl.querySelectorAll(".astar-cell");
    cells.forEach((cell) => {
      const r = parseInt(cell.dataset.row, 10);
      const c = parseInt(cell.dataset.col, 10);
      const ck = k(r, c);

      // Remove state classes
      cell.classList.remove(
        "astar-cell-open",
        "astar-cell-closed",
        "astar-cell-current",
        "astar-cell-path"
      );

      // Remove old cost labels
      while (cell.firstChild) {
        cell.removeChild(cell.firstChild);
      }

      // Apply state
      if (pathKeys.has(ck)) {
        cell.classList.add("astar-cell-path");
      } else if (ck === currentKey) {
        cell.classList.add("astar-cell-current");
      } else if (closedKeys.has(ck)) {
        cell.classList.add("astar-cell-closed");
      } else if (openKeys.has(ck)) {
        cell.classList.add("astar-cell-open");
      }

      // Cost annotations
      if (showCosts && snap.costs[ck]) {
        const costLabel = document.createElement("span");
        costLabel.className = "astar-cost-label astar-cost-label-f";
        costLabel.textContent = Math.round(snap.costs[ck].f);
        cell.appendChild(costLabel);
      }

      // Hover for cost detail
      cell.onmouseenter = function () {
        showCostDetail(gridId, snap.costs, r, c);
      };
    });
  }

  function showCostDetail(gridId, costs, r, c) {
    const sidebarId =
      gridId === "astar-grid-main"
        ? "astar-sidebar-main"
        : "astar-sidebar-main";
    const costRows = document.getElementById(sidebarId + "-cost-rows");
    if (!costRows) return;

    costRows.textContent = "";
    const ck = k(r, c);
    if (costs && costs[ck]) {
      const info = costs[ck];
      const lines = [
        "Cell: (" + r + "," + c + ")",
        "g(n) = " + info.g,
        "h(n) = " + (Math.round(info.h * 100) / 100),
        "f(n) = " + (Math.round(info.f * 100) / 100),
      ];
      lines.forEach((line) => {
        const row = document.createElement("div");
        row.className = "astar-cost-row";
        row.textContent = line;
        costRows.appendChild(row);
      });
    } else {
      const row = document.createElement("div");
      row.className = "astar-cost-row";
      row.textContent = "Cell (" + r + "," + c + "): not evaluated";
      costRows.appendChild(row);
    }
  }

  function renderOpenSetList(listId, snap) {
    const listEl = document.getElementById(listId);
    if (!listEl) return;

    listEl.textContent = "";

    if (snap.openSet.length === 0) {
      const empty = document.createElement("div");
      empty.className = "astar-open-empty";
      empty.textContent = "Open set is empty";
      listEl.appendChild(empty);
      return;
    }

    // Sort by f-cost if available
    const items = snap.openSet.slice(0, 30);
    items.forEach((coord) => {
      const item = document.createElement("div");
      item.className = "astar-open-item";
      const ck = k(coord[0], coord[1]);
      const cost = snap.costs[ck];
      if (cost) {
        item.textContent =
          "(" +
          coord[0] +
          "," +
          coord[1] +
          ") f=" +
          Math.round(cost.f);
      } else {
        item.textContent = "(" + coord[0] + "," + coord[1] + ")";
      }
      listEl.appendChild(item);
    });

    if (snap.openSet.length > 30) {
      const more = document.createElement("div");
      more.className = "astar-open-empty";
      more.textContent = "... and " + (snap.openSet.length - 30) + " more";
      listEl.appendChild(more);
    }
  }

  function updateStats(sidebarId, step, openSize, closedSize, result) {
    const stepEl = document.getElementById(sidebarId + "-stepCount");
    const openEl = document.getElementById(sidebarId + "-openSize");
    const closedEl = document.getElementById(sidebarId + "-closedSize");
    const pathEl = document.getElementById(sidebarId + "-pathLength");

    if (stepEl) stepEl.textContent = String(step);
    if (openEl) openEl.textContent = String(openSize);
    if (closedEl) closedEl.textContent = String(closedSize);
    if (pathEl) {
      pathEl.textContent =
        result && result.pathLength >= 0
          ? String(result.pathLength)
          : "-";
    }
  }

  function updateInfo(text) {
    infoEl.textContent = text;
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
      renderLayout();
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
    bfsSnapshots = [];
    currentStep = -1;
    astarResult = null;
    bfsResult = null;
    compareMode = false;
    playbackEl.style.display = "none";
    explicitStepCount = 0;
    explicitOpenSize = 0;
    explicitClosedSize = 0;
    explicitBfsExplored = 0;

    renderLayout();
    updateInfo(
      "Click cells to place walls, set start & end points, then click Run A*."
    );
  }

  // --- Mode Switching ---
  function setMode(newMode) {
    mode = newMode;
    btnModeWall.classList.toggle("astar-active-mode", mode === "WALL");
    btnModeStart.classList.toggle("astar-active-mode", mode === "START");
    btnModeEnd.classList.toggle("astar-active-mode", mode === "END");
  }

  function setHeuristic(h) {
    heuristic = h;
    btnManhattan.classList.toggle(
      "astar-active-heuristic",
      h === "manhattan"
    );
    btnEuclidean.classList.toggle(
      "astar-active-heuristic",
      h === "euclidean"
    );
  }

  // --- Event Listeners ---
  btnModeWall.addEventListener("click", () => setMode("WALL"));
  btnModeStart.addEventListener("click", () => setMode("START"));
  btnModeEnd.addEventListener("click", () => setMode("END"));

  btnManhattan.addEventListener("click", () => setHeuristic("manhattan"));
  btnEuclidean.addEventListener("click", () => setHeuristic("euclidean"));

  btnClearWalls.addEventListener("click", () => {
    if (snapshots.length > 0) resetVisualization();
    walls = new Set();
    renderLayout();
  });

  btnClearAll.addEventListener("click", () => {
    initGrid();
  });

  btnRun.addEventListener("click", () => {
    if (snapshots.length > 0) resetVisualization();
    compareMode = false;
    runAStar();
  });

  btnCompare.addEventListener("click", () => {
    if (snapshots.length > 0) resetVisualization();
    runComparison();
  });

  btnReset.addEventListener("click", resetVisualization);
  btnStepBack.addEventListener("click", stepBackward);
  btnPlay.addEventListener("click", startPlayback);
  btnPause.addEventListener("click", stopPlayback);
  btnStep.addEventListener("click", stepForward);

  gridSizeSelect.addEventListener("change", () => {
    const val = parseInt(gridSizeSelect.value, 10);
    if (val >= 5 && val <= 25) {
      gridSize = val;
    }
    initGrid();
  });

  // Clean up timers on page unload
  window.addEventListener("beforeunload", () => {
    stopPlayback();
  });

  // --- Init ---
  initGrid();
})();
