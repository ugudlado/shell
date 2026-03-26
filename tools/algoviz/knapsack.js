/**
 * Knapsack Visualization — DOM logic, animation, playback controls
 */
(() => {
  "use strict";

  // --- Default items ---
  const DEFAULT_ITEMS = [
    { weight: 2, value: 3 },
    { weight: 3, value: 4 },
    { weight: 4, value: 5 },
    { weight: 5, value: 6 },
  ];

  // --- State ---
  let items = DEFAULT_ITEMS.map((it) => ({ ...it }));
  let solveResult = null;
  let currentStep = -1;
  let animationTimer = null;
  let tableEl = null;
  let cellMap = {}; // "row,col" -> td element

  // --- DOM refs ---
  const itemListEl = document.getElementById("itemList");
  const capacityEl = document.getElementById("capacity");
  const btnVisualize = document.getElementById("btnVisualize");
  const btnPlay = document.getElementById("btnPlay");
  const btnPause = document.getElementById("btnPause");
  const btnStep = document.getElementById("btnStep");
  const btnStepBack = document.getElementById("btnStepBack");
  const btnReset = document.getElementById("btnReset");
  const btnAddItem = document.getElementById("btnAddItem");
  const playbackEl = document.getElementById("playback");
  const infoEl = document.getElementById("info");
  const matrixEl = document.getElementById("matrix-container");
  const resultEl = document.getElementById("result");
  const speedEl = document.getElementById("speed");

  // --- Item configuration ---
  function renderItems() {
    let html = "";
    for (let i = 0; i < items.length; i++) {
      html +=
        '<div class="item-row">' +
        '<span class="item-label">' +
        (i + 1) +
        "</span>" +
        '<label>W: <input type="number" class="item-weight" data-idx="' +
        i +
        '" value="' +
        items[i].weight +
        '" min="1" max="50"></label>' +
        '<label>V: <input type="number" class="item-value" data-idx="' +
        i +
        '" value="' +
        items[i].value +
        '" min="1" max="99"></label>' +
        '<button class="btn-remove" data-idx="' +
        i +
        '">x</button>' +
        "</div>";
    }
    itemListEl.innerHTML = html;

    // Attach event listeners
    itemListEl.querySelectorAll(".item-weight").forEach((el) => {
      el.addEventListener("change", (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        items[idx].weight = Math.max(1, parseInt(e.target.value, 10) || 1);
      });
    });
    itemListEl.querySelectorAll(".item-value").forEach((el) => {
      el.addEventListener("change", (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        items[idx].value = Math.max(1, parseInt(e.target.value, 10) || 1);
      });
    });
    itemListEl.querySelectorAll(".btn-remove").forEach((el) => {
      el.addEventListener("click", (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        if (items.length > 1) {
          items.splice(idx, 1);
          renderItems();
        }
      });
    });
  }

  btnAddItem.addEventListener("click", () => {
    if (items.length < 10) {
      items.push({ weight: 1, value: 1 });
      renderItems();
    }
  });

  // --- Build table ---
  function buildTable(nItems, capacity) {
    cellMap = {};
    const table = document.createElement("table");

    // Header row: empty corner + capacities 0..W
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    const cornerTh = document.createElement("th");
    cornerTh.textContent = "";
    headerRow.appendChild(cornerTh);
    for (let w = 0; w <= capacity; w++) {
      const th = document.createElement("th");
      th.textContent = w;
      headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body rows
    const tbody = document.createElement("tbody");
    for (let i = 0; i <= nItems; i++) {
      const tr = document.createElement("tr");
      const rowHeader = document.createElement("th");
      rowHeader.className = "row-header";
      if (i === 0) {
        rowHeader.textContent = "0 (base)";
      } else {
        const it = items[i - 1];
        rowHeader.textContent = i + " (w=" + it.weight + ",v=" + it.value + ")";
      }
      tr.appendChild(rowHeader);

      for (let w = 0; w <= capacity; w++) {
        const td = document.createElement("td");
        if (i === 0) {
          // Base case row: show 0
          td.textContent = "0";
          td.classList.add("filled", "skip");
        }
        cellMap[i + "," + w] = td;
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);

    matrixEl.innerHTML = "";
    matrixEl.appendChild(table);
    tableEl = table;
  }

  // --- Visualization ---
  function visualize() {
    stopAnimation();
    const capacity = Math.max(0, parseInt(capacityEl.value, 10) || 0);

    // Read items from inputs
    readItemsFromInputs();

    if (items.length === 0 || capacity < 0) {
      infoEl.textContent = "Add at least one item and set capacity >= 0.";
      return;
    }

    solveResult = KnapsackAlgorithm.solve(items, capacity);
    currentStep = -1;

    buildTable(items.length, capacity);

    playbackEl.classList.remove("hidden");
    resultEl.classList.add("hidden");
    btnPlay.disabled = false;
    btnPause.disabled = true;
    infoEl.innerHTML =
      "Ready. <strong>" +
      solveResult.steps.length +
      "</strong> cells to fill. Press Play or Step.";
  }

  function readItemsFromInputs() {
    const weightInputs = itemListEl.querySelectorAll(".item-weight");
    const valueInputs = itemListEl.querySelectorAll(".item-value");
    for (let i = 0; i < items.length; i++) {
      if (weightInputs[i]) {
        items[i].weight = Math.max(
          1,
          parseInt(weightInputs[i].value, 10) || 1
        );
      }
      if (valueInputs[i]) {
        items[i].value = Math.max(1, parseInt(valueInputs[i].value, 10) || 1);
      }
    }
  }

  // --- Step rendering ---
  function renderStep(stepIdx) {
    if (!solveResult) return;

    // Clear previous current highlight
    const prevCurrent = tableEl.querySelector("td.current");
    if (prevCurrent) prevCurrent.classList.remove("current");

    if (stepIdx < 0 || stepIdx >= solveResult.steps.length) return;

    const step = solveResult.steps[stepIdx];
    const cell = cellMap[step.row + "," + step.col];
    if (!cell) return;

    cell.textContent = step.value;
    cell.classList.add("filled");
    cell.classList.add(step.take ? "take" : "skip");
    cell.classList.add("current");

    infoEl.textContent = step.explanation;
  }

  function clearStepsAfter(stepIdx) {
    if (!solveResult) return;
    for (let i = stepIdx + 1; i < solveResult.steps.length; i++) {
      const step = solveResult.steps[i];
      const cell = cellMap[step.row + "," + step.col];
      if (cell) {
        cell.textContent = "";
        cell.className = "";
      }
    }
    // Clear traceback
    clearTraceback();
  }

  function clearTraceback() {
    if (!tableEl) return;
    tableEl.querySelectorAll("td.traceback").forEach((td) => {
      td.classList.remove("traceback");
    });
    resultEl.classList.add("hidden");
  }

  function showTraceback() {
    if (!solveResult) return;
    const tb = solveResult.traceback;

    // Highlight traceback path
    for (const p of tb.path) {
      const cell = cellMap[p.row + "," + p.col];
      if (cell) cell.classList.add("traceback");
    }

    // Show result
    let html =
      "Optimal value: <strong>" +
      tb.totalValue +
      "</strong> (weight: " +
      tb.totalWeight +
      ")";
    if (tb.selectedItems.length > 0) {
      html += '<div class="result-items">Selected: ';
      for (const idx of tb.selectedItems) {
        const it = items[idx];
        html +=
          '<span class="selected-item">Item ' +
          (idx + 1) +
          " (w=" +
          it.weight +
          ", v=" +
          it.value +
          ")</span>";
      }
      html += "</div>";
    } else {
      html += '<div class="result-items">No items selected.</div>';
    }
    resultEl.innerHTML = html;
    resultEl.classList.remove("hidden");

    infoEl.textContent =
      "Traceback complete. Optimal value = " +
      tb.totalValue +
      ", selected " +
      tb.selectedItems.length +
      " item(s).";
  }

  // --- Playback ---
  function stepForward() {
    if (!solveResult) return;
    if (currentStep < solveResult.steps.length - 1) {
      currentStep++;
      renderStep(currentStep);
      if (currentStep === solveResult.steps.length - 1) {
        stopAnimation();
        showTraceback();
      }
    }
  }

  function stepBack() {
    if (!solveResult || currentStep < 0) return;
    // Remove current step's cell data
    const step = solveResult.steps[currentStep];
    const cell = cellMap[step.row + "," + step.col];
    if (cell) {
      cell.textContent = "";
      cell.className = "";
    }
    clearTraceback();
    currentStep--;
    if (currentStep >= 0) {
      // Re-highlight previous step as current
      const prevCurrent = tableEl.querySelector("td.current");
      if (prevCurrent) prevCurrent.classList.remove("current");
      const prevStep = solveResult.steps[currentStep];
      const prevCell = cellMap[prevStep.row + "," + prevStep.col];
      if (prevCell) prevCell.classList.add("current");
      infoEl.textContent = prevStep.explanation;
    } else {
      const prevCurrent = tableEl.querySelector("td.current");
      if (prevCurrent) prevCurrent.classList.remove("current");
      infoEl.innerHTML =
        "Ready. <strong>" +
        solveResult.steps.length +
        "</strong> cells to fill. Press Play or Step.";
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
    // Rebuild clean table
    const capacity = Math.max(0, parseInt(capacityEl.value, 10) || 0);
    buildTable(items.length, capacity);
    resultEl.classList.add("hidden");
    infoEl.innerHTML =
      "Ready. <strong>" +
      solveResult.steps.length +
      "</strong> cells to fill. Press Play or Step.";
  }

  // --- Event listeners ---
  btnVisualize.addEventListener("click", visualize);
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

  // --- Init ---
  renderItems();
})();
