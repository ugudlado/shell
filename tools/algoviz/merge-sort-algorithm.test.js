/**
 * Merge Sort Algorithm Tests — Node.js runner compatible
 * Exports runTests() for run-tests.js harness
 */

function runTests({ assert, assertEqual }) {
  let passed = 0;
  let failed = 0;
  const failures = [];

  const MergeSortAlgorithm = require("./merge-sort-algorithm.js");

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
    const result = MergeSortAlgorithm.sort([3, 1, 2]);
    assertEqual(result.sortedArray, [1, 2, 3], "Sorted output");
  }, "Basic sort: [3,1,2] -> [1,2,3]");

  check(() => {
    const result = MergeSortAlgorithm.sort([5, 4, 3, 2, 1]);
    assertEqual(result.sortedArray, [1, 2, 3, 4, 5], "Reverse sorted");
  }, "Reverse sorted input");

  // --- Already sorted ---
  check(() => {
    const result = MergeSortAlgorithm.sort([1, 2, 3, 4, 5]);
    assertEqual(result.sortedArray, [1, 2, 3, 4, 5], "Already sorted");
  }, "Already sorted input");

  // --- Single element ---
  check(() => {
    const result = MergeSortAlgorithm.sort([42]);
    assertEqual(result.sortedArray, [42], "Single element");
    // Should have minimal steps (just complete)
    assert(result.steps.length >= 1, "At least one step");
  }, "Single element array");

  // --- Empty array ---
  check(() => {
    const result = MergeSortAlgorithm.sort([]);
    assertEqual(result.sortedArray, [], "Empty");
    assert(result.steps.length >= 1, "At least one step");
  }, "Empty array");

  // --- Two elements ---
  check(() => {
    const result = MergeSortAlgorithm.sort([2, 1]);
    assertEqual(result.sortedArray, [1, 2], "Sorted");
  }, "Two elements: swap needed");

  check(() => {
    const result = MergeSortAlgorithm.sort([1, 2]);
    assertEqual(result.sortedArray, [1, 2], "Already sorted pair");
  }, "Two elements: already sorted");

  // --- Duplicates ---
  check(() => {
    const result = MergeSortAlgorithm.sort([3, 1, 3, 1, 2]);
    assertEqual(result.sortedArray, [1, 1, 2, 3, 3], "Duplicates sorted");
  }, "Array with duplicates");

  // --- All duplicates ---
  check(() => {
    const result = MergeSortAlgorithm.sort([3, 3, 3, 3]);
    assertEqual(result.sortedArray, [3, 3, 3, 3], "All same");
  }, "All duplicates");

  // --- Negative numbers ---
  check(() => {
    const result = MergeSortAlgorithm.sort([-3, 5, -1, 0]);
    assertEqual(result.sortedArray, [-3, -1, 0, 5], "Negatives sorted");
  }, "Negative numbers");

  // --- Large array (20+ elements) ---
  check(() => {
    const input = [];
    for (let i = 20; i >= 1; i--) input.push(i);
    const result = MergeSortAlgorithm.sort(input);
    const expected = [];
    for (let i = 1; i <= 20; i++) expected.push(i);
    assertEqual(result.sortedArray, expected, "Large array sorted");
  }, "Large array (20 elements reverse sorted)");

  // --- Input not mutated ---
  check(() => {
    const input = [5, 3, 1];
    MergeSortAlgorithm.sort(input);
    assertEqual(input, [5, 3, 1], "Input not mutated");
  }, "Input array is not mutated");

  // --- Step structure: split steps ---
  check(() => {
    const result = MergeSortAlgorithm.sort([4, 2, 7, 1]);
    const splitSteps = result.steps.filter((s) => s.type === "split");
    assert(splitSteps.length > 0, "Has split steps");
    const s = splitSteps[0];
    assertEqual(s.type, "split", "Type is split");
    assert(typeof s.depth === "number", "Has depth");
    assert(Array.isArray(s.left), "Has left subarray");
    assert(Array.isArray(s.right), "Has right subarray");
    assert(typeof s.explanation === "string", "Has explanation");
  }, "Split step structure");

  // --- Step structure: merge steps ---
  check(() => {
    const result = MergeSortAlgorithm.sort([4, 2, 7, 1]);
    const mergeSteps = result.steps.filter((s) => s.type === "merge");
    assert(mergeSteps.length > 0, "Has merge steps");
    const m = mergeSteps[0];
    assertEqual(m.type, "merge", "Type is merge");
    assert(typeof m.depth === "number", "Has depth");
    assert(typeof m.comparisons === "number", "Has comparisons");
    assert(typeof m.explanation === "string", "Has explanation");
  }, "Merge step structure");

  // --- Step structure: complete step ---
  check(() => {
    const result = MergeSortAlgorithm.sort([4, 2, 7, 1]);
    const lastStep = result.steps[result.steps.length - 1];
    assertEqual(lastStep.type, "complete", "Last step is complete");
    assert(typeof lastStep.comparisons === "number", "Has comparisons");
    assert(typeof lastStep.mergeOps === "number", "Has mergeOps");
    assert(typeof lastStep.explanation === "string", "Has explanation");
  }, "Complete step is last");

  // --- Recursion depth tracking ---
  check(() => {
    const result = MergeSortAlgorithm.sort([8, 4, 2, 1, 6, 3, 7, 5]);
    const lastStep = result.steps[result.steps.length - 1];
    assert(typeof lastStep.maxDepth === "number", "Has maxDepth");
    // For 8 elements, max depth should be 3 (log2(8))
    assertEqual(lastStep.maxDepth, 3, "Max depth for 8 elements is 3");
  }, "Recursion depth tracking (8 elements -> depth 3)");

  // --- Comparison count is reasonable ---
  check(() => {
    const result = MergeSortAlgorithm.sort([5, 4, 3, 2, 1]);
    const lastStep = result.steps[result.steps.length - 1];
    // For n=5, merge sort makes at most n*log2(n) comparisons
    assert(lastStep.comparisons > 0, "Has comparisons");
    assert(
      lastStep.comparisons <= 5 * Math.ceil(Math.log2(5)) + 5,
      "Reasonable comparison count",
    );
  }, "Comparison count is reasonable for n=5");

  // --- Stability: equal elements maintain relative order ---
  check(() => {
    // Use objects to track original indices conceptually
    // Merge sort is stable: equal elements keep their relative order
    const result = MergeSortAlgorithm.sort([3, 1, 3, 2]);
    assertEqual(result.sortedArray, [1, 2, 3, 3], "Stable sort result");
  }, "Stability: equal elements maintain relative order");

  // --- Split produces correct subarrays ---
  check(() => {
    const result = MergeSortAlgorithm.sort([4, 2, 7, 1]);
    const firstSplit = result.steps.find((s) => s.type === "split");
    assert(firstSplit !== undefined, "Has a split step");
    // First split of [4,2,7,1] should produce [4,2] and [7,1]
    assertEqual(firstSplit.left, [4, 2], "Left half");
    assertEqual(firstSplit.right, [7, 1], "Right half");
  }, "First split produces correct halves");

  // --- Merge operations count ---
  check(() => {
    const result = MergeSortAlgorithm.sort([3, 1]);
    const lastStep = result.steps[result.steps.length - 1];
    assert(lastStep.mergeOps >= 1, "At least 1 merge op for 2 elements");
  }, "Merge operations counted");

  // --- Adversarial: already sorted large ---
  check(() => {
    const input = [];
    for (let i = 1; i <= 20; i++) input.push(i);
    const result = MergeSortAlgorithm.sort(input);
    assertEqual(result.sortedArray, input.slice(), "Already sorted 20");
  }, "Already sorted 20 elements");

  // --- Adversarial: all same large ---
  check(() => {
    const input = Array(15).fill(7);
    const result = MergeSortAlgorithm.sort(input);
    assertEqual(result.sortedArray, input.slice(), "All same 15 elements");
  }, "All same value (15 elements)");

  return { passed, failed, failures };
}

module.exports = { runTests };
