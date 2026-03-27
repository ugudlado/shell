/**
 * Load Balancer Algorithm Tests -- Node.js runner compatible
 * Exports runTests() for run-tests.js harness
 *
 * Tests cover:
 *   - Server pool management (add, remove, 0 servers, 1 server, all down)
 *   - Round Robin (cyclic distribution, skip down servers, fairness)
 *   - Least Connections (pick lowest, tie-breaking, release connections)
 *   - Weighted (proportional distribution, weight=0, single weight)
 *   - Algorithm switching at runtime
 *   - Slow node simulation (response time tracking)
 *   - Edge cases (all down, uneven weights, single server)
 *   - Distribution fairness (statistical)
 */

function runTests({ assert, assertEqual, assertApprox }) {
  var passed = 0;
  var failed = 0;
  var failures = [];

  var LB = require("./load-balancer-algorithm.js");

  function check(fn, name) {
    try {
      fn();
      passed++;
      console.log("  PASS: " + name);
    } catch (e) {
      failed++;
      failures.push({ name: name, message: e.message });
      console.log("  FAIL: " + name + " -- " + e.message);
    }
  }

  // ===========================
  // SERVER POOL — Creation
  // ===========================

  check(function () {
    var pool = LB.createPool();
    assertEqual(pool.servers.length, 0, "starts with no servers");
    assertEqual(pool.algorithm, "round-robin", "default algorithm");
    assertEqual(pool.roundRobinIndex, 0, "round robin index starts at 0");
    assertEqual(pool.totalRequests, 0, "total requests starts at 0");
  }, "createPool returns correct initial state");

  // ===========================
  // SERVER POOL — Add/Remove servers
  // ===========================

  check(function () {
    var pool = LB.createPool();
    var server = LB.addServer(pool, { name: "srv-1", weight: 1 });
    assertEqual(pool.servers.length, 1, "one server after add");
    assertEqual(server.name, "srv-1", "server has correct name");
    assertEqual(server.weight, 1, "server has correct weight");
    assertEqual(server.connections, 0, "connections start at 0");
    assertEqual(server.totalRequests, 0, "totalRequests start at 0");
    assertEqual(server.isUp, true, "server starts up");
    assertEqual(server.avgResponseTime, 0, "avgResponseTime starts at 0");
  }, "addServer adds a server with correct initial state");

  check(function () {
    var pool = LB.createPool();
    LB.addServer(pool, { name: "srv-1", weight: 1 });
    LB.addServer(pool, { name: "srv-2", weight: 2 });
    LB.addServer(pool, { name: "srv-3", weight: 3 });
    assertEqual(pool.servers.length, 3, "three servers after adding three");
  }, "addServer accumulates servers");

  check(function () {
    var pool = LB.createPool();
    LB.addServer(pool, { name: "srv-1", weight: 1 });
    LB.addServer(pool, { name: "srv-2", weight: 2 });
    var removed = LB.removeServer(pool, "srv-1");
    assertEqual(removed, true, "removeServer returns true");
    assertEqual(pool.servers.length, 1, "one server left");
    assertEqual(pool.servers[0].name, "srv-2", "correct server remains");
  }, "removeServer removes the named server");

  check(function () {
    var pool = LB.createPool();
    var removed = LB.removeServer(pool, "nonexistent");
    assertEqual(removed, false, "removeServer returns false for unknown server");
    assertEqual(pool.servers.length, 0, "pool still empty");
  }, "removeServer returns false for nonexistent server");

  check(function () {
    var pool = LB.createPool();
    LB.addServer(pool, { name: "srv-1", weight: 1 });
    LB.removeServer(pool, "srv-1");
    assertEqual(pool.servers.length, 0, "pool is empty after removing only server");
  }, "removeServer can empty the pool");

  // ===========================
  // SERVER POOL — 0 servers (edge)
  // ===========================

  check(function () {
    var pool = LB.createPool();
    var result = LB.routeRequest(pool);
    assertEqual(result.routed, false, "not routed");
    assertEqual(result.server, null, "no server");
    assertEqual(result.reason, "No servers available", "correct reason");
  }, "routeRequest with 0 servers returns not routed");

  // ===========================
  // SERVER POOL — All servers down
  // ===========================

  check(function () {
    var pool = LB.createPool();
    LB.addServer(pool, { name: "srv-1", weight: 1 });
    LB.addServer(pool, { name: "srv-2", weight: 1 });
    pool.servers[0].isUp = false;
    pool.servers[1].isUp = false;
    var result = LB.routeRequest(pool);
    assertEqual(result.routed, false, "not routed");
    assertEqual(result.server, null, "no server available");
    assertEqual(result.reason, "All servers are down", "correct reason");
  }, "routeRequest with all servers down returns not routed");

  // ===========================
  // SERVER POOL — 1 server
  // ===========================

  check(function () {
    var pool = LB.createPool();
    LB.addServer(pool, { name: "only", weight: 1 });
    var r1 = LB.routeRequest(pool);
    var r2 = LB.routeRequest(pool);
    var r3 = LB.routeRequest(pool);
    assertEqual(r1.routed, true, "r1 routed");
    assertEqual(r2.routed, true, "r2 routed");
    assertEqual(r3.routed, true, "r3 routed");
    assertEqual(r1.server.name, "only", "r1 to only server");
    assertEqual(r2.server.name, "only", "r2 to only server");
    assertEqual(r3.server.name, "only", "r3 to only server");
    assertEqual(pool.servers[0].totalRequests, 3, "all 3 requests went to only server");
  }, "single server gets all requests (round-robin)");

  // ===========================
  // ROUND ROBIN — Basic cycling
  // ===========================

  check(function () {
    var pool = LB.createPool();
    LB.addServer(pool, { name: "A", weight: 1 });
    LB.addServer(pool, { name: "B", weight: 1 });
    LB.addServer(pool, { name: "C", weight: 1 });
    var r1 = LB.routeRequest(pool);
    var r2 = LB.routeRequest(pool);
    var r3 = LB.routeRequest(pool);
    var r4 = LB.routeRequest(pool);
    assertEqual(r1.server.name, "A", "first to A");
    assertEqual(r2.server.name, "B", "second to B");
    assertEqual(r3.server.name, "C", "third to C");
    assertEqual(r4.server.name, "A", "fourth wraps to A");
  }, "round-robin cycles through servers in order");

  check(function () {
    var pool = LB.createPool();
    LB.addServer(pool, { name: "A", weight: 1 });
    LB.addServer(pool, { name: "B", weight: 1 });
    LB.addServer(pool, { name: "C", weight: 1 });
    pool.servers[1].isUp = false; // B is down
    var r1 = LB.routeRequest(pool);
    var r2 = LB.routeRequest(pool);
    var r3 = LB.routeRequest(pool);
    assertEqual(r1.server.name, "A", "first to A");
    assertEqual(r2.server.name, "C", "second skips B (down), goes to C");
    assertEqual(r3.server.name, "A", "third wraps to A");
  }, "round-robin skips down servers");

  // ===========================
  // ROUND ROBIN — Distribution fairness
  // ===========================

  check(function () {
    var pool = LB.createPool();
    LB.addServer(pool, { name: "A", weight: 1 });
    LB.addServer(pool, { name: "B", weight: 1 });
    LB.addServer(pool, { name: "C", weight: 1 });
    for (var i = 0; i < 300; i++) {
      LB.routeRequest(pool);
    }
    assertEqual(pool.servers[0].totalRequests, 100, "A gets exactly 100");
    assertEqual(pool.servers[1].totalRequests, 100, "B gets exactly 100");
    assertEqual(pool.servers[2].totalRequests, 100, "C gets exactly 100");
    assertEqual(pool.totalRequests, 300, "total is 300");
  }, "round-robin distributes exactly equally among 3 servers over 300 requests");

  // ===========================
  // LEAST CONNECTIONS — Basic
  // ===========================

  check(function () {
    var pool = LB.createPool();
    pool.algorithm = "least-connections";
    LB.addServer(pool, { name: "A", weight: 1 });
    LB.addServer(pool, { name: "B", weight: 1 });
    // Both at 0 connections — should pick first (A)
    var r1 = LB.routeRequest(pool);
    assertEqual(r1.server.name, "A", "first request to A (0 connections, first)");
    assertEqual(pool.servers[0].connections, 1, "A has 1 connection");
    // Now A has 1, B has 0 — should pick B
    var r2 = LB.routeRequest(pool);
    assertEqual(r2.server.name, "B", "second request to B (fewer connections)");
    assertEqual(pool.servers[1].connections, 1, "B has 1 connection");
  }, "least-connections picks server with fewest connections");

  check(function () {
    var pool = LB.createPool();
    pool.algorithm = "least-connections";
    LB.addServer(pool, { name: "A", weight: 1 });
    LB.addServer(pool, { name: "B", weight: 1 });
    LB.addServer(pool, { name: "C", weight: 1 });
    // Manually set connections
    pool.servers[0].connections = 5;
    pool.servers[1].connections = 2;
    pool.servers[2].connections = 8;
    var r1 = LB.routeRequest(pool);
    assertEqual(r1.server.name, "B", "picks B (lowest at 2)");
  }, "least-connections picks the server with minimum connections");

  check(function () {
    var pool = LB.createPool();
    pool.algorithm = "least-connections";
    LB.addServer(pool, { name: "A", weight: 1 });
    LB.addServer(pool, { name: "B", weight: 1 });
    pool.servers[0].isUp = false;
    pool.servers[0].connections = 0;
    pool.servers[1].connections = 5;
    var r1 = LB.routeRequest(pool);
    assertEqual(r1.server.name, "B", "skips A (down), picks B even with more connections");
  }, "least-connections skips down servers");

  // ===========================
  // LEAST CONNECTIONS — Release connections
  // ===========================

  check(function () {
    var pool = LB.createPool();
    pool.algorithm = "least-connections";
    LB.addServer(pool, { name: "A", weight: 1 });
    pool.servers[0].connections = 5;
    LB.releaseConnection(pool, "A");
    assertEqual(pool.servers[0].connections, 4, "connections decremented");
    LB.releaseConnection(pool, "A");
    LB.releaseConnection(pool, "A");
    LB.releaseConnection(pool, "A");
    LB.releaseConnection(pool, "A");
    assertEqual(pool.servers[0].connections, 0, "connections at 0");
    LB.releaseConnection(pool, "A");
    assertEqual(pool.servers[0].connections, 0, "connections never go negative");
  }, "releaseConnection decrements and never goes negative");

  // ===========================
  // WEIGHTED — Basic
  // ===========================

  check(function () {
    var pool = LB.createPool();
    pool.algorithm = "weighted";
    LB.addServer(pool, { name: "A", weight: 3 });
    LB.addServer(pool, { name: "B", weight: 1 });
    // Over 400 requests, A should get ~300, B should get ~100
    for (var i = 0; i < 400; i++) {
      LB.routeRequest(pool);
    }
    assertEqual(pool.servers[0].totalRequests, 300, "A (weight 3) gets exactly 300");
    assertEqual(pool.servers[1].totalRequests, 100, "B (weight 1) gets exactly 100");
  }, "weighted distributes proportionally (3:1 over 400 requests)");

  check(function () {
    var pool = LB.createPool();
    pool.algorithm = "weighted";
    LB.addServer(pool, { name: "A", weight: 2 });
    LB.addServer(pool, { name: "B", weight: 3 });
    LB.addServer(pool, { name: "C", weight: 5 });
    // Over 100 requests: A=20, B=30, C=50
    for (var i = 0; i < 100; i++) {
      LB.routeRequest(pool);
    }
    assertEqual(pool.servers[0].totalRequests, 20, "A (weight 2) gets 20");
    assertEqual(pool.servers[1].totalRequests, 30, "B (weight 3) gets 30");
    assertEqual(pool.servers[2].totalRequests, 50, "C (weight 5) gets 50");
  }, "weighted distributes proportionally (2:3:5 over 100 requests)");

  check(function () {
    var pool = LB.createPool();
    pool.algorithm = "weighted";
    LB.addServer(pool, { name: "A", weight: 1 });
    LB.addServer(pool, { name: "B", weight: 1 });
    LB.addServer(pool, { name: "C", weight: 1 });
    for (var i = 0; i < 90; i++) {
      LB.routeRequest(pool);
    }
    assertEqual(pool.servers[0].totalRequests, 30, "equal weights -> equal distribution A");
    assertEqual(pool.servers[1].totalRequests, 30, "equal weights -> equal distribution B");
    assertEqual(pool.servers[2].totalRequests, 30, "equal weights -> equal distribution C");
  }, "weighted with equal weights distributes equally");

  // ===========================
  // WEIGHTED — Skip down servers
  // ===========================

  check(function () {
    var pool = LB.createPool();
    pool.algorithm = "weighted";
    LB.addServer(pool, { name: "A", weight: 2 });
    LB.addServer(pool, { name: "B", weight: 3 });
    pool.servers[1].isUp = false;
    for (var i = 0; i < 10; i++) {
      LB.routeRequest(pool);
    }
    assertEqual(pool.servers[0].totalRequests, 10, "A gets all requests");
    assertEqual(pool.servers[1].totalRequests, 0, "B (down) gets none");
  }, "weighted skips down servers, redistributes to remaining");

  // ===========================
  // WEIGHTED — weight=0 server
  // ===========================

  check(function () {
    var pool = LB.createPool();
    pool.algorithm = "weighted";
    LB.addServer(pool, { name: "A", weight: 0 });
    LB.addServer(pool, { name: "B", weight: 5 });
    for (var i = 0; i < 50; i++) {
      LB.routeRequest(pool);
    }
    assertEqual(pool.servers[0].totalRequests, 0, "weight=0 server gets no requests");
    assertEqual(pool.servers[1].totalRequests, 50, "B gets all requests");
  }, "weight=0 server never receives requests");

  // ===========================
  // WEIGHTED — single server
  // ===========================

  check(function () {
    var pool = LB.createPool();
    pool.algorithm = "weighted";
    LB.addServer(pool, { name: "A", weight: 5 });
    for (var i = 0; i < 20; i++) {
      LB.routeRequest(pool);
    }
    assertEqual(pool.servers[0].totalRequests, 20, "single server gets all");
  }, "weighted with single server sends all to it");

  // ===========================
  // ALGORITHM SWITCHING
  // ===========================

  check(function () {
    var pool = LB.createPool();
    LB.addServer(pool, { name: "A", weight: 1 });
    LB.addServer(pool, { name: "B", weight: 1 });
    assertEqual(pool.algorithm, "round-robin", "starts round-robin");
    LB.setAlgorithm(pool, "least-connections");
    assertEqual(pool.algorithm, "least-connections", "switched to least-connections");
    LB.setAlgorithm(pool, "weighted");
    assertEqual(pool.algorithm, "weighted", "switched to weighted");
    LB.setAlgorithm(pool, "round-robin");
    assertEqual(pool.algorithm, "round-robin", "switched back to round-robin");
  }, "setAlgorithm changes the pool algorithm");

  check(function () {
    var pool = LB.createPool();
    var result = LB.setAlgorithm(pool, "invalid-algo");
    assertEqual(result, false, "returns false for invalid algorithm");
    assertEqual(pool.algorithm, "round-robin", "algorithm unchanged");
  }, "setAlgorithm rejects invalid algorithm names");

  check(function () {
    var pool = LB.createPool();
    LB.addServer(pool, { name: "A", weight: 3 });
    LB.addServer(pool, { name: "B", weight: 1 });
    // Start with round-robin
    LB.routeRequest(pool);
    LB.routeRequest(pool);
    assertEqual(pool.servers[0].totalRequests, 1, "A has 1 after RR");
    assertEqual(pool.servers[1].totalRequests, 1, "B has 1 after RR");
    // Switch to weighted mid-stream
    LB.setAlgorithm(pool, "weighted");
    // Weighted counters reset on switch
    for (var i = 0; i < 40; i++) {
      LB.routeRequest(pool);
    }
    // Total after switch: 40 weighted requests distributed 3:1
    // But totalRequests includes pre-switch requests
    assertEqual(pool.totalRequests, 42, "total is 42");
  }, "algorithm switch preserves total request count");

  // ===========================
  // SLOW NODE SIMULATION — Response time
  // ===========================

  check(function () {
    var pool = LB.createPool();
    LB.addServer(pool, { name: "A", weight: 1 });
    LB.recordResponseTime(pool, "A", 100);
    LB.recordResponseTime(pool, "A", 200);
    LB.recordResponseTime(pool, "A", 300);
    assertEqual(pool.servers[0].avgResponseTime, 200, "avg is (100+200+300)/3 = 200");
  }, "recordResponseTime computes running average");

  check(function () {
    var pool = LB.createPool();
    LB.addServer(pool, { name: "A", weight: 1 });
    LB.recordResponseTime(pool, "A", 50);
    assertEqual(pool.servers[0].avgResponseTime, 50, "single sample avg is the value");
    assertEqual(pool.servers[0].responseTimeCount, 1, "count is 1");
  }, "recordResponseTime single sample");

  check(function () {
    var pool = LB.createPool();
    // Record on nonexistent server — should not crash
    LB.recordResponseTime(pool, "nonexistent", 100);
    assertEqual(pool.servers.length, 0, "pool unchanged");
  }, "recordResponseTime on nonexistent server is a no-op");

  // ===========================
  // MARK SERVER UP/DOWN
  // ===========================

  check(function () {
    var pool = LB.createPool();
    LB.addServer(pool, { name: "A", weight: 1 });
    assertEqual(pool.servers[0].isUp, true, "starts up");
    LB.setServerStatus(pool, "A", false);
    assertEqual(pool.servers[0].isUp, false, "now down");
    LB.setServerStatus(pool, "A", true);
    assertEqual(pool.servers[0].isUp, true, "back up");
  }, "setServerStatus toggles server up/down");

  check(function () {
    var pool = LB.createPool();
    LB.addServer(pool, { name: "A", weight: 1 });
    var result = LB.setServerStatus(pool, "nonexistent", false);
    assertEqual(result, false, "returns false for unknown server");
  }, "setServerStatus returns false for nonexistent server");

  // ===========================
  // EDGE: All weights zero
  // ===========================

  check(function () {
    var pool = LB.createPool();
    pool.algorithm = "weighted";
    LB.addServer(pool, { name: "A", weight: 0 });
    LB.addServer(pool, { name: "B", weight: 0 });
    var result = LB.routeRequest(pool);
    assertEqual(result.routed, false, "not routed");
    assertEqual(result.reason, "All servers have zero weight", "correct reason");
  }, "weighted with all zero weights returns not routed");

  // ===========================
  // EDGE: Uneven weights distribution fairness
  // ===========================

  check(function () {
    var pool = LB.createPool();
    pool.algorithm = "weighted";
    LB.addServer(pool, { name: "A", weight: 1 });
    LB.addServer(pool, { name: "B", weight: 2 });
    LB.addServer(pool, { name: "C", weight: 7 });
    for (var i = 0; i < 1000; i++) {
      LB.routeRequest(pool);
    }
    // 1:2:7 ratio over 1000 => A=100, B=200, C=700
    assertEqual(pool.servers[0].totalRequests, 100, "A (w1) gets 100/1000");
    assertEqual(pool.servers[1].totalRequests, 200, "B (w2) gets 200/1000");
    assertEqual(pool.servers[2].totalRequests, 700, "C (w7) gets 700/1000");
  }, "weighted distribution fairness: 1:2:7 over 1000 requests");

  // ===========================
  // POOL STATS — getPoolStats
  // ===========================

  check(function () {
    var pool = LB.createPool();
    LB.addServer(pool, { name: "A", weight: 2 });
    LB.addServer(pool, { name: "B", weight: 3 });
    LB.routeRequest(pool);
    LB.routeRequest(pool);
    var stats = LB.getPoolStats(pool);
    assertEqual(stats.totalRequests, 2, "total is 2");
    assertEqual(stats.serverCount, 2, "2 servers");
    assertEqual(stats.algorithm, "round-robin", "algorithm is round-robin");
    assertEqual(stats.servers.length, 2, "2 server stats");
    assertEqual(stats.servers[0].name, "A", "first server name");
    assert(typeof stats.servers[0].connections === "number", "has connections");
    assert(typeof stats.servers[0].totalRequests === "number", "has totalRequests");
    assert(typeof stats.servers[0].avgResponseTime === "number", "has avgResponseTime");
    assert(typeof stats.servers[0].isUp === "boolean", "has isUp");
  }, "getPoolStats returns correct snapshot");

  // ===========================
  // ROUND ROBIN — index reset after remove
  // ===========================

  check(function () {
    var pool = LB.createPool();
    LB.addServer(pool, { name: "A", weight: 1 });
    LB.addServer(pool, { name: "B", weight: 1 });
    LB.addServer(pool, { name: "C", weight: 1 });
    LB.routeRequest(pool); // A, index now 1
    LB.routeRequest(pool); // B, index now 2
    LB.removeServer(pool, "C"); // remove C, index was 2, now should be adjusted
    var r3 = LB.routeRequest(pool);
    // After removing C, only A and B remain. Index should wrap properly.
    assert(r3.routed === true, "request routed");
    assert(r3.server.name === "A" || r3.server.name === "B", "routes to existing server");
  }, "round-robin index adjusts after server removal");

  // ===========================
  // LEAST CONNECTIONS — Tie-breaking
  // ===========================

  check(function () {
    var pool = LB.createPool();
    pool.algorithm = "least-connections";
    LB.addServer(pool, { name: "A", weight: 1 });
    LB.addServer(pool, { name: "B", weight: 1 });
    LB.addServer(pool, { name: "C", weight: 1 });
    // All at 0 connections — should pick first (A) as tie-breaker
    var r1 = LB.routeRequest(pool);
    assertEqual(r1.server.name, "A", "tie-break goes to first server");
  }, "least-connections tie-breaks by picking first server");

  // ===========================
  // VALID ALGORITHMS constant
  // ===========================

  check(function () {
    var algos = LB.ALGORITHMS;
    assert(algos.indexOf("round-robin") >= 0, "has round-robin");
    assert(algos.indexOf("least-connections") >= 0, "has least-connections");
    assert(algos.indexOf("weighted") >= 0, "has weighted");
    assertEqual(algos.length, 3, "exactly 3 algorithms");
  }, "ALGORITHMS constant lists all 3 algorithms");

  // ===========================
  // WEIGHTED — Rebuilds schedule on server add/remove
  // ===========================

  check(function () {
    var pool = LB.createPool();
    pool.algorithm = "weighted";
    LB.addServer(pool, { name: "A", weight: 1 });
    LB.addServer(pool, { name: "B", weight: 1 });
    // Route 10 requests: 5 each
    for (var i = 0; i < 10; i++) {
      LB.routeRequest(pool);
    }
    assertEqual(pool.servers[0].totalRequests, 5, "A gets 5");
    assertEqual(pool.servers[1].totalRequests, 5, "B gets 5");
  }, "weighted with equal weights gives equal share");

  return { passed: passed, failed: failed, failures: failures };
}

module.exports = { runTests };
