/**
 * Consistent Hashing Algorithm Tests — Node.js runner compatible
 * Exports runTests() for run-tests.js harness
 *
 * Tests cover: ring creation, server add/remove, key assignment, modulo comparison,
 * redistribution analysis, virtual nodes, edge cases (0 servers, 1 server,
 * add/remove, all keys same hash, degenerate inputs).
 */

function runTests({ assert, assertEqual }) {
  var passed = 0;
  var failed = 0;
  var failures = [];

  var CH = require("./consistent-hash-algorithm.js");

  function check(fn, name) {
    try {
      fn();
      passed++;
      console.log("  PASS: " + name);
    } catch (e) {
      failed++;
      failures.push({ name: name, message: e.message });
      console.log("  FAIL: " + name + " — " + e.message);
    }
  }

  // ===========================
  // RING CREATION
  // ===========================

  check(function () {
    var ring = CH.createRing({ virtualNodes: 3 });
    assertEqual(ring.virtualNodesPerServer, 3, "virtual nodes per server");
    assertEqual(ring.servers.length, 0, "no servers initially");
    assertEqual(ring.ring.length, 0, "ring is empty");
  }, "createRing returns correct initial state");

  check(function () {
    var ring = CH.createRing({ virtualNodes: 0 });
    assertEqual(ring.virtualNodesPerServer, 1, "clamped to minimum 1");
  }, "createRing clamps virtualNodes minimum to 1");

  check(function () {
    var ring = CH.createRing({ virtualNodes: 50 });
    assertEqual(ring.virtualNodesPerServer, 20, "clamped to maximum 20");
  }, "createRing clamps virtualNodes maximum to 20");

  // ===========================
  // HASH FUNCTION
  // ===========================

  check(function () {
    var h1 = CH.hashString("hello");
    var h2 = CH.hashString("hello");
    assertEqual(h1, h2, "same input produces same hash");
  }, "hashString is deterministic");

  check(function () {
    var h1 = CH.hashString("hello");
    var h2 = CH.hashString("world");
    assert(h1 !== h2, "different inputs should produce different hashes");
  }, "hashString produces different hashes for different inputs");

  check(function () {
    var h = CH.hashString("");
    assert(typeof h === "number", "hash of empty string is a number");
    assert(h >= 0, "hash is non-negative");
  }, "hashString handles empty string");

  // ===========================
  // ADD SERVER
  // ===========================

  check(function () {
    var ring = CH.createRing({ virtualNodes: 3 });
    var result = CH.addServer(ring, "S1");
    assert(result.added, "server added successfully");
    assertEqual(result.error, null, "no error");
    assertEqual(result.positions.length, 3, "3 virtual node positions");
    assertEqual(ring.servers.length, 1, "one server in ring");
    assertEqual(ring.ring.length, 3, "3 nodes in ring array");
  }, "addServer adds server with virtual nodes");

  check(function () {
    var ring = CH.createRing({ virtualNodes: 2 });
    CH.addServer(ring, "S1");
    var result = CH.addServer(ring, "S1");
    assert(!result.added, "duplicate not added");
    assert(result.error !== null, "error message present");
    assertEqual(ring.servers.length, 1, "still one server");
  }, "addServer rejects duplicate server");

  check(function () {
    var ring = CH.createRing({ virtualNodes: 2 });
    CH.addServer(ring, "S1");
    CH.addServer(ring, "S2");
    CH.addServer(ring, "S3");
    assertEqual(ring.servers.length, 3, "three servers");
    assertEqual(ring.ring.length, 6, "6 virtual nodes total");

    // Verify ring is sorted
    for (var i = 1; i < ring.ring.length; i++) {
      assert(ring.ring[i].position >= ring.ring[i - 1].position, "ring is sorted at index " + i);
    }
  }, "addServer maintains sorted ring order");

  // ===========================
  // REMOVE SERVER
  // ===========================

  check(function () {
    var ring = CH.createRing({ virtualNodes: 3 });
    CH.addServer(ring, "S1");
    CH.addServer(ring, "S2");
    var result = CH.removeServer(ring, "S1");
    assert(result.removed, "server removed");
    assertEqual(result.error, null, "no error");
    assertEqual(ring.servers.length, 1, "one server remaining");
    assertEqual(ring.ring.length, 3, "only S2 virtual nodes remain");
    // All remaining nodes belong to S2
    for (var i = 0; i < ring.ring.length; i++) {
      assertEqual(ring.ring[i].serverId, "S2", "remaining node belongs to S2");
    }
  }, "removeServer removes correct server and virtual nodes");

  check(function () {
    var ring = CH.createRing({ virtualNodes: 2 });
    var result = CH.removeServer(ring, "S_nonexistent");
    assert(!result.removed, "cannot remove nonexistent server");
    assert(result.error !== null, "error message present");
  }, "removeServer handles nonexistent server");

  check(function () {
    var ring = CH.createRing({ virtualNodes: 2 });
    CH.addServer(ring, "S1");
    CH.removeServer(ring, "S1");
    assertEqual(ring.servers.length, 0, "no servers");
    assertEqual(ring.ring.length, 0, "ring is empty");
  }, "removeServer can remove the last server");

  // ===========================
  // KEY ASSIGNMENT
  // ===========================

  check(function () {
    var ring = CH.createRing({ virtualNodes: 3 });
    var result = CH.assignKey(ring, "mykey");
    assertEqual(result.serverId, null, "null when ring is empty");
  }, "assignKey returns null for empty ring");

  check(function () {
    var ring = CH.createRing({ virtualNodes: 3 });
    CH.addServer(ring, "S1");
    var result = CH.assignKey(ring, "mykey");
    assertEqual(result.serverId, "S1", "single server gets all keys");
  }, "assignKey returns only server when single server in ring");

  check(function () {
    var ring = CH.createRing({ virtualNodes: 3 });
    CH.addServer(ring, "S1");
    // Same key should always go to same server
    var r1 = CH.assignKey(ring, "testkey");
    var r2 = CH.assignKey(ring, "testkey");
    assertEqual(r1.serverId, r2.serverId, "same key same server");
    assertEqual(r1.keyPosition, r2.keyPosition, "same key same position");
  }, "assignKey is deterministic");

  check(function () {
    var ring = CH.createRing({ virtualNodes: 5 });
    CH.addServer(ring, "S1");
    CH.addServer(ring, "S2");
    CH.addServer(ring, "S3");

    // With enough keys, multiple servers should be used
    var servers = {};
    for (var i = 0; i < 100; i++) {
      var result = CH.assignKey(ring, "key" + i);
      servers[result.serverId] = true;
    }
    assert(Object.keys(servers).length > 1, "keys distributed across multiple servers");
  }, "assignKey distributes keys across multiple servers");

  // ===========================
  // MODULO ASSIGNMENT
  // ===========================

  check(function () {
    var result = CH.assignKeyModulo(0, "key");
    assertEqual(result.serverIndex, -1, "returns -1 for 0 servers");
  }, "assignKeyModulo handles 0 servers");

  check(function () {
    var result = CH.assignKeyModulo(3, "testkey");
    assert(result.serverIndex >= 0, "index is non-negative");
    assert(result.serverIndex < 3, "index is within range");
  }, "assignKeyModulo returns valid index");

  check(function () {
    var r1 = CH.assignKeyModulo(3, "key");
    var r2 = CH.assignKeyModulo(3, "key");
    assertEqual(r1.serverIndex, r2.serverIndex, "same key same index");
  }, "assignKeyModulo is deterministic");

  // ===========================
  // ASSIGN ALL KEYS
  // ===========================

  check(function () {
    var ring = CH.createRing({ virtualNodes: 3 });
    CH.addServer(ring, "S1");
    CH.addServer(ring, "S2");
    var keys = ["a", "b", "c", "d", "e"];
    var result = CH.assignAllKeys(ring, keys);
    assertEqual(result.assignments.length, 5, "5 assignments");
    var totalInDist = 0;
    for (var s in result.distribution) {
      if (result.distribution.hasOwnProperty(s)) {
        totalInDist += result.distribution[s];
      }
    }
    assertEqual(totalInDist, 5, "distribution sums to total keys");
  }, "assignAllKeys returns correct structure");

  check(function () {
    var ring = CH.createRing({ virtualNodes: 3 });
    var result = CH.assignAllKeys(ring, ["key1", "key2"]);
    assertEqual(result.assignments.length, 2, "2 assignments returned");
    assertEqual(result.assignments[0].serverId, null, "no server for empty ring");
  }, "assignAllKeys handles empty ring");

  // ===========================
  // REDISTRIBUTION COMPARISON
  // ===========================

  check(function () {
    var ring = CH.createRing({ virtualNodes: 5 });
    CH.addServer(ring, "S1");
    CH.addServer(ring, "S2");
    CH.addServer(ring, "S3");

    var keys = [];
    for (var i = 0; i < 200; i++) {
      keys.push("key" + i);
    }

    var result = CH.compareRedistribution(ring, keys, "add", "S4");
    assert(result.totalKeys === 200, "total keys is 200");
    // Consistent hashing should move fewer keys than modulo
    assert(result.consistentMoved <= result.moduloMoved,
      "consistent hashing moves fewer keys (" + result.consistentMoved + ") than modulo (" + result.moduloMoved + ")");
    // The original ring should be unchanged
    assertEqual(ring.servers.length, 3, "original ring unchanged");
  }, "compareRedistribution shows consistent < modulo on server add");

  check(function () {
    var ring = CH.createRing({ virtualNodes: 5 });
    CH.addServer(ring, "S1");
    CH.addServer(ring, "S2");
    CH.addServer(ring, "S3");

    var keys = [];
    for (var i = 0; i < 200; i++) {
      keys.push("key" + i);
    }

    var result = CH.compareRedistribution(ring, keys, "remove", "S2");
    assert(result.totalKeys === 200, "total keys is 200");
    assert(result.consistentMoved <= result.moduloMoved,
      "consistent hashing moves fewer keys on remove (" + result.consistentMoved + ") than modulo (" + result.moduloMoved + ")");
    assertEqual(ring.servers.length, 3, "original ring unchanged after compare");
  }, "compareRedistribution shows consistent < modulo on server remove");

  check(function () {
    var ring = CH.createRing({ virtualNodes: 3 });
    CH.addServer(ring, "S1");
    CH.addServer(ring, "S2");

    var result = CH.compareRedistribution(ring, [], "add", "S3");
    assertEqual(result.totalKeys, 0, "no keys");
    assertEqual(result.consistentMoved, 0, "no keys moved");
    assertEqual(result.moduloMoved, 0, "no keys moved modulo either");
  }, "compareRedistribution handles empty keys array");

  // ===========================
  // DEEP COPY
  // ===========================

  check(function () {
    var ring = CH.createRing({ virtualNodes: 2 });
    CH.addServer(ring, "S1");
    CH.addServer(ring, "S2");
    var copy = CH.deepCopyRing(ring);

    // Modify copy
    CH.addServer(copy, "S3");
    assertEqual(ring.servers.length, 2, "original unchanged");
    assertEqual(copy.servers.length, 3, "copy modified");
  }, "deepCopyRing creates independent copy");

  // ===========================
  // GET DISTRIBUTION
  // ===========================

  check(function () {
    var ring = CH.createRing({ virtualNodes: 3 });
    CH.addServer(ring, "S1");
    var keys = ["x", "y", "z"];
    var dist = CH.getDistribution(ring, keys);
    assertEqual(dist["S1"], 3, "all keys on single server");
  }, "getDistribution with single server");

  // ===========================
  // GET RING POSITIONS
  // ===========================

  check(function () {
    var ring = CH.createRing({ virtualNodes: 2 });
    CH.addServer(ring, "S1");
    var positions = CH.getRingPositions(ring);
    assertEqual(positions.length, 2, "2 positions for 2 virtual nodes");
    assertEqual(positions[0].serverId, "S1", "belongs to S1");
    assert(typeof positions[0].position === "number", "position is a number");
    assert(typeof positions[0].colorIndex === "number", "colorIndex is a number");
  }, "getRingPositions returns correct structure");

  // ===========================
  // EDGE CASES
  // ===========================

  check(function () {
    var ring = CH.createRing({ virtualNodes: 1 });
    CH.addServer(ring, "S1");
    // All these keys should map to S1 regardless
    var keys = ["a", "b", "c", "zzz", ""];
    for (var i = 0; i < keys.length; i++) {
      var result = CH.assignKey(ring, keys[i]);
      assertEqual(result.serverId, "S1", "key '" + keys[i] + "' maps to only server");
    }
  }, "edge case: 1 server with 1 vnode gets all keys");

  check(function () {
    var ring = CH.createRing({ virtualNodes: 3 });
    // No servers — assign should return null
    var result = CH.assignKey(ring, "anykey");
    assertEqual(result.serverId, null, "null for 0 servers");
  }, "edge case: 0 servers returns null assignment");

  check(function () {
    var ring = CH.createRing({ virtualNodes: 3 });
    CH.addServer(ring, "S1");
    CH.addServer(ring, "S2");
    CH.addServer(ring, "S3");
    CH.removeServer(ring, "S1");
    CH.removeServer(ring, "S2");
    CH.removeServer(ring, "S3");
    assertEqual(ring.servers.length, 0, "all servers removed");
    assertEqual(ring.ring.length, 0, "ring is empty");
    var result = CH.assignKey(ring, "test");
    assertEqual(result.serverId, null, "null after removing all servers");
  }, "edge case: add then remove all servers");

  check(function () {
    var ring = CH.createRing({ virtualNodes: 3 });
    CH.addServer(ring, "S1");
    CH.addServer(ring, "S2");

    // Many identical keys should all go to the same server
    var keys = [];
    for (var i = 0; i < 50; i++) {
      keys.push("samekey");
    }
    var result = CH.assignAllKeys(ring, keys);
    var serverId = result.assignments[0].serverId;
    for (var j = 1; j < result.assignments.length; j++) {
      assertEqual(result.assignments[j].serverId, serverId, "all identical keys go to same server");
    }
  }, "edge case: all keys have same hash go to same server");

  check(function () {
    // Modulo with 1 server
    var result = CH.assignKeyModulo(1, "anykey");
    assertEqual(result.serverIndex, 0, "only index 0 with 1 server");
  }, "edge case: modulo with 1 server always returns index 0");

  check(function () {
    var ring = CH.createRing({ virtualNodes: 5 });
    CH.addServer(ring, "S1");
    CH.addServer(ring, "S2");

    // Verify key stays with same server if we add a 3rd server
    // (at least most keys should stay)
    var keys = [];
    for (var i = 0; i < 100; i++) {
      keys.push("stability_key_" + i);
    }
    var before = CH.assignAllKeys(ring, keys);

    CH.addServer(ring, "S3");
    var after = CH.assignAllKeys(ring, keys);

    var moved = 0;
    for (var j = 0; j < keys.length; j++) {
      if (before.assignments[j].serverId !== after.assignments[j].serverId) {
        moved++;
      }
    }
    // With 2->3 servers, ideally ~1/3 keys move. Should be less than 60%.
    assert(moved < 60, "fewer than 60% of keys moved on server addition (moved: " + moved + ")");
  }, "consistent hashing preserves most key assignments on server add");

  check(function () {
    // Test RING_SIZE constant
    assertEqual(CH.RING_SIZE, 360, "ring size is 360");
  }, "RING_SIZE constant is 360");

  return { passed: passed, failed: failed, failures: failures };
}

module.exports = { runTests: runTests };
