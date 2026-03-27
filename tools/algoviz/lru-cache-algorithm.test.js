/**
 * LRU Cache Algorithm Tests — Node.js runner compatible
 * Exports runTests() for run-tests.js harness
 *
 * Tests cover: empty cache, capacity 1, get miss, put eviction,
 * get promotion, duplicate put, large capacity, browser cache preset.
 */

function runTests({ assert, assertEqual }) {
  let passed = 0;
  let failed = 0;
  const failures = [];

  const LRUCacheAlgorithm = require("./lru-cache-algorithm.js");

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

  // --- createCache ---
  check(() => {
    const cache = LRUCacheAlgorithm.createCache(3);
    assertEqual(cache.capacity, 3, "capacity is 3");
    assertEqual(cache.size, 0, "initial size is 0");
    assertEqual(cache.head, null, "head is null");
    assertEqual(cache.tail, null, "tail is null");
    assertEqual(Object.keys(cache.map).length, 0, "map is empty");
  }, "createCache returns empty cache with correct capacity");

  check(() => {
    const cache = LRUCacheAlgorithm.createCache(1);
    assertEqual(cache.capacity, 1, "capacity is 1");
    assertEqual(cache.size, 0, "size is 0");
  }, "createCache with capacity 1");

  // --- put: single entry ---
  check(() => {
    const cache = LRUCacheAlgorithm.createCache(3);
    const result = LRUCacheAlgorithm.put(cache, "A", 1);
    assertEqual(cache.size, 1, "size is 1");
    assertEqual(cache.head.key, "A", "head is A");
    assertEqual(cache.tail.key, "A", "tail is A");
    assertEqual(cache.head.value, 1, "value is 1");
    assertEqual(cache.map["A"].value, 1, "map has A=1");
    assertEqual(result.evicted, null, "nothing evicted");
    assertEqual(result.action, "insert", "action is insert");
  }, "put single entry into empty cache");

  // --- put: multiple entries, MRU at head ---
  check(() => {
    const cache = LRUCacheAlgorithm.createCache(3);
    LRUCacheAlgorithm.put(cache, "A", 1);
    LRUCacheAlgorithm.put(cache, "B", 2);
    LRUCacheAlgorithm.put(cache, "C", 3);
    assertEqual(cache.size, 3, "size is 3");
    // MRU at head: C (most recently put)
    assertEqual(cache.head.key, "C", "head (MRU) is C");
    // LRU at tail: A (first put)
    assertEqual(cache.tail.key, "A", "tail (LRU) is A");
  }, "put multiple entries: MRU at head, LRU at tail");

  // --- put: eviction when at capacity ---
  check(() => {
    const cache = LRUCacheAlgorithm.createCache(3);
    LRUCacheAlgorithm.put(cache, "A", 1);
    LRUCacheAlgorithm.put(cache, "B", 2);
    LRUCacheAlgorithm.put(cache, "C", 3);
    const result = LRUCacheAlgorithm.put(cache, "D", 4);
    assertEqual(cache.size, 3, "size stays 3");
    assertEqual(result.evicted.key, "A", "evicted key is A");
    assertEqual(result.evicted.value, 1, "evicted value is 1");
    assertEqual(result.action, "evict", "action is evict");
    assertEqual(cache.map["A"], undefined, "A removed from map");
    assertEqual(cache.head.key, "D", "head (MRU) is D");
    assertEqual(cache.tail.key, "B", "tail (LRU) is B");
  }, "put evicts LRU entry when at capacity");

  // --- put: duplicate key updates value ---
  check(() => {
    const cache = LRUCacheAlgorithm.createCache(3);
    LRUCacheAlgorithm.put(cache, "A", 1);
    LRUCacheAlgorithm.put(cache, "B", 2);
    LRUCacheAlgorithm.put(cache, "C", 3);
    const result = LRUCacheAlgorithm.put(cache, "A", 10);
    assertEqual(cache.size, 3, "size unchanged");
    assertEqual(cache.map["A"].value, 10, "A updated to 10");
    assertEqual(cache.head.key, "A", "A promoted to head (MRU)");
    assertEqual(cache.tail.key, "B", "B is now LRU tail");
    assertEqual(result.action, "update", "action is update");
    assertEqual(result.evicted, null, "no eviction");
  }, "put duplicate key updates value and promotes to MRU");

  // --- get: cache hit promotes to MRU ---
  check(() => {
    const cache = LRUCacheAlgorithm.createCache(3);
    LRUCacheAlgorithm.put(cache, "A", 1);
    LRUCacheAlgorithm.put(cache, "B", 2);
    LRUCacheAlgorithm.put(cache, "C", 3);
    // A is LRU (tail), get it to promote
    const result = LRUCacheAlgorithm.get(cache, "A");
    assertEqual(result.value, 1, "got value 1");
    assertEqual(result.hit, true, "cache hit");
    assertEqual(cache.head.key, "A", "A promoted to head (MRU)");
    assertEqual(cache.tail.key, "B", "B is now LRU tail");
  }, "get promotes accessed entry to MRU (head)");

  // --- get: cache miss ---
  check(() => {
    const cache = LRUCacheAlgorithm.createCache(3);
    LRUCacheAlgorithm.put(cache, "A", 1);
    const result = LRUCacheAlgorithm.get(cache, "Z");
    assertEqual(result.value, -1, "miss returns -1");
    assertEqual(result.hit, false, "cache miss");
  }, "get on non-existent key returns miss");

  // --- get: empty cache ---
  check(() => {
    const cache = LRUCacheAlgorithm.createCache(3);
    const result = LRUCacheAlgorithm.get(cache, "A");
    assertEqual(result.value, -1, "empty cache miss");
    assertEqual(result.hit, false, "cache miss on empty");
  }, "get on empty cache returns miss");

  // --- capacity 1: immediate eviction ---
  check(() => {
    const cache = LRUCacheAlgorithm.createCache(1);
    LRUCacheAlgorithm.put(cache, "A", 1);
    assertEqual(cache.size, 1, "size is 1");
    const result = LRUCacheAlgorithm.put(cache, "B", 2);
    assertEqual(cache.size, 1, "size still 1");
    assertEqual(result.evicted.key, "A", "A evicted");
    assertEqual(cache.head.key, "B", "B is head");
    assertEqual(cache.tail.key, "B", "B is tail");
    assertEqual(cache.map["A"], undefined, "A gone from map");
  }, "capacity 1 cache evicts immediately on second put");

  // --- capacity 1: duplicate put ---
  check(() => {
    const cache = LRUCacheAlgorithm.createCache(1);
    LRUCacheAlgorithm.put(cache, "A", 1);
    const result = LRUCacheAlgorithm.put(cache, "A", 99);
    assertEqual(cache.size, 1, "size is 1");
    assertEqual(cache.map["A"].value, 99, "value updated");
    assertEqual(result.evicted, null, "no eviction");
    assertEqual(result.action, "update", "action is update");
  }, "capacity 1 duplicate put updates without evicting");

  // --- capacity 1: get then put ---
  check(() => {
    const cache = LRUCacheAlgorithm.createCache(1);
    LRUCacheAlgorithm.put(cache, "A", 1);
    const getResult = LRUCacheAlgorithm.get(cache, "A");
    assertEqual(getResult.value, 1, "got A");
    assertEqual(getResult.hit, true, "hit");
    const putResult = LRUCacheAlgorithm.put(cache, "B", 2);
    assertEqual(putResult.evicted.key, "A", "A evicted on new put");
  }, "capacity 1: get then put evicts correctly");

  // --- doubly-linked list integrity ---
  check(() => {
    const cache = LRUCacheAlgorithm.createCache(4);
    LRUCacheAlgorithm.put(cache, "A", 1);
    LRUCacheAlgorithm.put(cache, "B", 2);
    LRUCacheAlgorithm.put(cache, "C", 3);
    LRUCacheAlgorithm.put(cache, "D", 4);
    // Order head->tail: D, C, B, A
    assertEqual(cache.head.key, "D", "head is D");
    assertEqual(cache.head.next.key, "C", "D.next is C");
    assertEqual(cache.head.next.next.key, "B", "C.next is B");
    assertEqual(cache.head.next.next.next.key, "A", "B.next is A");
    assertEqual(cache.tail.key, "A", "tail is A");
    assertEqual(cache.tail.prev.key, "B", "A.prev is B");
    assertEqual(cache.tail.prev.prev.key, "C", "B.prev is C");
    assertEqual(cache.tail.prev.prev.prev.key, "D", "C.prev is D");
    assertEqual(cache.head.prev, null, "head.prev is null");
    assertEqual(cache.tail.next, null, "tail.next is null");
  }, "doubly-linked list forward and backward pointers are consistent");

  // --- get middle element promotes correctly ---
  check(() => {
    const cache = LRUCacheAlgorithm.createCache(3);
    LRUCacheAlgorithm.put(cache, "A", 1);
    LRUCacheAlgorithm.put(cache, "B", 2);
    LRUCacheAlgorithm.put(cache, "C", 3);
    // Order: C(head), B, A(tail). Get B (middle).
    LRUCacheAlgorithm.get(cache, "B");
    // Now: B(head), C, A(tail)
    assertEqual(cache.head.key, "B", "B is now head");
    assertEqual(cache.head.next.key, "C", "B.next is C");
    assertEqual(cache.tail.key, "A", "A is still tail");
    assertEqual(cache.tail.prev.key, "C", "A.prev is C");
  }, "get middle element promotes and relinks correctly");

  // --- get head element (already MRU) ---
  check(() => {
    const cache = LRUCacheAlgorithm.createCache(3);
    LRUCacheAlgorithm.put(cache, "A", 1);
    LRUCacheAlgorithm.put(cache, "B", 2);
    LRUCacheAlgorithm.put(cache, "C", 3);
    // C is already head. Get it.
    LRUCacheAlgorithm.get(cache, "C");
    assertEqual(cache.head.key, "C", "C still head");
    assertEqual(cache.tail.key, "A", "A still tail");
  }, "get head element (already MRU) is a no-op");

  // --- get tail element promotes to head ---
  check(() => {
    const cache = LRUCacheAlgorithm.createCache(3);
    LRUCacheAlgorithm.put(cache, "A", 1);
    LRUCacheAlgorithm.put(cache, "B", 2);
    LRUCacheAlgorithm.put(cache, "C", 3);
    // A is tail. Get it.
    LRUCacheAlgorithm.get(cache, "A");
    assertEqual(cache.head.key, "A", "A is now head");
    assertEqual(cache.tail.key, "B", "B is now tail");
  }, "get tail element promotes to head, new tail is correct");

  // --- multiple evictions ---
  check(() => {
    const cache = LRUCacheAlgorithm.createCache(2);
    LRUCacheAlgorithm.put(cache, "A", 1);
    LRUCacheAlgorithm.put(cache, "B", 2);
    const r1 = LRUCacheAlgorithm.put(cache, "C", 3);
    assertEqual(r1.evicted.key, "A", "first eviction: A");
    const r2 = LRUCacheAlgorithm.put(cache, "D", 4);
    assertEqual(r2.evicted.key, "B", "second eviction: B");
    assertEqual(cache.size, 2, "size stays 2");
    assertEqual(cache.head.key, "D", "head is D");
    assertEqual(cache.tail.key, "C", "tail is C");
  }, "multiple sequential evictions work correctly");

  // --- getOrder: returns keys head to tail ---
  check(() => {
    const cache = LRUCacheAlgorithm.createCache(3);
    LRUCacheAlgorithm.put(cache, "A", 1);
    LRUCacheAlgorithm.put(cache, "B", 2);
    LRUCacheAlgorithm.put(cache, "C", 3);
    const order = LRUCacheAlgorithm.getOrder(cache);
    assertEqual(order.length, 3, "3 items");
    assertEqual(order[0].key, "C", "MRU first");
    assertEqual(order[2].key, "A", "LRU last");
  }, "getOrder returns entries from MRU to LRU");

  check(() => {
    const cache = LRUCacheAlgorithm.createCache(3);
    const order = LRUCacheAlgorithm.getOrder(cache);
    assertEqual(order.length, 0, "empty cache order");
  }, "getOrder on empty cache returns empty array");

  // --- getSteps: records operation history ---
  check(() => {
    const cache = LRUCacheAlgorithm.createCache(3);
    const steps = [];
    LRUCacheAlgorithm.putWithSteps(cache, "A", 1, steps);
    assert(steps.length > 0, "steps recorded");
    const lastStep = steps[steps.length - 1];
    assertEqual(lastStep.type, "put", "step type is put");
    assertEqual(lastStep.key, "A", "step key is A");
  }, "putWithSteps records operation steps");

  check(() => {
    const cache = LRUCacheAlgorithm.createCache(3);
    const steps = [];
    LRUCacheAlgorithm.putWithSteps(cache, "A", 1, steps);
    LRUCacheAlgorithm.getWithSteps(cache, "A", steps);
    const lastStep = steps[steps.length - 1];
    assertEqual(lastStep.type, "get", "step type is get");
    assertEqual(lastStep.key, "A", "step key is A");
    assertEqual(lastStep.hit, true, "hit is true");
  }, "getWithSteps records cache hit step");

  check(() => {
    const cache = LRUCacheAlgorithm.createCache(3);
    const steps = [];
    LRUCacheAlgorithm.getWithSteps(cache, "X", steps);
    const lastStep = steps[steps.length - 1];
    assertEqual(lastStep.type, "get", "step type is get");
    assertEqual(lastStep.hit, false, "miss recorded");
  }, "getWithSteps records cache miss step");

  check(() => {
    const cache = LRUCacheAlgorithm.createCache(2);
    const steps = [];
    LRUCacheAlgorithm.putWithSteps(cache, "A", 1, steps);
    LRUCacheAlgorithm.putWithSteps(cache, "B", 2, steps);
    LRUCacheAlgorithm.putWithSteps(cache, "C", 3, steps);
    // Should record eviction of A
    const evictStep = steps.find(
      (s) => s.evicted !== null && s.evicted !== undefined,
    );
    assert(evictStep !== undefined, "eviction step exists");
    assertEqual(evictStep.evicted.key, "A", "evicted A recorded");
  }, "putWithSteps records eviction in steps");

  // --- step snapshots include list order and map state ---
  check(() => {
    const cache = LRUCacheAlgorithm.createCache(3);
    const steps = [];
    LRUCacheAlgorithm.putWithSteps(cache, "A", 1, steps);
    LRUCacheAlgorithm.putWithSteps(cache, "B", 2, steps);
    const lastStep = steps[steps.length - 1];
    assert(Array.isArray(lastStep.order), "step has order array");
    assertEqual(lastStep.order[0].key, "B", "MRU is B in snapshot");
    assertEqual(lastStep.order[1].key, "A", "LRU is A in snapshot");
    assert(typeof lastStep.mapSnapshot === "object", "step has mapSnapshot");
    assertEqual(lastStep.mapSnapshot["A"], 1, "map shows A=1");
    assertEqual(lastStep.mapSnapshot["B"], 2, "map shows B=2");
  }, "steps include order and map snapshots");

  // --- getBrowserCachePreset ---
  check(() => {
    const preset = LRUCacheAlgorithm.getBrowserCachePreset();
    assert(typeof preset.capacity === "number", "has capacity");
    assert(preset.capacity > 0, "capacity > 0");
    assert(Array.isArray(preset.operations), "has operations array");
    assert(preset.operations.length > 0, "has at least one operation");
    const op = preset.operations[0];
    assert(op.type === "put" || op.type === "get", "op type is put or get");
    assert(typeof op.key === "string", "op key is string");
  }, "getBrowserCachePreset returns valid preset");

  // --- large capacity: no eviction until full ---
  check(() => {
    const cache = LRUCacheAlgorithm.createCache(20);
    for (let i = 0; i < 20; i++) {
      const result = LRUCacheAlgorithm.put(cache, "K" + i, i);
      assertEqual(result.evicted, null, "no eviction at item " + i);
    }
    assertEqual(cache.size, 20, "size is 20");
    const evictResult = LRUCacheAlgorithm.put(cache, "K20", 20);
    assertEqual(evictResult.evicted.key, "K0", "first key evicted at 21");
    assertEqual(cache.size, 20, "size stays 20");
  }, "large capacity: eviction only after exceeding capacity");

  // --- stress: interleaved gets and puts ---
  check(() => {
    const cache = LRUCacheAlgorithm.createCache(3);
    LRUCacheAlgorithm.put(cache, "A", 1);
    LRUCacheAlgorithm.put(cache, "B", 2);
    LRUCacheAlgorithm.put(cache, "C", 3);
    // Access A (promote), then put D (evict B, not A)
    LRUCacheAlgorithm.get(cache, "A");
    const result = LRUCacheAlgorithm.put(cache, "D", 4);
    assertEqual(result.evicted.key, "B", "B evicted, not A (was promoted)");
    assertEqual(
      LRUCacheAlgorithm.get(cache, "A").hit,
      true,
      "A still in cache",
    );
    assertEqual(
      LRUCacheAlgorithm.get(cache, "B").hit,
      false,
      "B was evicted",
    );
  }, "interleaved get+put: promoted key survives eviction");

  return { passed, failed, failures };
}

module.exports = { runTests };
