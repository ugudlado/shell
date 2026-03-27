// DesignViz test runner — runs all *test*.js files that export test functions
// Usage: node run-tests.js

const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message || 'assertEqual'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertApprox(actual, expected, epsilon, message) {
  if (Math.abs(actual - expected) > epsilon) {
    throw new Error(`${message || 'assertApprox'}: expected ~${expected} (+-${epsilon}), got ${actual}`);
  }
}

// Find all test files
const testFiles = fs.readdirSync(__dirname)
  .filter(f => f.endsWith('.test.js'));

if (testFiles.length === 0) {
  console.log('No test files found (*.test.js)');
  process.exit(0);
}

for (const file of testFiles) {
  console.log(`\n--- ${file} ---`);
  try {
    const mod = require(path.join(__dirname, file));
    if (typeof mod.runTests === 'function') {
      const results = mod.runTests({ assert, assertEqual, assertApprox });
      passed += results.passed || 0;
      failed += results.failed || 0;
      if (results.failures) failures.push(...results.failures);
    }
  } catch (err) {
    console.error(`  ERROR: ${err.message}`);
    failed++;
    failures.push({ file, error: err.message });
  }
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach(f => console.log(`  - ${f.file || f.name}: ${f.error || f.message}`));
  process.exit(1);
}
process.exit(0);
