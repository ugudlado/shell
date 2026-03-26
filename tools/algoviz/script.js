(() => {
  "use strict";

  // --- DOM refs ---
  const elA = document.getElementById("stringA");
  const elB = document.getElementById("stringB");
  const btnVisualize = document.getElementById("btnVisualize");
  const playbackDiv = document.getElementById("playback");
  const btnReset = document.getElementById("btnReset");
  const btnStepBack = document.getElementById("btnStepBack");
  const btnPlay = document.getElementById("btnPlay");
  const btnPause = document.getElementById("btnPause");
  const btnStep = document.getElementById("btnStep");
  const speedSlider = document.getElementById("speed");
  const container = document.getElementById("matrix-container");
  const infoEl = document.getElementById("info");
  const resultEl = document.getElementById("result");

  // --- State ---
  let source = "";
  let target = "";
  let dp = [];
  let ops = [];       // operation per cell: "match"|"substitute"|"insert"|"delete"|"base"
  let steps = [];     // ordered: { i, j, value, op, desc }
  let stepIdx = -1;   // -1 = nothing revealed yet
  let timer = null;
  let isPlaying = false;
  let cells = [];     // cells[i][j] = <td> element
  let traceback = []; // [{i, j}, ...] optimal path

  // --- Levenshtein computation ---
  function compute() {
    source = elA.value;
    target = elB.value;
    const m = source.length;
    const n = target.length;

    dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    ops = Array.from({ length: m + 1 }, () => Array(n + 1).fill("base"));
    steps = [];

    // Fill matrix in row-major order
    for (let i = 0; i <= m; i++) {
      for (let j = 0; j <= n; j++) {
        let op, desc;

        if (i === 0 && j === 0) {
          dp[i][j] = 0;
          op = "match";
          desc = "Base case: empty strings, distance = 0";
        } else if (i === 0) {
          dp[i][j] = j;
          op = "insert";
          desc = "Insert '" + target[j - 1] + "' \u2014 distance = " + j;
        } else if (j === 0) {
          dp[i][j] = i;
          op = "delete";
          desc = "Delete '" + source[i - 1] + "' \u2014 distance = " + i;
        } else {
          const cost = source[i - 1] === target[j - 1] ? 0 : 1;
          const diag = dp[i - 1][j - 1] + cost;
          const up = dp[i - 1][j] + 1;
          const left = dp[i][j - 1] + 1;
          const minVal = Math.min(diag, up, left);
          dp[i][j] = minVal;

          if (minVal === diag) {
            if (cost === 0) {
              op = "match";
              desc = "Match '" + source[i - 1] + "' = '" + target[j - 1] + "' \u2014 distance = " + minVal;
            } else {
              op = "substitute";
              desc = "Substitute '" + source[i - 1] + "' \u2192 '" + target[j - 1] + "' \u2014 distance = " + minVal;
            }
          } else if (minVal === up) {
            op = "delete";
            desc = "Delete '" + source[i - 1] + "' \u2014 distance = " + minVal;
          } else {
            op = "insert";
            desc = "Insert '" + target[j - 1] + "' \u2014 distance = " + minVal;
          }
        }

        ops[i][j] = op;
        steps.push({ i, j, value: dp[i][j], op, desc });
      }
    }

    // Compute traceback from (m, n) to (0, 0)
    traceback = [];
    let ti = m;
    let tj = n;
    while (ti > 0 || tj > 0) {
      traceback.push({ i: ti, j: tj });
      if (ti === 0) {
        tj--;
      } else if (tj === 0) {
        ti--;
      } else {
        const cost = source[ti - 1] === target[tj - 1] ? 0 : 1;
        const diag = dp[ti - 1][tj - 1] + cost;
        const up = dp[ti - 1][tj] + 1;
        const left = dp[ti][tj - 1] + 1;
        const minVal = Math.min(diag, up, left);
        if (minVal === diag) { ti--; tj--; }
        else if (minVal === up) { ti--; }
        else { tj--; }
      }
    }
    traceback.push({ i: 0, j: 0 });
    traceback.reverse();
  }

  // --- Render empty table ---
  function renderTable() {
    const m = source.length;
    const n = target.length;
    const table = document.createElement("table");

    // Header row: corner | epsilon | target chars
    const headRow = document.createElement("tr");
    headRow.appendChild(mkTh(""));
    headRow.appendChild(mkTh("\u03B5"));
    for (let j = 0; j < n; j++) headRow.appendChild(mkTh(target[j]));
    table.appendChild(headRow);

    cells = [];
    for (let i = 0; i <= m; i++) {
      const tr = document.createElement("tr");
      tr.appendChild(mkTh(i === 0 ? "\u03B5" : source[i - 1]));
      cells[i] = [];
      for (let j = 0; j <= n; j++) {
        const td = document.createElement("td");
        td.innerHTML = '<span class="cell-val"></span><span class="op-label"></span>';
        tr.appendChild(td);
        cells[i][j] = td;
      }
      table.appendChild(tr);
    }

    container.innerHTML = "";
    container.appendChild(table);
  }

  function mkTh(text) {
    const el = document.createElement("th");
    el.textContent = text;
    return el;
  }

  function getOpLabel(op) {
    switch (op) {
      case "match": return "M";
      case "substitute": return "S";
      case "insert": return "I";
      case "delete": return "D";
      default: return "";
    }
  }

  function getOpClass(op) {
    switch (op) {
      case "match": return "match";
      case "substitute": return "substitute";
      case "insert": return "insert";
      case "delete": return "delete";
      default: return "";
    }
  }

  // --- Cell operations ---
  function fillCell(idx) {
    const s = steps[idx];
    if (!s) return;
    const td = cells[s.i][s.j];
    td.querySelector(".cell-val").textContent = s.value;
    td.querySelector(".op-label").textContent = getOpLabel(s.op);
    td.className = "filled " + getOpClass(s.op);
  }

  function unfillCell(idx) {
    const s = steps[idx];
    if (!s) return;
    const td = cells[s.i][s.j];
    td.querySelector(".cell-val").textContent = "";
    td.querySelector(".op-label").textContent = "";
    td.className = "";
  }

  function clearCurrentHighlight() {
    const el = container.querySelector("td.current");
    if (el) el.classList.remove("current");
  }

  function setCurrentHighlight() {
    clearCurrentHighlight();
    if (stepIdx >= 0 && stepIdx < steps.length) {
      const s = steps[stepIdx];
      cells[s.i][s.j].classList.add("current");
    }
  }

  function updateInfo() {
    if (stepIdx < 0) {
      infoEl.innerHTML = 'Click <strong>Play</strong> or <strong>Step \u2192</strong> to fill the matrix.';
      return;
    }
    const s = steps[stepIdx];
    const total = steps.length;
    infoEl.textContent = "Step " + (stepIdx + 1) + "/" + total +
      " \u2014 Cell (" + s.i + "," + s.j + "): " + s.desc;
  }

  // --- Traceback ---
  function showTraceback() {
    clearTraceback();
    for (const c of traceback) {
      cells[c.i][c.j].classList.add("traceback");
    }
    const dist = dp[source.length][target.length];
    resultEl.textContent = "Edit distance: " + dist;
    resultEl.classList.remove("hidden");

    // Update info panel with traceback operation descriptions
    const parts = [];
    for (let k = 1; k < traceback.length; k++) {
      const cur = traceback[k];
      const op = ops[cur.i][cur.j];
      if (op === "match") {
        parts.push("Match '" + source[cur.i - 1] + "'");
      } else if (op === "substitute") {
        parts.push("Substitute '" + source[cur.i - 1] + "' \u2192 '" + target[cur.j - 1] + "'");
      } else if (op === "insert") {
        parts.push("Insert '" + target[cur.j - 1] + "'");
      } else if (op === "delete") {
        parts.push("Delete '" + source[cur.i - 1] + "'");
      }
    }
    infoEl.textContent = "Traceback: " + parts.join(" \u2192 ");
  }

  function clearTraceback() {
    const els = container.querySelectorAll("td.traceback");
    els.forEach(el => el.classList.remove("traceback"));
    resultEl.classList.add("hidden");
  }

  // --- Playback ---
  function getDelay() {
    // Speed 1 = 800ms, speed 10 = 50ms
    const spd = parseInt(speedSlider.value, 10);
    return Math.round(850 / spd);
  }

  function stepForward() {
    if (stepIdx >= steps.length - 1) {
      // Already at end
      stopPlay();
      if (stepIdx === steps.length - 1) showTraceback();
      return;
    }

    clearTraceback();
    stepIdx++;
    fillCell(stepIdx);
    setCurrentHighlight();
    updateInfo();
    updateButtons();

    if (stepIdx === steps.length - 1) {
      setTimeout(() => {
        clearCurrentHighlight();
        showTraceback();
        stopPlay();
        updateButtons();
      }, getDelay() / 2);
    }
  }

  function stepBackward() {
    if (stepIdx < 0) return;
    clearTraceback();
    clearCurrentHighlight();
    unfillCell(stepIdx);
    stepIdx--;
    if (stepIdx >= 0) setCurrentHighlight();
    updateInfo();
    updateButtons();
  }

  function startPlay() {
    if (stepIdx >= steps.length - 1) {
      // At end, reset first
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
    clearTraceback();
    clearCurrentHighlight();
    // Unfill all cells
    for (let idx = steps.length - 1; idx >= 0; idx--) {
      unfillCell(idx);
    }
    stepIdx = -1;
    updateInfo();
    updateButtons();
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
    compute();
    renderTable();
    stepIdx = -1;
    playbackDiv.classList.remove("hidden");
    resultEl.classList.add("hidden");
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
      // Restart timer with new speed
      if (timer !== null) { clearTimeout(timer); timer = null; }
      timer = setTimeout(tick, getDelay());
    }
  });

  // Enter key triggers visualize
  elA.addEventListener("keydown", e => { if (e.key === "Enter") visualize(); });
  elB.addEventListener("keydown", e => { if (e.key === "Enter") visualize(); });

  // Auto-init
  visualize();
})();
