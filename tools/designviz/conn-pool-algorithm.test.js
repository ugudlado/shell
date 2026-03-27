/**
 * Connection Pool Algorithm Tests — Node.js runner compatible
 * Exports runTests() for run-tests.js harness
 *
 * Tests cover: pool creation, acquire/release, queue management, connection timeout,
 * idle cleanup, tick orchestration, reset, stats, edge cases (pool size=1,
 * all busy, timeout boundary, idle cleanup, queue full, rapid acquire/release).
 */

function runTests({ assert, assertEqual }) {
  var passed = 0;
  var failed = 0;
  var failures = [];

  var CP = require("./conn-pool-algorithm.js");

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
  // CREATION
  // ===========================

  check(function () {
    var pool = CP.createPool({
      poolSize: 5,
      connectionTimeout: 30,
      idleTimeout: 60,
      maxQueueSize: 10,
    });
    assertEqual(pool.poolSize, 5, "pool size is 5");
    assertEqual(pool.connectionTimeout, 30, "timeout is 30");
    assertEqual(pool.idleTimeout, 60, "idle timeout is 60");
    assertEqual(pool.maxQueueSize, 10, "max queue is 10");
    assertEqual(pool.connections.length, 5, "5 connections created");
    assertEqual(pool.queue.length, 0, "queue is empty");
    assertEqual(pool.totalAcquired, 0, "totalAcquired starts at 0");
    assertEqual(pool.totalReleased, 0, "totalReleased starts at 0");
    assertEqual(pool.totalTimedOut, 0, "totalTimedOut starts at 0");
    assertEqual(pool.totalIdleCleaned, 0, "totalIdleCleaned starts at 0");
    assertEqual(pool.totalQueueRejected, 0, "totalQueueRejected starts at 0");
    assertEqual(pool.totalQueued, 0, "totalQueued starts at 0");
  }, "createPool returns correct initial state");

  check(function () {
    var pool = CP.createPool({
      poolSize: 5,
      connectionTimeout: 30,
      idleTimeout: 60,
      maxQueueSize: 10,
    });
    for (var i = 0; i < pool.connections.length; i++) {
      var conn = pool.connections[i];
      assertEqual(conn.id, i, "connection id is " + i);
      assertEqual(conn.status, "idle", "connection " + i + " is idle");
      assertEqual(conn.clientId, null, "no client assigned");
      assertEqual(conn.acquiredAt, null, "not acquired");
    }
  }, "all connections start idle");

  check(function () {
    var pool = CP.createPool({
      poolSize: 1,
      connectionTimeout: 1,
      idleTimeout: 1,
      maxQueueSize: 1,
    });
    assertEqual(pool.poolSize, 1, "minimum pool size is 1");
    assertEqual(pool.connectionTimeout, 1, "minimum timeout is 1");
    assertEqual(pool.idleTimeout, 1, "minimum idle timeout is 1");
    assertEqual(pool.maxQueueSize, 1, "minimum queue size is 1");
  }, "createPool clamps to minimum values");

  check(function () {
    var pool = CP.createPool({
      poolSize: 100,
      connectionTimeout: 200,
      idleTimeout: 500,
      maxQueueSize: 200,
    });
    assertEqual(pool.poolSize, 50, "pool size clamped to 50");
    assertEqual(pool.connectionTimeout, 120, "timeout clamped to 120");
    assertEqual(pool.idleTimeout, 300, "idle timeout clamped to 300");
    assertEqual(pool.maxQueueSize, 100, "queue size clamped to 100");
  }, "createPool clamps to maximum values");

  // ===========================
  // ACQUIRE
  // ===========================

  check(function () {
    var pool = CP.createPool({
      poolSize: 3,
      connectionTimeout: 30,
      idleTimeout: 60,
      maxQueueSize: 5,
    });
    var result = CP.acquire(pool, "client-1", 1000);
    assertEqual(result.acquired, true, "acquired");
    assertEqual(result.queued, false, "not queued");
    assertEqual(result.rejected, false, "not rejected");
    assertEqual(result.connectionId, 0, "got connection 0");
    assertEqual(pool.connections[0].status, "active", "connection is active");
    assertEqual(pool.connections[0].clientId, "client-1", "client assigned");
    assertEqual(pool.connections[0].acquiredAt, 1000, "acquiredAt set");
    assertEqual(pool.totalAcquired, 1, "totalAcquired is 1");
  }, "acquire assigns first idle connection");

  check(function () {
    var pool = CP.createPool({
      poolSize: 2,
      connectionTimeout: 30,
      idleTimeout: 60,
      maxQueueSize: 5,
    });
    CP.acquire(pool, "client-1", 1000);
    var r2 = CP.acquire(pool, "client-2", 1001);
    assertEqual(r2.acquired, true, "second acquire succeeds");
    assertEqual(r2.connectionId, 1, "got connection 1");
    assertEqual(pool.totalAcquired, 2, "totalAcquired is 2");
  }, "acquire assigns different connections to different clients");

  // ===========================
  // ACQUIRE — Pool exhausted, queue
  // ===========================

  check(function () {
    var pool = CP.createPool({
      poolSize: 1,
      connectionTimeout: 30,
      idleTimeout: 60,
      maxQueueSize: 3,
    });
    CP.acquire(pool, "client-1", 1000);
    var r2 = CP.acquire(pool, "client-2", 1001);
    assertEqual(r2.acquired, false, "not acquired");
    assertEqual(r2.queued, true, "queued");
    assertEqual(r2.rejected, false, "not rejected");
    assertEqual(r2.queuePosition, 1, "queue position 1");
    assertEqual(pool.queue.length, 1, "queue has 1 entry");
    assertEqual(pool.totalQueued, 1, "totalQueued is 1");
  }, "acquire queues client when all connections busy");

  check(function () {
    var pool = CP.createPool({
      poolSize: 1,
      connectionTimeout: 30,
      idleTimeout: 60,
      maxQueueSize: 2,
    });
    CP.acquire(pool, "client-1", 1000);
    CP.acquire(pool, "client-2", 1001); // queued pos 1
    CP.acquire(pool, "client-3", 1002); // queued pos 2
    var r4 = CP.acquire(pool, "client-4", 1003); // queue full
    assertEqual(r4.acquired, false, "not acquired");
    assertEqual(r4.queued, false, "not queued");
    assertEqual(r4.rejected, true, "rejected");
    assertEqual(pool.totalQueueRejected, 1, "totalQueueRejected is 1");
    assertEqual(pool.queue.length, 2, "queue still has 2");
  }, "acquire rejects when queue is full");

  // ===========================
  // RELEASE
  // ===========================

  check(function () {
    var pool = CP.createPool({
      poolSize: 2,
      connectionTimeout: 30,
      idleTimeout: 60,
      maxQueueSize: 5,
    });
    CP.acquire(pool, "client-1", 1000);
    var result = CP.release(pool, 0, 2000);
    assertEqual(result.released, true, "released");
    assertEqual(result.holdTime, 1000, "hold time is 1000ms");
    assertEqual(pool.connections[0].status, "idle", "connection is idle");
    assertEqual(pool.connections[0].clientId, null, "client cleared");
    assertEqual(pool.connections[0].acquiredAt, null, "acquiredAt cleared");
    assertEqual(pool.connections[0].lastActiveAt, 2000, "lastActiveAt updated");
    assertEqual(pool.totalReleased, 1, "totalReleased is 1");
  }, "release returns connection to idle state");

  check(function () {
    var pool = CP.createPool({
      poolSize: 2,
      connectionTimeout: 30,
      idleTimeout: 60,
      maxQueueSize: 5,
    });
    var result = CP.release(pool, 0, 1000);
    assertEqual(result.released, false, "cannot release idle connection");
  }, "release fails on idle connection");

  check(function () {
    var pool = CP.createPool({
      poolSize: 2,
      connectionTimeout: 30,
      idleTimeout: 60,
      maxQueueSize: 5,
    });
    var result = CP.release(pool, 99, 1000);
    assertEqual(result.released, false, "cannot release invalid ID");
  }, "release fails on invalid connection ID");

  check(function () {
    var pool = CP.createPool({
      poolSize: 2,
      connectionTimeout: 30,
      idleTimeout: 60,
      maxQueueSize: 5,
    });
    var result = CP.release(pool, -1, 1000);
    assertEqual(result.released, false, "cannot release negative ID");
  }, "release fails on negative connection ID");

  // ===========================
  // PROCESS QUEUE
  // ===========================

  check(function () {
    var pool = CP.createPool({
      poolSize: 1,
      connectionTimeout: 30,
      idleTimeout: 60,
      maxQueueSize: 5,
    });
    CP.acquire(pool, "client-1", 1000);
    CP.acquire(pool, "client-2", 1001); // queued
    CP.acquire(pool, "client-3", 1002); // queued

    CP.release(pool, 0, 2000);
    var assigned = CP.processQueue(pool, 2000);
    assertEqual(assigned.length, 1, "one assigned from queue");
    assertEqual(assigned[0].clientId, "client-2", "FIFO: client-2 first");
    assertEqual(assigned[0].connectionId, 0, "got connection 0");
    assertEqual(assigned[0].waitTime, 999, "waited 999ms");
    assertEqual(pool.queue.length, 1, "one still in queue");
  }, "processQueue assigns in FIFO order");

  check(function () {
    var pool = CP.createPool({
      poolSize: 2,
      connectionTimeout: 30,
      idleTimeout: 60,
      maxQueueSize: 5,
    });
    CP.acquire(pool, "client-1", 1000);
    CP.acquire(pool, "client-2", 1001);
    CP.acquire(pool, "client-3", 1002); // queued
    CP.acquire(pool, "client-4", 1003); // queued

    CP.release(pool, 0, 2000);
    CP.release(pool, 1, 2000);
    var assigned = CP.processQueue(pool, 2000);
    assertEqual(assigned.length, 2, "both queued clients assigned");
    assertEqual(assigned[0].clientId, "client-3", "client-3 first");
    assertEqual(assigned[1].clientId, "client-4", "client-4 second");
    assertEqual(pool.queue.length, 0, "queue empty");
  }, "processQueue drains multiple when connections available");

  check(function () {
    var pool = CP.createPool({
      poolSize: 1,
      connectionTimeout: 30,
      idleTimeout: 60,
      maxQueueSize: 5,
    });
    // No one queued
    var assigned = CP.processQueue(pool, 1000);
    assertEqual(assigned.length, 0, "nothing to assign");
  }, "processQueue returns empty when queue empty");

  // ===========================
  // CONNECTION TIMEOUT
  // ===========================

  check(function () {
    var pool = CP.createPool({
      poolSize: 2,
      connectionTimeout: 5,
      idleTimeout: 60,
      maxQueueSize: 5,
    });
    CP.acquire(pool, "client-1", 1000);
    CP.acquire(pool, "client-2", 2000);

    // At 5999ms from acquire of client-1 (1000 + 5000 - 1 = 5999)
    var before = CP.checkTimeouts(pool, 5999);
    assertEqual(before.length, 0, "no timeout yet");
    assertEqual(pool.connections[0].status, "active", "still active");

    // At exactly 6000ms (1000 + 5000 = 6000)
    var atTimeout = CP.checkTimeouts(pool, 6000);
    assertEqual(atTimeout.length, 1, "one timed out");
    assertEqual(atTimeout[0].connectionId, 0, "connection 0 timed out");
    assertEqual(atTimeout[0].clientId, "client-1", "client-1 was holding");
    assertEqual(atTimeout[0].holdTime, 5000, "held for 5000ms");
    assertEqual(pool.connections[0].status, "idle", "now idle");
    assertEqual(pool.totalTimedOut, 1, "totalTimedOut is 1");
  }, "checkTimeouts force-releases at exact boundary");

  check(function () {
    var pool = CP.createPool({
      poolSize: 2,
      connectionTimeout: 3,
      idleTimeout: 60,
      maxQueueSize: 5,
    });
    CP.acquire(pool, "client-1", 1000);
    CP.acquire(pool, "client-2", 1000);

    var timedOut = CP.checkTimeouts(pool, 4000);
    assertEqual(timedOut.length, 2, "both timed out");
    assertEqual(pool.totalTimedOut, 2, "totalTimedOut is 2");
  }, "checkTimeouts handles multiple simultaneous timeouts");

  // ===========================
  // IDLE CLEANUP
  // ===========================

  check(function () {
    var pool = CP.createPool({
      poolSize: 2,
      connectionTimeout: 30,
      idleTimeout: 10,
      maxQueueSize: 5,
    });
    // Connections start with lastActiveAt = null, should not be cleaned
    var cleaned = CP.checkIdleConnections(pool, 100000);
    assertEqual(cleaned.length, 0, "null lastActiveAt not cleaned");
  }, "checkIdleConnections skips connections with null lastActiveAt");

  check(function () {
    var pool = CP.createPool({
      poolSize: 2,
      connectionTimeout: 30,
      idleTimeout: 10,
      maxQueueSize: 5,
    });
    CP.acquire(pool, "client-1", 1000);
    CP.release(pool, 0, 2000); // lastActiveAt = 2000

    // Before idle timeout: 2000 + 10000 - 1 = 11999
    var before = CP.checkIdleConnections(pool, 11999);
    assertEqual(before.length, 0, "not idle long enough");

    // At exact boundary: 2000 + 10000 = 12000
    var atTimeout = CP.checkIdleConnections(pool, 12000);
    assertEqual(atTimeout.length, 1, "one cleaned");
    assertEqual(atTimeout[0].connectionId, 0, "connection 0 cleaned");
    assertEqual(atTimeout[0].idleTime, 10000, "idle for 10000ms");
    assertEqual(pool.totalIdleCleaned, 1, "totalIdleCleaned is 1");
  }, "checkIdleConnections cleans at exact boundary");

  check(function () {
    var pool = CP.createPool({
      poolSize: 2,
      connectionTimeout: 30,
      idleTimeout: 5,
      maxQueueSize: 5,
    });
    CP.acquire(pool, "client-1", 1000);
    // connection 1 never acquired — still active should NOT be cleaned
    pool.connections[1].status = "active";
    pool.connections[1].lastActiveAt = 1000;

    CP.release(pool, 0, 2000);
    var cleaned = CP.checkIdleConnections(pool, 8000);
    assertEqual(cleaned.length, 1, "only idle connection cleaned");
    assertEqual(cleaned[0].connectionId, 0, "connection 0 cleaned");
  }, "checkIdleConnections does not clean active connections");

  // ===========================
  // TICK (orchestrates all)
  // ===========================

  check(function () {
    var pool = CP.createPool({
      poolSize: 1,
      connectionTimeout: 5,
      idleTimeout: 60,
      maxQueueSize: 5,
    });
    CP.acquire(pool, "client-1", 1000);
    CP.acquire(pool, "client-2", 1001); // queued

    // Tick at timeout boundary: 1000 + 5000 = 6000
    var result = CP.tick(pool, 6000);
    assertEqual(result.timedOut.length, 1, "client-1 timed out");
    assertEqual(result.assigned.length, 1, "client-2 dequeued");
    assertEqual(result.assigned[0].clientId, "client-2", "client-2 got conn");
    assertEqual(pool.queue.length, 0, "queue empty");
    assertEqual(pool.connections[0].clientId, "client-2", "conn 0 now has client-2");
  }, "tick: timeout frees connection for queued client");

  // ===========================
  // RESET
  // ===========================

  check(function () {
    var config = {
      poolSize: 3,
      connectionTimeout: 10,
      idleTimeout: 30,
      maxQueueSize: 5,
    };
    var pool = CP.createPool(config);
    CP.acquire(pool, "client-1", 1000);
    CP.acquire(pool, "client-2", 1001);

    var fresh = CP.reset(config);
    assertEqual(fresh.poolSize, 3, "pool size preserved");
    assertEqual(fresh.totalAcquired, 0, "totalAcquired reset");
    assertEqual(fresh.connections[0].status, "idle", "all idle");
    assertEqual(fresh.connections[1].status, "idle", "all idle");
    assertEqual(fresh.queue.length, 0, "queue empty");
  }, "reset creates fresh pool with same config");

  // ===========================
  // GET STATS
  // ===========================

  check(function () {
    var pool = CP.createPool({
      poolSize: 3,
      connectionTimeout: 30,
      idleTimeout: 60,
      maxQueueSize: 5,
    });
    CP.acquire(pool, "client-1", 1000);
    CP.acquire(pool, "client-2", 1001);

    var stats = CP.getStats(pool);
    assertEqual(stats.poolSize, 3, "poolSize");
    assertEqual(stats.activeConnections, 2, "activeConnections");
    assertEqual(stats.idleConnections, 1, "idleConnections");
    assertEqual(stats.queueLength, 0, "queueLength");
    assertEqual(stats.totalAcquired, 2, "totalAcquired");
    assertEqual(stats.totalReleased, 0, "totalReleased");
    assertEqual(stats.totalTimedOut, 0, "totalTimedOut");
    assertEqual(stats.totalIdleCleaned, 0, "totalIdleCleaned");
    assertEqual(stats.totalQueueRejected, 0, "totalQueueRejected");
    assertEqual(stats.totalQueued, 0, "totalQueued");
  }, "getStats returns correct snapshot");

  // ===========================
  // CONSTANTS
  // ===========================

  check(function () {
    assertEqual(CP.STATUSES.IDLE, "idle", "IDLE constant");
    assertEqual(CP.STATUSES.ACTIVE, "active", "ACTIVE constant");
  }, "STATUSES constants are correct");

  // ===========================
  // EDGE: Pool size = 1
  // ===========================

  check(function () {
    var pool = CP.createPool({
      poolSize: 1,
      connectionTimeout: 2,
      idleTimeout: 5,
      maxQueueSize: 1,
    });

    // Acquire the only connection
    var r1 = CP.acquire(pool, "client-1", 1000);
    assertEqual(r1.acquired, true, "acquired the only connection");

    // Second client queued
    var r2 = CP.acquire(pool, "client-2", 1001);
    assertEqual(r2.queued, true, "client-2 queued");

    // Third client rejected (queue size = 1)
    var r3 = CP.acquire(pool, "client-3", 1002);
    assertEqual(r3.rejected, true, "client-3 rejected");

    // Release -> client-2 gets it
    CP.release(pool, 0, 2000);
    var assigned = CP.processQueue(pool, 2000);
    assertEqual(assigned.length, 1, "client-2 dequeued");
    assertEqual(assigned[0].clientId, "client-2", "correct client");
    assertEqual(pool.connections[0].status, "active", "active again");
  }, "pool size=1: acquire, queue, reject, dequeue works");

  // ===========================
  // EDGE: All connections busy
  // ===========================

  check(function () {
    var pool = CP.createPool({
      poolSize: 3,
      connectionTimeout: 30,
      idleTimeout: 60,
      maxQueueSize: 2,
    });
    CP.acquire(pool, "c1", 1000);
    CP.acquire(pool, "c2", 1001);
    CP.acquire(pool, "c3", 1002);

    var stats = CP.getStats(pool);
    assertEqual(stats.activeConnections, 3, "all active");
    assertEqual(stats.idleConnections, 0, "none idle");

    var r = CP.acquire(pool, "c4", 1003);
    assertEqual(r.queued, true, "c4 queued");
  }, "all connections busy: new requests queue");

  // ===========================
  // EDGE: Timeout then queue drain
  // ===========================

  check(function () {
    var pool = CP.createPool({
      poolSize: 2,
      connectionTimeout: 3,
      idleTimeout: 60,
      maxQueueSize: 5,
    });
    CP.acquire(pool, "c1", 1000);
    CP.acquire(pool, "c2", 1000);
    CP.acquire(pool, "c3", 1001); // queued
    CP.acquire(pool, "c4", 1002); // queued

    // Both connections timeout at 4000
    var result = CP.tick(pool, 4000);
    assertEqual(result.timedOut.length, 2, "both timed out");
    assertEqual(result.assigned.length, 2, "both queued clients assigned");
    assertEqual(result.assigned[0].clientId, "c3", "c3 first (FIFO)");
    assertEqual(result.assigned[1].clientId, "c4", "c4 second");
    assertEqual(pool.queue.length, 0, "queue drained");
  }, "timeout + queue drain: freed connections go to waiting clients");

  // ===========================
  // EDGE: Rapid acquire/release cycles
  // ===========================

  check(function () {
    var pool = CP.createPool({
      poolSize: 1,
      connectionTimeout: 30,
      idleTimeout: 60,
      maxQueueSize: 5,
    });

    for (var i = 0; i < 10; i++) {
      var r = CP.acquire(pool, "client-" + i, 1000 + i * 100);
      assertEqual(r.acquired, true, "acquire " + i);
      CP.release(pool, 0, 1050 + i * 100);
    }

    assertEqual(pool.totalAcquired, 10, "10 acquires");
    assertEqual(pool.totalReleased, 10, "10 releases");
    assertEqual(pool.connections[0].status, "idle", "connection idle");
  }, "rapid acquire/release cycles on single connection");

  // ===========================
  // EDGE: Events log
  // ===========================

  check(function () {
    var pool = CP.createPool({
      poolSize: 1,
      connectionTimeout: 30,
      idleTimeout: 60,
      maxQueueSize: 5,
    });
    CP.acquire(pool, "c1", 1000);
    CP.release(pool, 0, 2000);

    assertEqual(pool.events.length, 2, "2 events");
    assertEqual(pool.events[0].type, "acquire", "first is acquire");
    assertEqual(pool.events[1].type, "release", "second is release");
    assertEqual(pool.events[1].holdTime, 1000, "hold time in event");
  }, "events log tracks acquire and release");

  // ===========================
  // EDGE: Idle cleanup resets lastActiveAt
  // ===========================

  check(function () {
    var pool = CP.createPool({
      poolSize: 1,
      connectionTimeout: 30,
      idleTimeout: 5,
      maxQueueSize: 5,
    });
    CP.acquire(pool, "c1", 1000);
    CP.release(pool, 0, 2000); // lastActiveAt = 2000

    // First cleanup at 7000 (2000 + 5000)
    var first = CP.checkIdleConnections(pool, 7000);
    assertEqual(first.length, 1, "first cleanup");
    // lastActiveAt now reset to 7000

    // Second cleanup should not trigger until 12000 (7000 + 5000)
    var second = CP.checkIdleConnections(pool, 11999);
    assertEqual(second.length, 0, "not yet due for second cleanup");

    var third = CP.checkIdleConnections(pool, 12000);
    assertEqual(third.length, 1, "second cleanup at new boundary");
    assertEqual(pool.totalIdleCleaned, 2, "two cleanups total");
  }, "idle cleanup resets lastActiveAt for recurring cleanup");

  // ===========================
  // FULL LIFECYCLE
  // ===========================

  check(function () {
    var pool = CP.createPool({
      poolSize: 2,
      connectionTimeout: 5,
      idleTimeout: 10,
      maxQueueSize: 3,
    });

    // 1. Two clients acquire
    CP.acquire(pool, "c1", 1000);
    CP.acquire(pool, "c2", 1500);

    // 2. Third client queued
    var r3 = CP.acquire(pool, "c3", 2000);
    assertEqual(r3.queued, true, "c3 queued");

    // 3. c1 releases -> c3 gets connection
    CP.release(pool, 0, 3000);
    var assigned = CP.processQueue(pool, 3000);
    assertEqual(assigned.length, 1, "c3 assigned");
    assertEqual(assigned[0].clientId, "c3", "c3 got connection");
    assertEqual(assigned[0].waitTime, 1000, "c3 waited 1000ms");

    // 4. c2 times out at 6500 (1500 + 5000)
    var tick1 = CP.tick(pool, 6500);
    assertEqual(tick1.timedOut.length, 1, "c2 timed out");
    assertEqual(tick1.timedOut[0].clientId, "c2", "c2 timed out");

    // 5. c3 releases normally
    CP.release(pool, 0, 7000);

    // 6. Idle cleanup at 17000+ (7000 + 10000)
    var tick2 = CP.tick(pool, 17000);
    assertEqual(tick2.idleCleaned.length >= 1, true, "at least one idle cleanup");

    var stats = CP.getStats(pool);
    assertEqual(stats.totalAcquired, 3, "3 total acquired");
    assertEqual(stats.totalTimedOut, 1, "1 timed out");
    assertEqual(stats.activeConnections, 0, "none active");
  }, "full lifecycle: acquire, queue, release, timeout, idle cleanup");

  return { passed: passed, failed: failed, failures: failures };
}

module.exports = { runTests };
