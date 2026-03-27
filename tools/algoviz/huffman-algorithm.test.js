/**
 * Huffman Algorithm Tests — Node.js runner compatible
 * Exports runTests() for run-tests.js harness
 */

function runTests({ assert, assertEqual }) {
  let passed = 0;
  let failed = 0;
  const failures = [];

  const HuffmanAlgorithm = require("./huffman-algorithm.js");

  function check(fn, name) {
    try {
      fn();
      passed++;
      console.log("  PASS: " + name);
    } catch (e) {
      failed++;
      failures.push({ name, message: e.message });
      console.log("  FAIL: " + name + " — " + e.message);
    }
  }

  // --- countFrequencies ---
  check(() => {
    const freq = HuffmanAlgorithm.countFrequencies("aabbc");
    assertEqual(freq["a"], 2, "a count");
    assertEqual(freq["b"], 2, "b count");
    assertEqual(freq["c"], 1, "c count");
  }, "countFrequencies: basic counting");

  check(() => {
    const freq = HuffmanAlgorithm.countFrequencies("");
    assertEqual(Object.keys(freq).length, 0, "empty string");
  }, "countFrequencies: empty input");

  check(() => {
    const freq = HuffmanAlgorithm.countFrequencies("A");
    assertEqual(freq["A"], 1, "single char");
    assertEqual(Object.keys(freq).length, 1, "one key");
  }, "countFrequencies: single character");

  check(() => {
    const freq = HuffmanAlgorithm.countFrequencies("aaaa");
    assertEqual(freq["a"], 4, "all same");
    assertEqual(Object.keys(freq).length, 1, "one key");
  }, "countFrequencies: all duplicates");

  // --- buildHuffmanTree ---
  check(() => {
    const result = HuffmanAlgorithm.buildHuffmanTree("");
    assertEqual(result.tree, null, "null tree");
    assertEqual(result.snapshots.length, 0, "no snapshots");
    assertEqual(Object.keys(result.encodingTable).length, 0, "empty table");
  }, "buildHuffmanTree: empty input");

  check(() => {
    const result = HuffmanAlgorithm.buildHuffmanTree("A");
    assert(result.tree !== null, "tree exists");
    assertEqual(result.encodingTable["A"], "0", "single char gets code 0");
    assertEqual(result.snapshots.length, 2, "init + done snapshots");
  }, "buildHuffmanTree: single character");

  check(() => {
    const result = HuffmanAlgorithm.buildHuffmanTree("AAAA");
    assert(result.tree !== null, "tree exists");
    assertEqual(result.encodingTable["A"], "0", "single unique char gets code 0");
  }, "buildHuffmanTree: all same character");

  check(() => {
    const result = HuffmanAlgorithm.buildHuffmanTree("AB");
    assert(result.tree !== null, "tree exists");
    const codes = Object.values(result.encodingTable);
    assertEqual(codes.length, 2, "two codes");
    // Both codes should be 1 bit
    assert(codes[0].length === 1, "code length is 1");
    assert(codes[1].length === 1, "code length is 1");
    // Codes should be different
    assert(codes[0] !== codes[1], "codes are different");
  }, "buildHuffmanTree: two chars equal frequency");

  check(() => {
    const result = HuffmanAlgorithm.buildHuffmanTree("AAAAAAB");
    assert(result.tree !== null, "tree exists");
    // A (freq 6) should have shorter or equal code to B (freq 1)
    assert(
      result.encodingTable["A"].length <= result.encodingTable["B"].length,
      "frequent char gets shorter/equal code"
    );
  }, "buildHuffmanTree: skewed frequency distribution");

  check(() => {
    const result = HuffmanAlgorithm.buildHuffmanTree("ABCDE");
    assert(result.tree !== null, "tree exists");
    assertEqual(Object.keys(result.encodingTable).length, 5, "five codes");
    // All codes should be unique
    const codes = Object.values(result.encodingTable);
    const unique = new Set(codes);
    assertEqual(unique.size, 5, "all codes unique");
  }, "buildHuffmanTree: five distinct characters");

  // --- Snapshots ---
  check(() => {
    const result = HuffmanAlgorithm.buildHuffmanTree("AABBC");
    assert(result.snapshots.length > 0, "has snapshots");
    assertEqual(result.snapshots[0].phase, "init", "first snapshot is init");
    const last = result.snapshots[result.snapshots.length - 1];
    assertEqual(last.phase, "done", "last snapshot is done");
  }, "snapshots: phases are init through done");

  check(() => {
    const result = HuffmanAlgorithm.buildHuffmanTree("AABBC");
    // 3 unique chars: init + 2 merges = 3 snapshots
    assertEqual(result.snapshots.length, 3, "init + 2 merges");
  }, "snapshots: correct count for 3 unique chars");

  check(() => {
    const result = HuffmanAlgorithm.buildHuffmanTree("ABCDEF");
    // 6 unique chars: init + 5 merges = 6 snapshots
    assertEqual(result.snapshots.length, 6, "init + 5 merges");
  }, "snapshots: correct count for 6 unique chars");

  // --- Prefix-free property ---
  check(() => {
    const result = HuffmanAlgorithm.buildHuffmanTree("MISSISSIPPI");
    const codes = result.encodingTable;
    const keys = Object.keys(codes);
    // No code should be a prefix of another
    for (let i = 0; i < keys.length; i++) {
      for (let j = 0; j < keys.length; j++) {
        if (i !== j) {
          assert(
            !codes[keys[j]].startsWith(codes[keys[i]]),
            "'" + keys[i] + "'=" + codes[keys[i]] + " is not prefix of '" + keys[j] + "'=" + codes[keys[j]]
          );
        }
      }
    }
  }, "encoding: prefix-free property");

  // --- encodeText ---
  check(() => {
    const encoded = HuffmanAlgorithm.encodeText("", { a: "0" });
    assertEqual(encoded, "", "empty text");
  }, "encodeText: empty input");

  check(() => {
    const encoded = HuffmanAlgorithm.encodeText("aab", { a: "0", b: "1" });
    assertEqual(encoded, "001", "simple encoding");
  }, "encodeText: simple two-char encoding");

  // --- decodeText ---
  check(() => {
    const decoded = HuffmanAlgorithm.decodeText("", null);
    assertEqual(decoded, "", "empty bits");
  }, "decodeText: empty input");

  // --- Encode/Decode roundtrip ---
  check(() => {
    const text = "MISSISSIPPI";
    const result = HuffmanAlgorithm.buildHuffmanTree(text);
    const encoded = HuffmanAlgorithm.encodeText(text, result.encodingTable);
    const decoded = HuffmanAlgorithm.decodeText(encoded, result.tree);
    assertEqual(decoded, text, "roundtrip matches");
  }, "roundtrip: MISSISSIPPI");

  check(() => {
    const text = "AAAAAAB";
    const result = HuffmanAlgorithm.buildHuffmanTree(text);
    const encoded = HuffmanAlgorithm.encodeText(text, result.encodingTable);
    const decoded = HuffmanAlgorithm.decodeText(encoded, result.tree);
    assertEqual(decoded, text, "roundtrip matches");
  }, "roundtrip: skewed AAAAAAB");

  check(() => {
    const text = "AB";
    const result = HuffmanAlgorithm.buildHuffmanTree(text);
    const encoded = HuffmanAlgorithm.encodeText(text, result.encodingTable);
    const decoded = HuffmanAlgorithm.decodeText(encoded, result.tree);
    assertEqual(decoded, text, "roundtrip matches");
  }, "roundtrip: two chars equal frequency");

  check(() => {
    const text = "abcdefghijklmnop";
    const result = HuffmanAlgorithm.buildHuffmanTree(text);
    const encoded = HuffmanAlgorithm.encodeText(text, result.encodingTable);
    const decoded = HuffmanAlgorithm.decodeText(encoded, result.tree);
    assertEqual(decoded, text, "roundtrip matches");
  }, "roundtrip: 16 distinct characters");

  check(() => {
    // Test with a longer string
    let text = "";
    for (let i = 0; i < 200; i++) {
      text += String.fromCharCode(65 + (i % 26));
    }
    const result = HuffmanAlgorithm.buildHuffmanTree(text);
    const encoded = HuffmanAlgorithm.encodeText(text, result.encodingTable);
    const decoded = HuffmanAlgorithm.decodeText(encoded, result.tree);
    assertEqual(decoded, text, "roundtrip matches");
  }, "roundtrip: max 200 chars");

  // --- getSnapshots ---
  check(() => {
    const result = HuffmanAlgorithm.getSnapshots("HELLO");
    assert(result.snapshots.length > 0, "has snapshots");
    assert(result.tree !== null, "has tree");
    assert(result.encoded.length > 0, "has encoded string");
    assertEqual(result.decoded, "HELLO", "decoded matches");
    assert(Object.keys(result.freqTable).length > 0, "has freq table");
    assert(Object.keys(result.encodingTable).length > 0, "has encoding table");
  }, "getSnapshots: returns complete result");

  // --- Compression ---
  check(() => {
    const text = "AAAAAABBBBCCD";
    const result = HuffmanAlgorithm.getSnapshots(text);
    const originalBits = text.length * 8;
    const encodedBits = result.encoded.length;
    assert(encodedBits < originalBits, "encoded is shorter than 8 bits/char");
  }, "compression: encoded is shorter than original");

  // --- buildEncodingTable ---
  check(() => {
    const table = HuffmanAlgorithm.buildEncodingTable(null);
    assertEqual(Object.keys(table).length, 0, "empty for null");
  }, "buildEncodingTable: null root");

  // --- Tie-breaking consistency ---
  check(() => {
    // Run the same input twice — should get same encoding
    const result1 = HuffmanAlgorithm.buildHuffmanTree("AABBCC");
    const result2 = HuffmanAlgorithm.buildHuffmanTree("AABBCC");
    assertEqual(
      JSON.stringify(result1.encodingTable),
      JSON.stringify(result2.encodingTable),
      "consistent tie-breaking"
    );
  }, "consistency: same input produces same encoding");

  return { passed, failed, failures };
}

module.exports = { runTests };
