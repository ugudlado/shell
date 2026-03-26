/**
 * 0/1 Knapsack Dynamic Programming Algorithm
 *
 * Pure functions — no DOM dependency.
 * Builds the DP table, records each step for visualization,
 * and traces back to find the optimal item selection.
 */
var KnapsackAlgorithm = (() => {
  "use strict";

  /**
   * Solve the 0/1 Knapsack problem.
   *
   * @param {Array<{weight: number, value: number, name?: string}>} items
   * @param {number} capacity - Maximum knapsack capacity
   * @returns {{
   *   dp: number[][],
   *   steps: Array<{row: number, col: number, value: number, take: boolean, explanation: string}>,
   *   traceback: {selectedItems: number[], totalValue: number, totalWeight: number, path: Array<{row: number, col: number}>}
   * }}
   */
  function solve(items, capacity) {
    var n = items.length;

    // Build DP table: (n+1) rows x (capacity+1) cols
    var dp = [];
    var i, w;
    for (i = 0; i <= n; i++) {
      dp[i] = [];
      for (w = 0; w <= capacity; w++) {
        dp[i][w] = 0;
      }
    }

    var steps = [];

    // Fill the DP table row by row
    for (i = 1; i <= n; i++) {
      var item = items[i - 1];
      for (w = 0; w <= capacity; w++) {
        var skipVal = dp[i - 1][w];
        var takeVal = -1;
        var canTake = item.weight <= w;
        var take = false;
        var value;

        if (canTake) {
          takeVal = dp[i - 1][w - item.weight] + item.value;
        }

        if (canTake && takeVal > skipVal) {
          take = true;
          value = takeVal;
        } else {
          take = false;
          value = skipVal;
        }

        dp[i][w] = value;

        var explanation;
        if (!canTake) {
          explanation =
            "Item " +
            i +
            " (w=" +
            item.weight +
            ", v=" +
            item.value +
            ") too heavy for capacity " +
            w +
            ". SKIP, value = " +
            skipVal;
        } else if (take) {
          explanation =
            "Item " +
            i +
            " (w=" +
            item.weight +
            ", v=" +
            item.value +
            ") at capacity " +
            w +
            ": max(skip=" +
            skipVal +
            ", take=" +
            item.value +
            "+dp[" +
            (i - 1) +
            "][" +
            (w - item.weight) +
            "]=" +
            takeVal +
            ") = " +
            value +
            ", TAKE";
        } else {
          explanation =
            "Item " +
            i +
            " (w=" +
            item.weight +
            ", v=" +
            item.value +
            ") at capacity " +
            w +
            ": max(skip=" +
            skipVal +
            ", take=" +
            item.value +
            "+dp[" +
            (i - 1) +
            "][" +
            (w - item.weight) +
            "]=" +
            takeVal +
            ") = " +
            value +
            ", SKIP";
        }

        steps.push({
          row: i,
          col: w,
          value: value,
          take: take,
          explanation: explanation,
        });
      }
    }

    var tb = traceback(dp, items, capacity);

    return { dp: dp, steps: steps, traceback: tb };
  }

  /**
   * Trace back through the DP table to find selected items.
   *
   * @param {number[][]} dp
   * @param {Array<{weight: number, value: number}>} items
   * @param {number} capacity
   * @returns {{selectedItems: number[], totalValue: number, totalWeight: number, path: Array<{row: number, col: number}>}}
   */
  function traceback(dp, items, capacity) {
    var n = items.length;
    var selectedItems = [];
    var totalWeight = 0;
    var path = [];
    var i = n;
    var w = capacity;

    path.push({ row: i, col: w });

    while (i > 0 && w > 0) {
      if (dp[i][w] !== dp[i - 1][w]) {
        // Item i was taken
        selectedItems.push(i - 1); // 0-indexed
        totalWeight += items[i - 1].weight;
        w -= items[i - 1].weight;
        i--;
      } else {
        // Item i was skipped
        i--;
      }
      path.push({ row: i, col: w });
    }

    // Walk remaining rows to row 0
    while (i > 0) {
      i--;
      path.push({ row: i, col: w });
    }

    selectedItems.reverse(); // Return in original order

    return {
      selectedItems: selectedItems,
      totalValue: dp[n][capacity],
      totalWeight: totalWeight,
      path: path,
    };
  }

  return { solve: solve };
})();

// Node.js module export (for test runner)
if (typeof module !== "undefined" && module.exports) {
  module.exports = KnapsackAlgorithm;
}
