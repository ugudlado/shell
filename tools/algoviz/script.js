(() => {
  "use strict";

  // DOM refs
  const elA = document.getElementById("stringA");
  const elB = document.getElementById("stringB");
  const btnReset = document.getElementById("btnReset");
  const btnPlay = document.getElementById("btnPlay");
  const btnPause = document.getElementById("btnPause");
  const btnStep = document.getElementById("btnStep");
  const speedSlider = document.getElementById("speed");
  const container = document.getElementById("matrix-container");
  const resultEl = document.getElementById("result");

  // State
  let a = "";
  let b = "";
  let dp = [];
  let ops = [];
  let steps = [];
  let stepIdx = 0;
  let timer = null;
  let cells = [];

  // ---- Build DP data (but don't reveal yet) ----
  function compute() {
    a = elA.value;
    b = elB.value;
    const m = a.length;
    const n = b.length;

    dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    ops = Array.from({ length: m + 1 }, () => Array(n + 1).fill("base"));
    steps = [];

    // Base cases
    for (let i = 0; i <= m; i++) { dp[i][0] = i; ops[i][0] = "base"; steps.push({ i, j: 0 }); }
    for (let j = 1; j <= n; j++) { dp[0][j] = j; ops[0][j] = "base"; steps.push({ i: 0, j }); }

    // Fill
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
          ops[i][j] = "match";
        } else {
          const sub = dp[i - 1][j - 1] + 1;
          const ins = dp[i][j - 1] + 1;
          const del = dp[i - 1][j] + 1;
          const min = Math.min(sub, ins, del);
          dp[i][j] = min;
          if (min === sub) ops[i][j] = "sub";
          else if (min === ins) ops[i][j] = "ins";
          else ops[i][j] = "del";
        }
        steps.push({ i, j });
      }
    }
  }

  // ---- Render empty table ----
  function renderTable() {
    const m = a.length;
    const n = b.length;
    const table = document.createElement("table");

    // Header row: empty | empty | b chars
    const headRow = document.createElement("tr");
    headRow.appendChild(mkTh(""));
    headRow.appendChild(mkTh(""));
    for (let j = 0; j < n; j++) headRow.appendChild(mkTh(b[j]));
    table.appendChild(headRow);

    cells = [];

    for (let i = 0; i <= m; i++) {
      const tr = document.createElement("tr");
      tr.appendChild(mkTh(i === 0 ? "" : a[i - 1]));
      cells[i] = [];
      for (let j = 0; j <= n; j++) {
        const td = document.createElement("td");
        td.textContent = "";
        tr.appendChild(td);
        cells[i][j] = td;
      }
      table.appendChild(tr);
    }

    container.innerHTML = "";
    container.appendChild(table);
    resultEl.classList.add("hidden");
  }

  function mkTh(text) {
    const el = document.createElement("th");
    el.textContent = text;
    return el;
  }

  // ---- Reveal one step ----
  function revealStep(idx) {
    if (idx >= steps.length) return false;
    // Remove "current" from previous
    if (idx > 0) {
      const prev = steps[idx - 1];
      cells[prev.i][prev.j].classList.remove("current");
    }
    const { i, j } = steps[idx];
    const td = cells[i][j];
    td.textContent = dp[i][j];
    td.classList.add("filled", "current");

    const op = ops[i][j];
    if (op === "match") td.classList.add("match");
    else if (op === "sub") td.classList.add("substitute");
    else if (op === "ins") td.classList.add("insert");
    else if (op === "del") td.classList.add("delete");

    return true;
  }

  function finishAnimation() {
    if (steps.length > 0) {
      const last = steps[steps.length - 1];
      cells[last.i][last.j].classList.remove("current");
    }
    resultEl.textContent = "Edit distance: " + dp[a.length][b.length];
    resultEl.classList.remove("hidden");
    stopTimer();
    btnPlay.disabled = true;
    btnPause.disabled = true;
    btnStep.disabled = true;
  }

  // ---- Controls ----
  function reset() {
    stopTimer();
    compute();
    renderTable();
    stepIdx = 0;
    btnPlay.disabled = false;
    btnPause.disabled = true;
    btnStep.disabled = false;
  }

  function play() {
    btnPlay.disabled = true;
    btnPause.disabled = false;
    btnStep.disabled = true;
    tick();
  }

  function tick() {
    if (stepIdx >= steps.length) { finishAnimation(); return; }
    revealStep(stepIdx);
    stepIdx++;
    if (stepIdx >= steps.length) { finishAnimation(); return; }
    const delay = 1050 - parseInt(speedSlider.value, 10);
    timer = setTimeout(tick, delay);
  }

  function pause() {
    stopTimer();
    if (stepIdx > 0) {
      const prev = steps[stepIdx - 1];
      cells[prev.i][prev.j].classList.remove("current");
    }
    btnPlay.disabled = false;
    btnPause.disabled = true;
    btnStep.disabled = false;
  }

  function step() {
    if (stepIdx >= steps.length) { finishAnimation(); return; }
    revealStep(stepIdx);
    stepIdx++;
    if (stepIdx >= steps.length) finishAnimation();
  }

  function stopTimer() {
    if (timer !== null) { clearTimeout(timer); timer = null; }
  }

  // ---- Wire up ----
  btnReset.addEventListener("click", reset);
  btnPlay.addEventListener("click", play);
  btnPause.addEventListener("click", pause);
  btnStep.addEventListener("click", step);

  // Init
  reset();
})();
