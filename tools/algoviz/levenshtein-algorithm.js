// levenshtein-algorithm.js — Pure Levenshtein Distance algorithm (no DOM, testable in Node)

function levenshteinCompute(source, target) {
  const m = source.length;
  const n = target.length;

  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  const ops = Array.from({ length: m + 1 }, () => Array(n + 1).fill("base"));

  for (let i = 0; i <= m; i++) {
    for (let j = 0; j <= n; j++) {
      if (i === 0 && j === 0) {
        dp[i][j] = 0;
        ops[i][j] = "match";
      } else if (i === 0) {
        dp[i][j] = j;
        ops[i][j] = "insert";
      } else if (j === 0) {
        dp[i][j] = i;
        ops[i][j] = "delete";
      } else {
        const cost = source[i - 1] === target[j - 1] ? 0 : 1;
        const diag = dp[i - 1][j - 1] + cost;
        const up = dp[i - 1][j] + 1;
        const left = dp[i][j - 1] + 1;
        const minVal = Math.min(diag, up, left);
        dp[i][j] = minVal;

        if (minVal === diag) {
          ops[i][j] = cost === 0 ? "match" : "substitute";
        } else if (minVal === up) {
          ops[i][j] = "delete";
        } else {
          ops[i][j] = "insert";
        }
      }
    }
  }

  // Compute traceback from (m, n) to (0, 0)
  const traceback = [];
  let ti = m;
  let tj = n;
  while (ti > 0 || tj > 0) {
    traceback.push({ i: ti, j: tj });
    if (ti === 0) {
      tj--;
    } else if (tj === 0) {
      ti--;
    } else {
      const cost = source[ti - 1] === target[tj - 1] ? 0 : 1;
      const diag = dp[ti - 1][tj - 1] + cost;
      const up = dp[ti - 1][tj] + 1;
      const left = dp[ti][tj - 1] + 1;
      const minVal = Math.min(diag, up, left);
      if (minVal === diag) { ti--; tj--; }
      else if (minVal === up) { ti--; }
      else { tj--; }
    }
  }
  traceback.push({ i: 0, j: 0 });
  traceback.reverse();

  return { dp, ops, traceback, distance: dp[m][n] };
}

/**
 * Build a human-readable description of the traceback path.
 * Returns a string describing each operation along the optimal edit path.
 */
function tracebackDescription(source, target, traceback, ops) {
  var parts = [];
  for (var k = 1; k < traceback.length; k++) {
    var cur = traceback[k];
    var op = ops[cur.i][cur.j];
    var stepNum = k;
    if (op === "match") {
      parts.push("Step " + stepNum + ": Match '" + source[cur.i - 1] + "'");
    } else if (op === "substitute") {
      parts.push(
        "Step " +
          stepNum +
          ": Substitute '" +
          source[cur.i - 1] +
          "' \u2192 '" +
          target[cur.j - 1] +
          "'",
      );
    } else if (op === "insert") {
      parts.push(
        "Step " + stepNum + ": Insert '" + target[cur.j - 1] + "'",
      );
    } else if (op === "delete") {
      parts.push(
        "Step " + stepNum + ": Delete '" + source[cur.i - 1] + "'",
      );
    }
  }
  return parts.join(" | ");
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { levenshteinCompute, tracebackDescription };
}
