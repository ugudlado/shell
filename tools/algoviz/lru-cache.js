(() => {
  "use strict";

  // --- DOM refs ---
  const capacityInput = document.getElementById("lru-capacityInput");
  const keyInput = document.getElementById("lru-keyInput");
  const valueInput = document.getElementById("lru-valueInput");
  const btnPut = document.getElementById("lru-btnPut");
  const btnGet = document.getElementById("lru-btnGet");
  const btnPreset = document.getElementById("lru-btnPreset");
  const btnReset = document.getElementById("lru-btnReset");
  const playbackDiv = document.getElementById("lru-playback");
  const btnStepBack = document.getElementById("lru-btnStepBack");
  const btnPlay = document.getElementById("lru-btnPlay");
  const btnPause = document.getElementById("lru-btnPause");
  const btnStepFwd = document.getElementById("lru-btnStepFwd");
  const speedSlider = document.getElementById("lru-speed");
  const errorEl = document.getElementById("lru-error");
  const infoEl = document.getElementById("lru-info");
  const listEmpty = document.getElementById("lru-listEmpty");
  const listNodes = document.getElementById("lru-listNodes");
  const mapEmpty = document.getElementById("lru-mapEmpty");
  const mapTable = document.getElementById("lru-mapTable");
  const mapBody = document.getElementById("lru-mapBody");
  const sizeStat = document.getElementById("lru-sizeStat");
  const hitsStat = document.getElementById("lru-hitsStat");
  const missesStat = document.getElementById("lru-missesStat");
  const evictionsStat = document.getElementById("lru-evictionsStat");
  const stepStat = document.getElementById("lru-stepStat");
  const logEntries = document.getElementById("lru-logEntries");

  // --- State ---
  let cache = null;
  let steps = [];
  let stepIdx = -1;
  let timer = null;
  let isPlaying = false;
  let hits = 0;
  let misses = 0;
  let evictions = 0;
  let presetMode = false;

  // --- Initialize ---
  function init() {
    const cap = getCapacity();
    cache = LRUCacheAlgorithm.createCache(cap);
    steps = [];
    stepIdx = -1;
    hits = 0;
    misses = 0;
    evictions = 0;
    presetMode = false;
    stopPlayback();
    playbackDiv.style.display = "none";
    clearError();
    renderFromCache();
    updateStats();
    logEntries.innerHTML = "";
    infoEl.textContent =
      "Enter a key and value, then click put() to add to the cache. Use get() to access a key.";
  }

  function getCapacity() {
    let cap = parseInt(capacityInput.value, 10);
    if (isNaN(cap) || cap < 1) cap = 1;
    if (cap > 10) cap = 10;
    capacityInput.value = cap;
    return cap;
  }

  // --- Error display ---
  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.remove("hidden");
  }

  function clearError() {
    errorEl.textContent = "";
    errorEl.classList.add("hidden");
  }

  // --- Render from live cache state ---
  function renderFromCache(highlightKey, highlightType) {
    renderList(
      LRUCacheAlgorithm.getOrder(cache),
      highlightKey,
      highlightType,
    );
    renderMap(
      LRUCacheAlgorithm.getMapSnapshot(cache),
      LRUCacheAlgorithm.getOrder(cache),
      highlightKey,
      highlightType,
    );
    updateStats();
  }

  // --- Render from step snapshot ---
  function renderFromStep(step) {
    const highlightKey = step.key;
    let highlightType = "";
    if (step.type === "get" && step.hit) highlightType = "promoted";
    else if (step.type === "get" && !step.hit) highlightType = "miss";
    else if (step.action === "evict") highlightType = "evict";
    else if (step.action === "update") highlightType = "promoted";
    else highlightType = "new";

    renderList(step.order, highlightKey, highlightType, step.evicted);
    renderMap(
      step.mapSnapshot,
      step.order,
      highlightKey,
      highlightType,
      step.evicted,
    );
    infoEl.textContent = step.explanation;
  }

  // --- Render the doubly-linked list ---
  function renderList(order, highlightKey, highlightType, evictedInfo) {
    listNodes.innerHTML = "";

    if (order.length === 0 && (!evictedInfo || highlightType !== "evict")) {
      listEmpty.style.display = "";
      return;
    }
    listEmpty.style.display = "none";

    for (let i = 0; i < order.length; i++) {
      const entry = order[i];

      // Pointer arrow (except before first node)
      if (i > 0) {
        const arrow = document.createElement("div");
        arrow.className = "lru-pointer";
        const isActivePointer =
          highlightKey === entry.key && highlightType === "promoted";
        if (isActivePointer) arrow.classList.add("lru-pointer-active");
        arrow.textContent = "\u2195"; // up-down arrow
        listNodes.appendChild(arrow);
      }

      const nodeEl = document.createElement("div");
      nodeEl.className = "lru-node";

      // Highlight states
      if (i === 0) nodeEl.classList.add("lru-node-mru");
      if (i === order.length - 1 && order.length > 1)
        nodeEl.classList.add("lru-node-lru");
      if (entry.key === highlightKey) {
        if (highlightType === "promoted") nodeEl.classList.add("lru-node-promoted");
        else if (highlightType === "new") nodeEl.classList.add("lru-node-promoted");
      }

      const keySpan = document.createElement("span");
      keySpan.className = "lru-node-key";
      keySpan.textContent = entry.key;

      const valSpan = document.createElement("span");
      valSpan.className = "lru-node-value";
      valSpan.textContent = "= " + entry.value;

      const ptrSpan = document.createElement("span");
      ptrSpan.className = "lru-node-pointers";
      const prevKey = i > 0 ? order[i - 1].key : "null";
      const nextKey = i < order.length - 1 ? order[i + 1].key : "null";
      ptrSpan.textContent = "\u2190" + prevKey + " | " + nextKey + "\u2192";

      nodeEl.appendChild(keySpan);
      nodeEl.appendChild(valSpan);
      nodeEl.appendChild(ptrSpan);
      listNodes.appendChild(nodeEl);
    }

    // Show evicted node at bottom if applicable
    if (evictedInfo && highlightType === "evict") {
      const arrow = document.createElement("div");
      arrow.className = "lru-pointer";
      arrow.textContent = "\u2716"; // X mark
      listNodes.appendChild(arrow);

      const evNode = document.createElement("div");
      evNode.className = "lru-node lru-node-evicted";
      const evKey = document.createElement("span");
      evKey.className = "lru-node-key";
      evKey.textContent = evictedInfo.key;
      const evVal = document.createElement("span");
      evVal.className = "lru-node-value";
      evVal.textContent = "= " + evictedInfo.value;
      const evLabel = document.createElement("span");
      evLabel.className = "lru-node-pointers";
      evLabel.textContent = "EVICTED";
      evNode.appendChild(evKey);
      evNode.appendChild(evVal);
      evNode.appendChild(evLabel);
      listNodes.appendChild(evNode);
    }
  }

  // --- Render the hash map ---
  function renderMap(mapSnapshot, order, highlightKey, highlightType, evictedInfo) {
    const keys = Object.keys(mapSnapshot);

    if (keys.length === 0 && !evictedInfo) {
      mapEmpty.style.display = "";
      mapTable.style.display = "none";
      return;
    }
    mapEmpty.style.display = "none";
    mapTable.style.display = "";

    mapBody.innerHTML = "";

    // Build position lookup from order
    const posMap = {};
    for (let i = 0; i < order.length; i++) {
      posMap[order[i].key] = i === 0 ? "HEAD (MRU)" : i === order.length - 1 ? "TAIL (LRU)" : "pos " + i;
    }

    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const row = document.createElement("tr");

      // Highlight row
      if (k === highlightKey) {
        if (highlightType === "promoted") row.classList.add("lru-map-row-hit");
        else if (highlightType === "new") row.classList.add("lru-map-row-new");
      }

      const tdKey = document.createElement("td");
      tdKey.textContent = k;
      const tdVal = document.createElement("td");
      tdVal.textContent = mapSnapshot[k];
      const tdPos = document.createElement("td");
      tdPos.textContent = posMap[k] || "—";

      row.appendChild(tdKey);
      row.appendChild(tdVal);
      row.appendChild(tdPos);
      mapBody.appendChild(row);
    }

    // Show evicted row
    if (evictedInfo && highlightType === "evict") {
      const row = document.createElement("tr");
      row.classList.add("lru-map-row-evicted");
      const tdKey = document.createElement("td");
      tdKey.textContent = evictedInfo.key;
      const tdVal = document.createElement("td");
      tdVal.textContent = evictedInfo.value;
      const tdPos = document.createElement("td");
      tdPos.textContent = "EVICTED";
      row.appendChild(tdKey);
      row.appendChild(tdVal);
      row.appendChild(tdPos);
      mapBody.appendChild(row);
    }
  }

  // --- Update stats ---
  function updateStats() {
    const cap = cache ? cache.capacity : getCapacity();
    const sz = cache ? cache.size : 0;
    sizeStat.textContent = sz + " / " + cap;
    hitsStat.textContent = String(hits);
    missesStat.textContent = String(misses);
    evictionsStat.textContent = String(evictions);
    stepStat.textContent =
      presetMode ? (stepIdx + 1) + " / " + steps.length : "—";
  }

  // --- Add log entry ---
  function addLogEntry(step) {
    const entry = document.createElement("div");
    entry.className = "lru-log-entry";

    if (step.type === "get" && step.hit) entry.classList.add("lru-log-entry-hit");
    else if (step.type === "get") entry.classList.add("lru-log-entry-miss");
    else if (step.action === "evict") entry.classList.add("lru-log-entry-evict");
    else if (step.action === "update") entry.classList.add("lru-log-entry-update");
    else entry.classList.add("lru-log-entry-insert");

    entry.textContent = step.explanation;
    logEntries.prepend(entry);
  }

  // --- Interactive put ---
  function handlePut() {
    clearError();
    const key = keyInput.value.trim();
    if (!key) {
      showError("Key cannot be empty.");
      return;
    }
    if (key.length > 20) {
      showError("Key must be 20 characters or fewer.");
      return;
    }
    const val = parseInt(valueInput.value, 10);
    if (isNaN(val)) {
      showError("Value must be a number.");
      return;
    }
    if (val < -999 || val > 999) {
      showError("Value must be between -999 and 999.");
      return;
    }

    // If capacity changed, re-init
    const newCap = getCapacity();
    if (!cache || cache.capacity !== newCap) {
      cache = LRUCacheAlgorithm.createCache(newCap);
      steps = [];
      hits = 0;
      misses = 0;
      evictions = 0;
    }

    const stepArr = [];
    LRUCacheAlgorithm.putWithSteps(cache, key, val, stepArr);
    const step = stepArr[0];

    if (step.action === "evict") evictions++;

    addLogEntry(step);
    renderFromCache(key, step.action === "evict" ? "evict" : step.action === "update" ? "promoted" : "new");
    infoEl.textContent = step.explanation;
  }

  // --- Interactive get ---
  function handleGet() {
    clearError();
    const key = keyInput.value.trim();
    if (!key) {
      showError("Key cannot be empty.");
      return;
    }

    if (!cache || cache.size === 0) {
      showError("Cache is empty. Use put() first.");
      return;
    }

    const stepArr = [];
    LRUCacheAlgorithm.getWithSteps(cache, key, stepArr);
    const step = stepArr[0];

    if (step.hit) hits++;
    else misses++;

    addLogEntry(step);
    renderFromCache(
      key,
      step.hit ? "promoted" : "miss",
    );
    infoEl.textContent = step.explanation;
  }

  // --- Preset mode ---
  function handlePreset() {
    const preset = LRUCacheAlgorithm.getBrowserCachePreset();
    cache = LRUCacheAlgorithm.createCache(preset.capacity);
    capacityInput.value = preset.capacity;
    steps = [];
    stepIdx = -1;
    hits = 0;
    misses = 0;
    evictions = 0;
    presetMode = true;
    logEntries.innerHTML = "";

    // Pre-record all steps
    const tempCache = LRUCacheAlgorithm.createCache(preset.capacity);
    for (let i = 0; i < preset.operations.length; i++) {
      const op = preset.operations[i];
      if (op.type === "put") {
        LRUCacheAlgorithm.putWithSteps(tempCache, op.key, op.value, steps);
      } else {
        LRUCacheAlgorithm.getWithSteps(tempCache, op.key, steps);
      }
    }

    // Show playback controls
    playbackDiv.style.display = "flex";
    renderFromCache();
    updateStats();
    infoEl.textContent =
      'Browser cache preset loaded (' + preset.operations.length +
      ' ops, capacity ' + preset.capacity +
      '). Use playback controls to step through.';
  }

  // --- Playback controls ---
  function stepForward() {
    if (stepIdx >= steps.length - 1) return;
    stepIdx++;
    const step = steps[stepIdx];

    // Replay operation on the actual cache
    if (step.type === "put") {
      const result = LRUCacheAlgorithm.put(cache, step.key, step.value);
      if (result.action === "evict") evictions++;
    } else {
      const result = LRUCacheAlgorithm.get(cache, step.key);
      if (result.hit) hits++;
      else misses++;
    }

    addLogEntry(step);
    renderFromStep(step);
    updateStats();
    updatePlaybackButtons();
  }

  function stepBackward() {
    if (stepIdx < 0) return;
    // Rebuild cache up to stepIdx - 1
    stepIdx--;
    rebuildCacheToStep(stepIdx);
    updatePlaybackButtons();
  }

  function rebuildCacheToStep(targetIdx) {
    const cap = parseInt(capacityInput.value, 10) || 4;
    cache = LRUCacheAlgorithm.createCache(cap);
    hits = 0;
    misses = 0;
    evictions = 0;
    logEntries.innerHTML = "";

    for (let i = 0; i <= targetIdx; i++) {
      const step = steps[i];
      if (step.type === "put") {
        const result = LRUCacheAlgorithm.put(cache, step.key, step.value);
        if (result.action === "evict") evictions++;
      } else {
        const result = LRUCacheAlgorithm.get(cache, step.key);
        if (result.hit) hits++;
        else misses++;
      }
      addLogEntry(step);
    }

    if (targetIdx >= 0) {
      renderFromStep(steps[targetIdx]);
    } else {
      renderFromCache();
      infoEl.textContent = "Rewound to start. Step forward to begin.";
    }
    updateStats();
  }

  function startPlayback() {
    if (isPlaying) return;
    isPlaying = true;
    btnPlay.disabled = true;
    btnPause.disabled = false;
    const delay = 1100 - speedSlider.value * 100;
    timer = setInterval(() => {
      if (stepIdx >= steps.length - 1) {
        stopPlayback();
        return;
      }
      stepForward();
    }, delay);
  }

  function stopPlayback() {
    isPlaying = false;
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
    btnPlay.disabled = false;
    btnPause.disabled = true;
  }

  function updatePlaybackButtons() {
    btnStepBack.disabled = stepIdx < 0;
    btnStepFwd.disabled = stepIdx >= steps.length - 1;
  }

  // --- Event listeners ---
  btnPut.addEventListener("click", handlePut);
  btnGet.addEventListener("click", handleGet);
  btnPreset.addEventListener("click", handlePreset);
  btnReset.addEventListener("click", init);
  btnStepBack.addEventListener("click", () => {
    stopPlayback();
    stepBackward();
  });
  btnPlay.addEventListener("click", startPlayback);
  btnPause.addEventListener("click", stopPlayback);
  btnStepFwd.addEventListener("click", () => {
    stopPlayback();
    stepForward();
  });

  // Enter key triggers put
  keyInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handlePut();
  });
  valueInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handlePut();
  });

  // Clean up timer on page unload
  window.addEventListener("beforeunload", () => {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  });

  // --- Init ---
  init();
})();
