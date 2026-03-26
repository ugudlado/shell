/**
 * Hash Table Algorithm Tests — Node.js runner compatible
 * Exports runTests() for run-tests.js harness
 */

function runTests({ assert, assertEqual }) {
  let passed = 0;
  let failed = 0;
  const failures = [];

  const HashTableAlgorithm = require("./hash-table-algorithm.js");

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

  // --- createTable ---
  check(() => {
    const t = HashTableAlgorithm.createTable(8);
    assertEqual(t.bucketCount, 8, "bucketCount");
    assertEqual(t.size, 0, "size");
    assertEqual(t.buckets.length, 8, "buckets array length");
    assertEqual(t.buckets[0].length, 0, "first bucket empty");
  }, "createTable: default 8 buckets");

  check(() => {
    const t = HashTableAlgorithm.createTable(4);
    assertEqual(t.bucketCount, 4, "bucketCount");
    assertEqual(t.buckets.length, 4, "buckets length");
  }, "createTable: custom bucket count");

  check(() => {
    const t = HashTableAlgorithm.createTable(0);
    assert(t.bucketCount >= 1, "at least 1 bucket");
  }, "createTable: zero bucket count clamped");

  check(() => {
    const t = HashTableAlgorithm.createTable(-5);
    assert(t.bucketCount >= 1, "at least 1 bucket for negative");
  }, "createTable: negative bucket count clamped");

  check(() => {
    const t = HashTableAlgorithm.createTable(100);
    assertEqual(t.bucketCount, 64, "clamped to 64");
  }, "createTable: large bucket count clamped to 64");

  check(() => {
    const t = HashTableAlgorithm.createTable();
    assertEqual(t.bucketCount, 8, "default 8");
  }, "createTable: no argument defaults to 8");

  // --- hash ---
  check(() => {
    const h = HashTableAlgorithm.hash("a", 8);
    assertEqual(h.charCodes, [97], "charCodes for 'a'");
    assertEqual(h.sum, 97, "sum for 'a'");
    assertEqual(h.index, 97 % 8, "index for 'a' mod 8");
  }, "hash: single char 'a'");

  check(() => {
    const h = HashTableAlgorithm.hash("ab", 8);
    assertEqual(h.charCodes, [97, 98], "charCodes for 'ab'");
    assertEqual(h.sum, 195, "sum for 'ab'");
    assertEqual(h.index, 195 % 8, "index");
  }, "hash: two chars 'ab'");

  check(() => {
    const h = HashTableAlgorithm.hash("", 8);
    assertEqual(h.charCodes, [], "no charCodes");
    assertEqual(h.sum, 0, "sum 0");
    assertEqual(h.index, 0, "index 0");
  }, "hash: empty string");

  check(() => {
    const h = HashTableAlgorithm.hash("abc", 3);
    assertEqual(h.index, (97 + 98 + 99) % 3, "mod 3");
  }, "hash: different bucket count");

  // --- insert ---
  check(() => {
    let t = HashTableAlgorithm.createTable(8);
    const result = HashTableAlgorithm.insert(t, "alice", "555-0001");
    assertEqual(result.table.size, 1, "size 1");
    assertEqual(result.collision, false, "no collision");
    assertEqual(result.updated, false, "not updated");
    assert(result.steps.length > 0, "has steps");
  }, "insert: single entry, no collision");

  check(() => {
    let t = HashTableAlgorithm.createTable(8);
    const r1 = HashTableAlgorithm.insert(t, "alice", "555-0001");
    const r2 = HashTableAlgorithm.insert(r1.table, "alice", "555-9999");
    assertEqual(r2.table.size, 1, "size still 1");
    assertEqual(r2.updated, true, "updated existing");
    // Verify value was updated
    const s = HashTableAlgorithm.search(r2.table, "alice");
    assertEqual(s.value, "555-9999", "value updated");
  }, "insert: update existing key");

  check(() => {
    // Force collision by using bucket count 1
    let t = HashTableAlgorithm.createTable(1);
    const r1 = HashTableAlgorithm.insert(t, "a", "1");
    const r2 = HashTableAlgorithm.insert(r1.table, "b", "2");
    assertEqual(r2.collision, true, "collision detected");
    assertEqual(r2.table.size, 2, "size 2");
    assertEqual(r2.table.buckets[0].length, 2, "chain length 2");
  }, "insert: collision with chaining");

  check(() => {
    let t = HashTableAlgorithm.createTable(8);
    // Insert does not mutate original
    HashTableAlgorithm.insert(t, "test", "val");
    assertEqual(t.size, 0, "original unchanged");
  }, "insert: does not mutate original table");

  check(() => {
    let t = HashTableAlgorithm.createTable(8);
    for (let i = 0; i < 20; i++) {
      const r = HashTableAlgorithm.insert(t, "key" + i, "val" + i);
      t = r.table;
    }
    assertEqual(t.size, 20, "20 entries inserted");
  }, "insert: many entries (20)");

  // --- search ---
  check(() => {
    let t = HashTableAlgorithm.createTable(8);
    t = HashTableAlgorithm.insert(t, "alice", "555-0001").table;
    const r = HashTableAlgorithm.search(t, "alice");
    assertEqual(r.found, true, "found");
    assertEqual(r.value, "555-0001", "correct value");
    assert(r.steps.length > 0, "has steps");
    assert(r.bucketIndex >= 0, "valid bucket index");
    assert(r.chainIndex >= 0, "valid chain index");
  }, "search: find existing key");

  check(() => {
    let t = HashTableAlgorithm.createTable(8);
    const r = HashTableAlgorithm.search(t, "alice");
    assertEqual(r.found, false, "not found");
    assertEqual(r.value, null, "null value");
    assertEqual(r.chainIndex, -1, "chain index -1");
  }, "search: key not found in empty table");

  check(() => {
    let t = HashTableAlgorithm.createTable(8);
    t = HashTableAlgorithm.insert(t, "bob", "555-0002").table;
    const r = HashTableAlgorithm.search(t, "alice");
    assertEqual(r.found, false, "not found");
  }, "search: key not found in non-empty table");

  check(() => {
    // Collision scenario: bucket count 1
    let t = HashTableAlgorithm.createTable(1);
    t = HashTableAlgorithm.insert(t, "a", "1").table;
    t = HashTableAlgorithm.insert(t, "b", "2").table;
    t = HashTableAlgorithm.insert(t, "c", "3").table;
    const r = HashTableAlgorithm.search(t, "c");
    assertEqual(r.found, true, "found in chain");
    assertEqual(r.value, "3", "correct value");
    // Should traverse chain: steps include traverse for a, b, then c
    const traverseSteps = r.steps.filter((s) => s.type === "traverse");
    assertEqual(traverseSteps.length, 3, "traversed 3 chain entries");
  }, "search: traverses collision chain");

  // --- remove ---
  check(() => {
    let t = HashTableAlgorithm.createTable(8);
    t = HashTableAlgorithm.insert(t, "alice", "555-0001").table;
    const r = HashTableAlgorithm.remove(t, "alice");
    assertEqual(r.removed, true, "removed");
    assertEqual(r.table.size, 0, "size 0");
    const s = HashTableAlgorithm.search(r.table, "alice");
    assertEqual(s.found, false, "not found after remove");
  }, "remove: existing key");

  check(() => {
    let t = HashTableAlgorithm.createTable(8);
    const r = HashTableAlgorithm.remove(t, "nonexistent");
    assertEqual(r.removed, false, "nothing removed");
    assertEqual(r.table.size, 0, "size unchanged");
  }, "remove: non-existent key");

  check(() => {
    let t = HashTableAlgorithm.createTable(8);
    t = HashTableAlgorithm.insert(t, "alice", "1").table;
    // remove does not mutate original
    HashTableAlgorithm.remove(t, "alice");
    assertEqual(t.size, 1, "original unchanged");
  }, "remove: does not mutate original table");

  check(() => {
    // Remove from middle of chain
    let t = HashTableAlgorithm.createTable(1);
    t = HashTableAlgorithm.insert(t, "a", "1").table;
    t = HashTableAlgorithm.insert(t, "b", "2").table;
    t = HashTableAlgorithm.insert(t, "c", "3").table;
    const r = HashTableAlgorithm.remove(t, "b");
    assertEqual(r.removed, true, "removed from chain");
    assertEqual(r.table.size, 2, "size 2");
    assertEqual(r.table.buckets[0].length, 2, "chain length 2");
    // a and c remain
    const sa = HashTableAlgorithm.search(r.table, "a");
    assertEqual(sa.found, true, "a still exists");
    const sc = HashTableAlgorithm.search(r.table, "c");
    assertEqual(sc.found, true, "c still exists");
  }, "remove: from middle of collision chain");

  // --- getStats ---
  check(() => {
    const t = HashTableAlgorithm.createTable(8);
    const s = HashTableAlgorithm.getStats(t);
    assertEqual(s.size, 0, "size 0");
    assertEqual(s.bucketCount, 8, "bucketCount 8");
    assertEqual(s.loadFactor, 0, "loadFactor 0");
    assertEqual(s.longestChain, 0, "longestChain 0");
    assertEqual(s.collisionCount, 0, "collisionCount 0");
    assertEqual(s.emptyBuckets, 8, "emptyBuckets 8");
  }, "getStats: empty table");

  check(() => {
    let t = HashTableAlgorithm.createTable(1);
    t = HashTableAlgorithm.insert(t, "a", "1").table;
    t = HashTableAlgorithm.insert(t, "b", "2").table;
    t = HashTableAlgorithm.insert(t, "c", "3").table;
    const s = HashTableAlgorithm.getStats(t);
    assertEqual(s.size, 3, "size 3");
    assertEqual(s.longestChain, 3, "longestChain 3");
    assertEqual(s.collisionCount, 2, "collisionCount 2");
    assertEqual(s.emptyBuckets, 0, "emptyBuckets 0");
    assertEqual(s.loadFactor, 3, "loadFactor 3");
  }, "getStats: all collisions in single bucket");

  check(() => {
    let t = HashTableAlgorithm.createTable(8);
    t = HashTableAlgorithm.insert(t, "a", "1").table;
    const s = HashTableAlgorithm.getStats(t);
    assertEqual(s.size, 1, "size 1");
    assertEqual(s.longestChain, 1, "longestChain 1");
    assertEqual(s.collisionCount, 0, "no collisions");
    assertEqual(s.emptyBuckets, 7, "7 empty");
    assertEqual(s.loadFactor, 0.13, "loadFactor ~0.125 rounds to 0.13");
  }, "getStats: single entry");

  // --- Edge cases ---
  check(() => {
    const h = HashTableAlgorithm.hash("", 8);
    assertEqual(h.index, 0, "empty key hashes to 0");
    let t = HashTableAlgorithm.createTable(8);
    const r = HashTableAlgorithm.insert(t, "", "empty-key-value");
    assertEqual(r.table.size, 1, "can insert empty key");
    const s = HashTableAlgorithm.search(r.table, "");
    assertEqual(s.found, true, "can find empty key");
    assertEqual(s.value, "empty-key-value", "correct value");
  }, "edge case: empty string key");

  check(() => {
    let t = HashTableAlgorithm.createTable(2);
    // Insert same key multiple times — should update, not grow
    t = HashTableAlgorithm.insert(t, "x", "1").table;
    t = HashTableAlgorithm.insert(t, "x", "2").table;
    t = HashTableAlgorithm.insert(t, "x", "3").table;
    assertEqual(t.size, 1, "size still 1 after updates");
    const s = HashTableAlgorithm.search(t, "x");
    assertEqual(s.value, "3", "last value wins");
  }, "edge case: repeated insert of same key updates value");

  check(() => {
    // Step structure verification
    let t = HashTableAlgorithm.createTable(8);
    const r = HashTableAlgorithm.insert(t, "test", "val");
    const hashStep = r.steps.find((s) => s.type === "hash");
    assert(hashStep !== undefined, "has hash step");
    assert(typeof hashStep.bucketIndex === "number", "hash step has bucketIndex");
    assert(Array.isArray(hashStep.charCodes), "hash step has charCodes");
    assert(typeof hashStep.sum === "number", "hash step has sum");
    const insertStep = r.steps.find((s) => s.type === "insert");
    assert(insertStep !== undefined, "has insert step");
    assert(typeof insertStep.bucketIndex === "number", "insert step has bucketIndex");
    assert(typeof insertStep.chainIndex === "number", "insert step has chainIndex");
  }, "step structure: insert steps have expected fields");

  check(() => {
    let t = HashTableAlgorithm.createTable(8);
    t = HashTableAlgorithm.insert(t, "hello", "world").table;
    const r = HashTableAlgorithm.search(t, "hello");
    const hashStep = r.steps.find((s) => s.type === "hash");
    assert(hashStep !== undefined, "search has hash step");
    const foundStep = r.steps.find((s) => s.type === "found");
    assert(foundStep !== undefined, "search has found step");
  }, "step structure: search steps have expected fields");

  check(() => {
    let t = HashTableAlgorithm.createTable(8);
    t = HashTableAlgorithm.insert(t, "hello", "world").table;
    const r = HashTableAlgorithm.remove(t, "hello");
    const removeStep = r.steps.find((s) => s.type === "remove");
    assert(removeStep !== undefined, "remove has remove step");
  }, "step structure: remove steps have expected fields");

  return { passed, failed, failures };
}

module.exports = { runTests };
