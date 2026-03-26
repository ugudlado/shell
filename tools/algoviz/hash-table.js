(() => {
  "use strict";

  // --- DOM refs ---
  const keyInput = document.getElementById("keyInput");
  const valueInput = document.getElementById("valueInput");
  const bucketCountInput = document.getElementById("bucketCount");
  const btnInsert = document.getElementById("btnInsert");
  const btnSearch = document.getElementById("btnSearch");
  const btnDelete = document.getElementById("btnDelete");
  const btnRebuild = document.getElementById("btnRebuild");
  const btnPhonebook = document.getElementById("btnPhonebook");
  const btnClear = document.getElementById("btnClear");
  const playbackDiv = document.getElementById("playback");
  const btnReset = document.getElementById("btnReset");
  const btnStepBack = document.getElementById("btnStepBack");
  const btnPlay = document.getElementById("btnPlay");
  const btnPause = document.getElementById("btnPause");
  const btnStep = document.getElementById("btnStep");
  const speedSlider = document.getElementById("speed");
  const infoEl = document.getElementById("info");
  const hashCompEl = document.getElementById("hashComputation");
  const bucketsContainer = document.getElementById("bucketsContainer");
  const resultEl = document.getElementById("result");

  // Stats refs
  const statEntries = document.getElementById("statEntries");
  const statLoadFactor = document.getElementById("statLoadFactor");
  const statLongestChain = document.getElementById("statLongestChain");
  const statCollisions = document.getElementById("statCollisions");

  // --- State ---
  let table = HashTableAlgorithm.createTable(8);
  let steps = [];
  let stepIdx = -1;
  let timer = null;
  let operationTable = null; // table state before current operation (for step replay)
  let operationType = ""; // "insert", "search", "delete"

  // --- Phonebook data ---
  const PHONEBOOK = [
    { key: "Alice", value: "555-0101" },
    { key: "Bob", value: "555-0202" },
    { key: "Charlie", value: "555-0303" },
    { key: "Diana", value: "555-0404" },
    { key: "Eve", value: "555-0505" },
    { key: "Frank", value: "555-0606" },
    { key: "Grace", value: "555-0707" },
    { key: "Hank", value: "555-0808" },
    { key: "Ada", value: "555-0909" },
    { key: "Carl", value: "555-1010" },
  ];

  // --- Render ---
  function renderBuckets(highlightBucket, highlightChain, highlightType) {
    bucketsContainer.innerHTML = "";
    for (let i = 0; i < table.bucketCount; i++) {
      const bucketDiv = document.createElement("div");
      bucketDiv.className = "ht-bucket";
      if (highlightBucket === i) {
        if (highlightType === "found") {
          bucketDiv.classList.add("ht-bucket-found");
        } else {
          bucketDiv.classList.add("ht-bucket-active");
        }
      }

      const header = document.createElement("div");
      header.className = "ht-bucket-header";
      header.textContent = "[" + i + "]";
      bucketDiv.appendChild(header);

      const body = document.createElement("div");
      body.className = "ht-bucket-body";
      if (table.buckets[i].length === 0) {
        body.classList.add("ht-empty");
      }

      for (let j = 0; j < table.buckets[i].length; j++) {
        const entry = table.buckets[i][j];
        const entryDiv = document.createElement("div");
        entryDiv.className = "ht-entry";

        if (highlightBucket === i && highlightChain === j) {
          entryDiv.classList.add("ht-" + (highlightType || "active"));
        }

        const keySpan = document.createElement("span");
        keySpan.className = "ht-entry-key";
        keySpan.textContent = entry.key;

        const valSpan = document.createElement("span");
        valSpan.className = "ht-entry-value";
        valSpan.textContent = ": " + entry.value;

        entryDiv.appendChild(keySpan);
        entryDiv.appendChild(valSpan);
        body.appendChild(entryDiv);
      }

      bucketDiv.appendChild(body);
      bucketsContainer.appendChild(bucketDiv);
    }
  }

  function updateStats() {
    const stats = HashTableAlgorithm.getStats(table);
    statEntries.textContent = stats.size;
    statLoadFactor.textContent = stats.loadFactor.toFixed(2);
    statLongestChain.textContent = stats.longestChain;
    statCollisions.textContent = stats.collisionCount;
  }

  function showHashComputation(step) {
    if (step && step.type === "hash") {
      hashCompEl.style.display = "block";
      const codes = step.charCodes || [];
      const codesStr = codes.map((c) => {
        const ch = String.fromCharCode(c);
        return "'" + ch + "'=" + c;
      }).join(" + ");

      hashCompEl.innerHTML =
        '<span class="ht-char-codes">' + codesStr + '</span>' +
        ' = <span class="ht-sum">' + step.sum + '</span>' +
        ' % ' + table.bucketCount +
        ' = <span class="ht-result">bucket ' + step.bucketIndex + '</span>';
    } else {
      hashCompEl.style.display = "none";
    }
  }

  function renderStep(idx) {
    if (idx < 0 || idx >= steps.length) return;
    const step = steps[idx];

    infoEl.textContent = step.detail;

    let highlightType = "active";
    if (step.type === "collision") highlightType = "collision";
    else if (step.type === "found") highlightType = "found";
    else if (step.type === "traverse") highlightType = "traverse";
    else if (step.type === "insert" || step.type === "update") highlightType = "found";
    else if (step.type === "remove") highlightType = "active";
    else if (step.type === "not_found") highlightType = "collision";

    showHashComputation(step.type === "hash" ? step : null);

    const bi = typeof step.bucketIndex === "number" ? step.bucketIndex : -1;
    const ci = typeof step.chainIndex === "number" ? step.chainIndex : -1;

    renderBuckets(bi, ci, highlightType);
  }

  // --- Playback ---
  function stopPlayback() {
    if (timer) clearInterval(timer);
    timer = null;
    btnPlay.disabled = false;
    btnPause.disabled = true;
  }

  function startPlayback() {
    if (stepIdx >= steps.length - 1) return;
    btnPlay.disabled = true;
    btnPause.disabled = false;
    const delay = Math.max(100, 1100 - speedSlider.value * 100);
    timer = setInterval(() => {
      if (stepIdx >= steps.length - 1) {
        stopPlayback();
        return;
      }
      stepIdx++;

      // For insert operations, apply table state progressively
      if (operationType === "insert" && steps[stepIdx].type === "insert") {
        // Re-run the full insert to get the final table state
        const result = HashTableAlgorithm.insert(operationTable, keyInput.value, valueInput.value);
        table = result.table;
      }

      renderStep(stepIdx);
      updatePlaybackButtons();
    }, delay);
  }

  function updatePlaybackButtons() {
    btnStepBack.disabled = stepIdx <= 0;
    btnStep.disabled = stepIdx >= steps.length - 1;
  }

  function showPlayback() {
    playbackDiv.style.display = "flex";
  }

  function hidePlayback() {
    playbackDiv.style.display = "none";
  }

  // --- Operations ---
  function validateKey() {
    const key = keyInput.value;
    if (key.length === 0) {
      infoEl.textContent = "Please enter a key.";
      return false;
    }
    if (key.length > 20) {
      infoEl.textContent = "Key must be 20 characters or fewer.";
      return false;
    }
    return true;
  }

  function validateValue() {
    const val = valueInput.value;
    if (val.length === 0) {
      infoEl.textContent = "Please enter a value.";
      return false;
    }
    if (val.length > 20) {
      infoEl.textContent = "Value must be 20 characters or fewer.";
      return false;
    }
    return true;
  }

  function doInsert() {
    if (!validateKey() || !validateValue()) return;
    stopPlayback();

    operationTable = table;
    operationType = "insert";
    const result = HashTableAlgorithm.insert(table, keyInput.value, valueInput.value);
    steps = result.steps;
    stepIdx = 0;

    // Apply the insert immediately to the table for rendering
    table = result.table;

    showPlayback();
    renderStep(0);
    updateStats();
    updatePlaybackButtons();

    if (result.collision) {
      resultEl.textContent = "Collision detected — entry chained in bucket.";
      resultEl.classList.remove("hidden");
    } else if (result.updated) {
      resultEl.textContent = "Key updated with new value.";
      resultEl.classList.remove("hidden");
    } else {
      resultEl.classList.add("hidden");
    }
  }

  function doSearch() {
    if (!validateKey()) return;
    stopPlayback();

    operationTable = table;
    operationType = "search";
    const result = HashTableAlgorithm.search(table, keyInput.value);
    steps = result.steps;
    stepIdx = 0;

    showPlayback();
    renderStep(0);
    updatePlaybackButtons();

    if (result.found) {
      resultEl.textContent = "Found: " + keyInput.value + " = " + result.value;
      resultEl.classList.remove("hidden");
    } else {
      resultEl.textContent = "Key \"" + keyInput.value + "\" not found.";
      resultEl.classList.remove("hidden");
    }
  }

  function doDelete() {
    if (!validateKey()) return;
    stopPlayback();

    operationTable = table;
    operationType = "delete";
    const result = HashTableAlgorithm.remove(table, keyInput.value);
    steps = result.steps;
    stepIdx = 0;

    table = result.table;

    showPlayback();
    renderStep(0);
    updateStats();
    updatePlaybackButtons();

    if (result.removed) {
      resultEl.textContent = "Removed \"" + keyInput.value + "\" from hash table.";
      resultEl.classList.remove("hidden");
    } else {
      resultEl.textContent = "Key \"" + keyInput.value + "\" not found — nothing to remove.";
      resultEl.classList.remove("hidden");
    }
  }

  function doRebuild() {
    stopPlayback();
    const count = parseInt(bucketCountInput.value, 10);
    if (isNaN(count) || count < 2 || count > 16) {
      infoEl.textContent = "Bucket count must be between 2 and 16.";
      return;
    }

    // Collect existing entries
    const entries = [];
    for (let i = 0; i < table.bucketCount; i++) {
      for (let j = 0; j < table.buckets[i].length; j++) {
        entries.push(table.buckets[i][j]);
      }
    }

    // Rebuild with new bucket count
    table = HashTableAlgorithm.createTable(count);
    for (let e = 0; e < entries.length; e++) {
      table = HashTableAlgorithm.insert(table, entries[e].key, entries[e].value).table;
    }

    hidePlayback();
    hashCompEl.style.display = "none";
    renderBuckets(-1, -1, "");
    updateStats();
    resultEl.classList.add("hidden");
    infoEl.textContent = "Rebuilt with " + count + " buckets. " + entries.length + " entries rehashed.";
  }

  function doPhonebook() {
    stopPlayback();
    const count = parseInt(bucketCountInput.value, 10) || 8;
    table = HashTableAlgorithm.createTable(count);
    for (let i = 0; i < PHONEBOOK.length; i++) {
      table = HashTableAlgorithm.insert(table, PHONEBOOK[i].key, PHONEBOOK[i].value).table;
    }

    hidePlayback();
    hashCompEl.style.display = "none";
    renderBuckets(-1, -1, "");
    updateStats();
    resultEl.classList.add("hidden");
    infoEl.textContent = "Loaded " + PHONEBOOK.length + " phonebook entries. Try searching or inserting more!";
  }

  function doClear() {
    stopPlayback();
    const count = parseInt(bucketCountInput.value, 10) || 8;
    table = HashTableAlgorithm.createTable(count);
    hidePlayback();
    hashCompEl.style.display = "none";
    renderBuckets(-1, -1, "");
    updateStats();
    resultEl.classList.add("hidden");
    infoEl.textContent = "Table cleared. Enter a key-value pair and click Insert.";
  }

  // --- Event Listeners ---
  btnInsert.addEventListener("click", doInsert);
  btnSearch.addEventListener("click", doSearch);
  btnDelete.addEventListener("click", doDelete);
  btnRebuild.addEventListener("click", doRebuild);
  btnPhonebook.addEventListener("click", doPhonebook);
  btnClear.addEventListener("click", doClear);

  btnPlay.addEventListener("click", startPlayback);
  btnPause.addEventListener("click", stopPlayback);

  btnStep.addEventListener("click", () => {
    if (stepIdx < steps.length - 1) {
      stepIdx++;
      renderStep(stepIdx);
      updatePlaybackButtons();
    }
  });

  btnStepBack.addEventListener("click", () => {
    if (stepIdx > 0) {
      stepIdx--;
      renderStep(stepIdx);
      updatePlaybackButtons();
    }
  });

  btnReset.addEventListener("click", () => {
    stopPlayback();
    stepIdx = 0;
    if (steps.length > 0) {
      renderStep(0);
    }
    updatePlaybackButtons();
  });

  // Keyboard shortcuts
  keyInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      doInsert();
    }
  });

  valueInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      doInsert();
    }
  });

  // Clamp bucket count on change
  bucketCountInput.addEventListener("change", () => {
    let v = parseInt(bucketCountInput.value, 10);
    if (isNaN(v) || v < 2) v = 2;
    if (v > 16) v = 16;
    bucketCountInput.value = v;
  });

  // Clean up timers on page unload
  window.addEventListener("beforeunload", () => {
    if (timer) clearInterval(timer);
  });

  // --- Initial render ---
  renderBuckets(-1, -1, "");
  updateStats();
})();
