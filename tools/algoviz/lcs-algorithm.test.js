/**
 * LCS Algorithm Tests — Node.js runner compatible
 * Exports runTests() for run-tests.js harness
 */

function runTests({ assert, assertEqual }) {
  let passed = 0;
  let failed = 0;
  const failures = [];

  // Load the algorithm module
  const LCSAlgorithm = require("./lcs-algorithm.js");

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
    const result = LCSAlgorithm.solve("ABCBDAB", "BDCAB");
    assertEqual(result.lcsString.length, 4, "LCS length = 4");
    // Multiple valid LCS exist (BCAB, BDAB), just check length
    assertEqual(result.dp[7][5], 4, "DP bottom-right = 4");
  }, "Basic correctness: ABCBDAB vs BDCAB");

  check(() => {
    const result = LCSAlgorithm.solve("AGGTAB", "GXTXAYB");
    assertEqual(result.lcsString.length, 4, "LCS length = 4");
    assertEqual(result.dp[6][7], 4, "DP bottom-right = 4");
  }, "Classic example: AGGTAB vs GXTXAYB");

  // --- Identical strings ---
  check(() => {
    const result = LCSAlgorithm.solve("abc", "abc");
    assertEqual(result.lcsString, "abc", "LCS = full string");
    assertEqual(result.dp[3][3], 3, "DP value = 3");
  }, "Identical strings: abc vs abc");

  // --- No common subsequence ---
  check(() => {
    const result = LCSAlgorithm.solve("abc", "xyz");
    assertEqual(result.lcsString, "", "LCS is empty");
    assertEqual(result.dp[3][3], 0, "DP value = 0");
  }, "No common subsequence: abc vs xyz");

  // --- Empty first string ---
  check(() => {
    const result = LCSAlgorithm.solve("", "abc");
    assertEqual(result.lcsString, "", "LCS is empty");
    assertEqual(result.dp.length, 1, "1 row");
    assertEqual(result.steps.length, 0, "0 steps");
  }, "Empty first string");

  // --- Empty second string ---
  check(() => {
    const result = LCSAlgorithm.solve("abc", "");
    assertEqual(result.lcsString, "", "LCS is empty");
    assertEqual(result.dp[0].length, 1, "1 column");
    assertEqual(result.steps.length, 0, "0 steps");
  }, "Empty second string");

  // --- Both empty ---
  check(() => {
    const result = LCSAlgorithm.solve("", "");
    assertEqual(result.lcsString, "", "LCS is empty");
    assertEqual(result.dp.length, 1, "1 row");
    assertEqual(result.dp[0].length, 1, "1 col");
    assertEqual(result.steps.length, 0, "0 steps");
  }, "Both empty strings");

  // --- Single character match ---
  check(() => {
    const result = LCSAlgorithm.solve("a", "a");
    assertEqual(result.lcsString, "a", "LCS = a");
    assertEqual(result.dp[1][1], 1, "DP value = 1");
  }, "Single character match");

  // --- Single character no match ---
  check(() => {
    const result = LCSAlgorithm.solve("a", "b");
    assertEqual(result.lcsString, "", "LCS is empty");
    assertEqual(result.dp[1][1], 0, "DP value = 0");
  }, "Single character no match");

  // --- All same characters ---
  check(() => {
    const result = LCSAlgorithm.solve("aaaa", "aa");
    assertEqual(result.lcsString, "aa", "LCS = aa");
    assertEqual(result.dp[4][2], 2, "DP value = 2");
  }, "All duplicates: aaaa vs aa");

  // --- One string is subsequence of other ---
  check(() => {
    const result = LCSAlgorithm.solve("abcdef", "ace");
    assertEqual(result.lcsString, "ace", "LCS = ace");
    assertEqual(result.dp[6][3], 3, "DP value = 3");
  }, "One string is subsequence of other");

  // --- Reverse strings ---
  check(() => {
    const result = LCSAlgorithm.solve("abcd", "dcba");
    assertEqual(result.lcsString.length, 1, "LCS length = 1");
  }, "Reverse strings: abcd vs dcba");

  // --- Max length strings (15 chars each) ---
  check(() => {
    const result = LCSAlgorithm.solve("abcdefghijklmno", "aeiou12345bcdmn");
    assert(result.dp.length === 16, "16 rows");
    assert(result.dp[0].length === 16, "16 cols");
    assert(result.lcsString.length > 0, "Non-empty LCS");
    assert(result.steps.length === 225, "15 * 15 = 225 steps");
  }, "Max length strings (15 chars each)");

  // --- DP table dimensions ---
  check(() => {
    const result = LCSAlgorithm.solve("abc", "de");
    assertEqual(result.dp.length, 4, "m+1 rows");
    assertEqual(result.dp[0].length, 3, "n+1 cols");
    // Base cases: row 0 and col 0 are all zeros
    assertEqual(result.dp[0], [0, 0, 0], "Row 0 all zeros");
    for (let i = 0; i <= 3; i++) {
      assertEqual(result.dp[i][0], 0, "Col 0 row " + i + " = 0");
    }
  }, "DP table dimensions and base cases");

  // --- Steps array structure ---
  check(() => {
    const result = LCSAlgorithm.solve("ab", "bc");
    assertEqual(result.steps.length, 4, "2 * 2 = 4 steps");
    const step = result.steps[0];
    assert(typeof step.row === "number", "Step has row");
    assert(typeof step.col === "number", "Step has col");
    assert(typeof step.value === "number", "Step has value");
    assert(typeof step.isMatch === "boolean", "Step has isMatch");
    assert(typeof step.explanation === "string", "Step has explanation");
  }, "Steps array structure and count");

  // --- Match detection in steps ---
  check(() => {
    const result = LCSAlgorithm.solve("ab", "ab");
    // Step for (1,1): A[0]='a' == B[0]='a' -> match
    const matchStep = result.steps.find(
      (s) => s.row === 1 && s.col === 1
    );
    assert(matchStep.isMatch === true, "a==a is match");
    assertEqual(matchStep.value, 1, "Match value = 1");
    // Step for (1,2): A[0]='a' != B[1]='b' -> no match
    const noMatchStep = result.steps.find(
      (s) => s.row === 1 && s.col === 2
    );
    assert(noMatchStep.isMatch === false, "a!=b is no match");
  }, "Match detection in steps");

  // --- Traceback path ---
  check(() => {
    const result = LCSAlgorithm.solve("abc", "abc");
    const tb = result.traceback;
    assert(tb.path.length > 0, "Path non-empty");
    // Path starts at (m, n)
    assertEqual(tb.path[0].row, 3, "Path starts at row m");
    assertEqual(tb.path[0].col, 3, "Path starts at col n");
    // Path ends at (0, 0)
    const last = tb.path[tb.path.length - 1];
    assertEqual(last.row, 0, "Path ends at row 0");
    assertEqual(last.col, 0, "Path ends at col 0");
  }, "Traceback path starts at (m,n) ends at (0,0)");

  // --- Traceback LCS matches solve LCS ---
  check(() => {
    const result = LCSAlgorithm.solve("ABCBDAB", "BDCAB");
    assertEqual(
      result.traceback.lcsString,
      result.lcsString,
      "traceback.lcsString matches top-level lcsString"
    );
  }, "Traceback lcsString matches top-level lcsString");

  // --- Case sensitive ---
  check(() => {
    const result = LCSAlgorithm.solve("ABC", "abc");
    assertEqual(result.lcsString, "", "Case sensitive: no match");
  }, "Case sensitive comparison");

  // --- Special characters ---
  check(() => {
    const result = LCSAlgorithm.solve("a b", "a b");
    assertEqual(result.lcsString, "a b", "Spaces preserved");
  }, "Strings with spaces");

  return { passed, failed, failures };
}

module.exports = { runTests };
