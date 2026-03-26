(() => {
  "use strict";

  // --- DOM refs ---
  const valuesInput = document.getElementById("valuesInput");
  const targetInput = document.getElementById("targetInput");
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
  const arrayContainer = document.getElementById("arrayContainer");
  const pointerLabels = document.getElementById("pointerLabels");
  const analogyEl = document.getElementById("analogy");
  const stepsStat = document.getElementById("stepsStat");
  const remainingStat = document.getElementById("remainingStat");
  const stepStat = document.getElementById("stepStat");

  // --- Constants ---
  const MAX_ARRAY_SIZE = 30;
  const MAX_VALUE = 9999;

  // --- State ---
  let searchResult = null;
  let steps = [];
  let stepIdx = -1;
  let timer = null;
  let isPlaying = false;
  let currentArr = [];
  let currentTarget = 0;
  // Track which indices have been eliminated so far
  let eliminatedIndices = new Set();

  // --- Generate random sorted array ---
  function generateRandom() {
    const size = Math.max(2, Math.min(MAX_ARRAY_SIZE, 11));
    const arr = [];
    let val = Math.floor(Math.random() * 5) + 1;
    for (let i = 0; i < size; i++) {
      arr.push(val);
      val += Math.floor(Math.random() * 8) + 1;
    }
    valuesInput.value = arr.join(", ");
    // Pick a random target — 70% chance it exists in array
    if (Math.random() < 0.7) {
      targetInput.value = arr[Math.floor(Math.random() * arr.length)];
    } else {
      targetInput.value = Math.floor(Math.random() * (arr[arr.length - 1] + 10)) + 1;
    }
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

  function parseTarget() {
    const val = Number(targetInput.value);
    if (isNaN(val) || !isFinite(val)) return null;
    return val;
  }

  // --- Render array cells ---
  function renderArray(arr, step) {
    arrayContainer.innerHTML = "";

    for (let i = 0; i < arr.length; i++) {
      const cell = document.createElement("div");
      cell.className = "bsrch-cell";

      const valueSpan = document.createElement("span");
      valueSpan.className = "bsrch-value";
      valueSpan.textContent = arr[i];
      cell.appendChild(valueSpan);

      const indexSpan = document.createElement("span");
      indexSpan.className = "bsrch-index";
      indexSpan.textContent = i;
      cell.appendChild(indexSpan);

      if (step) {
        if (step.found && step.mid === i) {
          // Found target — highlight green
          cell.classList.add("bsrch-found");
        } else if (step.mid === i && step.comparison !== "none") {
          // Currently checking mid
          cell.classList.add("bsrch-mid");
        } else if (eliminatedIndices.has(i)) {
          // Previously eliminated
          cell.classList.add("bsrch-eliminated");
        } else if (
          step.low >= 0 &&
          step.high >= 0 &&
          i >= step.low &&
          i <= step.high
        ) {
          // Active search space
          cell.classList.add("bsrch-active");
        } else if (step.low >= 0 || step.high >= 0) {
          // Outside search space
          cell.classList.add("bsrch-eliminated");
        }

        // Mark target value with a border indicator
        if (arr[i] === step.target && !step.found) {
          cell.classList.add("bsrch-target-marker");
        }
      }

      arrayContainer.appendChild(cell);
    }
  }

  // --- Render pointer labels below cells ---
  function renderPointers(arr, step) {
    pointerLabels.innerHTML = "";

    if (!step || step.low < 0) return;

    for (let i = 0; i < arr.length; i++) {
      const slot = document.createElement("div");
      slot.className = "bsrch-pointer-slot";

      const labels = [];
      if (i === step.low) labels.push("low");
      if (i === step.mid) labels.push("mid");
      if (i === step.high) labels.push("high");

      for (const lbl of labels) {
        const span = document.createElement("span");
        span.className = "bsrch-pointer-label bsrch-" + lbl + "-label";
        span.textContent = lbl;
        slot.appendChild(span);
      }

      pointerLabels.appendChild(slot);
    }
  }

  // --- Update analogy text based on step ---
  function updateAnalogy(step) {
    if (!step) {
      analogyEl.innerHTML =
        "<strong>Dictionary analogy:</strong> Imagine searching for a word in a dictionary. " +
        "You open to the middle page, check if your word comes before or after, " +
        "then eliminate half the dictionary with each comparison.";
      return;
    }

    let text = "";
    if (step.comparison === "equal") {
      text =
        "You opened the dictionary to page " +
        step.mid +
        " and found the word! Search complete.";
    } else if (step.comparison === "greater") {
      text =
        "Page " +
        step.mid +
        " shows \"" +
        step.arr[step.mid] +
        "\", which comes AFTER \"" +
        step.target +
        "\". " +
        "Flip to the LEFT half of remaining pages.";
    } else if (step.comparison === "less") {
      text =
        "Page " +
        step.mid +
        " shows \"" +
        step.arr[step.mid] +
        "\", which comes BEFORE \"" +
        step.target +
        "\". " +
        "Flip to the RIGHT half of remaining pages.";
    } else {
      text = "The word is not in this dictionary. All pages checked.";
    }

    analogyEl.textContent = "";
    const strong = document.createElement("strong");
    strong.textContent = "Dictionary analogy: ";
    analogyEl.appendChild(strong);
    analogyEl.appendChild(document.createTextNode(text));
  }

  // --- Update stats ---
  function updateStats() {
    if (stepIdx < 0 || !searchResult) {
      stepsStat.textContent = "0";
      remainingStat.textContent = currentArr.length.toString();
      stepStat.textContent = "0 / " + steps.length;
      return;
    }

    const step = steps[stepIdx];
    stepsStat.textContent = step.step.toString();

    // Calculate remaining search space
    let remaining;
    if (step.found) {
      remaining = 1;
    } else if (step.low >= 0 && step.high >= 0 && step.high >= step.low) {
      remaining = step.high - step.low + 1;
    } else {
      remaining = 0;
    }
    remainingStat.textContent = remaining.toString();
    stepStat.textContent = (stepIdx + 1) + " / " + steps.length;
  }

  // --- Update info ---
  function updateInfo() {
    if (stepIdx < 0) {
      infoEl.textContent =
        "Click Play or Step to start searching for " + currentTarget + ".";
      return;
    }
    const step = steps[stepIdx];
    infoEl.textContent = step.explanation;
  }

  // --- Playback controls ---
  function getDelay() {
    const spd = parseInt(speedSlider.value, 10);
    return Math.round(1200 / spd);
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

  // --- Track eliminated indices cumulatively ---
  function updateEliminated() {
    eliminatedIndices = new Set();
    for (let i = 0; i <= stepIdx; i++) {
      const s = steps[i];
      if (s.eliminated === "left" && s.low >= 0) {
        for (let j = s.low; j <= s.mid; j++) {
          eliminatedIndices.add(j);
        }
      } else if (s.eliminated === "right" && s.high >= 0) {
        for (let j = s.mid; j <= s.high; j++) {
          eliminatedIndices.add(j);
        }
      }
    }
  }

  function stepForward() {
    if (stepIdx >= steps.length - 1) {
      stopPlay();
      showResult();
      return;
    }

    stepIdx++;
    updateEliminated();
    const step = steps[stepIdx];

    renderArray(currentArr, step);
    renderPointers(currentArr, step);
    updateAnalogy(step);
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
      eliminatedIndices = new Set();
      renderArray(currentArr, null);
      renderPointers(currentArr, null);
      updateAnalogy(null);
    } else {
      updateEliminated();
      const step = steps[stepIdx];
      renderArray(currentArr, step);
      renderPointers(currentArr, step);
      updateAnalogy(step);
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
    eliminatedIndices = new Set();
    renderArray(currentArr, null);
    renderPointers(currentArr, null);
    updateAnalogy(null);
    resultEl.classList.add("hidden");
    updateStats();
    updateInfo();
    updateButtons();
  }

  function showResult() {
    if (!searchResult) return;
    if (searchResult.found) {
      resultEl.textContent =
        "Found " +
        currentTarget +
        " at index " +
        searchResult.foundIndex +
        " in " +
        (steps.length - 1) +
        " step(s).";
    } else {
      resultEl.textContent =
        "Target " +
        currentTarget +
        " not found after " +
        (steps.length - 1) +
        " step(s).";
    }
    resultEl.classList.remove("hidden");
  }

  // --- Visualize ---
  function visualize() {
    stopPlay();

    const arr = parseInputs();
    if (arr.length === 0) {
      infoEl.textContent = "Error: Enter at least one value.";
      return;
    }

    if (arr.length > MAX_ARRAY_SIZE) {
      infoEl.textContent =
        "Error: Maximum array size is " + MAX_ARRAY_SIZE + " elements.";
      return;
    }

    const target = parseTarget();
    if (target === null) {
      infoEl.textContent = "Error: Target must be a valid number.";
      return;
    }

    if (Math.abs(target) > MAX_VALUE) {
      infoEl.textContent =
        "Error: Target must be between -" + MAX_VALUE + " and " + MAX_VALUE + ".";
      return;
    }

    // Sort the array for binary search
    const sorted = arr.slice().sort((a, b) => a - b);
    valuesInput.value = sorted.join(", ");

    currentArr = sorted;
    currentTarget = target;

    // Run algorithm — calls BinarySearchAlgorithm.search (from binary-search-algorithm.js)
    searchResult = BinarySearchAlgorithm.search(sorted, target);
    steps = searchResult.steps;
    stepIdx = -1;
    eliminatedIndices = new Set();

    // Render initial state
    renderArray(currentArr, null);
    renderPointers(currentArr, null);
    updateAnalogy(null);
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
  targetInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") visualize();
  });

  // Auto-init
  visualize();
})();
