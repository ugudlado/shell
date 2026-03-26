// levenshtein-algorithm.test.js — Tests for Levenshtein algorithm + traceback info

const { levenshteinCompute, tracebackDescription } = require("./levenshtein-algorithm");

function runTests({ assert, assertEqual }) {
  let passed = 0;
  let failed = 0;
  const failures = [];

  function test(name, fn) {
    try {
      fn();
      console.log("  PASS: " + name);
      passed++;
    } catch (err) {
      console.log("  FAIL: " + name + " — " + err.message);
      failed++;
      failures.push({ name, message: err.message });
    }
  }

  // --- Algorithm correctness tests ---

  test("kitten -> sitting distance is 3", () => {
    const result = levenshteinCompute("kitten", "sitting");
    assertEqual(result.distance, 3, "distance");
  });

  test("empty -> abc distance is 3", () => {
    const result = levenshteinCompute("", "abc");
    assertEqual(result.distance, 3, "distance");
  });

  test("abc -> empty distance is 3", () => {
    const result = levenshteinCompute("abc", "");
    assertEqual(result.distance, 3, "distance");
  });

  test("same strings distance is 0", () => {
    const result = levenshteinCompute("hello", "hello");
    assertEqual(result.distance, 0, "distance");
  });

  test("traceback starts at (0,0) and ends at (m,n)", () => {
    const result = levenshteinCompute("kitten", "sitting");
    const tb = result.traceback;
    assertEqual(tb[0], { i: 0, j: 0 }, "traceback start");
    assertEqual(tb[tb.length - 1], { i: 6, j: 7 }, "traceback end");
  });

  // --- REGRESSION TEST: traceback description must not be empty ---

  test("tracebackDescription returns non-empty string for kitten->sitting", () => {
    const result = levenshteinCompute("kitten", "sitting");
    const desc = tracebackDescription("kitten", "sitting", result.traceback, result.ops);
    assert(typeof desc === "string", "description should be a string");
    assert(desc.length > 0, "traceback description must not be empty — this is the bug");
  });

  test("tracebackDescription mentions operations for each traceback step", () => {
    const result = levenshteinCompute("kitten", "sitting");
    const desc = tracebackDescription("kitten", "sitting", result.traceback, result.ops);
    // The description should mention at least one operation type
    const hasOp = /match|substitute|insert|delete/i.test(desc);
    assert(hasOp, "traceback description should mention at least one operation (match/substitute/insert/delete)");
  });

  test("tracebackDescription works for identical strings", () => {
    const result = levenshteinCompute("abc", "abc");
    const desc = tracebackDescription("abc", "abc", result.traceback, result.ops);
    assert(desc.length > 0, "description should not be empty even for identical strings");
    assert(/match/i.test(desc), "identical strings should produce match operations");
  });

  return { passed, failed, failures };
}

module.exports = { runTests };
