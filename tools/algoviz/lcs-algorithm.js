/**
 * Longest Common Subsequence (LCS) Algorithm
 *
 * Pure functions — no DOM dependency.
 * Builds the DP table, records each step for visualization,
 * and traces back to find the actual LCS string.
 *
 * Real-world use: Git diff uses LCS to find matching lines
 * between file versions.
 */
var LCSAlgorithm = (() => {
  "use strict";

  /**
   * Solve LCS for two strings.
   *
   * @param {string} strA - First string
   * @param {string} strB - Second string
   * @returns {{
   *   dp: number[][],
   *   steps: Array<{row: number, col: number, value: number, isMatch: boolean, explanation: string}>,
   *   traceback: {path: Array<{row: number, col: number}>, lcsString: string},
   *   lcsString: string
   * }}
   */
  function solve(strA, strB) {
    var m = strA.length;
    var n = strB.length;

    // Build DP table: (m+1) rows x (n+1) cols
    var dp = [];
    var i, j;
    for (i = 0; i <= m; i++) {
      dp[i] = [];
      for (j = 0; j <= n; j++) {
        dp[i][j] = 0;
      }
    }

    var steps = [];

    // Fill the DP table row by row
    for (i = 1; i <= m; i++) {
      for (j = 1; j <= n; j++) {
        var charA = strA[i - 1];
        var charB = strB[j - 1];
        var isMatch = charA === charB;
        var value;
        var explanation;

        if (isMatch) {
          value = dp[i - 1][j - 1] + 1;
          explanation =
            "A[" +
            (i - 1) +
            "]='" +
            charA +
            "' == B[" +
            (j - 1) +
            "]='" +
            charB +
            "' \u2014 MATCH, dp[" +
            (i - 1) +
            "][" +
            (j - 1) +
            "]+1 = " +
            value;
        } else {
          var fromAbove = dp[i - 1][j];
          var fromLeft = dp[i][j - 1];
          value = fromAbove >= fromLeft ? fromAbove : fromLeft;
          explanation =
            "A[" +
            (i - 1) +
            "]='" +
            charA +
            "' != B[" +
            (j - 1) +
            "]='" +
            charB +
            "' \u2014 max(up=" +
            fromAbove +
            ", left=" +
            fromLeft +
            ") = " +
            value;
        }

        dp[i][j] = value;

        steps.push({
          row: i,
          col: j,
          value: value,
          isMatch: isMatch,
          explanation: explanation,
        });
      }
    }

    var tb = traceback(dp, strA, strB);

    return { dp: dp, steps: steps, traceback: tb, lcsString: tb.lcsString };
  }

  /**
   * Trace back through the DP table to find the LCS.
   *
   * @param {number[][]} dp
   * @param {string} strA
   * @param {string} strB
   * @returns {{path: Array<{row: number, col: number}>, lcsString: string}}
   */
  function traceback(dp, strA, strB) {
    var m = strA.length;
    var n = strB.length;
    var path = [];
    var lcsChars = [];
    var i = m;
    var j = n;

    path.push({ row: i, col: j });

    while (i > 0 && j > 0) {
      if (strA[i - 1] === strB[j - 1]) {
        // Match — this character is part of the LCS
        lcsChars.push(strA[i - 1]);
        i--;
        j--;
      } else if (dp[i - 1][j] >= dp[i][j - 1]) {
        // Go up
        i--;
      } else {
        // Go left
        j--;
      }
      path.push({ row: i, col: j });
    }

    // Walk to (0,0) if not there yet
    while (i > 0) {
      i--;
      path.push({ row: i, col: j });
    }
    while (j > 0) {
      j--;
      path.push({ row: i, col: j });
    }

    lcsChars.reverse();

    return {
      path: path,
      lcsString: lcsChars.join(""),
    };
  }

  return { solve: solve };
})();

// Node.js module export (for test runner)
if (typeof module !== "undefined" && module.exports) {
  module.exports = LCSAlgorithm;
}
