/**
 * Huffman Coding Algorithm
 *
 * Pure functions — no DOM dependency.
 * Builds a Huffman tree from character frequencies,
 * encodes/decodes text, and records snapshots for visualization.
 */
var HuffmanAlgorithm = (function () {
  "use strict";

  /**
   * Count character frequencies in a string.
   * @param {string} text
   * @returns {Object} char -> count
   */
  function countFrequencies(text) {
    var freq = {};
    var i;
    for (i = 0; i < text.length; i++) {
      var ch = text[i];
      if (freq[ch] === undefined) {
        freq[ch] = 0;
      }
      freq[ch]++;
    }
    return freq;
  }

  /**
   * Create a new tree node.
   * @param {string|null} char - Character (null for internal nodes)
   * @param {number} freq - Frequency count
   * @param {Object|null} left - Left child
   * @param {Object|null} right - Right child
   * @param {number} id - Unique node ID for tracking
   * @returns {Object} node
   */
  function makeNode(ch, freq, left, right, id) {
    return { char: ch, freq: freq, left: left || null, right: right || null, id: id };
  }

  // --- Min-heap (priority queue) ---

  function pqPush(heap, node) {
    heap.push(node);
    var i = heap.length - 1;
    while (i > 0) {
      var parent = Math.floor((i - 1) / 2);
      if (heap[parent].freq > heap[i].freq ||
          (heap[parent].freq === heap[i].freq && heap[parent].id > heap[i].id)) {
        var tmp = heap[parent];
        heap[parent] = heap[i];
        heap[i] = tmp;
        i = parent;
      } else {
        break;
      }
    }
  }

  function pqPop(heap) {
    if (heap.length === 0) return null;
    if (heap.length === 1) return heap.pop();
    var min = heap[0];
    heap[0] = heap.pop();
    var i = 0;
    var len = heap.length;
    while (true) {
      var left = 2 * i + 1;
      var right = 2 * i + 2;
      var smallest = i;
      if (left < len &&
          (heap[left].freq < heap[smallest].freq ||
           (heap[left].freq === heap[smallest].freq && heap[left].id < heap[smallest].id))) {
        smallest = left;
      }
      if (right < len &&
          (heap[right].freq < heap[smallest].freq ||
           (heap[right].freq === heap[smallest].freq && heap[right].id < heap[smallest].id))) {
        smallest = right;
      }
      if (smallest !== i) {
        var tmp = heap[i];
        heap[i] = heap[smallest];
        heap[smallest] = tmp;
        i = smallest;
      } else {
        break;
      }
    }
    return min;
  }

  /**
   * Deep clone a node tree for snapshots.
   */
  function cloneNode(node) {
    if (!node) return null;
    return {
      char: node.char,
      freq: node.freq,
      left: cloneNode(node.left),
      right: cloneNode(node.right),
      id: node.id
    };
  }

  /**
   * Clone the heap array (deep clone each node).
   */
  function cloneHeap(heap) {
    var result = [];
    var i;
    for (i = 0; i < heap.length; i++) {
      result.push(cloneNode(heap[i]));
    }
    return result;
  }

  /**
   * Build Huffman tree from text and return snapshots.
   * @param {string} text
   * @returns {{tree: Object|null, snapshots: Array, freqTable: Object, encodingTable: Object}}
   */
  function buildHuffmanTree(text) {
    if (!text || text.length === 0) {
      return { tree: null, snapshots: [], freqTable: {}, encodingTable: {} };
    }

    var freq = countFrequencies(text);
    var keys = Object.keys(freq);

    // Sort keys by frequency ascending, then by char code for consistent ordering
    keys.sort(function (a, b) {
      if (freq[a] !== freq[b]) return freq[a] - freq[b];
      return a < b ? -1 : 1;
    });

    var nodeId = 0;
    var heap = [];
    var snapshots = [];
    var i;

    // Create leaf nodes and add to heap
    for (i = 0; i < keys.length; i++) {
      var leaf = makeNode(keys[i], freq[keys[i]], null, null, nodeId++);
      pqPush(heap, leaf);
    }

    // Snapshot: initial state
    snapshots.push({
      step: 0,
      phase: "init",
      queue: cloneHeap(heap),
      tree: null,
      merged: null,
      action: "init",
      detail: "Created " + keys.length + " leaf nodes from character frequencies"
    });

    // Special case: single unique character
    if (keys.length === 1) {
      var singleNode = pqPop(heap);
      var root = makeNode(null, singleNode.freq, singleNode, null, nodeId++);
      snapshots.push({
        step: 1,
        phase: "done",
        queue: [],
        tree: cloneNode(root),
        merged: null,
        action: "done",
        detail: "Single character '" + singleNode.char + "' — tree complete"
      });
      var enc = {};
      enc[singleNode.char] = "0";
      return { tree: root, snapshots: snapshots, freqTable: freq, encodingTable: enc };
    }

    // Build tree by merging
    var stepCount = 1;
    while (heap.length > 1) {
      var left = pqPop(heap);
      var right = pqPop(heap);
      var parent = makeNode(null, left.freq + right.freq, left, right, nodeId++);
      pqPush(heap, parent);

      var leftLabel = left.char !== null ? "'" + left.char + "'(" + left.freq + ")" : "(" + left.freq + ")";
      var rightLabel = right.char !== null ? "'" + right.char + "'(" + right.freq + ")" : "(" + right.freq + ")";

      snapshots.push({
        step: stepCount,
        phase: heap.length === 1 ? "done" : "build",
        queue: cloneHeap(heap),
        tree: cloneNode(parent),
        merged: { left: cloneNode(left), right: cloneNode(right), parent: cloneNode(parent) },
        action: "merge",
        detail: "Merged " + leftLabel + " + " + rightLabel + " = (" + parent.freq + ")"
      });
      stepCount++;
    }

    var finalRoot = heap[0];
    var encodingTable = buildEncodingTable(finalRoot);

    return {
      tree: finalRoot,
      snapshots: snapshots,
      freqTable: freq,
      encodingTable: encodingTable
    };
  }

  /**
   * Build encoding table by DFS traversal of Huffman tree.
   * @param {Object} root
   * @returns {Object} char -> bitstring
   */
  function buildEncodingTable(root) {
    var table = {};
    if (!root) return table;

    // Single node tree (root with one child)
    if (!root.left && !root.right) {
      if (root.char !== null) {
        table[root.char] = "0";
      }
      return table;
    }

    function dfs(node, code) {
      if (!node) return;
      if (node.char !== null) {
        table[node.char] = code;
        return;
      }
      dfs(node.left, code + "0");
      dfs(node.right, code + "1");
    }

    dfs(root, "");
    return table;
  }

  /**
   * Encode text using an encoding table.
   * @param {string} text
   * @param {Object} encodingTable - char -> bitstring
   * @returns {string} encoded bit string
   */
  function encodeText(text, encodingTable) {
    if (!text || !encodingTable) return "";
    var bits = "";
    var i;
    for (i = 0; i < text.length; i++) {
      var code = encodingTable[text[i]];
      if (code !== undefined) {
        bits += code;
      }
    }
    return bits;
  }

  /**
   * Decode a bit string using a Huffman tree.
   * @param {string} bits - Encoded bit string
   * @param {Object} tree - Huffman tree root
   * @returns {string} decoded text
   */
  function decodeText(bits, tree) {
    if (!bits || !tree) return "";

    // Single character tree: root->left is the only char
    if (!tree.left && !tree.right) {
      // Degenerate: shouldn't happen with our buildHuffmanTree
      return "";
    }

    var result = "";
    var node = tree;
    var i;
    for (i = 0; i < bits.length; i++) {
      if (bits[i] === "0") {
        node = node.left;
      } else {
        node = node.right;
      }
      if (!node) return result; // invalid bit string
      if (node.char !== null) {
        result += node.char;
        node = tree;
      }
    }
    return result;
  }

  /**
   * Get snapshots for visualization playback.
   * @param {string} text
   * @returns {{snapshots: Array, tree: Object|null, freqTable: Object, encodingTable: Object, encoded: string, decoded: string}}
   */
  function getSnapshots(text) {
    var result = buildHuffmanTree(text);
    var encoded = encodeText(text, result.encodingTable);
    var decoded = decodeText(encoded, result.tree);
    return {
      snapshots: result.snapshots,
      tree: result.tree,
      freqTable: result.freqTable,
      encodingTable: result.encodingTable,
      encoded: encoded,
      decoded: decoded
    };
  }

  return {
    countFrequencies: countFrequencies,
    buildHuffmanTree: buildHuffmanTree,
    buildEncodingTable: buildEncodingTable,
    encodeText: encodeText,
    decodeText: decodeText,
    getSnapshots: getSnapshots
  };
})();

// Node.js module export (for test runner)
if (typeof module !== "undefined" && module.exports) {
  module.exports = HuffmanAlgorithm;
}
