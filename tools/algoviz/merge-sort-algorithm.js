/**
 * Merge Sort Algorithm
 *
 * Pure functions — no DOM dependency.
 * Performs top-down recursive merge sort, recording each step
 * (split, merge, complete) for visualization replay.
 */
var MergeSortAlgorithm = (() => {
  "use strict";

  /**
   * Sort an array using merge sort, recording each step.
   *
   * @param {number[]} inputArr - Array of numbers to sort
   * @returns {{
   *   steps: Array<Object>,
   *   sortedArray: number[]
   * }}
   */
  function sort(inputArr) {
    var arr = inputArr.slice(); // defensive copy
    var steps = [];
    var comparisons = 0;
    var mergeOps = 0;
    var maxDepth = 0;

    if (arr.length <= 1) {
      steps.push({
        type: "complete",
        array: arr.slice(),
        comparisons: 0,
        mergeOps: 0,
        maxDepth: 0,
        explanation: "Sort complete! 0 comparisons, 0 merge operations.",
      });
      return { steps: steps, sortedArray: arr.slice() };
    }

    function mergeSort(a, depth) {
      if (depth > maxDepth) {
        maxDepth = depth;
      }

      if (a.length <= 1) {
        return a;
      }

      var mid = Math.floor(a.length / 2);
      var leftArr = a.slice(0, mid);
      var rightArr = a.slice(mid);

      // Record split step
      steps.push({
        type: "split",
        array: a.slice(),
        left: leftArr.slice(),
        right: rightArr.slice(),
        depth: depth,
        explanation:
          "Split [" +
          a.join(", ") +
          "] into [" +
          leftArr.join(", ") +
          "] and [" +
          rightArr.join(", ") +
          "] (depth " +
          depth +
          ")",
      });

      // Recursively sort both halves
      var sortedLeft = mergeSort(leftArr, depth + 1);
      var sortedRight = mergeSort(rightArr, depth + 1);

      // Merge the sorted halves
      return merge(sortedLeft, sortedRight, depth);
    }

    function merge(left, right, depth) {
      var result = [];
      var li = 0;
      var ri = 0;

      mergeOps++;

      while (li < left.length && ri < right.length) {
        comparisons++;

        if (left[li] <= right[ri]) {
          steps.push({
            type: "merge",
            left: left.slice(),
            right: right.slice(),
            leftIndex: li,
            rightIndex: ri,
            selected: "left",
            result: result.slice().concat([left[li]]),
            depth: depth,
            comparisons: comparisons,
            mergeOps: mergeOps,
            maxDepth: maxDepth,
            explanation:
              "Merge: compare " +
              left[li] +
              " (left) <= " +
              right[ri] +
              " (right) — take " +
              left[li] +
              " from left",
          });
          result.push(left[li]);
          li++;
        } else {
          steps.push({
            type: "merge",
            left: left.slice(),
            right: right.slice(),
            leftIndex: li,
            rightIndex: ri,
            selected: "right",
            result: result.slice().concat([right[ri]]),
            depth: depth,
            comparisons: comparisons,
            mergeOps: mergeOps,
            maxDepth: maxDepth,
            explanation:
              "Merge: compare " +
              left[li] +
              " (left) > " +
              right[ri] +
              " (right) — take " +
              right[ri] +
              " from right",
          });
          result.push(right[ri]);
          ri++;
        }
      }

      // Remaining elements from left
      while (li < left.length) {
        steps.push({
          type: "merge",
          left: left.slice(),
          right: right.slice(),
          leftIndex: li,
          rightIndex: ri,
          selected: "left",
          result: result.slice().concat([left[li]]),
          depth: depth,
          comparisons: comparisons,
          mergeOps: mergeOps,
          maxDepth: maxDepth,
          explanation: "Append remaining " + left[li] + " from left",
        });
        result.push(left[li]);
        li++;
      }

      // Remaining elements from right
      while (ri < right.length) {
        steps.push({
          type: "merge",
          left: left.slice(),
          right: right.slice(),
          leftIndex: li,
          rightIndex: ri,
          selected: "right",
          result: result.slice().concat([right[ri]]),
          depth: depth,
          comparisons: comparisons,
          mergeOps: mergeOps,
          maxDepth: maxDepth,
          explanation: "Append remaining " + right[ri] + " from right",
        });
        result.push(right[ri]);
        ri++;
      }

      return result;
    }

    var sorted = mergeSort(arr, 0);

    // Add complete step
    steps.push({
      type: "complete",
      array: sorted.slice(),
      comparisons: comparisons,
      mergeOps: mergeOps,
      maxDepth: maxDepth,
      explanation:
        "Sort complete! " +
        comparisons +
        " comparisons, " +
        mergeOps +
        " merge operations.",
    });

    return { steps: steps, sortedArray: sorted };
  }

  return { sort: sort };
})();

// Node.js module export (for test runner)
if (typeof module !== "undefined" && module.exports) {
  module.exports = MergeSortAlgorithm;
}
