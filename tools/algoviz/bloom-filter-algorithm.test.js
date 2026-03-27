/**
 * Bloom Filter Algorithm Tests — Node.js runner compatible
 * Exports runTests() for run-tests.js harness
 *
 * Tests cover: createFilter, hash determinism, insert, query (true-positive,
 * true-negative, false-positive), FP rate formula, fill level, edge cases
 * (empty filter, empty string, duplicate insert, all bits set).
 */

function runTests({ assert, assertEqual }) {
  var passed = 0;
  var failed = 0;
  var failures = [];

  var BloomFilterAlgorithm = require("./bloom-filter-algorithm.js");

  function check(fn, name) {
    try {
      fn();
      passed++;
      console.log("  PASS: " + name);
    } catch (e) {
      failed++;
      failures.push({ name: name, message: e.message });
      console.log("  FAIL: " + name + " — " + e.message);
    }
  }

  // --- createFilter ---
  check(function () {
    var filter = BloomFilterAlgorithm.createFilter(32, 3);
    assertEqual(filter.m, 32, "m is 32");
    assertEqual(filter.k, 3, "k is 3");
    assertEqual(filter.n, 0, "n is 0");
    assertEqual(filter.bits.length, 32, "bits array length is 32");
    for (var i = 0; i < 32; i++) {
      assertEqual(filter.bits[i], 0, "bit " + i + " is 0");
    }
    assertEqual(Object.keys(filter.insertedWords).length, 0, "no inserted words");
  }, "createFilter returns correct empty filter");

  check(function () {
    var filter = BloomFilterAlgorithm.createFilter(16, 1);
    assertEqual(filter.m, 16, "m is 16");
    assertEqual(filter.k, 1, "k is 1");
    assertEqual(filter.bits.length, 16, "bits length 16");
  }, "createFilter with minimum-like params");

  // --- hash determinism ---
  check(function () {
    var h1 = BloomFilterAlgorithm.hash("hello", 0, 32);
    var h2 = BloomFilterAlgorithm.hash("hello", 0, 32);
    assertEqual(h1, h2, "same input same output");
    assert(h1 >= 0 && h1 < 32, "hash in range [0, 32)");
  }, "hash is deterministic");

  check(function () {
    var h1 = BloomFilterAlgorithm.hash("hello", 0, 32);
    var h2 = BloomFilterAlgorithm.hash("hello", 1, 32);
    // Different seeds should usually produce different indices
    // (not guaranteed but extremely likely for this input)
    assert(typeof h1 === "number" && typeof h2 === "number", "both are numbers");
    assert(h1 >= 0 && h1 < 32, "h1 in range");
    assert(h2 >= 0 && h2 < 32, "h2 in range");
  }, "hash with different seeds produces valid indices");

  // --- getHashIndices ---
  check(function () {
    var indices = BloomFilterAlgorithm.getHashIndices("test", 3, 32);
    assertEqual(indices.length, 3, "3 indices for k=3");
    for (var i = 0; i < indices.length; i++) {
      assert(indices[i] >= 0 && indices[i] < 32, "index " + i + " in range");
    }
  }, "getHashIndices returns k indices in valid range");

  check(function () {
    var indices = BloomFilterAlgorithm.getHashIndices("test", 7, 128);
    assertEqual(indices.length, 7, "7 indices for k=7");
    for (var i = 0; i < indices.length; i++) {
      assert(
        indices[i] >= 0 && indices[i] < 128,
        "index " + i + " in range [0,128)",
      );
    }
  }, "getHashIndices with k=7, m=128");

  // --- insert ---
  check(function () {
    var filter = BloomFilterAlgorithm.createFilter(32, 3);
    var result = BloomFilterAlgorithm.insert(filter, "hello");
    assertEqual(result.alreadyPresent, false, "not already present");
    assertEqual(result.indices.length, 3, "3 indices returned");
    assertEqual(filter.n, 1, "n incremented to 1");
    assertEqual(filter.insertedWords["hello"], true, "word tracked");
    // Verify bits are set
    for (var i = 0; i < result.indices.length; i++) {
      assertEqual(filter.bits[result.indices[i]], 1, "bit at index set");
    }
  }, "insert sets correct bits and tracks word");

  check(function () {
    var filter = BloomFilterAlgorithm.createFilter(32, 3);
    BloomFilterAlgorithm.insert(filter, "hello");
    var result = BloomFilterAlgorithm.insert(filter, "hello");
    assertEqual(result.alreadyPresent, true, "duplicate detected");
    assertEqual(filter.n, 1, "n not incremented for duplicate");
  }, "insert duplicate word detected, n unchanged");

  check(function () {
    var filter = BloomFilterAlgorithm.createFilter(32, 3);
    BloomFilterAlgorithm.insert(filter, "a");
    BloomFilterAlgorithm.insert(filter, "b");
    BloomFilterAlgorithm.insert(filter, "c");
    assertEqual(filter.n, 3, "3 items inserted");
  }, "insert multiple distinct words increments n correctly");

  // --- query: true positive ---
  check(function () {
    var filter = BloomFilterAlgorithm.createFilter(32, 3);
    BloomFilterAlgorithm.insert(filter, "hello");
    var result = BloomFilterAlgorithm.query(filter, "hello");
    assertEqual(result.result, "true-positive", "result is true-positive");
    assertEqual(result.allBitsSet, true, "all bits set");
    assertEqual(result.isKnownInserted, true, "known inserted");
  }, "query inserted word returns true-positive");

  // --- query: true negative ---
  check(function () {
    var filter = BloomFilterAlgorithm.createFilter(64, 3);
    BloomFilterAlgorithm.insert(filter, "hello");
    var result = BloomFilterAlgorithm.query(filter, "xyz_not_inserted");
    assertEqual(result.result, "true-negative", "result is true-negative");
    assertEqual(result.allBitsSet, false, "not all bits set");
    assertEqual(result.isKnownInserted, false, "not known inserted");
  }, "query non-inserted word with unset bits returns true-negative");

  // --- query: empty filter ---
  check(function () {
    var filter = BloomFilterAlgorithm.createFilter(32, 3);
    var result = BloomFilterAlgorithm.query(filter, "anything");
    assertEqual(result.result, "true-negative", "empty filter always true-negative");
    assertEqual(result.allBitsSet, false, "no bits set in empty filter");
  }, "query on empty filter returns true-negative");

  // --- query: false positive demonstration ---
  check(function () {
    // Use a very small filter to force collisions
    var filter = BloomFilterAlgorithm.createFilter(8, 2);
    // Insert many words to fill up bits
    var words = [
      "apple",
      "banana",
      "cherry",
      "date",
      "elderberry",
      "fig",
      "grape",
      "honeydew",
      "kiwi",
      "lemon",
    ];
    for (var i = 0; i < words.length; i++) {
      BloomFilterAlgorithm.insert(filter, words[i]);
    }
    // With 8 bits and 10 words inserted with k=2, all bits should likely be set
    var fill = BloomFilterAlgorithm.getFillLevel(filter);
    // Query a word that was NOT inserted
    var result = BloomFilterAlgorithm.query(filter, "zzznotinserted");
    if (fill.percentage === 100) {
      // All bits set means any query returns false-positive
      assertEqual(
        result.result,
        "false-positive",
        "all bits set -> false positive for non-inserted word",
      );
      assertEqual(result.allBitsSet, true, "all queried bits are set");
      assertEqual(result.isKnownInserted, false, "word was not actually inserted");
    } else {
      // If not all bits set, result could be true-negative — still valid
      assert(
        result.result === "true-negative" || result.result === "false-positive",
        "result is either true-negative or false-positive",
      );
    }
  }, "false positive occurs when all queried bits happen to be set");

  // --- getFalsePositiveRate ---
  check(function () {
    var rate = BloomFilterAlgorithm.getFalsePositiveRate(0, 32, 3);
    assertEqual(rate, 0, "FP rate is 0 when no items inserted");
  }, "getFalsePositiveRate with n=0 returns 0");

  check(function () {
    var rate = BloomFilterAlgorithm.getFalsePositiveRate(0, 0, 3);
    assertEqual(rate, 0, "FP rate is 0 when m=0");
  }, "getFalsePositiveRate with m=0 returns 0");

  check(function () {
    // P(fp) = (1 - e^(-3*10/32))^3
    var rate = BloomFilterAlgorithm.getFalsePositiveRate(10, 32, 3);
    assert(rate > 0, "FP rate > 0 with items inserted");
    assert(rate < 1, "FP rate < 1");
    // Expected: (1 - e^(-0.9375))^3 ≈ (1 - 0.3916)^3 ≈ 0.6084^3 ≈ 0.2253
    assert(
      Math.abs(rate - 0.2253) < 0.01,
      "FP rate approximately 0.2253, got " + rate,
    );
  }, "getFalsePositiveRate computes correct value for n=10, m=32, k=3");

  check(function () {
    var rate = BloomFilterAlgorithm.getFalsePositiveRate(1, 32, 3);
    assert(rate > 0, "FP rate > 0");
    assert(rate < 0.01, "FP rate very low with 1 item in 32 bits");
  }, "getFalsePositiveRate is very low for 1 item in large filter");

  // --- getFillLevel ---
  check(function () {
    var filter = BloomFilterAlgorithm.createFilter(32, 3);
    var fill = BloomFilterAlgorithm.getFillLevel(filter);
    assertEqual(fill.setBits, 0, "no bits set");
    assertEqual(fill.total, 32, "total is 32");
    assertEqual(fill.percentage, 0, "percentage is 0");
  }, "getFillLevel on empty filter returns 0%");

  check(function () {
    var filter = BloomFilterAlgorithm.createFilter(32, 3);
    BloomFilterAlgorithm.insert(filter, "hello");
    var fill = BloomFilterAlgorithm.getFillLevel(filter);
    assert(fill.setBits > 0, "some bits set after insert");
    assert(fill.setBits <= 3, "at most k=3 bits set for 1 word");
    assertEqual(fill.total, 32, "total is 32");
    assert(fill.percentage > 0, "percentage > 0");
  }, "getFillLevel after one insert shows correct bits set");

  // --- all bits set scenario ---
  check(function () {
    var filter = BloomFilterAlgorithm.createFilter(4, 2);
    // Insert enough words to fill all 4 bits
    var words = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];
    for (var i = 0; i < words.length; i++) {
      BloomFilterAlgorithm.insert(filter, words[i]);
    }
    var fill = BloomFilterAlgorithm.getFillLevel(filter);
    assertEqual(fill.percentage, 100, "all bits set");
    // Any non-inserted query should be false-positive
    var result = BloomFilterAlgorithm.query(filter, "zzz_never_inserted");
    assertEqual(result.result, "false-positive", "false positive when all bits set");
  }, "all bits set produces false positives for any query");

  // --- getPasswordPreset ---
  check(function () {
    var preset = BloomFilterAlgorithm.getPasswordPreset();
    assertEqual(preset.length, 8, "8 preset passwords");
    assert(preset.indexOf("password") !== -1, "contains 'password'");
    assert(preset.indexOf("123456") !== -1, "contains '123456'");
    assert(preset.indexOf("qwerty") !== -1, "contains 'qwerty'");
  }, "getPasswordPreset returns 8 common passwords");

  // --- edge: single character word ---
  check(function () {
    var filter = BloomFilterAlgorithm.createFilter(32, 3);
    var result = BloomFilterAlgorithm.insert(filter, "x");
    assertEqual(result.alreadyPresent, false, "not already present");
    assertEqual(filter.n, 1, "n is 1");
    var q = BloomFilterAlgorithm.query(filter, "x");
    assertEqual(q.result, "true-positive", "single char queryable");
  }, "insert and query single character word");

  // --- edge: query before any insert ---
  check(function () {
    var filter = BloomFilterAlgorithm.createFilter(32, 3);
    var q = BloomFilterAlgorithm.query(filter, "test");
    assertEqual(q.result, "true-negative", "query before insert is true-negative");
    assertEqual(q.isKnownInserted, false, "not known inserted");
  }, "query before any insert returns true-negative");

  // --- deterministic hash indices ---
  check(function () {
    var i1 = BloomFilterAlgorithm.getHashIndices("test", 3, 32);
    var i2 = BloomFilterAlgorithm.getHashIndices("test", 3, 32);
    assertEqual(i1, i2, "same word same indices");
  }, "getHashIndices is deterministic across calls");

  return { passed: passed, failed: failed, failures: failures };
}

module.exports = { runTests: runTests };
