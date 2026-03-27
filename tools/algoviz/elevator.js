(() => {
  "use strict";

  // --- DOM refs ---
  const requestsInput = document.getElementById("requestsInput");
  const startInput = document.getElementById("startInput");
  const directionInput = document.getElementById("directionInput");
  const maxFloorInput = document.getElementById("maxFloorInput");
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
  const shaftEl = document.getElementById("shaft");
  const elevatorCar = document.getElementById("elevatorCar");
  const dirArrow = document.getElementById("dirArrow");
  const queueList = document.getElementById("queueList");
  const distanceStat = document.getElementById("distanceStat");
  const servicedStat = document.getElementById("servicedStat");
  const directionStat = document.getElementById("directionStat");

  // --- State ---
  let solveResult = null;  // result from ScanAlgorithm.solve()
  let steps = [];
  let stepIdx = -1;
  let timer = null;
  let isPlaying = false;
  let maxFloor = 10;
  let startPos = 5;
  let requests = [];
  let floorElements = []; // floorElements[i] = DOM element for floor i

  const FLOOR_HEIGHT = 36; // px, must match CSS .elev-floor height

  // --- Parse inputs ---
  function parseInputs() {
    const raw = requestsInput.value.trim();
    requests = raw.length === 0 ? [] : raw.split(/[,\s]+/).map(Number).filter(n => !isNaN(n));
    startPos = parseInt(startInput.value, 10) || 0;
    maxFloor = parseInt(maxFloorInput.value, 10) || 10;
    const dir = directionInput.value;
    return { requests, startPos, direction: dir, maxFloor };
  }

  // --- Render shaft ---
  function renderShaft() {
    shaftEl.innerHTML = "";
    floorElements = [];

    for (let i = 0; i <= maxFloor; i++) {
      const floorDiv = document.createElement("div");
      floorDiv.className = "elev-floor";
      floorDiv.dataset.floor = i;

      const numSpan = document.createElement("span");
      numSpan.className = "elev-floor-number";
      numSpan.textContent = i;

      const trackSpan = document.createElement("span");
      trackSpan.className = "elev-floor-track";

      floorDiv.appendChild(numSpan);
      floorDiv.appendChild(trackSpan);
      shaftEl.appendChild(floorDiv);
      floorElements[i] = floorDiv;
    }

    // Mark requested floors
    for (const r of requests) {
      if (r >= 0 && r <= maxFloor && floorElements[r]) {
        floorElements[r].classList.add("elev-requested");
      }
    }

    // Position elevator car at start
    positionCar(startPos, false);
  }

  // --- Position elevator car ---
  function positionCar(floor, animate) {
    const bottomPx = floor * FLOOR_HEIGHT + 2; // 2px offset for visual centering
    if (animate) {
      elevatorCar.style.transition = "bottom " + getAnimDuration() + "ms ease-in-out";
    } else {
      elevatorCar.style.transition = "none";
    }
    elevatorCar.style.bottom = bottomPx + "px";
  }

  function getAnimDuration() {
    const spd = parseInt(speedSlider.value, 10);
    return Math.round(600 / spd);
  }

  // --- Render request queue ---
  function renderQueue() {
    queueList.innerHTML = "";
    if (!solveResult) return;

    for (let i = 0; i < solveResult.order.length; i++) {
      const badge = document.createElement("div");
      badge.className = "elev-request-badge elev-pending";
      badge.dataset.index = i;

      const floorSpan = document.createElement("span");
      floorSpan.className = "elev-badge-floor";
      floorSpan.textContent = "F" + solveResult.order[i];

      const statusSpan = document.createElement("span");
      statusSpan.className = "elev-badge-status";
      statusSpan.textContent = "pending";

      badge.appendChild(floorSpan);
      badge.appendChild(statusSpan);
      queueList.appendChild(badge);
    }
  }

  // --- Update queue badges up to current step ---
  function updateQueue() {
    const badges = queueList.querySelectorAll(".elev-request-badge");
    for (let i = 0; i < badges.length; i++) {
      const badge = badges[i];
      const statusSpan = badge.querySelector(".elev-badge-status");
      if (i < stepIdx + 1) {
        // Completed
        badge.className = "elev-request-badge elev-completed";
        statusSpan.textContent = "done";
      } else if (i === stepIdx + 1) {
        // Next to be serviced (or active if we're transitioning)
        badge.className = "elev-request-badge elev-pending";
        statusSpan.textContent = "next";
      } else {
        badge.className = "elev-request-badge elev-pending";
        statusSpan.textContent = "pending";
      }
    }

    // Mark the current step as active
    if (stepIdx >= 0 && stepIdx < badges.length) {
      const activeBadge = badges[stepIdx];
      activeBadge.className = "elev-request-badge elev-active";
      activeBadge.querySelector(".elev-badge-status").textContent = "servicing";
    }
  }

  // --- Update floor highlights ---
  function updateFloorHighlights() {
    // Reset all
    for (let i = 0; i <= maxFloor; i++) {
      if (floorElements[i]) {
        floorElements[i].classList.remove("elev-current-floor", "elev-serviced");
      }
    }

    // Mark serviced floors
    for (let i = 0; i <= stepIdx; i++) {
      if (i >= 0 && i < steps.length) {
        const floor = steps[i].target;
        if (floorElements[floor]) {
          floorElements[floor].classList.add("elev-serviced");
        }
      }
    }

    // Mark current floor
    if (stepIdx >= 0 && stepIdx < steps.length) {
      const currentFloor = steps[stepIdx].target;
      if (floorElements[currentFloor]) {
        floorElements[currentFloor].classList.add("elev-current-floor");
      }
    }

    // Re-mark requested but not yet serviced
    for (const r of requests) {
      if (r >= 0 && r <= maxFloor && floorElements[r]) {
        const isServiced = floorElements[r].classList.contains("elev-serviced");
        if (!isServiced) {
          floorElements[r].classList.add("elev-requested");
        }
      }
    }
  }

  // --- Update stats ---
  function updateStats() {
    if (!solveResult) {
      distanceStat.textContent = "0";
      servicedStat.textContent = "0 / 0";
      directionStat.textContent = "--";
      return;
    }

    const totalRequests = solveResult.order.length;

    if (stepIdx < 0) {
      distanceStat.textContent = "0";
      servicedStat.textContent = "0 / " + totalRequests;
      directionStat.textContent = directionInput.value === "up" ? "UP" : "DOWN";
      dirArrow.innerHTML = directionInput.value === "up" ? "&#9650;" : "&#9660;";
      return;
    }

    const step = steps[stepIdx];
    distanceStat.textContent = step.distanceSoFar;
    servicedStat.textContent = (stepIdx + 1) + " / " + totalRequests;

    const dir = step.direction;
    directionStat.textContent = dir.toUpperCase();
    dirArrow.innerHTML = dir === "up" ? "&#9650;" : "&#9660;";
  }

  // --- Update info ---
  function updateInfo() {
    if (stepIdx < 0) {
      infoEl.innerHTML = 'Click <strong>Play</strong> or <strong>Step &rarr;</strong> to start the elevator.';
      return;
    }
    const step = steps[stepIdx];
    const total = steps.length;
    infoEl.textContent = "Step " + (stepIdx + 1) + "/" + total +
      " \u2014 Move " + step.direction + " from floor " + step.position +
      " to floor " + step.target +
      " (distance: " + Math.abs(step.target - step.position) +
      ", total: " + step.distanceSoFar + ")";
  }

  // --- Playback controls ---
  function getDelay() {
    const spd = parseInt(speedSlider.value, 10);
    return Math.round(1000 / spd);
  }

  function stepForward() {
    if (stepIdx >= steps.length - 1) {
      stopPlay();
      showResult();
      return;
    }

    stepIdx++;
    const step = steps[stepIdx];

    // Animate car to target floor
    positionCar(step.target, true);

    // Update UI
    updateQueue();
    updateFloorHighlights();
    updateStats();
    updateInfo();
    updateButtons();

    if (stepIdx === steps.length - 1) {
      // Last step — show result after animation completes
      setTimeout(() => {
        showResult();
        stopPlay();
        updateButtons();
      }, getAnimDuration() + 100);
    }
  }

  function stepBackward() {
    if (stepIdx < 0) return;

    stepIdx--;

    if (stepIdx < 0) {
      // Back to initial state
      positionCar(startPos, true);
    } else {
      const step = steps[stepIdx];
      positionCar(step.target, true);
    }

    resultEl.classList.add("hidden");
    updateQueue();
    updateFloorHighlights();
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
    if (timer !== null) { clearTimeout(timer); timer = null; }
    updateButtons();
  }

  function resetViz() {
    stopPlay();
    stepIdx = -1;
    positionCar(startPos, true);
    resultEl.classList.add("hidden");
    updateQueue();
    updateFloorHighlights();
    updateStats();
    updateInfo();
    updateButtons();

    // Reset floor states
    for (let i = 0; i <= maxFloor; i++) {
      if (floorElements[i]) {
        floorElements[i].classList.remove("elev-current-floor", "elev-serviced");
        if (requests.includes(i)) {
          floorElements[i].classList.add("elev-requested");
        }
      }
    }
  }

  function showResult() {
    if (!solveResult) return;
    resultEl.textContent = "Total distance: " + solveResult.totalDistance +
      " | Requests serviced: " + solveResult.order.length;
    resultEl.classList.remove("hidden");
  }

  function getAnimDuration() {
    const spd = parseInt(speedSlider.value, 10);
    return Math.round(600 / spd);
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

  // --- Visualize ---
  function visualize() {
    stopPlay();

    const input = parseInputs();

    // Validate
    const invalidReqs = input.requests.filter(r => r < 0 || r > input.maxFloor);
    if (invalidReqs.length > 0) {
      infoEl.textContent = "Error: Requests " + invalidReqs.join(", ") +
        " are outside range [0, " + input.maxFloor + "]";
      return;
    }
    if (input.startPos < 0 || input.startPos > input.maxFloor) {
      infoEl.textContent = "Error: Start position must be between 0 and " + input.maxFloor;
      return;
    }

    // Solve
    solveResult = ScanAlgorithm.solve(
      input.requests, input.startPos, input.direction
    );
    steps = solveResult.steps;
    stepIdx = -1;

    // Render
    renderShaft();
    renderQueue();
    playbackDiv.classList.remove("hidden");
    resultEl.classList.add("hidden");
    updateStats();
    updateInfo();
    updateButtons();
  }

  // --- Event listeners ---
  btnVisualize.addEventListener("click", visualize);
  btnPlay.addEventListener("click", startPlay);
  btnPause.addEventListener("click", stopPlay);
  btnStep.addEventListener("click", () => { stopPlay(); stepForward(); });
  btnStepBack.addEventListener("click", () => { stopPlay(); stepBackward(); });
  btnReset.addEventListener("click", resetViz);

  speedSlider.addEventListener("input", () => {
    if (isPlaying) {
      if (timer !== null) { clearTimeout(timer); timer = null; }
      timer = setTimeout(tick, getDelay());
    }
  });

  // Enter key triggers visualize
  requestsInput.addEventListener("keydown", e => { if (e.key === "Enter") visualize(); });
  startInput.addEventListener("keydown", e => { if (e.key === "Enter") visualize(); });
  maxFloorInput.addEventListener("keydown", e => { if (e.key === "Enter") visualize(); });

  // --- Cleanup on page unload ---
  window.addEventListener('beforeunload', function () {
    if (timer !== null) { clearTimeout(timer); timer = null; }
  });

  // Auto-init
  visualize();
})();
