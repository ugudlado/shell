/**
 * Bubble Sort Algorithm Tests — Node.js runner compatible
 * Exports runTests() for run-tests.js harness
 */

function runTests({ assert, assertEqual }) {
  let passed = 0;
  let failed = 0;
  const failures = [];

  const BubbleSortAlgorithm = require("./bubble-sort-algorithm.js");

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

  // --- Basic correctness ---
  check(() => {
    const result = BubbleSortAlgorithm.sort([3, 1, 2]);
    assertEqual(result.sortedArray, [1, 2, 3], "Sorted output");
  }, "Basic sort: [3,1,2] -> [1,2,3]");

  check(() => {
    const result = BubbleSortAlgorithm.sort([5, 4, 3, 2, 1]);
    assertEqual(result.sortedArray, [1, 2, 3, 4, 5], "Reverse sorted");
  }, "Reverse sorted input");

  // --- Already sorted (early termination) ---
  check(() => {
    const result = BubbleSortAlgorithm.sort([1, 2, 3, 4, 5]);
    assertEqual(result.sortedArray, [1, 2, 3, 4, 5], "Already sorted");
    assertEqual(result.steps[result.steps.length - 1].swaps, 0, "Zero swaps");
  }, "Already sorted: zero swaps, early termination");

  // --- Single element ---
  check(() => {
    const result = BubbleSortAlgorithm.sort([42]);
    assertEqual(result.sortedArray, [42], "Single element");
    // Only the final "done" step
    assertEqual(result.steps.length, 1, "One step (done)");
  }, "Single element array");

  // --- Empty array ---
  check(() => {
    const result = BubbleSortAlgorithm.sort([]);
    assertEqual(result.sortedArray, [], "Empty");
    assertEqual(result.steps.length, 1, "One step (done)");
  }, "Empty array");

  // --- Two elements ---
  check(() => {
    const result = BubbleSortAlgorithm.sort([2, 1]);
    assertEqual(result.sortedArray, [1, 2], "Sorted");
    assertEqual(result.steps[0].swapped, true, "First step is a swap");
    assertEqual(result.steps[0].swaps, 1, "One swap");
  }, "Two elements: swap needed");

  check(() => {
    const result = BubbleSortAlgorithm.sort([1, 2]);
    assertEqual(result.sortedArray, [1, 2], "Already sorted");
    assertEqual(result.steps[0].swapped, false, "No swap needed");
  }, "Two elements: no swap needed");

  // --- Duplicates ---
  check(() => {
    const result = BubbleSortAlgorithm.sort([3, 1, 3, 1, 2]);
    assertEqual(result.sortedArray, [1, 1, 2, 3, 3], "Duplicates sorted");
  }, "Array with duplicates");

  // --- Step structure ---
  check(() => {
    const result = BubbleSortAlgorithm.sort([3, 1, 2]);
    const step = result.steps[0];
    assert(Array.isArray(step.arr), "Step has arr");
    assert(Array.isArray(step.comparing), "Step has comparing");
    assertEqual(step.comparing.length, 2, "Comparing has 2 indices");
    assert(typeof step.swapped === "boolean", "Step has swapped");
    assert(typeof step.sortedBoundary === "number", "Step has sortedBoundary");
    assert(typeof step.comparisons === "number", "Step has comparisons");
    assert(typeof step.swaps === "number", "Step has swaps");
    assert(typeof step.explanation === "string", "Step has explanation");
  }, "Step object structure");

  // --- Comparison and swap counts ---
  check(() => {
    // Worst case: [3,2,1] needs 3 comparisons and 3 swaps
    const result = BubbleSortAlgorithm.sort([3, 2, 1]);
    const lastStep = result.steps[result.steps.length - 1];
    assertEqual(lastStep.comparisons, 3, "3 comparisons");
    assertEqual(lastStep.swaps, 3, "3 swaps");
  }, "Comparison and swap counts for worst case [3,2,1]");

  // --- Final step is the done step ---
  check(() => {
    const result = BubbleSortAlgorithm.sort([4, 2, 7, 1]);
    const lastStep = result.steps[result.steps.length - 1];
    assertEqual(lastStep.comparing, [-1, -1], "Done step comparing = [-1,-1]");
    assert(
      lastStep.explanation.indexOf("Sort complete") >= 0,
      "Done explanation",
    );
  }, "Final step is done marker");

  // --- Does not mutate input ---
  check(() => {
    const input = [5, 3, 1];
    BubbleSortAlgorithm.sort(input);
    assertEqual(input, [5, 3, 1], "Input not mutated");
  }, "Input array is not mutated");

  // --- Sorted boundary decreases ---
  check(() => {
    const result = BubbleSortAlgorithm.sort([4, 3, 2, 1]);
    // First pass: boundary = 4, second pass: boundary = 3, etc.
    const boundaries = result.steps
      .filter((s) => s.comparing[0] !== -1)
      .map((s) => s.sortedBoundary);
    // Boundaries should start at n and not increase
    assert(boundaries[0] >= boundaries[boundaries.length - 1], "Boundary shrinks");
  }, "Sorted boundary decreases over passes");

  return { passed, failed, failures };
}

module.exports = { runTests };
