/* DFS Pathfinding Visualization — AlgoViz */
(() => {
  "use strict";

  // --- State ---
  let gridSize = 20;
  let walls = []; // walls[row][col] = boolean
  let startPos = null; // [row, col]
  let endPos = null; // [row, col]
  let mode = "WALL"; // WALL | START | END
  let snapshots = []; // from DFSAlgorithm.search()
  let currentStep = -1;
  let playing = false;
  let playTimer = null;
  let isDragging = false;
  let explicitStepCount = 0;
  let explicitVisitedCount = 0;
  let explicitStackSize = 0;

  // --- DOM refs ---
  const gridContainer = document.getElementById("dfs-grid-container");
  const stackList = document.getElementById("dfs-stack-list");
  const infoEl = document.getElementById("dfs-info");
  const playbackEl = document.getElementById("dfs-playback");
  const stepCountEl = document.getElementById("dfs-stepCount");
  const visitedCountEl = document.getElementById("dfs-visitedCount");
  const stackSizeEl = document.getElementById("dfs-stackSize");

  const btnModeWall = document.getElementById("dfs-btnModeWall");
  const btnModeStart = document.getElementById("dfs-btnModeStart");
  const btnModeEnd = document.getElementById("dfs-btnModeEnd");
  const btnClearWalls = document.getElementById("dfs-btnClearWalls");
  const btnClearAll = document.getElementById("dfs-btnClearAll");
  const btnRun = document.getElementById("dfs-btnRun");
  const btnReset = document.getElementById("dfs-btnReset");
  const btnStepBack = document.getElementById("dfs-btnStepBack");
  const btnPlay = document.getElementById("dfs-btnPlay");
  const btnPause = document.getElementById("dfs-btnPause");
  const btnStep = document.getElementById("dfs-btnStep");
  const speedSlider = document.getElementById("dfs-speed");
  const gridSizeSelect = document.getElementById("dfs-gridSize");

  // --- Helpers ---
  function key(r, c) {
    return r + "," + c;
  }
  function getDelay() {
    return 600 - (speedSlider.value - 1) * 55;
  }

  // --- Grid Init ---
  function initGrid() {
    stopPlayback();
    snapshots = [];
    currentStep = -1;
    explicitStepCount = 0;
    explicitVisitedCount = 0;
    explicitStackSize = 0;
    playbackEl.style.display = "none";

    walls = [];
    for (let r = 0; r < gridSize; r++) {
      walls[r] = [];
      for (let c = 0; c < gridSize; c++) {
        walls[r][c] = false;
      }
    }

    startPos = [1, 1];
    endPos = [gridSize - 2, gridSize - 2];

    renderGrid();
    resetStackSidebar();
    infoEl.textContent =
      "Click cells to place walls, then set start & end points and click Run DFS.";
  }

  function renderGrid() {
    // Clear grid
    while (gridContainer.firstChild) {
      gridContainer.removeChild(gridContainer.firstChild);
    }
    gridContainer.style.gridTemplateColumns = "repeat(" + gridSize + ", 1fr)";

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const cell = document.createElement("div");
        cell.className = "dfs-grid-cell";
        cell.dataset.row = r;
        cell.dataset.col = c;

        if (startPos && r === startPos[0] && c === startPos[1]) {
          cell.classList.add("dfs-start");
        }
        if (endPos && r === endPos[0] && c === endPos[1]) {
          cell.classList.add("dfs-end");
        }
        if (walls[r][c]) {
          cell.classList.add("dfs-wall");
        }

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

        gridContainer.appendChild(cell);
      }
    }
  }

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });

  function handleCellClick(r, c) {
    if (snapshots.length > 0) return;

    if (mode === "WALL") {
      if (startPos && r === startPos[0] && c === startPos[1]) return;
      if (endPos && r === endPos[0] && c === endPos[1]) return;
      walls[r][c] = !walls[r][c];
    } else if (mode === "START") {
      walls[r][c] = false;
      startPos = [r, c];
      if (endPos && r === endPos[0] && c === endPos[1]) {
        endPos = null;
      }
    } else if (mode === "END") {
      walls[r][c] = false;
      endPos = [r, c];
      if (startPos && r === startPos[0] && c === startPos[1]) {
        startPos = null;
      }
    }
    renderGrid();
  }

  // --- Run DFS (delegates to algorithm module) ---
  function runDFS() {
    if (!startPos || !endPos) {
      infoEl.textContent =
        "Please set both a start and end point before running DFS.";
      return;
    }

    if (startPos[0] === endPos[0] && startPos[1] === endPos[1]) {
      infoEl.textContent =
        "Start and end are the same cell — already there!";
      return;
    }

    // Call the pure algorithm module
    const result = DFSAlgorithm.search({
      walls: walls,
      rows: gridSize,
      cols: gridSize,
      start: startPos,
      end: endPos,
    });

    snapshots = result.snapshots;
    currentStep = -1;
    explicitStepCount = 0;
    explicitVisitedCount = 0;
    explicitStackSize = 0;
    playbackEl.style.display = "flex";

    if (result.found) {
      infoEl.textContent =
        "DFS complete — path found: " +
        (result.path.length - 1) +
        " steps. Note: DFS does not guarantee the shortest path. Use playback to see the animation.";
    } else {
      infoEl.textContent =
        "DFS complete — no path found! The end is unreachable.";
    }
  }

  // --- Rendering a Snapshot ---
  function renderSnapshot(stepIdx) {
    if (stepIdx < 0 || stepIdx >= snapshots.length) return;

    const snap = snapshots[stepIdx];
    const visitedSet = new Set(snap.visited.map(([r, c]) => key(r, c)));
    const currentKey = snap.current ? key(snap.current[0], snap.current[1]) : null;
    const pathSet = snap.path
      ? new Set(snap.path.map(([r, c]) => key(r, c)))
      : new Set();

    const cells = gridContainer.querySelectorAll(".dfs-grid-cell");
    cells.forEach((cell) => {
      const r = parseInt(cell.dataset.row);
      const c = parseInt(cell.dataset.col);
      const k = key(r, c);

      cell.classList.remove("dfs-visited", "dfs-current-cell", "dfs-path");

      if (pathSet.has(k)) {
        cell.classList.add("dfs-path");
      } else if (k === currentKey) {
        cell.classList.add("dfs-current-cell");
      } else if (visitedSet.has(k)) {
        cell.classList.add("dfs-visited");
      }
    });

    // Update stack sidebar
    renderStack(snap.stack);

    // Update stats from explicit state
    explicitStepCount = stepIdx + 1;
    explicitVisitedCount = snap.visited.length;
    explicitStackSize = snap.stack.length;

    stepCountEl.textContent = String(explicitStepCount);
    visitedCountEl.textContent = String(explicitVisitedCount);
    stackSizeEl.textContent = String(explicitStackSize);

    // Update info
    if (snap.path !== null && snap.found) {
      infoEl.textContent =
        "Path found! Length: " + (snap.path.length - 1) + " steps.";
    } else if (
      !snap.found &&
      stepIdx === snapshots.length - 1 &&
      snap.current === null
    ) {
      infoEl.textContent = "No path found — the end is unreachable.";
    } else {
      infoEl.textContent =
        "Step " +
        (stepIdx + 1) +
        "/" +
        snapshots.length +
        ": exploring cell (" +
        (snap.current ? snap.current[0] : "?") +
        ", " +
        (snap.current ? snap.current[1] : "?") +
        ")...";
    }
  }

  function renderStack(stack) {
    // Clear stack list
    while (stackList.firstChild) {
      stackList.removeChild(stackList.firstChild);
    }

    if (stack.length === 0) {
      const empty = document.createElement("div");
      empty.className = "dfs-stack-empty";
      empty.textContent = "Stack is empty";
      stackList.appendChild(empty);
      return;
    }

    // Show stack top-to-bottom (newest/top first — LIFO visualization)
    const maxItems = 50;
    const startIdx = Math.max(0, stack.length - maxItems);

    for (let i = stack.length - 1; i >= startIdx; i--) {
      const item = document.createElement("div");
      item.className = "dfs-stack-item";
      if (i === stack.length - 1) {
        item.classList.add("dfs-stack-top");
      }
      item.textContent = "(" + stack[i][0] + ", " + stack[i][1] + ")";
      stackList.appendChild(item);
    }

    if (startIdx > 0) {
      const more = document.createElement("div");
      more.className = "dfs-stack-empty";
      more.textContent = "... and " + startIdx + " more";
      stackList.appendChild(more);
    }
  }

  function resetStackSidebar() {
    while (stackList.firstChild) {
      stackList.removeChild(stackList.firstChild);
    }
    const empty = document.createElement("div");
    empty.className = "dfs-stack-empty";
    empty.textContent = "Run DFS to see the stack";
    stackList.appendChild(empty);
    stepCountEl.textContent = "0";
    visitedCountEl.textContent = "0";
    stackSizeEl.textContent = "0";
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
      renderGrid();
      resetStackSidebar();
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
    explicitStepCount = 0;
    explicitVisitedCount = 0;
    explicitStackSize = 0;
    playbackEl.style.display = "none";

    renderGrid();
    resetStackSidebar();
    infoEl.textContent =
      "Click cells to place walls, then set start & end points and click Run DFS.";
  }

  // --- Mode Switching ---
  function setMode(newMode) {
    mode = newMode;
    btnModeWall.classList.toggle("dfs-active-mode", mode === "WALL");
    btnModeStart.classList.toggle("dfs-active-mode", mode === "START");
    btnModeEnd.classList.toggle("dfs-active-mode", mode === "END");
  }

  // --- Event Listeners ---
  btnModeWall.addEventListener("click", () => setMode("WALL"));
  btnModeStart.addEventListener("click", () => setMode("START"));
  btnModeEnd.addEventListener("click", () => setMode("END"));

  btnClearWalls.addEventListener("click", () => {
    if (snapshots.length > 0) resetVisualization();
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        walls[r][c] = false;
      }
    }
    renderGrid();
  });

  btnClearAll.addEventListener("click", () => {
    startPos = [1, 1];
    endPos = [gridSize - 2, gridSize - 2];
    initGrid();
  });

  btnRun.addEventListener("click", () => {
    if (snapshots.length > 0) {
      snapshots = [];
      currentStep = -1;
      renderGrid();
    }
    runDFS();
  });

  btnReset.addEventListener("click", resetVisualization);
  btnStepBack.addEventListener("click", stepBackward);
  btnPlay.addEventListener("click", startPlayback);
  btnPause.addEventListener("click", stopPlayback);
  btnStep.addEventListener("click", stepForward);

  gridSizeSelect.addEventListener("change", () => {
    gridSize = parseInt(gridSizeSelect.value);
    startPos = [1, 1];
    endPos = [gridSize - 2, gridSize - 2];
    initGrid();
  });

  // Cleanup timer on page unload
  window.addEventListener("beforeunload", () => {
    stopPlayback();
  });

  // --- Init ---
  initGrid();
})();
