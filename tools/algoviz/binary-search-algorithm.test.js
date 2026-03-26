/**
 * Binary Search Algorithm Tests — Node.js runner compatible
 * Exports runTests() for run-tests.js harness
 */

function runTests({ assert, assertEqual }) {
  let passed = 0;
  let failed = 0;
  const failures = [];

  const BinarySearchAlgorithm = require("./binary-search-algorithm.js");

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

  // --- Target found at middle ---
  check(() => {
    const result = BinarySearchAlgorithm.search([1, 3, 5, 7, 9], 5);
    assertEqual(result.found, true, "Found");
    assertEqual(result.foundIndex, 2, "Found at index 2");
  }, "Target found at middle");

  // --- Target found at start (index 0) ---
  check(() => {
    const result = BinarySearchAlgorithm.search([1, 3, 5, 7, 9], 1);
    assertEqual(result.found, true, "Found");
    assertEqual(result.foundIndex, 0, "Found at index 0");
  }, "Target found at start");

  // --- Target found at end (last index) ---
  check(() => {
    const result = BinarySearchAlgorithm.search([1, 3, 5, 7, 9], 9);
    assertEqual(result.found, true, "Found");
    assertEqual(result.foundIndex, 4, "Found at index 4");
  }, "Target found at end");

  // --- Target not found (between elements) ---
  check(() => {
    const result = BinarySearchAlgorithm.search([1, 3, 5, 7, 9], 4);
    assertEqual(result.found, false, "Not found");
    assertEqual(result.foundIndex, -1, "Index is -1");
  }, "Target not found (between elements)");

  // --- Target not found (smaller than all) ---
  check(() => {
    const result = BinarySearchAlgorithm.search([1, 3, 5, 7, 9], 0);
    assertEqual(result.found, false, "Not found");
    assertEqual(result.foundIndex, -1, "Index is -1");
  }, "Target not found (smaller than all)");

  // --- Target not found (larger than all) ---
  check(() => {
    const result = BinarySearchAlgorithm.search([1, 3, 5, 7, 9], 10);
    assertEqual(result.found, false, "Not found");
    assertEqual(result.foundIndex, -1, "Index is -1");
  }, "Target not found (larger than all)");

  // --- Empty array ---
  check(() => {
    const result = BinarySearchAlgorithm.search([], 5);
    assertEqual(result.found, false, "Not found");
    assertEqual(result.foundIndex, -1, "Index is -1");
    assertEqual(result.steps.length, 1, "One step (done)");
  }, "Empty array");

  // --- Single element found ---
  check(() => {
    const result = BinarySearchAlgorithm.search([42], 42);
    assertEqual(result.found, true, "Found");
    assertEqual(result.foundIndex, 0, "Found at index 0");
  }, "Single element found");

  // --- Single element not found ---
  check(() => {
    const result = BinarySearchAlgorithm.search([42], 99);
    assertEqual(result.found, false, "Not found");
    assertEqual(result.foundIndex, -1, "Index is -1");
  }, "Single element not found");

  // --- All duplicates (target present) ---
  check(() => {
    const result = BinarySearchAlgorithm.search([5, 5, 5, 5, 5], 5);
    assertEqual(result.found, true, "Found");
    assert(result.foundIndex >= 0 && result.foundIndex <= 4, "Valid index");
  }, "All duplicates (target present)");

  // --- All duplicates (target absent) ---
  check(() => {
    const result = BinarySearchAlgorithm.search([5, 5, 5, 5, 5], 3);
    assertEqual(result.found, false, "Not found");
    assertEqual(result.foundIndex, -1, "Index is -1");
  }, "All duplicates (target absent)");

  // --- Large array (20+ elements) ---
  check(() => {
    const arr = [];
    for (let i = 0; i < 25; i++) arr.push(i * 3);
    // Search for element at index 20 (value 60)
    const result = BinarySearchAlgorithm.search(arr, 60);
    assertEqual(result.found, true, "Found");
    assertEqual(result.foundIndex, 20, "Found at index 20");
    // Steps should be O(log n) — for 25 elements, max ~5 steps + done
    assert(result.steps.length <= 7, "Steps count is O(log n): " + result.steps.length);
  }, "Large array (25 elements)");

  // --- Two element array ---
  check(() => {
    const result = BinarySearchAlgorithm.search([1, 2], 1);
    assertEqual(result.found, true, "Found");
    assertEqual(result.foundIndex, 0, "Found at index 0");
  }, "Two element array (find first)");

  check(() => {
    const result = BinarySearchAlgorithm.search([1, 2], 2);
    assertEqual(result.found, true, "Found");
    assertEqual(result.foundIndex, 1, "Found at index 1");
  }, "Two element array (find second)");

  check(() => {
    const result = BinarySearchAlgorithm.search([1, 2], 3);
    assertEqual(result.found, false, "Not found");
  }, "Two element array (not found)");

  // --- Step structure validation ---
  check(() => {
    const result = BinarySearchAlgorithm.search([1, 3, 5, 7, 9], 5);
    const step = result.steps[0];
    assert(Array.isArray(step.arr), "Step has arr");
    assert(typeof step.low === "number", "Step has low");
    assert(typeof step.mid === "number", "Step has mid");
    assert(typeof step.high === "number", "Step has high");
    assert(typeof step.target === "number", "Step has target");
    assert(typeof step.comparison === "string", "Step has comparison");
    assert(typeof step.found === "boolean", "Step has found");
    assert(typeof step.eliminated === "string", "Step has eliminated");
    assert(typeof step.step === "number", "Step has step counter");
    assert(typeof step.explanation === "string", "Step has explanation");
  }, "Step object structure");

  // --- Done step ---
  check(() => {
    const result = BinarySearchAlgorithm.search([1, 3, 5, 7, 9], 5);
    const lastStep = result.steps[result.steps.length - 1];
    assertEqual(lastStep.found, true, "Last step found");
    assert(
      lastStep.explanation.indexOf("Found") >= 0,
      "Done explanation mentions Found",
    );
  }, "Done step for found target");

  check(() => {
    const result = BinarySearchAlgorithm.search([1, 3, 5, 7, 9], 4);
    const lastStep = result.steps[result.steps.length - 1];
    assertEqual(lastStep.found, false, "Last step not found");
    assert(
      lastStep.explanation.indexOf("not found") >= 0 ||
        lastStep.explanation.indexOf("Not found") >= 0,
      "Done explanation mentions not found",
    );
  }, "Done step for not-found target");

  // --- Input not mutated ---
  check(() => {
    const input = [1, 3, 5, 7, 9];
    BinarySearchAlgorithm.search(input, 5);
    assertEqual(input, [1, 3, 5, 7, 9], "Input not mutated");
  }, "Input array is not mutated");

  // --- Comparison values ---
  check(() => {
    const result = BinarySearchAlgorithm.search([1, 3, 5, 7, 9], 5);
    // First step: mid = 2, arr[2] = 5 = target, comparison = "equal"
    const step = result.steps[0];
    assertEqual(step.comparison, "equal", "Comparison is equal");
  }, "Comparison equal when target found immediately");

  check(() => {
    const result = BinarySearchAlgorithm.search([1, 3, 5, 7, 9], 1);
    // First step: mid = 2, arr[2] = 5 > 1, comparison = "greater"
    const step = result.steps[0];
    assertEqual(step.comparison, "greater", "Comparison is greater");
    assertEqual(step.eliminated, "right", "Right half eliminated");
  }, "Comparison greater eliminates right half");

  check(() => {
    const result = BinarySearchAlgorithm.search([1, 3, 5, 7, 9], 9);
    // First step: mid = 2, arr[2] = 5 < 9, comparison = "less"
    const step = result.steps[0];
    assertEqual(step.comparison, "less", "Comparison is less");
    assertEqual(step.eliminated, "left", "Left half eliminated");
  }, "Comparison less eliminates left half");

  // --- Steps count is O(log n) ---
  check(() => {
    const arr = [];
    for (let i = 1; i <= 32; i++) arr.push(i);
    const result = BinarySearchAlgorithm.search(arr, 1);
    // For 32 elements, max steps = ceil(log2(32)) + 1 = 6 + done step
    assert(result.steps.length <= 8, "Steps <= 8 for 32 elements: " + result.steps.length);
  }, "Steps count is O(log n) for 32 elements");

  return { passed, failed, failures };
}

module.exports = { runTests };
