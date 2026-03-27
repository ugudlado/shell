(() => {
  "use strict";

  // --- DOM refs ---
  const valuesInput = document.getElementById("valuesInput");
  const sizeInput = document.getElementById("sizeInput");
  const btnRandom = document.getElementById("btnRandom");
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
  const barChart = document.getElementById("barChart");
  const comparisonsStat = document.getElementById("comparisonsStat");
  const swapsStat = document.getElementById("swapsStat");
  const stepStat = document.getElementById("stepStat");

  // --- State ---
  let sortResult = null;
  let steps = [];
  let stepIdx = -1;
  let timer = null;
  let isPlaying = false;
  let currentArr = [];
  let maxVal = 1;

  // --- Generate random array ---
  function generateRandom() {
    const size = Math.max(2, Math.min(30, parseInt(sizeInput.value, 10) || 9));
    const arr = [];
    for (let i = 0; i < size; i++) {
      arr.push(Math.floor(Math.random() * 50) + 1);
    }
    valuesInput.value = arr.join(", ");
    sizeInput.value = size;
  }

  // --- Parse inputs ---
  function parseInputs() {
    const raw = valuesInput.value.trim();
    if (raw.length === 0) return [];
    return raw
      .split(/[,\s]+/)
      .map(Number)
      .filter((n) => !isNaN(n) && isFinite(n));
  }

  // --- Render bars for a given array state ---
  function renderBars(arr, comparing, swapped, sortedBoundary) {
    barChart.innerHTML = "";
    const chartHeight = barChart.clientHeight - 16; // account for padding

    for (let i = 0; i < arr.length; i++) {
      const bar = document.createElement("div");
      bar.className = "bs-bar";

      // Height proportional to value
      const height = Math.max(4, (arr[i] / maxVal) * chartHeight);
      bar.style.height = height + "px";

      // Label
      const label = document.createElement("span");
      label.className = "bar-label";
      label.textContent = arr[i];
      bar.appendChild(label);

      // Apply state classes
      if (comparing[0] === i || comparing[1] === i) {
        if (swapped) {
          bar.classList.add("swapping");
        } else {
          bar.classList.add("comparing");
        }
      }

      if (i >= sortedBoundary) {
        bar.classList.add("sorted");
      }

      barChart.appendChild(bar);
    }
  }

  // --- Update stats ---
  function updateStats() {
    if (stepIdx < 0 || !sortResult) {
      comparisonsStat.textContent = "0";
      swapsStat.textContent = "0";
      stepStat.textContent = "0 / " + steps.length;
      return;
    }

    const step = steps[stepIdx];
    comparisonsStat.textContent = step.comparisons;
    swapsStat.textContent = step.swaps;
    stepStat.textContent = stepIdx + 1 + " / " + steps.length;
  }

  // --- Update info ---
  function updateInfo() {
    if (stepIdx < 0) {
      infoEl.innerHTML =
        'Click <strong>Play</strong> or <strong>Step &rarr;</strong> to start sorting.';
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

    // For the done step, mark everything sorted
    const boundary =
      step.comparing[0] === -1 ? 0 : step.sortedBoundary;
    renderBars(step.arr, step.comparing, step.swapped, boundary);
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
      // Back to initial state
      renderBars(currentArr, [-1, -1], false, currentArr.length);
    } else {
      const step = steps[stepIdx];
      const boundary =
        step.comparing[0] === -1 ? 0 : step.sortedBoundary;
      renderBars(step.arr, step.comparing, step.swapped, boundary);
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
    renderBars(currentArr, [-1, -1], false, currentArr.length);
    resultEl.classList.add("hidden");
    updateStats();
    updateInfo();
    updateButtons();
  }

  function showResult() {
    if (!sortResult) return;
    const last = steps[steps.length - 1];
    resultEl.textContent =
      "Sort complete! " +
      last.comparisons +
      " comparisons, " +
      last.swaps +
      " swaps.";
    resultEl.classList.remove("hidden");
  }

  // --- Visualize ---
  function visualize() {
    stopPlay();

    const arr = parseInputs();
    if (arr.length < 1) {
      infoEl.textContent = "Error: Enter at least one value.";
      return;
    }

    currentArr = arr.slice();
    maxVal = Math.max(...arr, 1);

    // Solve
    sortResult = BubbleSortAlgorithm.sort(arr);
    steps = sortResult.steps;
    stepIdx = -1;

    // Render initial state
    renderBars(currentArr, [-1, -1], false, currentArr.length);
    playbackDiv.classList.remove("hidden");
    resultEl.classList.add("hidden");
    updateStats();
    updateInfo();
    updateButtons();
  }

  // --- Event listeners ---
  btnVisualize.addEventListener("click", visualize);
  btnRandom.addEventListener("click", () => {
    generateRandom();
    visualize();
  });
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
  btnReset.addEventListener("click", resetViz);

  speedSlider.addEventListener("input", () => {
    if (isPlaying) {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      timer = setTimeout(tick, getDelay());
    }
  });

  // Enter key triggers visualize
  valuesInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") visualize();
  });
  sizeInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      generateRandom();
      visualize();
    }
  });

  // --- Cleanup on page unload ---
  window.addEventListener('beforeunload', function () {
    if (timer !== null) { clearTimeout(timer); timer = null; }
  });

  // Auto-init
  visualize();
})();
