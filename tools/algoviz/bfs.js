/* BFS Pathfinding Visualization — AlgoViz */
(() => {
  'use strict';

  // --- State ---
  let gridSize = 20;
  let grid = [];          // grid[row][col] = { wall, visited, distance, parent }
  let startPos = null;    // [row, col]
  let endPos = null;      // [row, col]
  let mode = 'WALL';      // WALL | START | END
  let snapshots = [];     // Array of { frontier, visited, queue, path }
  let currentStep = -1;
  let playing = false;
  let playTimer = null;
  let isDragging = false;

  // --- DOM refs ---
  const gridContainer = document.getElementById('grid-container');
  const queueList = document.getElementById('queue-list');
  const infoEl = document.getElementById('info');
  const playbackEl = document.getElementById('playback');
  const stepCountEl = document.getElementById('stepCount');
  const visitedCountEl = document.getElementById('visitedCount');
  const queueSizeEl = document.getElementById('queueSize');

  const btnModeWall = document.getElementById('btnModeWall');
  const btnModeStart = document.getElementById('btnModeStart');
  const btnModeEnd = document.getElementById('btnModeEnd');
  const btnClearWalls = document.getElementById('btnClearWalls');
  const btnClearAll = document.getElementById('btnClearAll');
  const btnRunBFS = document.getElementById('btnRunBFS');
  const btnReset = document.getElementById('btnReset');
  const btnStepBack = document.getElementById('btnStepBack');
  const btnPlay = document.getElementById('btnPlay');
  const btnPause = document.getElementById('btnPause');
  const btnStep = document.getElementById('btnStep');
  const speedSlider = document.getElementById('speed');
  const gridSizeSelect = document.getElementById('gridSize');

  // --- Helpers ---
  function key(r, c) { return `${r},${c}`; }
  function getDelay() { return 600 - (speedSlider.value - 1) * 55; }

  // --- Grid Init ---
  function initGrid() {
    stopPlayback();
    snapshots = [];
    currentStep = -1;
    playbackEl.style.display = 'none';

    grid = [];
    for (let r = 0; r < gridSize; r++) {
      grid[r] = [];
      for (let c = 0; c < gridSize; c++) {
        grid[r][c] = { wall: false, visited: false, distance: -1, parent: null };
      }
    }

    // Default start and end positions
    startPos = [1, 1];
    endPos = [gridSize - 2, gridSize - 2];

    renderGrid();
    resetQueueSidebar();
    infoEl.innerHTML = 'Click cells to place walls, then set start &amp; end points and click <strong>Run BFS</strong>.';
  }

  function renderGrid() {
    gridContainer.innerHTML = '';
    gridContainer.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.row = r;
        cell.dataset.col = c;

        if (startPos && r === startPos[0] && c === startPos[1]) {
          cell.classList.add('start');
        }
        if (endPos && r === endPos[0] && c === endPos[1]) {
          cell.classList.add('end');
        }
        if (grid[r][c].wall) {
          cell.classList.add('wall');
        }

        cell.addEventListener('mousedown', (e) => {
          e.preventDefault();
          isDragging = true;
          handleCellClick(r, c);
        });
        cell.addEventListener('mouseenter', () => {
          if (isDragging && mode === 'WALL') {
            handleCellClick(r, c);
          }
        });

        gridContainer.appendChild(cell);
      }
    }
  }

  document.addEventListener('mouseup', () => { isDragging = false; });

  function handleCellClick(r, c) {
    // Don't allow editing during animation
    if (snapshots.length > 0) return;

    if (mode === 'WALL') {
      // Don't toggle wall on start/end
      if (startPos && r === startPos[0] && c === startPos[1]) return;
      if (endPos && r === endPos[0] && c === endPos[1]) return;
      grid[r][c].wall = !grid[r][c].wall;
    } else if (mode === 'START') {
      // Remove wall at new position
      grid[r][c].wall = false;
      startPos = [r, c];
      // If end is at same position, remove end
      if (endPos && r === endPos[0] && c === endPos[1]) {
        endPos = null;
      }
    } else if (mode === 'END') {
      grid[r][c].wall = false;
      endPos = [r, c];
      if (startPos && r === startPos[0] && c === startPos[1]) {
        startPos = null;
      }
    }
    renderGrid();
  }

  // --- BFS Algorithm (delegates to bfs-algorithm.js) ---
  function runBFS() {
    if (!startPos || !endPos) {
      infoEl.textContent = 'Please set both a start and end point before running BFS.';
      return;
    }

    // Same position edge case
    if (startPos[0] === endPos[0] && startPos[1] === endPos[1]) {
      infoEl.textContent = 'Start and end are the same cell — already there!';
      return;
    }

    // Reset grid state
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        grid[r][c].visited = false;
        grid[r][c].distance = -1;
        grid[r][c].parent = null;
      }
    }

    // Build walls array from grid state for the algorithm module
    const walls = [];
    for (let r = 0; r < gridSize; r++) {
      walls[r] = [];
      for (let c = 0; c < gridSize; c++) {
        walls[r][c] = grid[r][c].wall;
      }
    }

    // Delegate to BFSAlgorithm.search()
    const result = BFSAlgorithm.search({
      gridSize: gridSize,
      walls: walls,
      start: [startPos[0], startPos[1]],
      end: [endPos[0], endPos[1]],
    });

    snapshots = result.snapshots;
    const path = result.path;
    const found = result.found;

    // Show playback controls
    currentStep = -1;
    playbackEl.style.display = 'flex';
    infoEl.textContent = found
      ? `BFS complete — shortest path: ${path.length - 1} steps. Use playback to see the animation.`
      : 'BFS complete — no path found! The end is unreachable.';
  }

  // --- Rendering a Snapshot ---
  function renderSnapshot(stepIdx) {
    if (stepIdx < 0 || stepIdx >= snapshots.length) return;

    const snap = snapshots[stepIdx];
    const visitedSet = new Set(snap.visited.map(([r, c]) => key(r, c)));
    const frontierSet = new Set(snap.frontier.map(([r, c]) => key(r, c)));
    const pathSet = snap.path ? new Set(snap.path.map(([r, c]) => key(r, c))) : new Set();

    const cells = gridContainer.querySelectorAll('.grid-cell');
    cells.forEach(cell => {
      const r = parseInt(cell.dataset.row);
      const c = parseInt(cell.dataset.col);
      const k = key(r, c);

      // Remove animation classes
      cell.classList.remove('visited', 'frontier', 'path');

      // Apply state classes
      if (pathSet.has(k)) {
        cell.classList.add('path');
      } else if (frontierSet.has(k)) {
        cell.classList.add('frontier');
      } else if (visitedSet.has(k)) {
        cell.classList.add('visited');
      }
    });

    // Update queue sidebar
    renderQueue(snap.queue, snap.frontier);

    // Update stats
    stepCountEl.textContent = stepIdx + 1;
    visitedCountEl.textContent = snap.visited.length;
    queueSizeEl.textContent = snap.queue.length;

    // Update info
    if (snap.path !== null) {
      if (snap.found !== false) {
        infoEl.textContent = `Path found! Length: ${snap.path.length - 1} steps.`;
      }
    } else if (snap.found === false && stepIdx === snapshots.length - 1) {
      infoEl.textContent = 'No path found — the end is unreachable.';
    } else {
      infoEl.textContent = `Step ${stepIdx + 1}/${snapshots.length}: exploring level ${Math.floor(stepIdx / 2)}...`;
    }
  }

  function renderQueue(queue, frontier) {
    queueList.innerHTML = '';
    const frontierSet = new Set(frontier.map(([r, c]) => key(r, c)));

    if (queue.length === 0) {
      queueList.innerHTML = '<div class="queue-empty">Queue is empty</div>';
      return;
    }

    // Show up to 50 items to avoid DOM bloat
    const maxItems = 50;
    const items = queue.slice(0, maxItems);
    items.forEach(([r, c]) => {
      const item = document.createElement('div');
      item.className = 'queue-item';
      if (frontierSet.has(key(r, c))) {
        item.classList.add('frontier-item');
      }
      item.textContent = `(${r}, ${c})`;
      queueList.appendChild(item);
    });

    if (queue.length > maxItems) {
      const more = document.createElement('div');
      more.className = 'queue-empty';
      more.textContent = `... and ${queue.length - maxItems} more`;
      queueList.appendChild(more);
    }
  }

  function resetQueueSidebar() {
    queueList.innerHTML = '<div class="queue-empty">Run BFS to see the queue</div>';
    stepCountEl.textContent = '0';
    visitedCountEl.textContent = '0';
    queueSizeEl.textContent = '0';
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
      // Restart from beginning
      currentStep = -1;
      renderGrid();
      resetQueueSidebar();
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
    playbackEl.style.display = 'none';

    // Reset grid visited state but keep walls
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        grid[r][c].visited = false;
        grid[r][c].distance = -1;
        grid[r][c].parent = null;
      }
    }

    renderGrid();
    resetQueueSidebar();
    infoEl.innerHTML = 'Click cells to place walls, then set start &amp; end points and click <strong>Run BFS</strong>.';
  }

  // --- Mode Switching ---
  function setMode(newMode) {
    mode = newMode;
    btnModeWall.classList.toggle('active-mode', mode === 'WALL');
    btnModeStart.classList.toggle('active-mode', mode === 'START');
    btnModeEnd.classList.toggle('active-mode', mode === 'END');
  }

  // --- Event Listeners ---
  btnModeWall.addEventListener('click', () => setMode('WALL'));
  btnModeStart.addEventListener('click', () => setMode('START'));
  btnModeEnd.addEventListener('click', () => setMode('END'));

  btnClearWalls.addEventListener('click', () => {
    if (snapshots.length > 0) resetVisualization();
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        grid[r][c].wall = false;
      }
    }
    renderGrid();
  });

  btnClearAll.addEventListener('click', () => {
    startPos = [1, 1];
    endPos = [gridSize - 2, gridSize - 2];
    initGrid();
  });

  btnRunBFS.addEventListener('click', () => {
    if (snapshots.length > 0) {
      // Reset animation state but keep walls
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          grid[r][c].visited = false;
          grid[r][c].distance = -1;
          grid[r][c].parent = null;
        }
      }
      snapshots = [];
      currentStep = -1;
      renderGrid();
    }
    runBFS();
  });

  btnReset.addEventListener('click', resetVisualization);
  btnStepBack.addEventListener('click', stepBackward);
  btnPlay.addEventListener('click', startPlayback);
  btnPause.addEventListener('click', stopPlayback);
  btnStep.addEventListener('click', stepForward);

  gridSizeSelect.addEventListener('change', () => {
    gridSize = parseInt(gridSizeSelect.value);
    startPos = [1, 1];
    endPos = [gridSize - 2, gridSize - 2];
    initGrid();
  });

  // --- Cleanup on page unload ---
  window.addEventListener('beforeunload', function () {
    if (playTimer !== null) { clearTimeout(playTimer); playTimer = null; }
  });

  // --- Init ---
  initGrid();
})();
