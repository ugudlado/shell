(() => {
  "use strict";

  // --- DOM refs ---
  const canvas = document.getElementById("hullCanvas");
  const ctx = canvas.getContext("2d");
  const canvasHint = document.getElementById("canvasHint");
  const pointCountInput = document.getElementById("pointCount");
  const btnRandom = document.getElementById("btnRandom");
  const btnClear = document.getElementById("btnClear");
  const btnVisualize = document.getElementById("btnVisualize");
  const playbackDiv = document.getElementById("playback");
  const btnReset = document.getElementById("btnReset");
  const btnStepBack = document.getElementById("btnStepBack");
  const btnPlay = document.getElementById("btnPlay");
  const btnPause = document.getElementById("btnPause");
  const btnStep = document.getElementById("btnStep");
  const speedSlider = document.getElementById("speed");
  const infoEl = document.getElementById("info");
  const resultEl = document.getElementById("result");
  const stepStat = document.getElementById("stepStat");
  const hullSizeStat = document.getElementById("hullSizeStat");
  const processedStat = document.getElementById("processedStat");
  const discardedStat = document.getElementById("discardedStat");

  // --- Constants ---
  const POINT_RADIUS = 6;
  const PIVOT_RADIUS = 8;
  const CANVAS_PADDING = 20;

  // --- Colors ---
  const COLORS = {
    point: "#8b949e",
    pivot: "#f0883e",
    current: "#388bfd",
    hull: "#2ea043",
    discarded: "#da3633",
    edge: "#2ea043",
    edgeAlpha: "rgba(46, 160, 67, 0.7)",
    sortLine: "rgba(56, 139, 253, 0.3)",
    text: "#c9d1d9",
    textDim: "#484f58",
  };

  // --- State ---
  let points = [];
  let scanResult = null;
  let steps = [];
  let stepIdx = -1;
  let timer = null;
  let isPlaying = false;
  let isAnimating = false; // true once Visualize is clicked

  // --- Canvas coordinate helpers ---
  function getCanvasRect() {
    return canvas.getBoundingClientRect();
  }

  function clientToCanvas(clientX, clientY) {
    const rect = getCanvasRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  // --- Drawing helpers ---
  function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function drawPoint(x, y, color, radius, label) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();

    if (label !== undefined && label !== null) {
      ctx.fillStyle = COLORS.text;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(String(label), x, y - radius - 2);
    }
  }

  function drawEdge(x1, y1, x2, y2, color, lineWidth) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth || 2;
    ctx.stroke();
  }

  // --- Render all points (pre-animation state) ---
  function renderPoints() {
    clearCanvas();
    for (let i = 0; i < points.length; i++) {
      drawPoint(points[i].x, points[i].y, COLORS.point, POINT_RADIUS, i);
    }
    updateHint();
  }

  // --- Render a specific animation step ---
  function renderStep(step) {
    clearCanvas();

    const pivotIdx = scanResult ? scanResult.pivotIndex : -1;
    const stackSet = new Set(step.stack);
    const discardedSet = new Set(step.discarded);

    // Draw sort lines during sort phase
    if (step.type === "sort" && scanResult && scanResult.sortedIndices.length > 1) {
      const si = scanResult.sortedIndices;
      for (let i = 0; i < si.length - 1; i++) {
        drawEdge(
          points[si[i]].x, points[si[i]].y,
          points[si[i + 1]].x, points[si[i + 1]].y,
          COLORS.sortLine, 1
        );
      }
    }

    // Draw hull edges (connecting stack points)
    if (step.stack.length >= 2) {
      for (let i = 0; i < step.stack.length - 1; i++) {
        const a = step.stack[i];
        const b = step.stack[i + 1];
        drawEdge(points[a].x, points[a].y, points[b].x, points[b].y, COLORS.edgeAlpha, 2);
      }
      // Close hull on done step
      if (step.type === "done" && step.stack.length >= 3) {
        const first = step.stack[0];
        const last = step.stack[step.stack.length - 1];
        drawEdge(points[first].x, points[first].y, points[last].x, points[last].y, COLORS.edge, 2.5);
      }
    }

    // Draw all points with appropriate colors
    for (let i = 0; i < points.length; i++) {
      let color = COLORS.point;
      let radius = POINT_RADIUS;

      if (i === pivotIdx) {
        color = COLORS.pivot;
        radius = PIVOT_RADIUS;
      } else if (i === step.currentPoint) {
        color = COLORS.current;
        radius = PIVOT_RADIUS;
      } else if (discardedSet.has(i)) {
        color = COLORS.discarded;
        radius = POINT_RADIUS - 1;
      } else if (stackSet.has(i)) {
        color = COLORS.hull;
      }

      drawPoint(points[i].x, points[i].y, color, radius, i);
    }
  }

  // --- Update hint text ---
  function updateHint() {
    if (isAnimating) {
      canvasHint.textContent = "";
    } else if (points.length === 0) {
      canvasHint.textContent = "Click to place points";
    } else {
      canvasHint.textContent = "";
    }
  }

  // --- Update stats ---
  function updateStats() {
    if (stepIdx < 0 || !scanResult) {
      stepStat.textContent = "0 / " + steps.length;
      hullSizeStat.textContent = "0";
      processedStat.textContent = String(points.length);
      discardedStat.textContent = "0";
      return;
    }

    const step = steps[stepIdx];
    stepStat.textContent = (stepIdx + 1) + " / " + steps.length;
    hullSizeStat.textContent = String(step.hullSize);
    processedStat.textContent = String(step.pointsProcessed);
    discardedStat.textContent = String(step.discarded.length);
  }

  // --- Update info ---
  function updateInfo() {
    if (stepIdx < 0) {
      infoEl.textContent = "Click Play or Step to start the Graham Scan.";
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
    const atEnd = stepIdx >= steps.length - 1;
    const atStart = stepIdx < 0;

    btnPlay.disabled = isPlaying;
    btnPause.disabled = !isPlaying;
    btnStep.disabled = isPlaying || atEnd;
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
    renderStep(step);
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
      renderPoints();
    } else {
      renderStep(steps[stepIdx]);
    }

    resultEl.classList.add("hidden");
    updateStats();
    updateInfo();
    updateButtons();
  }

  function startPlay() {
    if (stepIdx >= steps.length - 1) {
      resetViz();
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

  function resetViz() {
    stopPlay();
    stepIdx = -1;
    renderPoints();
    resultEl.classList.add("hidden");
    updateStats();
    updateInfo();
    updateButtons();
  }

  function showResult() {
    if (!scanResult) return;
    const lastStep = steps[steps.length - 1];
    resultEl.textContent =
      "Hull complete! " +
      lastStep.hullSize +
      " points on hull, " +
      lastStep.discarded.length +
      " discarded.";
    resultEl.classList.remove("hidden");
  }

  // --- Validate point count input ---
  function getValidPointCount() {
    let val = parseInt(pointCountInput.value, 10);
    if (isNaN(val) || val < 5) val = 5;
    if (val > 50) val = 50;
    pointCountInput.value = val;
    return val;
  }

  // --- Generate random points ---
  function generateRandom() {
    stopPlay();
    isAnimating = false;
    const count = getValidPointCount();
    points = [];
    for (let i = 0; i < count; i++) {
      points.push({
        x: CANVAS_PADDING + Math.random() * (canvas.width - 2 * CANVAS_PADDING),
        y: CANVAS_PADDING + Math.random() * (canvas.height - 2 * CANVAS_PADDING),
      });
    }
    // Round for cleaner display
    for (let i = 0; i < points.length; i++) {
      points[i].x = Math.round(points[i].x);
      points[i].y = Math.round(points[i].y);
    }
    scanResult = null;
    steps = [];
    stepIdx = -1;
    playbackDiv.classList.add("hidden");
    resultEl.classList.add("hidden");
    renderPoints();
    updateStats();
    infoEl.textContent = count + " random points placed. Click Visualize to run Graham Scan.";
  }

  // --- Clear all points ---
  function clearPoints() {
    stopPlay();
    isAnimating = false;
    points = [];
    scanResult = null;
    steps = [];
    stepIdx = -1;
    playbackDiv.classList.add("hidden");
    resultEl.classList.add("hidden");
    clearCanvas();
    updateHint();
    updateStats();
    infoEl.textContent = "Click on the canvas to place points, or use Random to generate them.";
  }

  // --- Visualize ---
  function visualize() {
    stopPlay();

    if (points.length === 0) {
      infoEl.textContent = "Error: Place at least one point on the canvas or click Random.";
      return;
    }

    isAnimating = true;

    // Run algorithm — calls the algorithm module (no logic duplication)
    scanResult = ConvexHullAlgorithm.grahamScan(points);
    steps = scanResult.steps;
    stepIdx = -1;

    // Render initial state
    renderPoints();
    playbackDiv.classList.remove("hidden");
    resultEl.classList.add("hidden");
    updateStats();
    updateInfo();
    updateButtons();
    updateHint();
  }

  // --- Canvas click handler ---
  canvas.addEventListener("click", (e) => {
    if (isAnimating) return; // Don't add points during animation
    const pos = clientToCanvas(e.clientX, e.clientY);
    // Bounds check
    if (pos.x < 0 || pos.x > canvas.width || pos.y < 0 || pos.y > canvas.height) return;

    if (points.length >= 100) {
      infoEl.textContent = "Error: Maximum 100 points reached. Clear to start over.";
      return;
    }

    points.push({ x: Math.round(pos.x), y: Math.round(pos.y) });
    renderPoints();
    infoEl.textContent = points.length + " point" + (points.length === 1 ? "" : "s") + " placed. Click Visualize to run Graham Scan.";
    updateStats();
  });

  // --- Event listeners ---
  btnVisualize.addEventListener("click", visualize);
  btnRandom.addEventListener("click", () => {
    generateRandom();
    visualize();
  });
  btnClear.addEventListener("click", clearPoints);
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
  btnReset.addEventListener("click", () => {
    resetViz();
    isAnimating = false;
    playbackDiv.classList.add("hidden");
    renderPoints();
    updateHint();
    infoEl.textContent = points.length + " point" + (points.length === 1 ? "" : "s") + " placed. Click Visualize to run Graham Scan.";
  });

  speedSlider.addEventListener("input", () => {
    if (isPlaying) {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      timer = setTimeout(tick, getDelay());
    }
  });

  // Enforce input bounds on point count
  pointCountInput.addEventListener("change", () => {
    getValidPointCount();
  });

  // Clean up timers on page unload
  window.addEventListener("beforeunload", () => {
    stopPlay();
  });

  // Init
  updateHint();
  updateStats();
})();
