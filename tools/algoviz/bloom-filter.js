/**
 * Bloom Filter — UI / Visualization
 *
 * All algorithm logic delegated to BloomFilterAlgorithm (bloom-filter-algorithm.js).
 * Uses textContent for user-visible text. Timers cleaned up on reset.
 */
(function () {
  "use strict";

  // --- DOM refs ---
  const wordInput = document.getElementById("bloom-wordInput");
  const mInput = document.getElementById("bloom-mInput");
  const kInput = document.getElementById("bloom-kInput");
  const btnInsert = document.getElementById("bloom-btnInsert");
  const btnQuery = document.getElementById("bloom-btnQuery");
  const btnPreset = document.getElementById("bloom-btnPreset");
  const btnReset = document.getElementById("bloom-btnReset");
  const errorEl = document.getElementById("bloom-error");
  const resultEl = document.getElementById("bloom-result");
  const bitArrayEl = document.getElementById("bloom-bitArray");
  const fpRateEl = document.getElementById("bloom-fpRate");
  const fpFormulaEl = document.getElementById("bloom-fpFormula");
  const fillValueEl = document.getElementById("bloom-fillValue");
  const fillBarEl = document.getElementById("bloom-fillBar");
  const fillWarningEl = document.getElementById("bloom-fillWarning");
  const itemCountEl = document.getElementById("bloom-itemCount");
  const wordsListEl = document.getElementById("bloom-wordsList");

  // --- State ---
  let filter = null;
  let highlightTimers = [];
  let presetTimer = null;

  // --- Init ---
  function init() {
    const m = clampInt(mInput.value, 16, 128, 32);
    const k = clampInt(kInput.value, 1, 7, 3);
    mInput.value = m;
    kInput.value = k;
    filter = BloomFilterAlgorithm.createFilter(m, k);
    renderBitArray();
    updateStats();
    clearResult();
    clearError();
    updateWordsList();
  }

  // --- Helpers ---
  function clampInt(val, min, max, fallback) {
    const n = parseInt(val, 10);
    if (isNaN(n)) return fallback;
    if (n < min) return min;
    if (n > max) return max;
    return n;
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.remove("hidden");
  }

  function clearError() {
    errorEl.textContent = "";
    errorEl.classList.add("hidden");
  }

  function clearResult() {
    resultEl.textContent = "";
    resultEl.className = "bloom-result";
  }

  function showResult(text, cssClass) {
    resultEl.textContent = text;
    resultEl.className = "bloom-result " + cssClass;
  }

  // --- Render bit array ---
  function renderBitArray() {
    bitArrayEl.innerHTML = "";
    for (let i = 0; i < filter.m; i++) {
      const cell = document.createElement("div");
      cell.className =
        "bloom-bit " + (filter.bits[i] === 1 ? "bloom-bit-on" : "bloom-bit-off");
      cell.textContent = filter.bits[i];
      cell.dataset.index = i;
      bitArrayEl.appendChild(cell);
    }
  }

  function highlightBits(indices, cssClass, duration) {
    const cells = bitArrayEl.children;
    for (let i = 0; i < indices.length; i++) {
      const idx = indices[i];
      if (idx < cells.length) {
        cells[idx].className = "bloom-bit " + cssClass;
      }
    }
    if (duration > 0) {
      const tid = setTimeout(function () {
        renderBitArray();
      }, duration);
      highlightTimers.push(tid);
    }
  }

  // --- Update stats ---
  function updateStats() {
    // FP rate
    const fpRate = BloomFilterAlgorithm.getFalsePositiveRate(
      filter.n,
      filter.m,
      filter.k,
    );
    fpRateEl.textContent = (fpRate * 100).toFixed(4) + "%";
    fpFormulaEl.textContent =
      "P(fp) = (1 - e^(-" +
      filter.k +
      "\u00D7" +
      filter.n +
      "/" +
      filter.m +
      "))^" +
      filter.k +
      " = " +
      fpRate.toFixed(6);

    // Fill level
    const fill = BloomFilterAlgorithm.getFillLevel(filter);
    fillValueEl.textContent =
      fill.setBits +
      " / " +
      fill.total +
      " bits (" +
      fill.percentage.toFixed(1) +
      "%)";
    fillBarEl.style.width = fill.percentage + "%";

    // Fill meter color
    if (fill.percentage >= 75) {
      fillBarEl.style.background = "#f85149";
    } else if (fill.percentage >= 50) {
      fillBarEl.style.background = "#d29922";
    } else {
      fillBarEl.style.background = "#3fb950";
    }

    // Fill warning
    if (fill.percentage >= 75) {
      fillWarningEl.textContent =
        "Warning: Filter is " +
        fill.percentage.toFixed(0) +
        "% full — very high false positive rate!";
      fillWarningEl.className = "bloom-fill-warning bloom-fill-danger";
      fillWarningEl.style.display = "";
    } else if (fill.percentage > 50) {
      fillWarningEl.textContent =
        "Caution: Filter is " +
        fill.percentage.toFixed(0) +
        "% full — reliability is degrading.";
      fillWarningEl.className = "bloom-fill-warning";
      fillWarningEl.style.display = "";
    } else {
      fillWarningEl.style.display = "none";
    }

    // Item count
    itemCountEl.textContent = String(filter.n);
  }

  function updateWordsList() {
    const words = Object.keys(filter.insertedWords);
    if (words.length === 0) {
      wordsListEl.textContent = "none";
    } else {
      wordsListEl.textContent = words.join(", ");
    }
  }

  // --- Insert ---
  function handleInsert() {
    clearError();
    clearResult();

    const word = wordInput.value.trim();
    if (word === "") {
      showError("Please enter a non-empty word to insert.");
      return;
    }

    const result = BloomFilterAlgorithm.insert(filter, word);
    renderBitArray();
    highlightBits(result.indices, "bloom-bit-insert", 1500);
    updateStats();
    updateWordsList();

    if (result.alreadyPresent) {
      showResult(
        '"' + word + '" was already inserted (bits unchanged).',
        "bloom-result-already",
      );
    } else {
      showResult(
        'Inserted "' +
          word +
          '" — set bits at positions: [' +
          result.indices.join(", ") +
          "]",
        "bloom-result-positive",
      );
    }
  }

  // --- Query ---
  function handleQuery() {
    clearError();
    clearResult();

    const word = wordInput.value.trim();
    if (word === "") {
      showError("Please enter a non-empty word to query.");
      return;
    }

    const result = BloomFilterAlgorithm.query(filter, word);
    renderBitArray();

    if (result.result === "true-positive") {
      highlightBits(result.indices, "bloom-bit-query-match", 2000);
      showResult(
        'Probably in set (true positive): "' +
          word +
          '" was inserted and all ' +
          result.indices.length +
          " bits are set.",
        "bloom-result-positive",
      );
    } else if (result.result === "true-negative") {
      // Highlight the bits — set ones as match, unset ones as miss
      for (let i = 0; i < result.indices.length; i++) {
        const idx = result.indices[i];
        const cells = bitArrayEl.children;
        if (idx < cells.length) {
          if (filter.bits[idx] === 1) {
            cells[idx].className = "bloom-bit bloom-bit-query-match";
          } else {
            cells[idx].className = "bloom-bit bloom-bit-query-miss";
          }
        }
      }
      const tid = setTimeout(function () {
        renderBitArray();
      }, 2000);
      highlightTimers.push(tid);
      showResult(
        'Definitely not in set (true negative): "' +
          word +
          '" — at least one checked bit is 0.',
        "bloom-result-negative",
      );
    } else {
      // false-positive
      highlightBits(result.indices, "bloom-bit-false-positive", 2500);
      showResult(
        'FALSE POSITIVE: "' +
          word +
          '" was never inserted, but all ' +
          result.indices.length +
          " checked bits happen to be set by other words!",
        "bloom-result-false-positive",
      );
    }
  }

  // --- Preset ---
  function handlePreset() {
    clearTimers();
    clearError();
    clearResult();

    // Reset filter with current params
    const m = clampInt(mInput.value, 16, 128, 32);
    const k = clampInt(kInput.value, 1, 7, 3);
    mInput.value = m;
    kInput.value = k;
    filter = BloomFilterAlgorithm.createFilter(m, k);
    renderBitArray();
    updateStats();
    updateWordsList();

    const passwords = BloomFilterAlgorithm.getPasswordPreset();
    let idx = 0;

    function insertNext() {
      if (idx >= passwords.length) {
        presetTimer = null;
        showResult(
          "Password blacklist loaded! Try querying a common password or a word not in the list.",
          "bloom-result-already",
        );
        return;
      }
      const pw = passwords[idx];
      wordInput.value = pw;
      const result = BloomFilterAlgorithm.insert(filter, pw);
      renderBitArray();
      highlightBits(result.indices, "bloom-bit-insert", 250);
      updateStats();
      updateWordsList();
      showResult(
        "Inserting: " + pw + " (" + (idx + 1) + "/" + passwords.length + ")",
        "bloom-result-positive",
      );
      idx++;
      presetTimer = setTimeout(insertNext, 300);
    }

    insertNext();
  }

  // --- Reset ---
  function handleReset() {
    clearTimers();
    wordInput.value = "";
    init();
  }

  // --- Timer cleanup ---
  function clearTimers() {
    for (let i = 0; i < highlightTimers.length; i++) {
      clearTimeout(highlightTimers[i]);
    }
    highlightTimers = [];
    if (presetTimer !== null) {
      clearTimeout(presetTimer);
      presetTimer = null;
    }
  }

  // --- Parameter change ---
  function handleParamChange() {
    clearTimers();
    clearResult();
    clearError();
    const m = clampInt(mInput.value, 16, 128, 32);
    const k = clampInt(kInput.value, 1, 7, 3);
    mInput.value = m;
    kInput.value = k;
    filter = BloomFilterAlgorithm.createFilter(m, k);
    renderBitArray();
    updateStats();
    updateWordsList();
  }

  // --- Event listeners ---
  btnInsert.addEventListener("click", handleInsert);
  btnQuery.addEventListener("click", handleQuery);
  btnPreset.addEventListener("click", handlePreset);
  btnReset.addEventListener("click", handleReset);
  mInput.addEventListener("change", handleParamChange);
  kInput.addEventListener("change", handleParamChange);

  wordInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      handleInsert();
    }
  });

  // Cleanup on page unload
  window.addEventListener("beforeunload", clearTimers);

  // --- Boot ---
  init();
})();
