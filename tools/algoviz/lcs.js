/**
 * LCS Visualization — DOM logic, animation, playback controls
 * Calls LCSAlgorithm.solve() from lcs-algorithm.js (no duplicated logic).
 */
(() => {
  "use strict";

  // --- Constants ---
  const MAX_LENGTH = 15;
  const RANDOM_PAIRS = [
    ["ABCBDAB", "BDCAB"],
    ["AGGTAB", "GXTXAYB"],
    ["kitten", "sitting"],
    ["sunday", "saturday"],
    ["ACCGGTCG", "GTCGTTCG"],
    ["abcdef", "ace"],
    ["intention", "execution"],
    ["horse", "ros"],
  ];

  // --- State ---
  let solveResult = null;
  let currentStep = -1;
  let animationTimer = null;
  let tableEl = null;
  let cellMap = {}; // "row,col" -> td element
  let stepCount = 0; // explicit step counter for display

  // --- DOM refs ---
  const stringAEl = document.getElementById("stringA");
  const stringBEl = document.getElementById("stringB");
  const btnVisualize = document.getElementById("btnVisualize");
  const btnRandom = document.getElementById("btnRandom");
  const btnPlay = document.getElementById("btnPlay");
  const btnPause = document.getElementById("btnPause");
  const btnStep = document.getElementById("btnStep");
  const btnStepBack = document.getElementById("btnStepBack");
  const btnReset = document.getElementById("btnReset");
  const playbackEl = document.getElementById("playback");
  const infoEl = document.getElementById("info");
  const matrixEl = document.getElementById("matrix-container");
  const resultEl = document.getElementById("result");
  const speedEl = document.getElementById("speed");

  // --- Input validation ---
  function validateInputs() {
    const a = stringAEl.value;
    const b = stringBEl.value;

    if (a.length === 0 || b.length === 0) {
      infoEl.textContent = "Both strings must be non-empty.";
      infoEl.classList.add("lcs-error");
      return null;
    }

    if (a.length > MAX_LENGTH) {
      infoEl.textContent =
        "String A is too long (max " + MAX_LENGTH + " characters).";
      infoEl.classList.add("lcs-error");
      return null;
    }

    if (b.length > MAX_LENGTH) {
      infoEl.textContent =
        "String B is too long (max " + MAX_LENGTH + " characters).";
      infoEl.classList.add("lcs-error");
      return null;
    }

    infoEl.classList.remove("lcs-error");
    return { a: a, b: b };
  }

  // --- Build table ---
  function buildTable(strA, strB) {
    cellMap = {};
    const m = strA.length;
    const n = strB.length;
    const table = document.createElement("table");

    // Header row: empty corner + empty + B chars
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    // Corner cell
    const cornerTh = document.createElement("th");
    cornerTh.textContent = "";
    headerRow.appendChild(cornerTh);

    // Empty column header (for col 0)
    const emptyTh = document.createElement("th");
    emptyTh.textContent = "-";
    headerRow.appendChild(emptyTh);

    // B characters as column headers
    for (let j = 0; j < n; j++) {
      const th = document.createElement("th");
      th.textContent = strB[j];
      headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body rows
    const tbody = document.createElement("tbody");
    for (let i = 0; i <= m; i++) {
      const tr = document.createElement("tr");

      // Row header: "-" for row 0, then A chars
      const rowHeader = document.createElement("th");
      rowHeader.textContent = i === 0 ? "-" : strA[i - 1];
      tr.appendChild(rowHeader);

      for (let j = 0; j <= n; j++) {
        const td = document.createElement("td");
        if (i === 0 || j === 0) {
          // Base case: show 0
          td.textContent = "0";
          td.classList.add("filled", "lcs-nomatch");
        }
        cellMap[i + "," + j] = td;
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);

    matrixEl.textContent = "";
    matrixEl.appendChild(table);
    tableEl = table;
  }

  // --- Visualization ---
  function visualize() {
    stopAnimation();
    const input = validateInputs();
    if (!input) return;

    solveResult = LCSAlgorithm.solve(input.a, input.b);
    currentStep = -1;
    stepCount = 0;

    buildTable(input.a, input.b);

    playbackEl.classList.remove("hidden");
    resultEl.classList.add("hidden");
    btnPlay.disabled = false;
    btnPause.disabled = true;

    infoEl.textContent =
      "Ready. " +
      solveResult.steps.length +
      " cells to fill. Press Play or Step.";
  }

  // --- Step rendering ---
  function renderStep(stepIdx) {
    if (!solveResult) return;

    // Clear previous current highlight
    if (tableEl) {
      const prevCurrent = tableEl.querySelector("td.lcs-current");
      if (prevCurrent) prevCurrent.classList.remove("lcs-current");
    }

    if (stepIdx < 0 || stepIdx >= solveResult.steps.length) return;

    const step = solveResult.steps[stepIdx];
    const cell = cellMap[step.row + "," + step.col];
    if (!cell) return;

    cell.textContent = String(step.value);
    cell.classList.add("filled");
    cell.classList.add(step.isMatch ? "lcs-match" : "lcs-nomatch");
    cell.classList.add("lcs-current");

    infoEl.textContent =
      "Step " + stepCount + "/" + solveResult.steps.length + ": " +
      step.explanation;
  }

  function clearTraceback() {
    if (!tableEl) return;
    tableEl.querySelectorAll("td.lcs-traceback").forEach((td) => {
      td.classList.remove("lcs-traceback");
    });
    resultEl.classList.add("hidden");
  }

  function showTraceback() {
    if (!solveResult) return;
    const tb = solveResult.traceback;

    // Highlight traceback path
    for (let i = 0; i < tb.path.length; i++) {
      const p = tb.path[i];
      const cell = cellMap[p.row + "," + p.col];
      if (cell) cell.classList.add("lcs-traceback");
    }

    // Show result using textContent (no innerHTML for user text)
    resultEl.textContent = "";

    const titleSpan = document.createElement("span");
    titleSpan.textContent =
      "LCS length: " +
      solveResult.lcsString.length +
      (solveResult.lcsString.length > 0 ? " — " : "");
    resultEl.appendChild(titleSpan);

    if (solveResult.lcsString.length > 0) {
      const container = document.createElement("span");
      container.className = "lcs-result-string";
      for (let i = 0; i < solveResult.lcsString.length; i++) {
        const charSpan = document.createElement("span");
        charSpan.className = "lcs-char";
        charSpan.textContent = solveResult.lcsString[i];
        container.appendChild(charSpan);
      }
      resultEl.appendChild(container);
    } else {
      const noMatch = document.createElement("span");
      noMatch.textContent = "No common subsequence found.";
      resultEl.appendChild(noMatch);
    }

    resultEl.classList.remove("hidden");

    infoEl.textContent =
      "Traceback complete. LCS = \"" +
      solveResult.lcsString +
      "\" (length " +
      solveResult.lcsString.length +
      ")";
  }

  // --- Playback ---
  function stepForward() {
    if (!solveResult) return;
    if (currentStep < solveResult.steps.length - 1) {
      currentStep++;
      stepCount++;
      renderStep(currentStep);
      if (currentStep === solveResult.steps.length - 1) {
        stopAnimation();
        showTraceback();
      }
    }
  }

  function stepBack() {
    if (!solveResult || currentStep < 0) return;
    // Remove current step cell data
    const step = solveResult.steps[currentStep];
    const cell = cellMap[step.row + "," + step.col];
    if (cell) {
      cell.textContent = "";
      cell.className = "";
    }
    clearTraceback();
    currentStep--;
    stepCount--;
    if (currentStep >= 0) {
      // Re-highlight previous step as current
      if (tableEl) {
        const prevCurrent = tableEl.querySelector("td.lcs-current");
        if (prevCurrent) prevCurrent.classList.remove("lcs-current");
      }
      const prevStep = solveResult.steps[currentStep];
      const prevCell = cellMap[prevStep.row + "," + prevStep.col];
      if (prevCell) prevCell.classList.add("lcs-current");
      infoEl.textContent =
        "Step " + stepCount + "/" + solveResult.steps.length + ": " +
        prevStep.explanation;
    } else {
      if (tableEl) {
        const prevCurrent = tableEl.querySelector("td.lcs-current");
        if (prevCurrent) prevCurrent.classList.remove("lcs-current");
      }
      infoEl.textContent =
        "Ready. " +
        solveResult.steps.length +
        " cells to fill. Press Play or Step.";
    }
  }

  function getSpeed() {
    return 1100 - parseInt(speedEl.value, 10) * 100;
  }

  function play() {
    if (!solveResult) return;
    btnPlay.disabled = true;
    btnPause.disabled = false;
    animationTimer = setInterval(() => {
      if (currentStep >= solveResult.steps.length - 1) {
        stopAnimation();
        showTraceback();
        return;
      }
      stepForward();
    }, getSpeed());
  }

  function stopAnimation() {
    if (animationTimer) {
      clearInterval(animationTimer);
      animationTimer = null;
    }
    btnPlay.disabled = false;
    btnPause.disabled = true;
  }

  function reset() {
    stopAnimation();
    if (!solveResult) return;
    currentStep = -1;
    stepCount = 0;
    // Rebuild clean table
    const input = validateInputs();
    if (input) {
      buildTable(input.a, input.b);
    }
    resultEl.classList.add("hidden");
    infoEl.textContent =
      "Ready. " +
      solveResult.steps.length +
      " cells to fill. Press Play or Step.";
  }

  // --- Random example ---
  function randomExample() {
    const pair = RANDOM_PAIRS[Math.floor(Math.random() * RANDOM_PAIRS.length)];
    stringAEl.value = pair[0];
    stringBEl.value = pair[1];
  }

  // --- Event listeners ---
  btnVisualize.addEventListener("click", visualize);
  btnRandom.addEventListener("click", randomExample);
  btnPlay.addEventListener("click", play);
  btnPause.addEventListener("click", stopAnimation);
  btnStep.addEventListener("click", stepForward);
  btnStepBack.addEventListener("click", stepBack);
  btnReset.addEventListener("click", reset);

  // Speed change updates interval if playing
  speedEl.addEventListener("input", () => {
    if (animationTimer) {
      stopAnimation();
      play();
    }
  });

  // Enforce maxlength on inputs programmatically
  stringAEl.addEventListener("input", () => {
    if (stringAEl.value.length > MAX_LENGTH) {
      stringAEl.value = stringAEl.value.slice(0, MAX_LENGTH);
    }
  });

  stringBEl.addEventListener("input", () => {
    if (stringBEl.value.length > MAX_LENGTH) {
      stringBEl.value = stringBEl.value.slice(0, MAX_LENGTH);
    }
  });

  // Clean up timer on page unload
  window.addEventListener("beforeunload", () => {
    stopAnimation();
  });
})();
