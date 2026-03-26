(() => {
  "use strict";

  // --- DOM refs ---
  const textInput = document.getElementById("textInput");
  const charCount = document.getElementById("charCount");
  const btnVisualize = document.getElementById("btnVisualize");
  const playbackDiv = document.getElementById("playback");
  const btnReset = document.getElementById("btnReset");
  const btnStepBack = document.getElementById("btnStepBack");
  const btnPlay = document.getElementById("btnPlay");
  const btnPause = document.getElementById("btnPause");
  const btnStep = document.getElementById("btnStep");
  const speedSlider = document.getElementById("speed");
  const infoEl = document.getElementById("info");
  const stepInfoEl = document.getElementById("stepInfo");
  const treeSvg = document.getElementById("treeSvg");
  const freqTableContainer = document.getElementById("freqTableContainer");
  const encTableContainer = document.getElementById("encTableContainer");
  const compressionPanel = document.getElementById("compressionPanel");
  const compOriginal = document.getElementById("compOriginal");
  const compEncoded = document.getElementById("compEncoded");
  const compRatio = document.getElementById("compRatio");
  const encodedBitsEl = document.getElementById("encodedBits");
  const decodedTextEl = document.getElementById("decodedText");
  const decodeCheckEl = document.getElementById("decodeCheck");

  // --- State ---
  let snapshots = [];
  let currentStep = 0;
  let result = null;
  let timer = null;

  // --- Character counter ---
  textInput.addEventListener("input", () => {
    const len = textInput.value.length;
    charCount.textContent = len + " / 200";
  });

  // --- Visualize ---
  btnVisualize.addEventListener("click", () => {
    const text = textInput.value;
    if (!text || text.length === 0) {
      infoEl.textContent = "Please enter some text to compress.";
      infoEl.classList.add("huff-error");
      return;
    }
    infoEl.classList.remove("huff-error");

    result = HuffmanAlgorithm.getSnapshots(text);
    snapshots = result.snapshots;
    currentStep = 0;

    playbackDiv.style.display = "flex";
    stepInfoEl.style.display = "block";
    compressionPanel.style.display = "none";

    renderFreqTable(result.freqTable);
    renderStep();
    updateButtons();
  });

  // --- Playback controls ---
  btnPlay.addEventListener("click", play);
  btnPause.addEventListener("click", pause);
  btnStep.addEventListener("click", stepForward);
  btnStepBack.addEventListener("click", stepBackward);
  btnReset.addEventListener("click", reset);

  function getDelay() {
    return 800 - (parseInt(speedSlider.value, 10) - 1) * 75;
  }

  function play() {
    if (timer) return;
    btnPlay.disabled = true;
    btnPause.disabled = false;
    timer = setInterval(() => {
      if (currentStep < snapshots.length - 1) {
        currentStep++;
        renderStep();
        updateButtons();
      } else {
        pause();
      }
    }, getDelay());
  }

  function pause() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    btnPlay.disabled = false;
    btnPause.disabled = true;
  }

  function stepForward() {
    pause();
    if (currentStep < snapshots.length - 1) {
      currentStep++;
      renderStep();
      updateButtons();
    }
  }

  function stepBackward() {
    pause();
    if (currentStep > 0) {
      currentStep--;
      renderStep();
      updateButtons();
    }
  }

  function reset() {
    pause();
    currentStep = 0;
    compressionPanel.style.display = "none";
    renderStep();
    updateButtons();
  }

  function updateButtons() {
    btnStepBack.disabled = currentStep <= 0;
    btnStep.disabled = currentStep >= snapshots.length - 1;
    if (currentStep >= snapshots.length - 1 && timer) {
      pause();
    }
  }

  // --- Render current step ---
  function renderStep() {
    if (!snapshots.length) return;
    const snap = snapshots[currentStep];

    stepInfoEl.textContent =
      "Step " + (currentStep + 1) + " / " + snapshots.length + ": " + snap.detail;

    // Render tree for build/done phases
    if (snap.phase === "done") {
      renderTree(result.tree, snap.merged);
      renderEncodingTable(result.encodingTable);
      showCompression();
    } else if (snap.merged) {
      renderTree(snap.merged.parent, snap.merged);
    } else {
      // init phase - show queue as individual nodes
      renderQueueAsTree(snap.queue);
    }

    // Show queue state
    infoEl.textContent =
      "Priority queue: " +
      snap.queue
        .map((n) => {
          const label = n.char !== null ? "'" + n.char + "'" : "*";
          return label + "(" + n.freq + ")";
        })
        .join(", ");
  }

  // --- Render frequency table ---
  function renderFreqTable(freqTable) {
    const keys = Object.keys(freqTable);
    keys.sort((a, b) => freqTable[b] - freqTable[a] || a.localeCompare(b));

    let html = "<table><tr><th>Char</th><th>Count</th></tr>";
    for (const ch of keys) {
      const display = ch === " " ? "SP" : ch;
      html +=
        '<tr><td class="huff-char-cell">' +
        escapeHtml(display) +
        "</td><td>" +
        freqTable[ch] +
        "</td></tr>";
    }
    html += "</table>";
    freqTableContainer.innerHTML = html;
  }

  // --- Render encoding table ---
  function renderEncodingTable(encodingTable) {
    if (!encodingTable || Object.keys(encodingTable).length === 0) {
      encTableContainer.innerHTML = "";
      return;
    }
    const keys = Object.keys(encodingTable);
    keys.sort((a, b) => encodingTable[a].length - encodingTable[b].length || a.localeCompare(b));

    let html = "<table><tr><th>Char</th><th>Code</th><th>Bits</th></tr>";
    for (const ch of keys) {
      const display = ch === " " ? "SP" : ch;
      html +=
        '<tr><td class="huff-char-cell">' +
        escapeHtml(display) +
        '</td><td class="huff-bits-cell">' +
        encodingTable[ch] +
        "</td><td>" +
        encodingTable[ch].length +
        "</td></tr>";
    }
    html += "</table>";
    encTableContainer.innerHTML = html;
  }

  // --- Show compression stats ---
  function showCompression() {
    if (!result) return;
    const text = textInput.value;
    const originalBits = text.length * 8;
    const encodedBits = result.encoded.length;
    const ratio = ((encodedBits / originalBits) * 100).toFixed(1);
    const savings = (100 - parseFloat(ratio)).toFixed(1);

    compOriginal.textContent = text.length + " chars (" + originalBits + " bits)";
    compEncoded.textContent = encodedBits + " bits";
    compRatio.textContent = ratio + "% (" + savings + "% saved)";

    // Format encoded bits in groups of 8
    let formattedBits = "";
    for (let i = 0; i < result.encoded.length; i += 8) {
      if (i > 0) formattedBits += " ";
      formattedBits += result.encoded.slice(i, i + 8);
    }
    encodedBitsEl.textContent = formattedBits;

    // Decoded text
    decodedTextEl.textContent = result.decoded;
    if (result.decoded === text) {
      decodeCheckEl.textContent = "\u2713 Match";
      decodeCheckEl.className = "huff-decode-check huff-match";
    } else {
      decodeCheckEl.textContent = "\u2717 Mismatch";
      decodeCheckEl.className = "huff-decode-check huff-mismatch";
    }

    compressionPanel.style.display = "block";
  }

  // --- Tree rendering (SVG) ---
  const NODE_RADIUS = 20;
  const LEVEL_HEIGHT = 60;
  const MIN_H_GAP = 10;

  function renderTree(root, merged) {
    treeSvg.innerHTML = "";
    if (!root) return;

    // Compute layout
    const layout = computeLayout(root);
    if (!layout) return;

    // Set SVG dimensions
    const svgWidth = layout.maxX + NODE_RADIUS + 20;
    const svgHeight = layout.maxY + NODE_RADIUS + 30;
    treeSvg.setAttribute("viewBox", "0 0 " + svgWidth + " " + svgHeight);
    treeSvg.style.minHeight = Math.min(svgHeight, 500) + "px";

    // Collect merged node IDs for highlighting
    const highlightIds = new Set();
    if (merged) {
      if (merged.left) highlightIds.add(merged.left.id);
      if (merged.right) highlightIds.add(merged.right.id);
      if (merged.parent) highlightIds.add(merged.parent.id);
    }

    // Draw edges first, then nodes (so nodes are on top)
    drawEdges(layout.root, highlightIds);
    drawNodes(layout.root, highlightIds);
  }

  function computeLayout(root) {
    if (!root) return null;

    // Assign positions: leaf-based spacing
    let nextX = NODE_RADIUS + 10;

    function assignPositions(node, depth) {
      if (!node) return null;

      const y = depth * LEVEL_HEIGHT + NODE_RADIUS + 10;

      if (!node.left && !node.right) {
        // Leaf node
        const x = nextX;
        nextX += NODE_RADIUS * 2 + MIN_H_GAP;
        return { node: node, x: x, y: y, left: null, right: null };
      }

      const leftLayout = assignPositions(node.left, depth + 1);
      const rightLayout = assignPositions(node.right, depth + 1);

      let x;
      if (leftLayout && rightLayout) {
        x = (leftLayout.x + rightLayout.x) / 2;
      } else if (leftLayout) {
        x = leftLayout.x;
      } else if (rightLayout) {
        x = rightLayout.x;
      } else {
        x = nextX;
        nextX += NODE_RADIUS * 2 + MIN_H_GAP;
      }

      return { node: node, x: x, y: y, left: leftLayout, right: rightLayout };
    }

    const layoutRoot = assignPositions(root, 0);

    // Find max extents
    let maxX = 0;
    let maxY = 0;
    function findExtents(lay) {
      if (!lay) return;
      if (lay.x > maxX) maxX = lay.x;
      if (lay.y > maxY) maxY = lay.y;
      findExtents(lay.left);
      findExtents(lay.right);
    }
    findExtents(layoutRoot);

    return { root: layoutRoot, maxX: maxX, maxY: maxY };
  }

  function drawEdges(lay, highlightIds) {
    if (!lay) return;

    if (lay.left) {
      drawEdge(lay.x, lay.y, lay.left.x, lay.left.y, "0", highlightIds.has(lay.left.node.id));
      drawEdges(lay.left, highlightIds);
    }
    if (lay.right) {
      drawEdge(lay.x, lay.y, lay.right.x, lay.right.y, "1", highlightIds.has(lay.right.node.id));
      drawEdges(lay.right, highlightIds);
    }
  }

  function drawEdge(x1, y1, x2, y2, label, highlight) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("class", "huff-edge");
    if (highlight) {
      line.setAttribute("stroke", "#f0c000");
    }
    treeSvg.appendChild(line);

    // Edge label (0 or 1)
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const dx = x2 - x1;
    const offsetX = dx < 0 ? -10 : 10;
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", midX + offsetX);
    text.setAttribute("y", midY - 5);
    text.setAttribute("class", "huff-edge-label");
    text.textContent = label;
    treeSvg.appendChild(text);
  }

  function drawNodes(lay, highlightIds) {
    if (!lay) return;

    const node = lay.node;
    const isLeaf = node.char !== null;
    const isHighlight = highlightIds.has(node.id);

    if (isLeaf) {
      // Leaf: rectangle
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", lay.x - NODE_RADIUS);
      rect.setAttribute("y", lay.y - NODE_RADIUS);
      rect.setAttribute("width", NODE_RADIUS * 2);
      rect.setAttribute("height", NODE_RADIUS * 2);
      rect.setAttribute("rx", 4);
      let cls = "huff-node-leaf";
      if (isHighlight) cls += " huff-node-highlight";
      rect.setAttribute("class", cls);
      treeSvg.appendChild(rect);

      // Character label
      const charText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      charText.setAttribute("x", lay.x);
      charText.setAttribute("y", lay.y - 3);
      charText.setAttribute("class", "huff-node-text");
      charText.textContent = node.char === " " ? "SP" : node.char;
      treeSvg.appendChild(charText);
    } else {
      // Internal: circle
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", lay.x);
      circle.setAttribute("cy", lay.y);
      circle.setAttribute("r", NODE_RADIUS);
      let cls = "huff-node-internal";
      if (isHighlight) cls += " huff-node-highlight";
      circle.setAttribute("class", cls);
      treeSvg.appendChild(circle);
    }

    // Frequency below node
    const freqText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    freqText.setAttribute("x", lay.x);
    freqText.setAttribute("y", lay.y + (isLeaf ? 12 : 5));
    freqText.setAttribute("class", isLeaf ? "huff-node-freq" : "huff-node-text");
    freqText.textContent = node.freq;
    treeSvg.appendChild(freqText);

    drawNodes(lay.left, highlightIds);
    drawNodes(lay.right, highlightIds);
  }

  // --- Render queue as separate nodes (init phase) ---
  function renderQueueAsTree(queue) {
    treeSvg.innerHTML = "";
    if (!queue || queue.length === 0) return;

    const spacing = NODE_RADIUS * 2 + MIN_H_GAP;
    const totalWidth = queue.length * spacing;
    const svgWidth = totalWidth + 20;
    const svgHeight = NODE_RADIUS * 2 + 40;

    treeSvg.setAttribute("viewBox", "0 0 " + svgWidth + " " + svgHeight);
    treeSvg.style.minHeight = svgHeight + "px";

    for (let i = 0; i < queue.length; i++) {
      const node = queue[i];
      const x = NODE_RADIUS + 10 + i * spacing;
      const y = NODE_RADIUS + 10;

      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", x - NODE_RADIUS);
      rect.setAttribute("y", y - NODE_RADIUS);
      rect.setAttribute("width", NODE_RADIUS * 2);
      rect.setAttribute("height", NODE_RADIUS * 2);
      rect.setAttribute("rx", 4);
      rect.setAttribute("class", "huff-node-leaf");
      treeSvg.appendChild(rect);

      const charText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      charText.setAttribute("x", x);
      charText.setAttribute("y", y - 3);
      charText.setAttribute("class", "huff-node-text");
      charText.textContent = node.char !== null ? (node.char === " " ? "SP" : node.char) : "*";
      treeSvg.appendChild(charText);

      const freqText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      freqText.setAttribute("x", x);
      freqText.setAttribute("y", y + 12);
      freqText.setAttribute("class", "huff-node-freq");
      freqText.textContent = node.freq;
      treeSvg.appendChild(freqText);
    }
  }

  // --- Utility ---
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // Clean up on page unload
  window.addEventListener("beforeunload", () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  });
})();
