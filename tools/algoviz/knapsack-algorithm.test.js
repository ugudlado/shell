/**
 * Knapsack Algorithm Tests — Node.js runner compatible
 * Exports runTests() for run-tests.js harness
 */

function runTests({ assert, assertEqual }) {
  let passed = 0;
  let failed = 0;
  const failures = [];

  // Load the algorithm module
  const KnapsackAlgorithm = require("./knapsack-algorithm.js");

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
    const items = [
      { weight: 2, value: 3 },
      { weight: 3, value: 4 },
      { weight: 4, value: 5 },
      { weight: 5, value: 6 },
    ];
    const result = KnapsackAlgorithm.solve(items, 7);
    assertEqual(result.dp[4][7], 9, "Optimal value for 4 items, capacity 7");
    assertEqual(result.traceback.totalValue, 9, "Traceback totalValue");
  }, "Basic correctness: 4 items, capacity 7, optimal = 9");

  check(() => {
    const items = [
      { weight: 1, value: 1 },
      { weight: 3, value: 4 },
      { weight: 4, value: 5 },
      { weight: 5, value: 7 },
    ];
    const result = KnapsackAlgorithm.solve(items, 7);
    assertEqual(result.dp[4][7], 9, "Textbook example optimal");
  }, "Textbook example: optimal = 9");

  // --- Single item ---
  check(() => {
    const result = KnapsackAlgorithm.solve([{ weight: 3, value: 5 }], 5);
    assertEqual(result.dp[1][5], 5, "Value");
    assertEqual(result.traceback.selectedItems.length, 1, "Count");
    assertEqual(result.traceback.totalWeight, 3, "Weight");
  }, "Single item fits");

  check(() => {
    const result = KnapsackAlgorithm.solve([{ weight: 6, value: 5 }], 5);
    assertEqual(result.dp[1][5], 0, "Value");
    assertEqual(result.traceback.selectedItems.length, 0, "Count");
  }, "Single item too heavy");

  // --- All items fit ---
  check(() => {
    const items = [
      { weight: 1, value: 2 },
      { weight: 2, value: 3 },
      { weight: 3, value: 4 },
    ];
    const result = KnapsackAlgorithm.solve(items, 10);
    assertEqual(result.traceback.totalValue, 9, "Total value");
    assertEqual(result.traceback.totalWeight, 6, "Total weight");
    assertEqual(result.traceback.selectedItems.length, 3, "All selected");
  }, "All items fit");

  // --- No items fit ---
  check(() => {
    const items = [
      { weight: 5, value: 10 },
      { weight: 6, value: 12 },
    ];
    const result = KnapsackAlgorithm.solve(items, 4);
    assertEqual(result.dp[2][4], 0, "Optimal = 0");
    assertEqual(result.traceback.selectedItems.length, 0, "None selected");
  }, "No items fit");

  // --- Zero capacity ---
  check(() => {
    const result = KnapsackAlgorithm.solve([{ weight: 1, value: 5 }], 0);
    assertEqual(result.dp[1][0], 0, "Value = 0");
    assertEqual(result.traceback.selectedItems.length, 0, "None selected");
  }, "Zero capacity");

  // --- Empty items ---
  check(() => {
    const result = KnapsackAlgorithm.solve([], 5);
    assertEqual(result.dp.length, 1, "1 row");
    assertEqual(result.traceback.totalValue, 0, "Value = 0");
  }, "Empty items");

  // --- Exact capacity match ---
  check(() => {
    const items = [
      { weight: 3, value: 4 },
      { weight: 4, value: 5 },
    ];
    const result = KnapsackAlgorithm.solve(items, 7);
    assertEqual(result.traceback.totalValue, 9, "Value = 9");
    assertEqual(result.traceback.totalWeight, 7, "Weight = capacity");
  }, "Exact capacity match");

  // --- Greedy trap ---
  check(() => {
    const items = [
      { weight: 2, value: 5 },
      { weight: 3, value: 6 },
      { weight: 5, value: 8 },
    ];
    const result = KnapsackAlgorithm.solve(items, 7);
    assertEqual(result.dp[3][7], 13, "DP optimal = 13");
    assertEqual(result.traceback.totalValue, 13, "Traceback = 13");
  }, "Greedy trap: DP beats greedy");

  // --- DP table dimensions ---
  check(() => {
    const items = [
      { weight: 1, value: 1 },
      { weight: 2, value: 2 },
      { weight: 3, value: 3 },
    ];
    const result = KnapsackAlgorithm.solve(items, 5);
    assertEqual(result.dp.length, 4, "n+1 rows");
    assertEqual(result.dp[0].length, 6, "W+1 cols");
    assertEqual(result.dp[0], [0, 0, 0, 0, 0, 0], "Row 0 all zeros");
  }, "DP table dimensions");

  // --- Steps array ---
  check(() => {
    const items = [
      { weight: 2, value: 3 },
      { weight: 3, value: 4 },
    ];
    const result = KnapsackAlgorithm.solve(items, 4);
    assertEqual(result.steps.length, 10, "2 * 5 = 10 steps");
    assert(typeof result.steps[0].row === "number", "Step has row");
    assert(typeof result.steps[0].col === "number", "Step has col");
    assert(typeof result.steps[0].value === "number", "Step has value");
    assert(typeof result.steps[0].take === "boolean", "Step has take");
    assert(typeof result.steps[0].explanation === "string", "Step has explanation");
  }, "Steps array structure and count");

  // --- Decision tracking ---
  check(() => {
    const items = [{ weight: 3, value: 5 }];
    const result = KnapsackAlgorithm.solve(items, 5);
    const skipStep = result.steps.find((s) => s.row === 1 && s.col === 2);
    const takeStep = result.steps.find((s) => s.row === 1 && s.col === 3);
    assert(skipStep && !skipStep.take, "w=2 is skip");
    assert(takeStep && takeStep.take, "w=3 is take");
  }, "Decision tracking: take vs skip");

  // --- Traceback path ---
  check(() => {
    const items = [
      { weight: 2, value: 3 },
      { weight: 3, value: 4 },
    ];
    const result = KnapsackAlgorithm.solve(items, 5);
    assertEqual(result.traceback.totalValue, 7, "Value = 7");
    assertEqual(result.traceback.totalWeight, 5, "Weight = 5");
    assert(result.traceback.path.length > 0, "Path non-empty");
    assertEqual(result.traceback.path[0].row, 2, "Path starts at row n");
    assertEqual(result.traceback.path[0].col, 5, "Path starts at col W");
    const last = result.traceback.path[result.traceback.path.length - 1];
    assertEqual(last.row, 0, "Path ends at row 0");
    assertEqual(last.col, 0, "Path ends at col 0");
  }, "Traceback path correctness");

  // --- Duplicate weights/values ---
  check(() => {
    const items = [
      { weight: 2, value: 3 },
      { weight: 2, value: 3 },
      { weight: 2, value: 3 },
    ];
    const result = KnapsackAlgorithm.solve(items, 5);
    assertEqual(result.traceback.totalValue, 6, "2 items, value 6");
    assertEqual(result.traceback.totalWeight, 4, "Weight 4");
    assertEqual(result.traceback.selectedItems.length, 2, "2 selected");
  }, "Duplicate weights and values");

  return { passed, failed, failures };
}

module.exports = { runTests };
