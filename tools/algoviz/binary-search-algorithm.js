/**
 * Binary Search Algorithm
 *
 * Pure functions — no DOM dependency.
 * Runs binary search on a sorted array, records each comparison
 * as a step for visualization with low/mid/high pointers.
 */
var BinarySearchAlgorithm = (() => {
  "use strict";

  /**
   * Search for a target in a sorted array using binary search, recording each step.
   *
   * @param {number[]} inputArr - Sorted array of numbers to search
   * @param {number} target - Value to find
   * @returns {{
   *   steps: Array<{arr: number[], low: number, mid: number, high: number, target: number, comparison: string, found: boolean, eliminated: string, step: number, explanation: string}>,
   *   found: boolean,
   *   foundIndex: number
   * }}
   */
  function search(inputArr, target) {
    var arr = inputArr.slice(); // defensive copy
    var steps = [];
    var low = 0;
    var high = arr.length - 1;
    var stepCount = 0;
    var foundIndex = -1;
    var found = false;

    if (arr.length === 0) {
      steps.push({
        arr: arr.slice(),
        low: -1,
        mid: -1,
        high: -1,
        target: target,
        comparison: "none",
        found: false,
        eliminated: "none",
        step: 0,
        explanation: "Array is empty — target " + target + " not found.",
      });
      return { steps: steps, found: false, foundIndex: -1 };
    }

    while (low <= high) {
      stepCount++;
      var mid = Math.floor((low + high) / 2);
      var midVal = arr[mid];
      var comparison;
      var eliminated;
      var explanation;

      if (midVal === target) {
        comparison = "equal";
        eliminated = "none";
        found = true;
        foundIndex = mid;
        explanation =
          "Step " +
          stepCount +
          ": mid=" +
          mid +
          ", arr[" +
          mid +
          "]=" +
          midVal +
          " equals target " +
          target +
          ". Found at index " +
          mid +
          "!";

        steps.push({
          arr: arr.slice(),
          low: low,
          mid: mid,
          high: high,
          target: target,
          comparison: comparison,
          found: true,
          eliminated: eliminated,
          step: stepCount,
          explanation: explanation,
        });
        break;
      } else if (midVal > target) {
        comparison = "greater";
        eliminated = "right";
        explanation =
          "Step " +
          stepCount +
          ": mid=" +
          mid +
          ", arr[" +
          mid +
          "]=" +
          midVal +
          " > target " +
          target +
          ". Eliminate right half (indices " +
          mid +
          ".." +
          high +
          ").";

        steps.push({
          arr: arr.slice(),
          low: low,
          mid: mid,
          high: high,
          target: target,
          comparison: comparison,
          found: false,
          eliminated: eliminated,
          step: stepCount,
          explanation: explanation,
        });

        high = mid - 1;
      } else {
        comparison = "less";
        eliminated = "left";
        explanation =
          "Step " +
          stepCount +
          ": mid=" +
          mid +
          ", arr[" +
          mid +
          "]=" +
          midVal +
          " < target " +
          target +
          ". Eliminate left half (indices " +
          low +
          ".." +
          mid +
          ").";

        steps.push({
          arr: arr.slice(),
          low: low,
          mid: mid,
          high: high,
          target: target,
          comparison: comparison,
          found: false,
          eliminated: eliminated,
          step: stepCount,
          explanation: explanation,
        });

        low = mid + 1;
      }
    }

    if (!found) {
      steps.push({
        arr: arr.slice(),
        low: low,
        mid: -1,
        high: high,
        target: target,
        comparison: "none",
        found: false,
        eliminated: "none",
        step: stepCount + 1,
        explanation:
          "Search space exhausted — target " +
          target +
          " not found in the array.",
      });
    }

    return { steps: steps, found: found, foundIndex: foundIndex };
  }

  return { search: search };
})();

// Node.js module export (for test runner)
if (typeof module !== "undefined" && module.exports) {
  module.exports = BinarySearchAlgorithm;
}
