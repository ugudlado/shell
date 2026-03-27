// Regression test: ScanAlgorithm.solve() accepts exactly 3 parameters.
// The 4th parameter (maxFloor) was removed in commit 22ff9b8 but callers
// in elevator.js and scan-algorithm.test.html still pass 4 arguments.
// This test documents the correct 3-arg signature.

const path = require('path');

// Load scan-algorithm.js (IIFE that assigns to global var ScanAlgorithm)
const fs = require('fs');
const code = fs.readFileSync(path.join(__dirname, 'scan-algorithm.js'), 'utf8');

// Execute in a context that captures the global
const vm = require('vm');
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
const ScanAlgorithm = sandbox.ScanAlgorithm;

module.exports = {
  runTests({ assert, assertEqual }) {
    let passed = 0;
    let failed = 0;
    const failures = [];

    function test(name, fn) {
      try {
        fn();
        passed++;
        console.log('  PASS: ' + name);
      } catch (e) {
        failed++;
        failures.push({ name, message: e.message });
        console.log('  FAIL: ' + name + ' — ' + e.message);
      }
    }

    test('ScanAlgorithm.solve exists and is a function', () => {
      assert(typeof ScanAlgorithm === 'object', 'ScanAlgorithm should be an object');
      assert(typeof ScanAlgorithm.solve === 'function', 'ScanAlgorithm.solve should be a function');
    });

    test('solve() function has exactly 3 declared parameters', () => {
      assertEqual(ScanAlgorithm.solve.length, 3,
        'solve() should declare exactly 3 parameters (requests, startPosition, direction)');
    });

    test('solve() with 3 args returns correct result', () => {
      const result = ScanAlgorithm.solve([2, 9, 6, 4, 1], 5, 'up');
      assertEqual(result.order, [6, 9, 4, 2, 1], 'Order should be [6, 9, 4, 2, 1]');
      assertEqual(result.totalDistance, 12, 'Total distance should be 12');
    });

    test('solve() with 4 args produces same result as 3 args (extra arg ignored)', () => {
      const result3 = ScanAlgorithm.solve([2, 9, 6, 4, 1], 5, 'up');
      const result4 = ScanAlgorithm.solve([2, 9, 6, 4, 1], 5, 'up', 10);
      assertEqual(result3.order, result4.order,
        '4-arg call should produce identical order to 3-arg call');
      assertEqual(result3.totalDistance, result4.totalDistance,
        '4-arg call should produce identical totalDistance to 3-arg call');
    });

    test('solve() with empty requests', () => {
      const result = ScanAlgorithm.solve([], 5, 'up');
      assertEqual(result.order, [], 'Empty requests should return empty order');
      assertEqual(result.totalDistance, 0, 'Empty requests should have 0 distance');
    });

    test('solve() going down', () => {
      const result = ScanAlgorithm.solve([2, 9, 6, 4, 1], 5, 'down');
      assertEqual(result.order, [4, 2, 1, 6, 9], 'Down order should be [4, 2, 1, 6, 9]');
      assertEqual(result.totalDistance, 12, 'Down total distance should be 12');
    });

    return { passed, failed, failures };
  }
};
